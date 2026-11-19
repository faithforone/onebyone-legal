// one-by.one home v3. The hero phone plays one day by itself, and each small scene in
// "why" plays once when it comes into view. Nothing fades: pieces move, get covered, or cut.
// Without this file (or with Reduce Motion) the page is a still page with the same content.
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const seg = (t, from, to) => clamp((t - from) / (to - from));
  const mix = (from, to, t) => from + (to - from) * t;
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const easeIn = (t) => t * t;
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

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  // Small scenes: play once, a little after the tile is properly on screen.
  document.documentElement.classList.add("js");
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-seen");
      seen.unobserve(entry.target);
    }
  }, { threshold: 0.45 });
  $$(".tile").forEach((tile) => seen.observe(tile));

  // The hero phone: a card arrives, Start, the time runs, Done brings the next, the day ends.
  const device = $("[data-demo]");
  if (!device) return;

  const slot = $(".slot", device);
  const greet = $("[data-greet]", device);
  const dayline = $("[data-dayline]", device);
  const pip = $("[data-pip]", device);
  const upnext = $("[data-upnext]", device);
  const upnextName = $("b", upnext);
  const stubs = $(".stubs", device);
  const greetText = [greet.textContent, greet.dataset.end];
  const daylineText = [dayline.textContent, dayline.dataset.end];

  // Seconds within one loop.
  const times = [
    { enter: [0.2, 1.1], start: 2.5, run: [2.5, 5.3], leave: [5.55, 6.15] },
    { enter: [5.75, 6.55], run: [6.55, 8.9], leave: [9.15, 9.75] },
    { enter: [9.35, 10.15], run: [10.15, 12.2], leave: [12.45, 13.05] },
  ];
  const DAY_ENDS = 12.9;
  const STUBS = { enter: [12.7, 13.5], leave: [17.6, 18.2] };
  const LOOP = 18.4;

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

  const clockText = (seconds) => {
    const whole = Math.ceil(seconds);
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  };

  let enterFrom = 0;
  let leaveTo = 0;
  const measure = () => {
    const height = slot.offsetHeight;
    enterFrom = -height * 1.16;
    leaveTo = height * 1.2;
  };

  const draw = (t, first) => {
    let current = 0;
    cards.forEach((card, index) => {
      // On the very first loop the page's own arrival has already brought the first card in.
      const enter = first && index === 0 ? 1 : seg(t, card.enter[0], card.enter[1]);
      const leave = seg(t, card.leave[0], card.leave[1]);
      if (enter > 0) current = index;
      card.node.style.visibility = enter <= 0 || leave >= 1 ? "hidden" : "visible";
      move(card.node, enter < 1 ? enterFrom * (1 - easeOut(enter)) : leaveTo * easeIn(leave));

      const started = card.start === undefined || t >= card.start;
      // The time ticks at its real pace, one second a second: a sped-up countdown pulls the eye off the card.
      const ran = started ? clamp(t - card.run[0], 0, card.leave[1] - card.run[0]) : 0;
      setText(card.clock, clockText(card.seconds - Math.floor(ran)));
      setText(card.label, card.labels[started ? 1 : 0]);
      card.fill.style.clipPath = started ? `inset(0 ${(1 - mix(0.3, 0.34, seg(t, card.run[0], card.leave[1]))) * 100}% 0 0 round 99em)` : "none";

      const pressed =
        (card.start !== undefined && t > card.start - 0.2 && t < card.start + 0.04) ||
        (t > card.run[1] + 0.05 && t < card.leave[0] + 0.06);
      card.pill.style.transform = pressed ? "scale(.95)" : "";
    });

    const over = t >= DAY_ENDS && t < STUBS.leave[1];
    setText(upnextName, cards[current].next || "");
    upnext.classList.toggle("is-empty", !cards[current].next);
    setText(greet, greetText[over ? 1 : 0]);
    setText(dayline, daylineText[over ? 1 : 0]);
    pip.classList.toggle("is-smiling", over);

    const settle = seg(t, STUBS.enter[0], STUBS.enter[1]);
    const clear = seg(t, STUBS.leave[0], STUBS.leave[1]);
    stubs.style.visibility = settle <= 0 || clear >= 1 ? "hidden" : "visible";
    move(stubs, settle < 1 ? enterFrom * (1 - easeOut(settle)) : leaveTo * easeIn(clear));
  };

  let elapsed = 1.25; // the first card is already in
  let last = 0;
  let running = false;
  let frameId = 0;

  const tick = (now) => {
    elapsed += Math.min(0.1, (now - last) / 1000);
    last = now;
    draw(elapsed % LOOP, elapsed < LOOP);
    frameId = requestAnimationFrame(tick);
  };

  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    cancelAnimationFrame(frameId);
    if (!on) return;
    last = performance.now();
    frameId = requestAnimationFrame(tick);
  };

  let onScreen = false;
  new IntersectionObserver((entries) => {
    onScreen = entries[0].isIntersecting;
    setRunning(onScreen && !document.hidden);
  }, { threshold: 0.2 }).observe(device);
  document.addEventListener("visibilitychange", () => setRunning(onScreen && !document.hidden));
  addEventListener("resize", measure);

  device.classList.add("is-playing");
  measure();
  draw(elapsed, true);
})();
