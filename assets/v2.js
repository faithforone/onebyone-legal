// Home v2 (preview). The page supplies the words and printed tickets. Read each scene straight
// off the scroll position every frame, so the printer and its cards never trail the finger.
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // The scenes are built for one motion setting; when it changes while the page is open, start again.
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => location.reload());

  const hero = $("[data-v2-hero]");
  if (!hero) return;
  const stage = $(".v2-stage", hero), copy = $(".v2-copy", hero), act = $(".v2-act", hero), printer = $(".v2-printer", hero);
  const chip = $(".v2-chip", hero), card = $(".v2-card", hero), fill = $(".v2-fill", hero);
  const dock = $("[data-dock]");
  // The top bar is not there on the first screen; it comes down once the hero's words step aside.
  const bar = $(".topbar");
  const showBar = (on) => { if (!bar) return; bar.classList.toggle("v2-hide", !on); bar.inert = !on; };
  if (bar) { bar.style.transition = "none"; showBar(false); requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = ""; })); }
  const pip = window.Pip($(".v2-printer svg", hero), { sleeping: !still });

  // Arrival, in reading order: the question shows; Pip wakes and looks up at it; then looks down as
  // the card prints; then looks about. The rest arrives by CSS.
  let awake = still;
  if (!still) {
    setTimeout(() => { pip.wake().look(0, -12); }, 700);
    setTimeout(() => { pip.look(0, 14); }, 1250);
    setTimeout(() => { pip.glad(700); awake = true; }, 2200);
    setTimeout(() => { if (scrollY < innerHeight * 0.1) pip.roam(); }, 3200);
  } else pip.roam();

  addEventListener("pointermove", (e) => {
    if (!awake || scrollY > innerHeight * 0.3) return;
    const r = printer.getBoundingClientRect();
    pip.look(clamp((e.clientX - (r.left + r.width / 2)) / 14, -20, 20), clamp((e.clientY - (r.top + r.height / 2)) / 18, -10, 14));
    clearTimeout(pip._t); pip._t = setTimeout(() => pip.roam(), 2000);
  }, { passive: true });
  $(".v2-printer svg", hero).addEventListener("click", () => { if (!awake) { pip.wake(); awake = true; } pip.glad(900).pop(); });

  let printed = false, ticking = false, lift = 0, dockInScene = true;
  // The floating Download steps away while the page's own Download is in view.
  const buy = $("[data-v2-buy]");
  const nearBuy = () => { if (!buy) return false; const b = buy.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight * 0.9; };
  // Pip keeps its size (Sam 11-15: growing on scroll is too much); it rises just enough that Pip and
  // its long ticket sit in the middle of the screen, below the top bar. On a screen too short for both
  // the ticket and the floating Download, the Download waits until the scene is over.
  const measure = () => {
    const tall = printer.offsetHeight + card.offsetHeight - 14;
    const dockH = dock && getComputedStyle(dock).display !== "none" ? dock.offsetHeight + 12 : 0;
    dockInScene = 84 + tall <= innerHeight - dockH;
    const top = Math.max(dockInScene ? 84 : 72, (innerHeight - (dockInScene ? dockH : 0) - tall) / 2);
    lift = Math.max(0, printer.offsetTop - top);
  };
  function paint() {
    ticking = false;
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    // The words step aside.
    const away = span(p, 0, 0.18);
    for (const el of [copy, act]) {
      el.style.opacity = String(1 - away);
      el.style.translate = `0 ${((el === copy ? -1 : 1) * away * 36).toFixed(1)}px`;
    }
    act.inert = away > 0.5;
    showBar(away > 0.5);
    if (dock) dock.classList.toggle("on", away > 0.5 && (dockInScene || p >= 1) && !nearBuy());
    // The line goes back into Pip; Pip rises to make room; the long ticket prints.
    const back = ease(span(p, 0.06, 0.24));
    chip.style.translate = `0 ${(-104 * back).toFixed(2)}%`;
    const up = ease(span(p, 0.14, 0.5));
    printer.style.translate = `0 ${(-lift * up).toFixed(1)}px`;
    const out = ease(span(p, 0.26, 0.62));
    card.style.translate = `0 ${(-101 + out * 101).toFixed(2)}%`;
    if (awake && p > 0.22 && p < 0.64) pip.look(0, 14);
    // Done fills as the end comes, as a held press fills it in the app.
    const done = span(p, 0.66, 0.8);
    fill.style.transform = `scaleX(${done.toFixed(3)})`;
    if (done >= 1 && !printed) { printed = true; pip.glad(1200).pop(1.1); }
    if (done < 0.6) printed = false;
    // Then the lights go out: only Pip's eyes and its ticket are left.
    stage.style.setProperty("--dark", span(p, 0.88, 0.95).toFixed(3));
  }
  if (still && dock) {
    // Reduce Motion: no scene, but the floating Download still shows only while neither the hero's
    // nor the page's own Download is in view.
    const heroRow = $("[data-hero-cta]");
    const dockOnly = () => { ticking = false; const h = heroRow.getBoundingClientRect(), gone = h.bottom < 0 || h.top > innerHeight; dock.classList.toggle("on", gone && !nearBuy()); showBar(gone); };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(dockOnly); } }, { passive: true });
    dockOnly();
  }
  if (!still) {
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener("resize", () => { measure(); paint(); });
    measure(); paint();
  }

  // The card under Pip holds its room in the column (so long words or another language never overlap);
  // when that room changes, Pip has moved, so the scene measures again.
  const fitChip = () => {
    stage.style.setProperty("--chip-h", `${chip.offsetHeight}px`);
    if (!still) { measure(); paint(); }
  };
  fitChip();
  if ("ResizeObserver" in window) new ResizeObserver(fitChip).observe(chip);
  document.fonts && document.fonts.ready.then(fitChip);
  // Tabbing to Download ends the arrival for good, so it never plays again on leaving.
  act.addEventListener("focusin", () => stage.classList.add("v2-arrived"), { once: true });

  // Pip to the end. Both scenes are read off the scroll like the hero, so they never trail the finger.
  const progress = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

  // On the black: what you tell your AI. Each phrase lights up as it is said, then flies into Pip.
  const say = $("[data-v2-say]");
  if (say) {
    const words = $$(".v2-words span", say), sayPip = $(".v2-say-pip", say), sayT = $(".v2-say-t", say);
    const listener = window.Pip($("svg", sayPip));
    if (still) listener.roam();
    else {
      say.dataset.live = "";
      let to = [], ate = 0, heard = false, sayTick = false;
      const aim = () => {
        words.forEach((w) => { w.style.transform = ""; });
        const pr = sayPip.getBoundingClientRect();
        to = words.map((w) => { const r = w.getBoundingClientRect(); return [pr.left + pr.width / 2 - (r.left + r.width / 2), pr.top + pr.height * 0.5 - (r.top + r.height / 2)]; });
      };
      const draw = () => {
        sayTick = false;
        const p = progress(say);
        let eaten = 0;
        words.forEach((w, i) => {
          const lit = span(p, 0.06 + i * 0.09, 0.12 + i * 0.09);
          const f = ease(span(p, 0.46 + i * 0.07, 0.6 + i * 0.07));
          const [dx, dy] = to[i] || [0, 0];
          w.style.opacity = (0.28 + 0.72 * lit) * (1 - span(f, 0.85, 1));
          w.style.transform = f ? `translate(${(dx * f).toFixed(1)}px, ${(dy * f - Math.sin(Math.PI * f) * 46).toFixed(1)}px) scale(${(1 - 0.5 * f).toFixed(3)})` : "";
          if (f >= 1) eaten++;
        });
        if (eaten > ate) listener.pop(1.08, 220);
        ate = eaten;
        if (p > 0.04 && eaten < words.length) listener.look(0, -10);
        const end = span(p, 0.8, 0.9);
        sayT.style.opacity = end;
        if (end >= 1 && !heard) { heard = true; listener.glad(1100); setTimeout(() => listener.roam(), 1300); }
        if (end < 0.5) heard = false;
      };
      addEventListener("scroll", () => { if (!sayTick) { sayTick = true; requestAnimationFrame(draw); } }, { passive: true });
      addEventListener("resize", () => { aim(); draw(); });
      document.fonts && document.fonts.ready.then(() => { aim(); draw(); });
      aim(); draw();
    }
  }

  // On the sheet: Pip prints one card. Its button fills, the card tears off and falls away, and the
  // next one prints. The last one stays, done, as the day ends.
  const desk = $("[data-v2-desk]");
  if (desk) {
    const deskStage = $(".v2-desk-stage", desk), cards = $$(".v2-dc", desk), heads = $$(".v2-desk-head > *", desk);
    const fills = cards.map((c) => $(".v2-fill", c));
    const printerPip = window.Pip($(".v2-desk-printer svg", desk));
    let H = 190;
    const fit = () => { H = Math.max(...cards.map((c) => c.offsetHeight)); deskStage.style.setProperty("--dc-h", `${H}px`); };
    fit();
    if (still) printerPip.roam();
    else {
      desk.dataset.live = "";
      let deskTick = false, idle = true;
      const doneSeen = cards.map(() => false);
      const draw = () => {
        deskTick = false;
        const p = progress(desk), t = -0.12 + p * 3.9;
        let printing = false;
        cards.forEach((c, i) => {
          const local = t - i;
          const print = ease(span(local, -0.04, 0.24));
          const done = span(local, 0.4, 0.62);
          const tear = i < cards.length - 1 ? span(local, 0.7, 0.92) : 0;
          if (print > 0 && print < 1) printing = true;
          fills[i].style.transform = `scaleX(${done.toFixed(3)})`;
          c.style.opacity = print > 0 && tear < 1 ? "1" : "0";
          const side = i % 2 ? -1 : 1;
          if (tear > 0) {
            c.style.clipPath = "none";
            c.style.transform = `translate(${(side * 30 * tear).toFixed(1)}px, ${(tear * tear * innerHeight * 0.95).toFixed(1)}px) rotate(${(side * 14 * tear).toFixed(2)}deg)`;
          } else {
            const hid = (1 - print) * H;
            c.style.transform = `translateY(${(-hid).toFixed(1)}px)`;
            c.style.clipPath = print < 1 ? `inset(${hid.toFixed(1)}px 0 0 0)` : "none";
          }
          if (done >= 1 && !doneSeen[i]) { doneSeen[i] = true; printerPip.glad(900).pop(1.08, 260); }
          if (done < 0.6) doneSeen[i] = false;
        });
        heads[0].classList.toggle("on", t < 0.62);
        heads[1].classList.toggle("on", t >= 0.62);
        if (printing) { printerPip.look(0, 14); idle = false; }
        else if (!idle) { idle = true; printerPip.roam(); }
      };
      addEventListener("scroll", () => { if (!deskTick) { deskTick = true; requestAnimationFrame(draw); } }, { passive: true });
      addEventListener("resize", () => { fit(); draw(); });
      document.fonts && document.fonts.ready.then(() => { fit(); draw(); });
      draw();
    }
  }

  // Nothing left: Pip stays asleep and prints the empty card with a few that fit now.
  const free = $("[data-v2-free]");
  if (free) {
    window.Pip($(".v2-free-pip svg", free)).sleep(true);
    if (!still) {
      free.dataset.live = "";
      new IntersectionObserver((seen, io) => {
        if (!seen[0].isIntersecting) return;
        io.disconnect();
        free.classList.add("on");
      }, { threshold: 0.5 }).observe($(".v2-free-dev", free));
    }
  }

  // The bar shows the server count once 50 places are held.
  const founders = $("[data-v2-founders]");
  if (founders) {
    fetch("https://uaiszwblgrohzwucqbdb.supabase.co/functions/v1/founders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !Number.isInteger(d.taken) || d.taken < 50) return;
        const bar = $(".v2-f-bar", founders);
        bar.hidden = false;
        bar.style.setProperty("--f", `${Math.min(100, (d.taken / d.places) * 100)}%`);
        const count = $(".v2-f-n", founders);
        const number = new Intl.NumberFormat(count.dataset.numberLocale);
        count.textContent = count.dataset.countText
          .replace("{taken}", number.format(d.taken))
          .replace("{places}", number.format(d.places))
          .replace("{left}", number.format(d.places - d.taken));
      })
      .catch(() => {});
  }

  // Today, done: the day's stubs fall into a pile; Pip smiles.
  const yay = $(".v2-yay");
  if (yay) {
    const mini = window.Pip($(".v2-mini", yay));
    const pile = $(".v2-pile", yay);
    const stubs = [...$("[data-v2-stubs]", yay).content.children];
    new IntersectionObserver((seen, io) => {
      if (!seen[0].isIntersecting) return;
      io.disconnect();
      mini.smile(true);
      setTimeout(() => mini.smile(false).roam(), 1800);
      const W = yay.clientWidth, H = yay.clientHeight;
      const lanes = Math.max(3, Math.floor(W / 190));
      const heights = Array(lanes).fill(0);
      stubs.forEach((stub, i) => {
        const s = stub.cloneNode(true);
        pile.append(s);
        const lane = i % lanes, w = s.offsetWidth;
        const x = clamp((lane + 0.5) * (W / lanes) - w / 2 + (Math.random() * 40 - 20), 8, W - w - 8);
        const rot = Math.random() * 24 - 12;
        const y = H - 54 - heights[lane];
        heights[lane] += 30;
        if (still) { s.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`; return; }
        s.animate([
          { transform: `translate(${x}px, -80px) rotate(${rot * 3}deg)` },
          { transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`, offset: 0.82, easing: "ease-out" },
          { transform: `translate(${x}px, ${y - 10}px) rotate(${rot}deg)`, offset: 0.91, easing: "ease-in" },
          { transform: `translate(${x}px, ${y}px) rotate(${rot}deg)` },
        ], { duration: 900 + Math.random() * 300, delay: i * 110, easing: "cubic-bezier(.5,0,.75,0)", fill: "both" });
      });
    }, { threshold: 0.45 }).observe(yay);
  }

  // The end: Pip asleep; a tap wakes it for a look round, then back to sleep.
  const end = $(".v2-end");
  if (end) {
    const sleeper = window.Pip($(".v2-bed svg", end)).sleep(true);
    end.classList.add("asleep");
    let napping = 0;
    $(".v2-bed button", end).addEventListener("click", () => {
      clearTimeout(napping);
      end.classList.remove("asleep");
      sleeper.wake().look(-12, -4);
      setTimeout(() => sleeper.look(12, -4), 800);
      setTimeout(() => sleeper.glad(900), 1600);
      napping = setTimeout(() => { sleeper.sleep(true); end.classList.add("asleep"); }, 4200);
    });
  }
})();
