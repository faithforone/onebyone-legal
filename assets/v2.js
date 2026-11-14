// Home v2 (preview). The hero's scroll scene is read straight off the scroll position every frame,
// so it never trails the finger: copy blurs away, the page goes black, Pip prints the first card,
// one big line arrives. Then a "done for today" moment and a sleeping Pip at the end.
(() => {
  const ko = document.documentElement.lang === "ko";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  const hero = $("[data-v2-hero]");
  if (!hero) return;
  const stage = $(".v2-stage", hero), night = $(".v2-night", hero), copy = $(".v2-copy", hero);
  const card = $(".v2-card", hero), say = $$(".v2-say span", hero), dust = $(".v2-dust", hero);
  const topbar = $(".topbar");
  const pip = window.Pip($(".v2-printer svg", hero));

  // The rotating line: what the AI plans. Pip reacts to each.
  const roll = $$(".v2-roll b", hero);
  const moods = [() => pip.look(0, 10), () => pip.glad(900), () => pip.look(-14, 4), () => pip.look(14, -6)];
  let at = 0, rolling = 0;
  const step = () => {
    const prev = roll[at];
    prev.classList.remove("on"); prev.classList.add("off");
    setTimeout(() => prev.classList.remove("off"), 600);
    at = (at + 1) % roll.length;
    roll[at].classList.add("on");
    moods[at % moods.length]();
    setTimeout(() => pip.roam(), 1400);
  };
  if (!still && roll.length > 1) rolling = setInterval(step, 3400);
  pip.roam();

  // Pip follows the pointer a little while the hero is up.
  addEventListener("pointermove", (e) => {
    if (scrollY > innerHeight * 0.4) return;
    const r = stage.getBoundingClientRect();
    pip.look(((e.clientX - r.width / 2) / r.width) * 40, ((e.clientY - r.height * 0.2) / r.height) * 22);
    clearTimeout(pip._t); pip._t = setTimeout(() => pip.roam(), 2200);
  }, { passive: true });
  $(".v2-printer svg", hero).addEventListener("click", () => pip.glad(1000).pop());

  let printed = false, ticking = false;
  function paint() {
    ticking = false;
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    const away = span(p, 0, 0.22);
    copy.style.opacity = String(1 - away);
    copy.style.filter = away > 0 ? `blur(${(away * 14).toFixed(1)}px)` : "";
    copy.style.transform = `translateY(${(-away * 40).toFixed(1)}px) scale(${(1 - away * 0.06).toFixed(3)})`;
    copy.style.pointerEvents = away > 0.5 ? "none" : "";
    const dark = span(p, 0.08, 0.4);
    night.style.opacity = dark.toFixed(3);
    dust.style.opacity = String(1 - dark);
    topbar?.classList.toggle("on-night", dark > 0.5 && p < 0.999);
    const out = ease(span(p, 0.3, 0.7));
    card.style.translate = `0 ${(-101 + out * 101).toFixed(2)}%`;
    say.forEach((w, i) => {
      const k = ease(span(p, 0.62 + i * 0.06, 0.82 + i * 0.06));
      w.style.opacity = k.toFixed(3);
      w.style.translate = `0 ${((1 - k) * 40).toFixed(1)}px`;
    });
    if (p > 0.25 && p < 0.72) { pip.look(0, 14); }
    if (out >= 0.999 && !printed) { printed = true; pip.glad(1100).pop(1.1); }
    if (out < 0.5) printed = false;
    if (p > 0.05 && rolling) { clearInterval(rolling); rolling = 0; }
    if (p <= 0.02 && !rolling && !still && roll.length > 1) rolling = setInterval(step, 3400);
  }
  if (!still) {
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener("resize", paint);
    paint();
  } else {
    card.style.translate = "0 0";
  }

  // Done for today.
  const yay = $(".v2-yay");
  if (yay) {
    const mini = window.Pip($(".v2-mini", yay));
    const box = $(".v2-confetti", yay);
    const colors = ["#c6ef4e", "#f5b83d", "#e5658a", "#3b82f6", "#3fb6a8", "#6d5df5"];
    new IntersectionObserver((seen, io) => {
      if (!seen[0].isIntersecting) return;
      io.disconnect();
      yay.classList.add("on");
      mini.smile(true);
      setTimeout(() => mini.smile(false).roam(), 1600);
      if (still) return;
      for (let i = 0; i < 70; i++) {
        const c = document.createElement("i");
        c.style.setProperty("--c", colors[i % colors.length]);
        box.append(c);
        const a = Math.random() * Math.PI * 2, d = 180 + Math.random() * 420;
        c.animate([
          { opacity: 1, transform: "translate(-50%, -50%) rotate(0deg) scale(.6)" },
          { opacity: 1, offset: 0.7, transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d * 0.7}px) rotate(${Math.random() * 540}deg)` },
          { opacity: 0, transform: `translate(${Math.cos(a) * d * 1.05}px, ${Math.sin(a) * d * 0.7 + 160}px) rotate(${Math.random() * 720}deg)` },
        ], { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" }).onfinish = () => c.remove();
      }
    }, { threshold: 0.5 }).observe(yay);
  }

  // The end: Pip asleep; a tap wakes it for a look round, then back to sleep.
  const end = $(".v2-end");
  if (end) {
    const sleeper = window.Pip($(".v2-bed svg", end)).sleep(true);
    end.classList.add("asleep");
    new IntersectionObserver((seen, io) => { if (seen[0].isIntersecting) { end.classList.add("on"); io.disconnect(); } }, { threshold: 0.3 }).observe(end);
    let napping = 0;
    $(".v2-bed button", end).addEventListener("click", () => {
      clearTimeout(napping);
      end.classList.remove("asleep");
      sleeper.wake().look(-12, -6);
      setTimeout(() => sleeper.look(12, -6), 900);
      setTimeout(() => sleeper.glad(900), 1800);
      napping = setTimeout(() => { sleeper.sleep(true); end.classList.add("asleep"); }, 4600);
    });
  }
})();
