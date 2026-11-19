// one-by.one home v3. Two pinned scenes read the scroll position each frame and place
// every piece from it. Nothing is eased over time and nothing fades: pieces move, get
// covered, or cut. Without this file (or with Reduce Motion) both scenes are plain pages.
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const seg = (p, from, to) => clamp((p - from) / (to - from));
  const mix = (from, to, t) => from + (to - from) * t;
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const easeIn = (t) => t * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const move = (node, y) => { node.style.transform = `translate3d(0,${y}px,0)`; };
  const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };

  // Founders' places: the bar and the count show only once the count is worth showing.
  const founders = $("[data-founders]");
  if (founders) {
    fetch("https://uaiszwblgrohzwucqbdb.supabase.co/functions/v1/founders")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !Number.isInteger(data.taken) || data.taken < 50) return;
        const bar = $(".founders-bar", founders);
        bar.style.setProperty("--taken", `${Math.min(100, (data.taken / data.places) * 100)}%`);
        bar.hidden = false;
        const count = $(".founders-count", founders);
        const number = new Intl.NumberFormat(count.dataset.numberLocale);
        count.textContent = count.dataset.countText
          .replace("{taken}", number.format(data.taken))
          .replace("{places}", number.format(data.places))
          .replace("{left}", number.format(data.places - data.taken));
        count.hidden = false;
      })
      .catch(() => {});
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const scenes = [];

  // Scene one: the list runs past, everything but one line leaves, that line becomes the card.
  const pickScene = $(".scene-pick");
  if (pickScene) {
    const view = $(".scene-view", pickScene);
    const up = $(".todo-up", pickScene);
    const down = $(".todo-down", pickScene);
    const rows = [...down.children];
    const pick = $(".pick", pickScene);
    const row = $(".pick-row", pickScene);
    const ghost = $(".card-title", row);
    const top = $(".card-top", pickScene);
    const title = $(".card-title", top);
    const rest = $(".card-rest", pickScene);
    const LANDS = 0.46;
    let m = {};

    scenes.push({
      el: pickScene,
      runway: 2.3,
      layout() {
        const viewH = view.clientHeight;
        const rowH = up.firstElementChild.offsetHeight;
        const topH = top.offsetHeight;
        const cardH = $(".card", pickScene).offsetHeight;
        const pickTop = Math.max(14, Math.round((viewH - cardH) * 0.4));
        const slotTop = Math.round(title.offsetTop + title.offsetHeight / 2 - rowH / 2);
        const line = pickTop + slotTop;
        const upH = up.offsetHeight;

        pick.style.top = `${pickTop}px`;
        row.style.top = `${slotTop}px`;
        ghost.style.left = `${title.offsetLeft}px`;
        ghost.style.top = `${title.offsetTop - slotTop}px`;
        up.style.top = `${line - upH}px`;
        down.style.top = `${line + rowH}px`;

        const rowTops = rows.map((_, index) => line + rowH * (index + 1));
        m = {
          viewH,
          rowH,
          topH,
          rowTops,
          travel: Math.max(rowH * 8, upH - line),
          seen: Math.max(1, rowTops.filter((y) => y < viewH).length),
          barTop: slotTop + 5,
          barBottom: topH - (slotTop + rowH - 5),
          scale: parseFloat(getComputedStyle(row).fontSize) / parseFloat(getComputedStyle(title).fontSize),
          shift: 30 - title.offsetLeft,
        };
      },
      draw(p) {
        // The list scrolls at one steady speed; the picked line stops where its card will be.
        const offset = m.travel * (1 - p / LANDS);
        const hold = Math.max(0, offset);
        move(up, offset);
        move(pick, hold);
        move(down, hold);

        // The lines under it drop off the bottom, lowest first.
        rows.forEach((item, index) => {
          const order = Math.min(index, m.seen - 1);
          const start = 0.47 + ((m.seen - 1 - order) / m.seen) * 0.07;
          const fall = easeIn(seg(p, start, start + 0.06));
          item.style.transform = fall ? `translate3d(0,${fall * (m.viewH - m.rowTops[order] + m.rowH)}px,0)` : "";
        });

        // A dark bar sweeps across the one line, then opens into the card's top.
        const sweep = easeOut(seg(p, 0.64, 0.72));
        const open = easeInOut(seg(p, 0.72, 0.84));
        top.style.clipPath = `inset(${mix(m.barTop, 0, open)}px ${(1 - sweep) * 100}% ${mix(m.barBottom, 0, open)}px 0 round ${mix(12, 26, open)}px)`;
        const transform = `translate3d(${mix(m.shift, 0, open)}px,0,0) scale(${mix(m.scale, 1, open)})`;
        title.style.transform = transform;
        ghost.style.transform = transform;

        // The time and Start print out from under it.
        rest.style.transform = `translate3d(0,${-(1 - easeOut(seg(p, 0.84, 0.96))) * 100}%,0)`;
      },
    });
  }

  // Scene two: say it to the AI, the phone shows one card, Done brings the next, the day ends.
  const dayScene = $(".scene-day");
  if (dayScene) {
    const view = $(".scene-view", dayScene);
    const chat = $(".chat", dayScene);
    const answer = $(".bubble-ai", dayScene);
    const typing = $(".typing", dayScene);
    const device = $(".device-day", dayScene);
    const slot = $(".slot", device);
    const steps = $$(".steps li", dayScene);
    const greet = $("[data-greet]", device);
    const dayline = $("[data-dayline]", device);
    const pip = $("[data-pip]", device);
    const upnext = $("[data-upnext]", device);
    const upnextName = $("b", upnext);
    const stubs = $(".stubs", device);
    const greetText = [greet.textContent, greet.dataset.end];
    const daylineText = [dayline.textContent, dayline.dataset.end];
    const TYPING = { width: 74, height: 48 };

    const times = [
      { enter: [0.23, 0.31], start: 0.345, run: [0.345, 0.5], leave: [0.505, 0.565] },
      { enter: [0.545, 0.605], run: [0.605, 0.7], leave: [0.705, 0.765] },
      { enter: [0.745, 0.805], run: [0.805, 0.88], leave: [0.885, 0.94] },
    ];
    const cards = $$("[data-card]", device).map((node, index) => {
      const label = $(".pill-label", node);
      return {
        node,
        clock: $(".t-clock", node),
        pill: $(".pill", node),
        fill: $(".pill-fill", node),
        label,
        labels: [label.textContent, label.dataset.run || label.textContent],
        seconds: Number(node.dataset.minutes) * 60,
        next: node.dataset.next,
        ...times[index],
      };
    });
    const ENDS = 0.93;
    let m = {};

    const clockText = (seconds) => {
      const whole = Math.ceil(seconds);
      return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
    };

    scenes.push({
      el: dayScene,
      runway: 4.6,
      layout() {
        const viewH = view.clientHeight;
        const viewW = view.clientWidth;
        const deviceW = Math.round(Math.min(340, viewW - 24, (viewH - 28) / 1.94));
        const deviceTop = Math.max(14, Math.round((viewH - deviceW * 1.94) / 2));
        device.style.setProperty("--dw", `${deviceW}px`);
        device.style.top = `${deviceTop}px`;
        device.style.marginLeft = `${-deviceW / 2}px`;

        const chatH = chat.offsetHeight;
        const chatTop = Math.max(16, Math.round((viewH - chatH) * 0.36));
        chat.style.top = `${chatTop}px`;

        const slotH = slot.offsetHeight;
        m = {
          swap: Math.max(chatTop + chatH + 24, viewH - deviceTop + 24),
          enterFrom: -slotH * 1.16,
          leaveTo: slotH * 1.2,
          answerW: answer.offsetWidth,
          answerH: answer.offsetHeight,
        };
      },
      draw(q) {
        // The AI's dots open into its answer.
        const reply = seg(q, 0.03, 0.085);
        const grown = easeOut(reply);
        typing.style.visibility = reply > 0 ? "hidden" : "visible";
        answer.style.visibility = reply > 0 ? "visible" : "hidden";
        answer.style.clipPath = reply < 1
          ? `inset(${(m.answerH - TYPING.height) * (1 - grown)}px ${(m.answerW - TYPING.width) * (1 - grown)}px 0 0 round 26px 26px 26px 8px)`
          : "none";

        // The chat goes up and the phone comes up after it, as one page.
        const swap = 1 - (1 - seg(q, 0.11, 0.22)) ** 2;
        move(chat, -m.swap * swap);
        move(device, m.swap * (1 - swap));

        let current = 0;
        cards.forEach((card, index) => {
          const enter = seg(q, card.enter[0], card.enter[1]);
          const leave = seg(q, card.leave[0], card.leave[1]);
          if (enter > 0) current = index;
          card.node.style.visibility = enter <= 0 || leave >= 1 ? "hidden" : "visible";
          move(card.node, enter < 1 ? m.enterFrom * (1 - easeOut(enter)) : m.leaveTo * easeIn(leave));

          const started = card.start === undefined || q >= card.start;
          const run = seg(q, card.run[0], card.run[1]);
          setText(card.clock, clockText(card.seconds * (started ? 1 - run : 1)));
          setText(card.label, card.labels[started ? 1 : 0]);
          card.fill.style.clipPath = started ? `inset(0 ${(1 - mix(0.3, 1, run)) * 100}% 0 0 round 99em)` : "none";

          const pressed =
            (card.start !== undefined && q > card.start - 0.014 && q < card.start + 0.006) ||
            (q > card.run[1] - 0.004 && q < card.leave[0] + 0.008);
          card.pill.style.transform = pressed ? "scale(.95)" : "";
        });

        const step = q < 0.13 ? 0 : q < 0.5 ? 1 : 2;
        steps.forEach((item, index) => item.classList.toggle("is-on", index === step));

        const over = q >= ENDS;
        setText(upnextName, cards[current].next || "");
        upnext.classList.toggle("is-empty", !cards[current].next);
        setText(greet, greetText[over ? 1 : 0]);
        setText(dayline, daylineText[over ? 1 : 0]);
        pip.classList.toggle("is-smiling", over);

        // The day's three stubs come down last.
        const settle = seg(q, 0.925, 0.985);
        stubs.style.visibility = settle > 0 ? "visible" : "hidden";
        move(stubs, m.enterFrom * (1 - easeOut(settle)));
      },
    });
  }

  if (!scenes.length) return;

  const topbar = $(".topbar");
  let queued = false;

  const frame = () => {
    queued = false;
    const pinnedAt = topbar.offsetHeight;
    for (const scene of scenes) {
      const p = clamp((pinnedAt - scene.el.getBoundingClientRect().top) / scene.distance);
      if (p === scene.last) continue;
      scene.last = p;
      scene.draw(p);
    }
  };

  const measure = () => {
    for (const scene of scenes) {
      scene.el.classList.add("is-live");
      scene.distance = Math.round($(".pin", scene.el).offsetHeight * scene.runway);
      scene.el.style.setProperty("--runway", `${scene.distance}px`);
      scene.layout();
      scene.last = -1;
    }
    frame();
  };

  let width = innerWidth;
  let height = innerHeight;
  let timer = 0;
  addEventListener("resize", () => {
    // Mobile browsers resize as their bars slide; only a real change needs a new layout.
    if (innerWidth === width && Math.abs(innerHeight - height) < 140) return;
    width = innerWidth;
    height = innerHeight;
    clearTimeout(timer);
    timer = setTimeout(measure, 120);
  });

  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }, { passive: true });

  measure();
})();
