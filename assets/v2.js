// Home v2 (preview). The first screen asks the visitor's own question, "Where do I even start?";
// Pip wakes and prints the answer, one card. The hero's scroll scene is then read straight off the
// scroll position every frame, so it never trails the finger: the words step aside, the card goes
// back into Pip, Pip prints one long ticket, "One card at a time.", its Done fills and Pip smiles;
// then the lights go out. Later a finished day's stubs pile up, and at the end Pip is asleep.
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
  // the card prints ("Start here. Make the bed."); then looks about. The rest arrives by CSS.
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

  let printed = false, ticking = false, lift = 0, grow = 1;
  // The floating Download steps away while the page's own Download is in view.
  const buy = $("[data-v2-buy]");
  const nearBuy = () => { if (!buy) return false; const b = buy.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight * 0.9; };
  // Pip rises under the top bar, and on a big screen grows with its ticket until the two fill the height.
  const measure = () => {
    const top = Math.max(84, innerHeight * 0.1);
    lift = Math.max(0, printer.offsetTop - top);
    const tall = printer.offsetHeight + card.offsetHeight - 14;
    const room = innerHeight - top - 28 - (dock && getComputedStyle(dock).display !== "none" ? dock.offsetHeight + 12 : 0);
    grow = clamp(Math.min(room / tall, (innerWidth - 40) / printer.offsetWidth), 0.6, 1.6);
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
    if (dock) dock.classList.toggle("on", away > 0.5 && !nearBuy());
    // The line goes back into Pip; Pip rises to make room; the long ticket prints.
    const back = ease(span(p, 0.06, 0.24));
    chip.style.translate = `0 ${(-104 * back).toFixed(2)}%`;
    const up = ease(span(p, 0.14, 0.5));
    printer.style.translate = `0 ${(-lift * up).toFixed(1)}px`;
    printer.style.scale = String(1 + (grow - 1) * ease(span(p, 0.26, 0.62)));
    const out = ease(span(p, 0.26, 0.62));
    card.style.translate = `0 ${(-101 + out * 101).toFixed(2)}%`;
    if (awake && p > 0.22 && p < 0.64) pip.look(0, 14);
    // Done fills as the end comes, as a held press fills it in the app.
    const done = span(p, 0.66, 0.8);
    fill.style.transform = `scaleX(${done.toFixed(3)})`;
    if (done >= 1 && !printed) { printed = true; pip.glad(1200).pop(1.1); }
    if (done < 0.6) printed = false;
    // Then the lights go out: only Pip's eyes and its ticket are left.
    stage.style.setProperty("--dark", ease(span(p, 0.84, 0.98)).toFixed(3));
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

  // Today, done: the day's stubs fall into a pile; Pip smiles.
  const yay = $(".v2-yay");
  if (yay) {
    const mini = window.Pip($(".v2-mini", yay));
    const pile = $(".v2-pile", yay);
    const names = ["Push-ups", "Shower", "Put the water on", "Garlic pasta", "Call mom", "Q3 deck outline", "Standup", "Dentist", "Fold the towels", "Stretch", "Read 10 pages", "Water the plants"];
    new IntersectionObserver((seen, io) => {
      if (!seen[0].isIntersecting) return;
      io.disconnect();
      mini.smile(true);
      setTimeout(() => mini.smile(false).roam(), 1800);
      const W = yay.clientWidth, H = yay.clientHeight;
      const lanes = Math.max(3, Math.floor(W / 190));
      const heights = Array(lanes).fill(0);
      names.forEach((name, i) => {
        const s = document.createElement("span");
        s.className = "v2-stub";
        s.innerHTML = `<i>✓</i>${name}`;
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
