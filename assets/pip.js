// Pip, the app's printer, drawn for the web: the same eyes as the app (OneByOnePrinterFace).
// One pair that moves together; the gap changes only as the head turns (the eyes sit on a drum).
// A blink keeps the bottom edge still and brings the top down to a short flat pill; glad is an
// eye smile (the eye closes into its lower part and the bottom bows up, ∩); asleep is a ∪.
// Use: const pip = Pip(svgElement); pip.look(x, y); pip.smile(); pip.sleep(true); pip.wake().
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The eye's outline (as OneByOnePrinterFaceView.eye): open 1 a pill; closing, the top comes down
  // into the lower part; bow 1 the bottom curves down (∪), -1 up (∩); blink squashes it onto its bottom.
  function eyePath(w, h, open, bow, blink) {
    const a = w / 2, bh = Math.max(a, h / 2);
    const op = Math.min(1.1, Math.max(0, open)), o = Math.min(1, op);
    const top = -bh + a, bottom = bh - a, y = bottom + (top - bottom) * op;
    const dip = a * (0.45 + 0.55 * o) * bow, cap = -dip + (a + dip) * o, q = 4 / 3;
    const c = a * (0.4 + 0.6 * o);
    const b = Math.min(1, Math.max(0, blink)), k = (w / 6 + (2 * bh - w / 6) * (1 - b)) / (2 * bh);
    const Y = (v) => (bh - (bh - v) * k).toFixed(2), X = (v) => v.toFixed(2);
    const d = `M${X(-a)} ${Y(y)}L${X(-a)} ${Y(bottom)}C${X(-c)} ${Y(bottom + q * dip)} ${X(c)} ${Y(bottom + q * dip)} ${X(a)} ${Y(bottom)}` +
      `L${X(a)} ${Y(y)}C${X(c)} ${Y(y - q * cap)} ${X(-c)} ${Y(y - q * cap)} ${X(-a)} ${Y(y)}Z`;
    return { d, line: 9.5 * Math.max(0, Math.min(1, (0.32 - op) / 0.32)) };
  }

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeIn = (t) => t * t * t, easeOut = (t) => 1 - Math.pow(1 - t, 3);

  window.Pip = function Pip(svg, { body = true } = {}) {
    svg.setAttribute("viewBox", "0 0 120 120");
    if (body && !svg.querySelector(".pip-body")) {
      const r = document.createElementNS(NS, "rect");
      Object.entries({ class: "pip-body", x: 0, y: 0, width: 120, height: 120, rx: 31 }).forEach(([k, v]) => r.setAttribute(k, v));
      svg.append(r);
    }
    const eyes = [0, 1].map(() => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "pip-eye");
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      svg.append(p);
      return p;
    });
    // Where it is (s) and where it is going (to). Gaze glides; lids run on their own clocks.
    const s = { gx: 0, gy: 0, smile: 0, shut: 0, blink: 0, size: 1 };
    const to = { gx: 0, gy: 0, smile: 0, shut: 0, size: 1 };
    let blinkAt = -1, blinkTwice = false, nextBlink = performance.now() + 1800, asleep = false, raf = 0, last = 0, wanderAt = 0;
    let wander = true;

    function draw() {
      const drum = 60, spread = Math.asin(25 / drum);
      const turn = Math.asin(Math.max(-0.95, Math.min(0.95, s.gx / (drum * Math.cos(spread)))));
      const half = 25 * Math.cos(turn), w = 29 * s.size, h = 37 * s.size;
      const room = Math.max(0, 56 - w / 2 - half), x = Math.max(-room, Math.min(room, s.gx));
      const gy = Math.max(-14, Math.min(14, s.gy));
      const slim = (ang) => Math.min(1, 1 + (Math.cos(ang) / Math.cos(spread) - 1) * 0.6);
      const smile = Math.min(1, Math.max(0, s.smile));
      const open = 1 - Math.max(Math.min(1, s.shut), smile), bow = 1 - 2 * smile;
      [[-half, slim(turn - spread)], [half, slim(turn + spread)]].forEach(([dx, wide], i) => {
        const e = eyePath(w * wide, h, open, bow, s.blink);
        eyes[i].setAttribute("d", e.d);
        eyes[i].setAttribute("stroke-width", e.line.toFixed(2));
        eyes[i].setAttribute("transform", `translate(${(60 + x + dx).toFixed(2)} ${(67 + gy).toFixed(2)})`);
      });
    }

    function blinkValue(t) {
      // Taby's: down in 80 ms, held, up by 250 ms; sometimes twice.
      const one = (u) => (u < 0 ? 0 : u < 80 ? easeIn(u / 80) : u < 165 ? 1 : u < 250 ? 1 - easeOut((u - 165) / 85) : 0);
      return Math.max(one(t), blinkTwice ? one(t - 290) : 0);
    }

    function tick(now) {
      const dt = Math.min(64, now - (last || now)); last = now;
      const k = 1 - Math.pow(0.0009, dt / 1000);          // a quick, soft glide toward the target
      for (const key of ["gx", "gy", "smile", "shut", "size"]) s[key] += (to[key] - s[key]) * Math.min(1, k * (key === "shut" ? 1.6 : 1));
      if (wander && !asleep && now > wanderAt) {
        const r = Math.random();
        if (r < 0.45) { to.gx = 0; to.gy = 0; } else { to.gx = (Math.random() * 2 - 1) * 18; to.gy = (Math.random() * 2 - 1) * 9; }
        wanderAt = now + 1600 + Math.random() * 2600;
      }
      if (!asleep && to.smile < 0.01 && s.smile < 0.05 && now >= nextBlink && blinkAt < 0) {
        blinkAt = now; blinkTwice = Math.random() < 0.25;
      }
      if (blinkAt >= 0) {
        const t = now - blinkAt;
        s.blink = blinkValue(t);
        if (t > (blinkTwice ? 560 : 260)) { blinkAt = -1; s.blink = 0; nextBlink = now + 2500 + Math.random() * 3500; }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    const api = {
      look(x, y) { wander = false; to.gx = x; to.gy = y; return api; },
      roam() { wander = true; wanderAt = 0; return api; },
      smile(on = true) { to.smile = on ? 1 : 0; return api; },
      glad(ms = 900) { api.smile(true); setTimeout(() => api.smile(false), ms); return api; },
      pop(k = 1.12, ms = 260) { to.size = k; setTimeout(() => { to.size = 1; }, ms); return api; },
      sleep(on = true) { asleep = on; to.shut = on ? 1 : 0; if (on) { to.gx = 0; to.gy = 4; } return api; },
      wake() { return api.sleep(false); },
      blink() { blinkAt = performance.now(); blinkTwice = false; return api; },
      start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } return api; },
      stop() { cancelAnimationFrame(raf); raf = 0; return api; },
      get asleep() { return asleep; },
    };
    draw();
    if (still()) { draw(); return api; }
    // Run only while on screen.
    new IntersectionObserver((seen) => seen.forEach((e) => (e.isIntersecting ? api.start() : api.stop()))).observe(svg);
    return api;
  };
})();
