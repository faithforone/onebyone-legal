// one-by.one home. Nothing moves until it is on screen or tapped; no scroll
// is ever held. The page is complete without this script.
(function () {
  "use strict";
  const ko = document.documentElement.lang === "ko";
  // <i18n>
  // The demo's own words (buttons, menu, labels, announcements). English is the default; <html lang="ko"> swaps the table.
  const T = ko ? {
    start: "시작", done: "완료", track: "맡기기", waiting: "대기 중", paused: "일시정지됨", resume: "다시 시작", held: "보류 중",
    skip: "건너뛰기", notToday: "오늘은 넘기기", remove: "삭제", more: "더 보기", close: "닫기", upNext: "다음 카드", doNow: "지금 하기",
    ready: "준비 완료", due: "끝남", dueBall: "끝", dueSay: (n, next) => `${n} 타이머가 끝났어요. 다음은 ${next}.`,
    dueAria: (n, next) => `${n} 타이머가 끝났어요. 다음은 ${next}.`,
    left: (c) => `${c} 남음`, speed: "여기서는 시간을 건너뛰어 보여 줘요",
    min: (m) => `${m}분`, sec: (s) => `${s}초`, under: "1분 미만",
    trayLabel: (n) => `타이머 ${n}개 실행 중`, ballLabel: (n, s) => `${n}, ${s >= 60 ? `${Math.ceil(s / 60)}분` : "1분 미만"} 남음`,
    timerStarted: (n, m) => `${n} 타이머를 ${m}분으로 시작했어요.`, confirm: (n) => `${n} 확인`,
    stepLabel: (r, dir) => `${r.l} ${dir < 0 ? "줄이기" : "늘리기"}`,
    skipped: "건너뛰었어요. 다음 카드 뒤에 다시 나와요.", removed: "삭제했어요. 왼쪽 위의 되돌리기로 취소할 수 있어요.", aside: "오늘은 넘겼어요",
    paused2: "일시정지했어요.", resumed: "다시 시작했어요.",
    idleT: "지금 할 일이 없어요", idleNote: (n, then) => `${n} 타이머가 끝나면 ‘${then}’ 차례예요.`,
    waitT: "아직 없어요", waitNote: "AI에게 지금 생각나는 일을 말해 보세요. 카드가 여기로 와요.",
    greet: (h) => (h >= 5 && h < 12 ? "좋은 아침이에요" : h >= 12 && h < 18 ? "좋은 오후예요" : "좋은 저녁이에요"),
    suggested: "제안", added: "추가됨",
  } : {
    start: "Start", done: "Done", track: "Keep track", waiting: "Waiting", paused: "Paused", resume: "Resume", held: "Held",
    skip: "Skip", notToday: "Not today", remove: "Remove", more: "More", close: "Close", upNext: "Up next", doNow: "Do now",
    ready: "Ready", due: "Due", dueBall: "due", dueSay: (n, next) => `${n} is due. ${next} is next.`,
    dueAria: (n, next) => `${n}, due. ${next} is next.`,
    left: (c) => `${c} left`, speed: "Time skips ahead in this demo",
    min: (m) => `${m}m`, sec: (s) => `${s}s`, under: "under a minute",
    trayLabel: (n) => `Timers, ${n} running`, ballLabel: (n, s) => `${n}, ${s >= 60 ? `${Math.ceil(s / 60)} minutes` : "under a minute"} left`,
    timerStarted: (n, m) => `${n} timer started, ${m} minutes.`, confirm: (n) => `Confirm: ${n}`,
    stepLabel: (r, dir) => `${dir < 0 ? (r.u === "reps" ? "Fewer" : "Less") : "More"} ${r.l.toLowerCase()}`,
    skipped: "Skipped. It comes back after the next card.", removed: "Removed. Undo is at the top left.", aside: "Set aside for today",
    paused2: "Paused.", resumed: "Resumed.",
    idleT: "Nothing to do now", idleNote: (n, then) => `${then} comes when the ${n.toLowerCase()} is ready.`,
    waitT: "Nothing yet", waitNote: "Tell your AI what’s on your mind. The cards land here.",
    greet: (h) => (h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 18 ? "Good afternoon" : "Good evening"),
    suggested: "Suggested", added: "Added",
  };
  // </i18n>
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => motion.matches;
  const $ = (sel, root = document) => root?.querySelector(sel) || null;
  const $$ = (sel, root = document) => [...(root?.querySelectorAll(sel) || [])];
  const ck = '<svg class="ck" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7"/></svg>';
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const topbar = $(".topbar");
  const onScroll = () => topbar && topbar.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Loops run only while their section is visible.
  if ("IntersectionObserver" in window) {
    // Once, never undone: scrolling back up must not restart or reverse anything.
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: 0.3 });
    $$("[data-reveal]").forEach((el) => io.observe(el));
  }

  // Talk: the mark art is the product's loop (confirmed 2026-10-05). Your day comes down to you, one card at a time: the cards
  // stand in one 3D space seen through one camera (sizes from distance, colour from haze: far is pale, near is charcoal). Each
  // step the front card becomes the app's ticket (the notches bite in, the perforation prints) and goes straight down through
  // the edge just under it, tipping 18 degrees towards you below the edge; the next card turns charcoal on its way up and gets
  // its lime once the ticket is out; a new card fades in at the back. 2 s a step, slowest exactly at the logo, never stopping.
  // Plays while on screen, pauses (never restarts) when off; with reduced motion the mark stands still.
  {
    const art = $(".mark-art");
    const masks = window.CSS && (CSS.supports("mask-image", "linear-gradient(#000,#000)") || CSS.supports("-webkit-mask-image", "linear-gradient(#000,#000)"));
    if (art && !still() && masks && "IntersectionObserver" in window) {
      const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, p) => a + (b - a) * p;
      const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
      // colour in OKLab, so a change is lighter or darker, never muddy
      const toLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const fromLin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
      const toLab = ([r, g, b]) => { r = toLin(r); g = toLin(g); b = toLin(b); const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
      const fromLab = ([L, a, b]) => { const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
        return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((v) => Math.round(clamp(fromLin(clamp(v, 0, 1)), 0, 255))); };
      const WHITE = toLab([255, 255, 255]), GREY = toLab([218, 221, 225]), INK = toLab([26, 28, 32]), LIME = toLab([198, 239, 78]);
      const mix = (a, b, p) => fromLab([0, 1, 2].map((i) => lerp(a[i], b[i], p)));
      const rgb = (c) => `rgb(${c.join(",")})`;
      const haze = (h) => h <= 0.87 ? mix(INK, GREY, h / 0.87) : mix(GREY, WHITE, (h - 0.87) / 0.13);   // 0 near .. 1 far
      const E = ((x1, y1, x2, y2) => (x) => {                                                          // cubic-bezier(.4,0,.6,1)
        if (x <= 0) return 0; if (x >= 1) return 1;
        const cx = (t) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3, cy = (t) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
        let lo = 0, hi = 1, t = x; for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (cx(t) < x) lo = t; else hi = t; } return cy(t);
      })(0.4, 0, 0.6, 1);
      // the path of a card's centre and size: behind the back card, back, middle, front, on (Catmull-Rom, so no corners)
      const NODE = [[22, 58, 118], [75, 105, 150], [145, 165, 190], [220, 200, 220], [282, 236, 246]];
      const TAN = NODE.map((n, i) => [0, 1, 2].map((k) => i === 0 ? NODE[1][k] - NODE[0][k] : i === 4 ? NODE[4][k] - NODE[3][k] : (NODE[i + 1][k] - NODE[i - 1][k]) / 2));
      const along = (q) => {
        const x = clamp(q + 1, 0, 3.999), i = Math.floor(x), t = x - i, t2 = t * t, t3 = t2 * t, a = NODE[i], b = NODE[i + 1], ta = TAN[i], tb = TAN[i + 1];
        const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        return [0, 1, 2].map((k) => h00 * a[k] + h10 * ta[k] + h01 * b[k] + h11 * tb[k]);
      };
      const P = 2, A = 0.7, CAM = 1000, ORG = [165, 150];
      const EDGE = 324, OUT = 640, FALL = 0.6, BEND = 18, PERF = 122;                               // y in the art frame; past the edge the panel itself is what hides it
      const steps = (tt) => { const v = tt / P, n = Math.floor(v), p = v - n; return n + p - A * Math.sin(2 * Math.PI * p) / (2 * Math.PI); };
      const notch = (r) => `radial-gradient(circle at 0 ${PERF}px, transparent ${r.toFixed(2)}px, #000 ${(r + 0.6).toFixed(2)}px), radial-gradient(circle at 220px ${PERF}px, transparent ${r.toFixed(2)}px, #000 ${(r + 0.6).toFixed(2)}px)`;
      const perf = (a) => `repeating-linear-gradient(90deg, rgba(255,255,255,${a.toFixed(3)}) 0 5px, transparent 5px 9px) 14px ${PERF - 0.6}px / 192px 1.2px no-repeat`;
      const setMask = (st, m) => { st.webkitMaskImage = m; st.maskImage = m; };
      // each card rides in a lane holding the camera (the art box plus 400 px all round, contents 400 px in); the second lane
      // carries the part of a leaving card that is below the edge
      art.textContent = "";
      const lane = () => { const l = document.createElement("div"); l.className = "lane"; l.innerHTML = "<span><i></i></span>"; art.append(l); return l; };
      const cards = [0, 1, 2, 3].map(() => { const l = lane(), l2 = lane(); return { l, l2, e: l.firstChild, e2: l2.firstChild, bar: l.firstChild.firstChild, bar2: l2.firstChild.firstChild }; });
      art.classList.add("live");
      const draw = (tt) => {
        const u = steps(tt);
        cards.forEach((c, j) => {
          const q = ((((j + u + 1) % 4) + 4) % 4) - 1, role = Math.floor(q), f = q - role;
          const s = c.e.style, s2 = c.e2.style;
          c.l2.style.visibility = "hidden";
          if (role === 2 && f >= FALL) { c.l.style.visibility = "hidden"; return; }
          c.l.style.visibility = "visible";
          const [cx, cy, sz] = along(Math.min(q, 2));
          const z = CAM * (1 - 220 / sz), back = (CAM - z) / CAM;
          const wx = ORG[0] + (cx - ORG[0]) * back, wy = ORG[1] + (cy - ORG[1]) * back;   // world centre that projects onto (cx, cy)
          const base = `translate3d(${(wx + 290).toFixed(2)}px,${(wy + 290).toFixed(2)}px,${z.toFixed(2)}px)`;
          let h = 0, lit = 1, opacity = 1, shadow, zi = 20 + 10 * q;
          if (role === -1) { h = 1; lit = 0; opacity = E(f); }
          else if (role === 0) { h = 1 - 0.13 * E(f); lit = 0; }
          else if (role === 1) { h = 0.87 * (1 - E(f / 0.62)); lit = E((f - 0.6) / 0.08); }
          const bgc = haze(h), bg = rgb(bgc), lime = rgb(mix(toLab(bgc), LIME, lit));
          c.bar.style.background = lime;
          setMask(s, "none");
          if (role === 2) {
            zi = 60;
            const x = clamp(f / FALL), drop = 340 * (0.3 * x + 0.7 * x * x), edge = EDGE - (90 + drop);
            const k = smooth(f / 0.08);
            s.transform = `${base} translateY(${drop.toFixed(2)}px)`;
            s.background = `linear-gradient(rgba(0,0,0,0) ${(edge - 12).toFixed(1)}px, rgba(0,0,0,.10) ${edge.toFixed(1)}px), ${perf(0.3 * k)}, ${bg}`;
            if (k > 0.01) setMask(s, notch(6 * k));
            s.opacity = "1";
            shadow = 0.18 * (1 - smooth(x / 0.3));
            setMask(c.l.style, `linear-gradient(#000 ${EDGE + 401.5}px, transparent ${EDGE + 401.5}px)`);
            c.l2.style.visibility = "visible"; c.l2.style.zIndex = "61";
            setMask(c.l2.style, `linear-gradient(transparent ${EDGE + 400}px, #000 ${EDGE + 400}px, #000 ${OUT + 400}px, transparent ${OUT + 400}px)`);
            const pv = edge - 110;
            s2.transform = `${base} translateY(${drop.toFixed(2)}px) translateY(${pv.toFixed(2)}px) rotateX(${BEND}deg) translateY(${(-pv).toFixed(2)}px)`;
            s2.background = `${perf(0.3)}, ${bg}`;
            setMask(s2, notch(6));
            c.bar2.style.background = lime;
          } else {
            s.transform = base; s.background = bg; s.opacity = opacity.toFixed(4);
            shadow = 0.18 * (1 - smooth(h / 0.6));
            setMask(c.l.style, "none");
          }
          c.l.style.zIndex = String(Math.round(zi));
          const sh = [];
          if (shadow > 0.002) sh.push(`0 12px 24px -12px rgba(0,0,0,${shadow.toFixed(3)})`);
          const ring = smooth((h - 0.9) / 0.1);
          if (ring > 0.002) sh.push(`inset 0 0 0 1px rgba(214,216,220,${ring.toFixed(3)})`);
          s.boxShadow = sh.length ? sh.join(",") : "none";
        });
      };
      let t = 0, last = 0, visible = false, raf = 0;
      // No frames are scheduled while the mark is off screen; it resumes where it was.
      const tick = (now) => { if (!visible) { raf = 0; last = 0; return; } raf = requestAnimationFrame(tick); const dt = last ? Math.min(64, now - last) : 0; last = now; t += dt / 1000; draw(t); };
      draw(0);
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); }, { threshold: 0.3 }).observe(art);
      window.__mark = { seek: (ms) => { t = ms / 1000; draw(t); }, stop: () => { cancelAnimationFrame(raf); visible = false; } };
    }
  }

  // One-of-a-group buttons: aria-pressed, plus arrow keys for a tablist.
  const roving = (tabs) => tabs.forEach((tab, at) => tab.addEventListener("keydown", (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    const to = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : step ? (at + step + tabs.length) % tabs.length : -1;
    if (to < 0) return;
    e.preventDefault(); tabs[to].focus(); tabs[to].click();
  }));

  // The app's Now screen: one card, its Start/Done pill, and what is up next.
  // <tpl>
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  const dots = '<svg class="dots" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>';
  const minus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>';
  const plus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>';
  const xIcon = '<svg class="x" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const skipIcon = icon("M5 5v6a3 3 0 0 0 3 3h10M14 10l4 4-4 4"), moonIcon = icon("M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"), trashIcon = icon("M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5");
  const playIcon = '<svg class="play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5l10 6.5-10 6.5z"/></svg>';
  const clockText = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  // Demo timers are decorative, and no visible number ever changes faster than once per real second.
  // A short timer simply runs. A long one is shown as time passing: it prints its full time, the pill fill sweeps
  // (SWEEP ms), the digits cross-fade once to a near-end value (tail seconds), then real 1 Hz seconds run to zero.
  const SWEEP = 700, BALL_TAIL = 5;
  const timeline = (P, tail) => (P > tail + 1 ? { P, S: SWEEP, tail, k0: 1 - tail / P, total: SWEEP + tail * 1000 } : { P, S: 0, tail: P, k0: 0, total: P * 1000 });
  const easeIO = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  // At e ms into a timeline: the seconds the number shows (disp), how much of the time is gone (k, 0..1), and whether it is still the full time.
  const at = (L, e) => {
    e = Math.max(0, Math.min(L.total, e));
    if (!L.S) return { disp: L.P - e / 1000, k: e / L.total, full: false };
    if (e < L.S) return { disp: L.P, k: easeIO(e / L.S) * L.k0, full: true };
    return { disp: L.tail - (e - L.S) / 1000, k: L.k0 + (1 - L.k0) * ((e - L.S) / (L.tail * 1000)), full: false };
  };
  const whole = (d) => Math.max(0, Math.ceil(d - 0.05));
  const cardLine = (c) => timeline(c.clock, Math.max(2, Math.round((c.ms || 4000) / 1000)));
  const shift = (k) => `${((k - 1) * 100).toFixed(2)}%`;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  // The pill is two layers: the track, and the lime Start/Done laid over it, uncovered by k (0..1).
  const pillHTML = (label, k, off, glyph = arrow) =>
    `<button class="go" type="button" aria-label="${label}"${off ? ' aria-disabled="true"' : ""}><span class="go-lay" aria-hidden="true"><span class="go-t">${label}</span><b>${glyph}</b></span>` +
    `<span class="go-lit" aria-hidden="true" style="transform:translateX(${shift(k)})"><span class="go-lay" style="transform:translateX(${shift(2 - k)})"><span class="go-t">${label}</span><b>${glyph}</b></span></span></button>`;
  // Not today and Remove sit side by side; the first tap joins them into one named button, the second does it.
  const pairHTML = `<div class="pair"><button class="ab nt" type="button" data-name="${T.notToday}" aria-label="${T.notToday}">${moonIcon}<span>${T.notToday}</span></button><button class="ab rm" type="button" data-name="${T.remove}" aria-label="${T.remove}">${trashIcon}<span>${T.remove}</span></button></div>`;
  // The ⋯ opens the stub split: Skip, Not today, Remove, with the pill slid aside.
  const moreHTML = (menu, c) => menu && !c.idle
    ? `<button class="t-more" type="button" aria-label="${T.more}" aria-expanded="false">${dots}${xIcon}</button>`
    : `<span class="t-more${c.idle ? " off" : ""}" aria-hidden="true">${dots}</span>`;
  const menuHTML = `<div class="mrow" inert><button class="m-skip" type="button">${skipIcon}<span>${T.skip}</span></button>${pairHTML}</div>`;
  // The amounts: one row per quantity, each with real − / + buttons (44 px wide to touch, 26 px to look at).
  const stepHTML = (r, n, dir, vals) =>
    `<button class="a-step" type="button" data-n="${n}" data-d="${dir}" aria-label="${esc(T.stepLabel(r, dir))}"${dir < 0 && vals[n] <= 0 ? " disabled" : ""}>${dir < 0 ? minus : plus}</button>`;
  const amtHTML = (rows, vals) =>
    `<div class="t-amt${rows.length > 1 ? " two" : ""}">` + rows.map((r, n) =>
      `<div class="a-row" role="group" aria-label="${esc(r.l)}"><p class="a-label">${esc(r.l)}</p>${stepHTML(r, n, -1, vals)}<output class="a-val"><b>${fmt(vals[n])}</b>${esc(r.u)}</output>${stepHTML(r, n, 1, vals)}</div>`).join("") + `</div>`;
  // A card: its title, then one measure of time or its amounts, then its note.
  const bodyHTML = (c, running, vals = (c.amt || []).map((r) => r.v), menu = true) =>
    `<div class="t-head"><p class="t-title">${esc(c.t)}</p>${moreHTML(menu, c)}</div>` +
    `<p class="t-pause">${T.paused}</p>` +
    (c.clock ? `<p class="t-clock${c.rest || running ? "" : " sm"}" role="timer">${clockText(c.clock)}</p>` : "") +
    (c.amt ? amtHTML(c.amt, vals) : "") +
    (c.note ? `<p class="t-note">${esc(c.note).replace(/ · /g, "\u00a0· ").replace(/(\d) (min|s|kg|reps)\b/g, "$1\u00a0$2")}</p>` : "");
  const ticketHTML = (c, start, vals, menu = true) =>
    `<div class="t-body">${bodyHTML(c, !start, vals, menu)}</div><div class="t-stub"><div class="stub-a"><div class="stub-in">${pillHTML(c.idle ? T.waiting : start ? T.start : c.wait ? T.track : T.done, c.idle ? 0 : start || !c.clock ? 1 : 0, c.idle)}${menu && !c.idle ? menuHTML : ""}</div></div></div><span class="t-shadow" aria-hidden="true"></span>`;
  // </tpl>

  // A wait is a card that is short to do; its pill reads Keep track, and the app keeps track of the wait (the app's timer balls, planned for 1.1).
  // The demo runs one real minute in two seconds; the ball and panel always say real minutes.
  const RING = 2 * Math.PI * 13, LAND = 920, MAX_BALLS = 3;
  const leftLabel = (s) => (s >= 60 ? T.min(Math.ceil(s / 60)) : T.sec(s));
  const leftText = (d) => { const s = whole(d); return T.left(s >= 60 ? T.min(Math.ceil(s / 60)) : clockText(s)); };
  const ballHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="b-tr" cx="16" cy="16" r="13"/><circle class="b-pr" cx="16" cy="16" r="13" transform="rotate(-90 16 16)"/></svg><b></b>';

  // Done, as the app does it (Now ticket: crack, fall, print):
  //   crack  0.40 s  the stub tears off along the perforation, left to right, its free end drooping
  //   fall   0.50 s  starting the moment it is free: it swings off the last-held corner, with a shadow
  //   print  from 0.70 s  the next card is lowered in from under the top sheet (spring, 0.42 s)
  // and the "Up next" line follows as it lands. A wait card's top part also shrinks into a timer ball
  // in the tray (0.26 s .. 0.90 s). Transform and opacity, except that one small morph.
  const makeDeck = (root, { chain = false, menu = true, onReady } = {}) => {
    const slot = $(".slot", root), nextEl = $("[data-next]", root);
    const sit = $("[data-sit]", root), chip = $("[data-sit-chip]", root), tray = $("[data-tray]", root), panel = $("[data-tpanel]", root);
    const hasTray = !!(sit && chip && tray && panel);
    const peek = document.createElement("div");
    if (hasTray) { peek.className = "tpeek"; peek.hidden = true; peek.setAttribute("aria-hidden", "true"); sit.append(peek); }
    const st = { base: [], cards: [], i: 0, phase: "run", raf: 0, settle: null, vals: [], timers: [], tid: 0, loop: 0, paint: 0, open: false, ghosts: new Set(), morph: 0, peek: null, opener: null, swallow: false,
      menu: false, armed: null, queue: false, qcards: [], sel: null, undo: null, gone: new Set(), paused: false, elapsed: 0, t0: 0, held: null };
    let nextAnims = [];
    const cur = () => slot.querySelector(".ticket:not(.inc)");
    const card = () => st.cards[st.i];
    const startsHere = () => !chain && st.i === 0;
    const stop = () => { cancelAnimationFrame(st.raf); clearTimeout(st.over); };
    const setFill = (t, k) => {
      $(".go-lit", t).style.transform = `translateX(${shift(k)})`;
      $(".go-lit .go-lay", t).style.transform = `translateX(${shift(2 - k)})`;
    };
    const setLabel = (t, text) => { $$(".go-t", t).forEach((x) => { x.textContent = text; }); $(".go", t).setAttribute("aria-label", text); };
    const say = (() => {
      if (!hasTray && !menu) return () => {};
      const el = document.createElement("p");
      el.className = "visually-hidden"; el.setAttribute("aria-live", "polite"); root.append(el);
      return (m) => { el.textContent = m; };
    })();
    const rectIn = (el) => { const r = el.getBoundingClientRect(), p = root.getBoundingClientRect(); return { left: r.left - p.left, top: r.top - p.top, width: r.width, height: r.height }; };
    const box = (r, radius) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: radius });
    const drop = (g) => { g.remove(); st.ghosts.delete(g); };

    // A timed card's pill fills with the time, and the number counts down.
    const play = (t, from = 0) => {
      stop();
      const c = card(), num = $(".t-clock", t);
      if (c.idle) { st.t0 = performance.now() - from; setFill(t, 0); return; }
      if (!c.clock || !num) { st.t0 = performance.now() - from; setFill(t, 1); return; }
      const L = cardLine(c);
      // Reduced motion: no sweep and no cross-fade; the card starts at its near-end value.
      const t0 = performance.now() - (still() ? Math.max(from, L.S) : from);
      st.t0 = t0;
      let shown = -1, full = true;
      const ready = () => {
        num.classList.add("done");
        num.innerHTML = `<span class="t-ready">${T.ready}</span><span class="t-over"></span>`;
        const over = $(".t-over", num), end = t0 + L.total;
        const count = () => {
          if (!num.isConnected) return;
          const d = performance.now() - end;
          over.textContent = `+${clockText(Math.max(0, Math.floor(d / 1000)))}`;
          st.over = setTimeout(count, 1005 - (d % 1000));
        };
        count();
        if (onReady) onReady();
      };
      const tick = (now) => {
        const e = now - t0, a = at(L, e);
        setFill(t, a.k);
        if (e >= L.total) { ready(); return; }
        const sec = whole(a.disp);
        if (sec !== shown) {
          if (full && !a.full && shown >= 0 && !still() && num.animate) num.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
          num.textContent = clockText(sec); shown = sec;
        }
        full = a.full;
        st.raf = requestAnimationFrame(tick);
      };
      setFill(t, 0);
      st.raf = requestAnimationFrame(tick);
    };

    // The amounts: each card keeps its own values while it is in front; what shows at Done is what was recorded.
    const step = (btn) => {
      const c = card(), n = Number(btn.dataset.n), r = c.amt && c.amt[n];
      if (!r || st.settle || btn.closest(".ticket") !== cur()) return;
      const v = Math.max(0, Math.round((st.vals[n] + Number(btn.dataset.d) * r.s) * 100) / 100);
      st.vals[n] = v;
      const row = btn.closest(".a-row"), less = $('[data-d="-1"]', row), more = $('[data-d="1"]', row);
      $(".a-val b", row).textContent = fmt(v);
      const kept = document.activeElement === less;
      less.disabled = v <= 0;
      if (kept && less.disabled) more.focus({ preventScroll: true });
    };

    // The tray: up to three balls, one fixed slot each, soonest to end nearest the edge.
    // Tap a ball for the list of timers; press and hold it (0.35 s) for a small peek at that one.
    const remaining = (tm, now) => at(tm.L, now - tm.t0).disp;
    const soonest = () => st.timers.find((x) => !x.ending);
    // Everything about the balls pops, scales or slides; nothing fades.
    const spring = "cubic-bezier(.34,1.56,.64,1)";
    const popEl = (el, from = 1, peak = 1.18, ms = 420) => { if (!still() && el.animate) el.animate([{ transform: `scale(${from})` }, { transform: `scale(${peak})`, offset: 0.4 }, { transform: "scale(1)" }], { duration: ms, easing: spring }); };
    // A ball that lands is the real one at once: its ring draws in and its label pops.
    const reveal = (tm, land) => {
      if (!tm.el.classList.contains("pending")) return;
      tm.el.classList.remove("pending"); tm.el.removeAttribute("inert");
      if (!land || still() || !tm.el.animate) return;
      const pr = $(".b-pr", tm.el), tr = $(".b-tr", tm.el), num = $("b", tm.el), ease = "cubic-bezier(.3,.7,.3,1)";
      tr.animate([{ strokeDasharray: "0 81.68" }, { strokeDasharray: "81.68 0" }], { duration: 240, easing: ease });
      pr.animate([{ strokeDashoffset: String(-RING) }, { strokeDashoffset: pr.style.strokeDashoffset || "0" }], { duration: 280, easing: ease });
      num.animate([{ transform: "scale(.55)" }, { transform: "scale(1.18)", offset: 0.6 }, { transform: "scale(1)" }], { duration: 320, easing: spring });
    };
    const clearGhosts = () => { st.ghosts.forEach((g) => g.remove()); st.ghosts.clear(); clearTimeout(st.morph); st.morph = 0; };
    const renderPanel = () => {
      const rows = st.timers.filter((x) => !x.closing);
      if (!rows.length) { setOpen(false); return; }
      const now = performance.now();
      panel.innerHTML = "<ul>" + rows.map((tm) =>
        `<li><p class="tp-top"><b>${esc(tm.name)}</b><span data-left="${tm.id}">${tm.due ? T.due : leftText(remaining(tm, now))}</span></p><p class="tp-then">→ ${esc(tm.then.t)}</p></li>`).join("") +
        `</ul><p class="tp-note">${T.speed}</p>`;
    };
    const setOpen = (on, refocus) => {
      if (!hasTray) return;
      st.open = on; panel.hidden = !on;
      $$(".ball", tray).forEach((b) => b.setAttribute("aria-expanded", String(on)));
      if (on) { hidePeek(true); renderPanel(); }
      if (!on && refocus) { const b = st.opener && st.opener.isConnected ? st.opener : $(".ball", tray); if (b) b.focus({ preventScroll: true }); }
    };
    // The peek: a small card that grows out of the held ball and goes when the finger lifts.
    let peekAnim = null;
    const peekHTML = (tm) => `<p class="pk-top"><b>${esc(tm.name)}</b><span data-pk>${leftText(remaining(tm, performance.now()))}</span></p><p class="pk-then">→ ${esc(tm.then.t)}</p>`;
    const showPeek = (tm) => {
      if (st.open || tm.ending || !tm.el.isConnected) return;
      st.peek = tm; peek.innerHTML = peekHTML(tm); peek.hidden = false;
      const s = sit.getBoundingClientRect(), b = tm.el.getBoundingClientRect(), w = peek.offsetWidth;
      const left = Math.max(0, Math.min(s.width - w, b.right - s.left - w + 4));
      peek.style.left = `${left}px`; peek.style.transformOrigin = `${b.left + b.width / 2 - s.left - left}px 0`;
      if (peekAnim) peekAnim.cancel();
      if (!still() && peek.animate) peekAnim = peek.animate([{ transform: "scale(.6)" }, { transform: "scale(1.04)", offset: 0.6 }, { transform: "none" }], { duration: 200, easing: spring });
    };
    const hidePeek = () => {
      if (!st.peek) return;
      st.peek = null;
      if (peekAnim) peekAnim.cancel();
      peek.hidden = true;
    };
    const layoutTray = (animate) => {
      const was = new Map($$(".ball", tray).map((b) => [b, b.getBoundingClientRect().left]));
      $$(".ball", tray).forEach((b) => { if (!st.timers.some((tm) => tm.el === b)) b.remove(); });
      st.timers.forEach((tm) => tray.append(tm.el));
      tray.hidden = !st.timers.length;
      tray.setAttribute("aria-label", T.trayLabel(st.timers.length));
      if (animate && !still()) st.timers.forEach((tm) => {
        const x = was.get(tm.el), dx = x == null ? 0 : x - tm.el.getBoundingClientRect().left;
        if (Math.abs(dx) > 0.5 && tm.el.animate) tm.el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: 240, easing: "cubic-bezier(.22,.8,.26,1)" });
      });
      if (st.open) renderPanel();
    };
    const paintBall = (tm, now) => {
      const a = at(tm.L, now - tm.t0), s = a.disp, sec = whole(s), label = leftLabel(sec), num = $("b", tm.el);
      $(".b-pr", tm.el).style.strokeDashoffset = String(-RING * a.k);
      if (num.textContent !== label) {
        if (tm.full && !a.full && !still() && num.animate) num.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
        num.textContent = label;
        tm.el.setAttribute("aria-label", T.ballLabel(tm.name, sec));
      }
      tm.full = a.full;
      const text = leftText(s);
      if (st.peek === tm) { const el = $("[data-pk]", peek); if (el && el.textContent !== text) el.textContent = text; }
      if (st.open) { const el = $(`[data-left="${tm.id}"]`, panel); if (el && el.textContent !== text) el.textContent = text; }
      return s;
    };
    const tick = (now) => {
      st.loop = 0;
      if (!still() || now - st.paint >= 500) {
        st.paint = now;
        st.timers.slice().forEach((tm) => { if (!tm.ending && paintBall(tm, now) <= 0) endTimer(tm); });
      }
      if (st.timers.some((x) => !x.ending)) st.loop = requestAnimationFrame(tick);
    };
    const addTimer = (w, lag) => {
      if (!hasTray || st.timers.length >= MAX_BALLS) return null;
      const el = document.createElement("button");
      el.type = "button"; el.className = "ball pending"; el.innerHTML = ballHTML; el.setAttribute("inert", "");
      el.setAttribute("aria-expanded", String(st.open)); el.setAttribute("aria-controls", panel.id);
      const L = timeline(w.min * 60, BALL_TAIL);
      const tm = { id: ++st.tid, name: w.name, min: w.min, then: w.then, L, full: true, t0: performance.now() + lag - (still() ? L.S : 0), ms: L.total, el };
      st.timers.push(tm);
      st.timers.sort((a, b) => (a.t0 + a.ms) - (b.t0 + b.ms));
      paintBall(tm, performance.now());
      layoutTray(true);
      say(T.timerStarted(w.name, w.min));
      if (!st.loop) st.loop = requestAnimationFrame(tick);
      return tm;
    };
    // The card's top part folds into its ball: the card stays full size and is clipped in toward the ball
    // (so the text is cut away, never shrunk); then the small round shape travels, on a slight arc, and lands as the ball.
    const flyBall = (old, tm) => {
      const body = $(".t-body", old);
      if (!body || !tm.el.isConnected || !body.animate) return;
      const from = rectIn(body), to = rectIn(tm.el), cx = to.left + to.width / 2, cy = to.top + to.height / 2;
      const px = Math.min(Math.max(cx - from.left, 20), from.width - 20), py = Math.min(Math.max(cy - from.top, 20), from.height - 20);
      const g = document.createElement("div");
      g.className = "ticket ghost"; g.setAttribute("aria-hidden", "true"); g.setAttribute("inert", "");
      const inner = body.cloneNode(true);
      g.append(inner); Object.assign(g.style, box(from, "0")); root.append(g); st.ghosts.add(g);
      body.style.visibility = "hidden";
      const r = to.width / 2, W = from.width, H = from.height, small = 7;
      const circle = (rad) => `inset(${py - rad}px ${W - px - rad}px ${H - py - rad}px ${px - rad}px round ${rad}px)`;
      const open = `inset(0px 0px 0px 0px round 20px 20px 0px 0px)`;
      const size = 280, travel = 400, grow = 110;
      $$(":scope > *", inner).forEach((x) => x.animate([{ clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(50% 50% 50% 50%)" }], { duration: size * 0.7, easing: "ease-in", fill: "forwards" }));
      // The card folds down to a small dot, which rides up the right margin (clear of the Up next row), then swings into
      // the tray and grows to the ball's size as it arrives, where the ring starts drawing at once.
      g.animate([{ clipPath: open }, { clipPath: circle(small) }], { duration: size, easing: "cubic-bezier(.25,.75,.3,1)", fill: "forwards" });
      g.animate([{ clipPath: circle(small) }, { clipPath: circle(r) }], { duration: grow, delay: size + travel - grow, easing: "ease-out", fill: "forwards" });
      const rootW = root.getBoundingClientRect().width, mx = rootW - 8 - (from.left + px);
      const dx = cx - (from.left + px), dy = cy - (from.top + py);
      const a = g.animate([
        { transform: "translate(0px,0px)", easing: "ease-out" },
        { transform: `translate(${mx}px, ${dy * 0.5}px)`, offset: 0.4, easing: "linear" },
        { transform: `translate(${mx}px, ${dy}px)`, offset: 0.72, easing: "ease-in" },
        { transform: `translate(${dx}px, ${dy}px)` }], { duration: travel, delay: size, fill: "both" });
      const land = () => { reveal(tm, true); drop(g); };
      a.finished.then(land, () => {});
    };
    // A timer that is up turns red and pops; its card is queued as the next one (after any other due cards), the current card is not touched.
    // Tapping the due ball brings it now: the current card is held (frozen like Pause) and the due card pops out of the ball.
    const inject = (c, tm) => {
      const here = card();
      if (here && here.idle) { st.cards.splice(st.i, 1, c); swapTo(st.i, false, null, { pop: !still() && tm && tm.el.isConnected ? rectIn(tm.el) : null }); return; }
      let at = st.i + 1;
      while (st.cards[at] && st.cards[at].due) at++;
      st.cards.splice(at, 0, c);
      showNext(true, true); refreshQueue();
    };
    const endTimer = (tm) => {
      if (tm.ending) return;
      tm.ending = true; tm.due = true;
      tm.el.classList.add("due"); $("b", tm.el).textContent = T.dueBall;
      $(".b-pr", tm.el).style.strokeDashoffset = "0";
      tm.el.setAttribute("aria-label", T.dueAria(tm.name, tm.then.t));
      tm.card = { ...tm.then, due: true };
      say(T.dueSay(tm.name, tm.then.t));
      if (st.open) renderPanel();
      popEl(tm.el);
      inject(tm.card, tm);
    };
    // A due ball closes when its card comes up: it scales away and the others slide over.
    const closeBall = (tm, instant) => {
      if (!st.timers.includes(tm) || tm.closing) return;
      tm.closing = true;
      const fin = () => { if (st.peek === tm) hidePeek(); st.timers = st.timers.filter((x) => x !== tm); layoutTray(true); };
      if (instant || still() || !tm.el.animate) { fin(); return; }
      tm.el.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)", offset: 0.3 }, { transform: "scale(0)" }], { duration: 260, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" }).finished.then(fin, fin);
    };
    const canBring = () => !st.held && !st.settle && !!card() && !card().idle;
    const bring = (tm) => {
      const due = tm.card, j = st.cards.indexOf(due);
      if (j <= st.i) return;
      setMenu(false); closeQueue(); setOpen(false);
      const pop = still() ? null : rectIn(tm.el), here = card();
      if (st.phase === "run") {
        st.held = { c: here, by: due, vals: st.vals.slice(), elapsed: st.paused ? st.elapsed : performance.now() - st.t0 };
        st.cards.splice(j, 1); st.cards[st.i] = due;
      } else { here.notStarted = true; st.cards.splice(j, 1); st.cards.splice(st.i, 0, due); }
      swapTo(st.i, false, null, { pop });
    };
    // The held card prints back frozen where it was: "Held · m:ss" and a Resume pill. Nothing resumes by itself.
    const paintHeld = (t, h) => {
      const c = card();
      let secs = Math.floor(h.elapsed / 1000);
      if (c.clock) { const a = at(cardLine(c), h.elapsed); secs = whole(a.disp); setFill(t, a.k); $(".t-clock", t).classList.remove("done"); $(".t-clock", t).textContent = clockText(secs); } else setFill(t, 1);
      t.classList.add("paused"); setLabel(t, T.resume);
      $$(".go b", t).forEach((b) => { b.innerHTML = playIcon; });
      $(".t-pause", t).textContent = `${T.held} · ${clockText(secs)}`;
    };
    const holdState = (h) => { st.paused = true; st.elapsed = h.elapsed; st.t0 = performance.now() - h.elapsed; };
    const idleCard = () => {
      const s = soonest();
      return { idle: true, t: T.idleT, note: s ? T.idleNote(s.name, s.then.t) : "" };
    };
    const resetTimers = () => {
      if (!hasTray) return;
      cancelAnimationFrame(st.loop); st.loop = 0; clearGhosts();
      if (hold) { clearTimeout(hold.t); hold = null; }
      hidePeek(true); st.timers = []; layoutTray(false); setOpen(false);
    };
    // Press and hold (pointer, or Enter / Space held) peeks; a short press or tap opens the list, and again closes it.
    let hold = null;
    const holdStart = (tm, id, x, y) => { holdEnd(); hold = { tm, id, x, y, long: false, t: setTimeout(() => { hold.long = true; showPeek(tm); }, 350) }; };
    const holdEnd = () => {
      if (!hold) return false;
      clearTimeout(hold.t);
      const long = hold.long; hold = null;
      if (long) hidePeek();
      return long;
    };
    const ballOf = (e) => { const b = e.target.closest(".ball"); return b ? st.timers.find((x) => x.el === b) : null; };
    const toggle = (tm) => {
      if (tm.due && !tm.closing && canBring() && st.cards.includes(tm.card)) { bring(tm); return; }
      st.opener = tm.el; setOpen(!st.open);
    };
    if (hasTray) {
      tray.addEventListener("pointerdown", (e) => {
        const tm = ballOf(e);
        if (!tm || (e.pointerType === "mouse" && e.button !== 0)) return;
        if (tm.el.setPointerCapture) tm.el.setPointerCapture(e.pointerId);
        holdStart(tm, e.pointerId, e.clientX, e.clientY);
      });
      tray.addEventListener("pointermove", (e) => {
        if (hold && !hold.long && hold.id === e.pointerId && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 10) { clearTimeout(hold.t); hold = null; }
      });
      tray.addEventListener("pointerup", () => { if (holdEnd()) { st.swallow = true; setTimeout(() => { st.swallow = false; }, 400); } });
      tray.addEventListener("pointercancel", () => { holdEnd(); });
      tray.addEventListener("contextmenu", (e) => { if (e.target.closest(".ball")) e.preventDefault(); });
      tray.addEventListener("click", (e) => {
        const tm = ballOf(e);
        if (!tm) return;
        if (st.swallow) { st.swallow = false; return; }
        toggle(tm);
      });
      const keyed = (e) => e.key === "Enter" || e.key === " ";
      tray.addEventListener("keydown", (e) => {
        const tm = keyed(e) && ballOf(e);
        if (!tm) return;
        e.preventDefault();
        if (!e.repeat) holdStart(tm, "key", 0, 0);
      });
      tray.addEventListener("keyup", (e) => {
        const tm = keyed(e) && ballOf(e);
        if (!tm) return;
        e.preventDefault();
        if (hold && hold.id === "key" && !holdEnd()) toggle(tm);
      });
      tray.addEventListener("focusout", () => { if (hold && hold.id === "key") holdEnd(); });
      document.addEventListener("pointerdown", (e) => { if (st.open && !panel.contains(e.target) && !tray.contains(e.target)) setOpen(false); });
      document.addEventListener("keydown", (e) => { if (st.open && e.key === "Escape") setOpen(false, true); });
      root.addEventListener("focusout", (e) => { if (st.open && e.relatedTarget && !panel.contains(e.relatedTarget) && !tray.contains(e.relatedTarget)) setOpen(false); });
    }

    const showNext = (animate, pop) => {
      if (!nextEl || !st.cards.length) return;
      nextAnims.forEach((a) => a.cancel()); nextAnims = [];
      if (upBtn) upBtn.setAttribute("aria-disabled", String(!qrows().length));
      const after = st.cards[st.i + 1], pending = soonest(), here = card();
      const text = st.held && here === st.held.by ? `${T.held} · ${st.held.c.t}` : after ? after.t : pending ? pending.then.t : hasTray && here.wait ? here.wait.then.t : st.cards.length === 1 && here.idle ? "–" : st.cards[0].t;
      if (!animate || still() || !nextEl.animate) { nextEl.textContent = text; return; }
      if (pop) {
        nextEl.textContent = text;
        nextAnims = [nextEl.animate([{ transform: "scale(.85)" }, { transform: "scale(1.07)", offset: 0.55 }, { transform: "scale(1)" }], { duration: 340, easing: spring })];
        return;
      }
      // The old line is drawn down out of the row and the new one drops in from its top edge; the row clips both.
      const was = nextEl.cloneNode(true);
      was.removeAttribute("data-next"); was.classList.add("nx-old"); was.setAttribute("aria-hidden", "true");
      was.style.left = nextEl.offsetLeft + "px"; was.style.top = nextEl.offsetTop + "px"; was.style.width = nextEl.offsetWidth + "px";
      nextEl.after(was);
      nextEl.textContent = text;
      const down = was.animate([{ transform: "translateY(0)" }, { transform: "translateY(34px)" }], { duration: 180, easing: "cubic-bezier(.5,0,.9,.6)", fill: "forwards" });
      down.finished.then(() => was.remove(), () => was.remove());
      nextAnims = [down, nextEl.animate([{ transform: "translateY(-34px)" }, { transform: "translateY(0)" }], { duration: 300, delay: 90, easing: "cubic-bezier(.22,.8,.26,1)", fill: "backwards" })];
    };

    // The card's ⋯ (the stub splits into Skip · Not today · Remove), the Up next queue, Undo and Pause.
    const sheet = $(".sheet", root), upBtn = menu ? $("button.upnext", root) : null;
    const inertOf = (el, on) => { if (el) { if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); } };
    const toastEl = menu && sheet ? Object.assign(document.createElement("p"), { className: "toast" }) : null;
    if (toastEl) { toastEl.setAttribute("aria-hidden", "true"); sheet.append(toastEl); }
    let toastT = 0, undoT = 0;
    const toast = (m) => {
      say(m);
      if (!toastEl) return;
      toastEl.textContent = m; toastEl.classList.add("on");
      clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2400);
    };
    const undoBtn = menu ? $(".ic.undo", root) : null;
    const setUndo = (u) => {
      st.undo = u; clearTimeout(undoT);
      if (!undoBtn) return;
      undoBtn.disabled = !u; undoBtn.classList.toggle("live", !!u);
      if (u) undoT = setTimeout(() => setUndo(null), 5000);
    };
    const fresh = () => {
      const rest = st.base.filter((c) => !st.gone.has(c));
      if (rest.length) return rest;
      st.gone.clear(); return st.base.slice();
    };
    const disarm = () => {
      const a = st.armed;
      if (!a) return false;
      st.armed = null; a.host.classList.remove("arm-nt", "arm-rm");
      $$(".ab", a.host).forEach((b) => b.setAttribute("aria-label", b.dataset.name));
      return true;
    };
    const arm = (host, remove) => {
      disarm(); st.armed = { host, remove };
      host.classList.add(remove ? "arm-rm" : "arm-nt");
      const b = $(remove ? ".ab.rm" : ".ab.nt", host);
      b.setAttribute("aria-label", T.confirm(b.dataset.name));
    };
    const setMenu = (on) => {
      const t = cur(), more = t && $("button.t-more", t), row = t && $(".mrow", t);
      if (!more || !row) return;
      disarm(); st.menu = on; t.classList.toggle("menu", on);
      more.setAttribute("aria-expanded", String(on)); more.setAttribute("aria-label", on ? T.close : T.more);
      inertOf(row, !on); inertOf($(".go", t), on);
      if (on) { closeQueue(); setOpen(false); $(".m-skip", t).hidden = st.cards.length - st.i < 2 || (!!st.held && st.held.by === card()); }
    };
    // Skip puts the card one place back, right after the next one (as the app does); Not today sets it aside for today and
    // Remove takes it out (Remove can be undone for a few seconds).
    const advance = () => {
      if (st.held && !st.cards.includes(st.held.by)) {
        const h = st.held; st.held = null; st.cards.splice(st.i, 0, h.c); swapTo(st.i, false, null, { restore: h }); return;
      }
      if (st.i < st.cards.length) swapTo(st.i, false);
      else if (soonest()) { st.cards.push(idleCard()); swapTo(st.i, false); }
      else { st.cards = fresh(); swapTo(0, false); }
    };
    const skip = () => {
      if (st.cards.length - st.i < 2) return;
      st.cards.splice(st.i + 1, 0, st.cards.splice(st.i, 1)[0]);
      say(T.skipped); advance();
    };
    const putAside = (c, remove) => {
      const at = st.cards.indexOf(c);
      if (at < 0) return;
      st.cards.splice(at, 1); st.gone.add(c); st.sel = null;
      st.timers.filter((x) => x.card === c).forEach((x) => closeBall(x));
      if (remove) { setUndo({ c, at }); say(T.removed); } else toast(T.aside);
      if (at === st.i) advance(); else { showNext(true); refreshQueue(); }
    };
    const restore = () => {
      const u = st.undo;
      if (!u) return;
      setUndo(null);
      st.cards = st.cards.filter((c) => !c.idle); st.gone.delete(u.c);
      const at = Math.min(u.at, st.cards.length);
      st.cards.splice(at, 0, u.c);
      if (at <= st.i) swapTo(at, false); else { showNext(true); refreshQueue(); }
    };
    const doNow = (c) => {
      const j = st.cards.indexOf(c);
      if (j <= st.i) return;
      st.cards.splice(j, 1); st.cards.splice(st.i, 0, c);
      closeQueue(); swapTo(st.i, false);
    };
    // The queue: the cards after this one, nearest at the bottom, rolling out above the Up next line.
    const qrows = () => st.cards.slice(st.i + 1).filter((c) => !c.idle);
    const queue = document.createElement("div");
    if (menu && sheet && upBtn) {
      queue.className = "queue"; queue.hidden = true; queue.id = `q-${root.dataset.deck}`;
      queue.setAttribute("role", "group"); queue.setAttribute("aria-label", T.upNext); sheet.append(queue);
      upBtn.setAttribute("aria-controls", queue.id); upBtn.setAttribute("aria-expanded", "false");
    }
    const syncSel = () => $$(".qrow", queue).forEach((r) => {
      const on = st.qcards[Number(r.dataset.n)] === st.sel;
      r.classList.toggle("sel", on); $(".q-t", r).setAttribute("aria-expanded", String(on)); inertOf($(".q-act", r), !on);
    });
    const renderQueue = (roll) => {
      st.qcards = qrows();
      if (!st.qcards.length) { closeQueue(); return; }
      disarm();
      queue.innerHTML = st.qcards.map((c, n) =>
        `<div class="qrow armable" data-n="${n}"><button class="q-t" type="button" aria-expanded="false"><span>${esc(c.t)}</span></button><div class="q-act" inert><button class="q-now" type="button">${T.doNow}</button>${pairHTML}</div></div>`).join("");
      syncSel();
      if (roll && !still() && queue.animate) $$(".qrow", queue).forEach((r, n) => r.animate([{ opacity: 0, transform: "translateY(28px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 260, delay: n * 45, easing: "cubic-bezier(.22,.8,.26,1)", fill: "backwards" }));
    };
    const refreshQueue = () => { if (st.queue) renderQueue(false); };
    const openQueue = () => {
      if (!upBtn || !qrows().length) return;
      setMenu(false); setOpen(false);
      st.queue = true; st.sel = null; queue.hidden = false; upBtn.setAttribute("aria-expanded", "true");
      renderQueue(true);
    };
    const closeQueue = () => {
      if (!st.queue) return;
      st.queue = false; st.sel = null; disarm(); queue.hidden = true;
      if (upBtn) upBtn.setAttribute("aria-expanded", "false");
    };
    // Pause: the countdown and the pill's fill stop where they are; Resume goes on from there. Timer balls keep running.
    const pauseBtn = menu ? $(".ic.pause", root) : null;
    const syncPause = () => {
      if (!pauseBtn) return;
      const c = card();
      pauseBtn.hidden = !(st.phase === "run" && c && !c.idle);
      pauseBtn.setAttribute("aria-pressed", String(st.paused));
    };
    const pause = () => {
      const t = cur();
      if (st.paused || st.phase !== "run" || card().idle || st.settle) return;
      st.paused = true; st.elapsed = performance.now() - st.t0; stop();
      t.classList.add("paused"); setLabel(t, T.resume); $(".t-pause", t).textContent = T.paused;
      $$(".go b", t).forEach((b) => { b.innerHTML = playIcon; });
      if (pauseBtn) pauseBtn.setAttribute("aria-pressed", "true"); say(T.paused2);
    };
    const resume = () => {
      const t = cur();
      if (!st.paused) return;
      st.paused = false; t.classList.remove("paused");
      setLabel(t, card().wait ? T.track : T.done);
      $$(".go b", t).forEach((b) => { b.innerHTML = arrow; });
      if (pauseBtn) pauseBtn.setAttribute("aria-pressed", "false"); say(T.resumed);
      play(t, st.elapsed);
    };
    if (menu) {
      root.addEventListener("click", (e) => {
        if (st.settle) return;
        const t = e.target;
        const more = t.closest("button.t-more");
        if (more && more.closest(".ticket") === cur()) { setMenu(!st.menu); return; }
        if (t.closest(".m-skip")) { skip(); return; }
        const ab = t.closest(".ab");
        if (ab) {
          const host = ab.closest(".armable"), remove = ab.classList.contains("rm");
          if (st.armed && st.armed.host === host && st.armed.remove === remove) putAside(host.classList.contains("ticket") ? card() : st.qcards[Number(host.dataset.n)], remove);
          else arm(host, remove);
          return;
        }
        const row = t.closest(".qrow");
        if (row && t.closest(".q-now")) { doNow(st.qcards[Number(row.dataset.n)]); return; }
        if (row && t.closest(".q-t")) { const c = st.qcards[Number(row.dataset.n)]; disarm(); st.sel = st.sel === c ? null : c; syncSel(); return; }
        if (upBtn && t.closest("button.upnext") === upBtn) { if (st.queue) closeQueue(); else openQueue(); return; }
        if (t.closest(".ic.undo")) { restore(); return; }
        if (t.closest(".ic.pause")) { if (st.paused) resume(); else pause(); }
      });
      // A tap elsewhere pulls an armed pair apart first; then it closes the menu or the queue.
      document.addEventListener("pointerdown", (e) => {
        const t = e.target;
        if (st.armed) { if (!t.closest(".pair")) disarm(); return; }
        if (st.menu && !t.closest(".mrow, button.t-more")) setMenu(false);
        if (st.queue && !t.closest(".queue, button.upnext")) closeQueue();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || st.settle) return;
        if (disarm()) return;
        if (st.menu) { setMenu(false); const m = $("button.t-more", cur()); if (m) m.focus({ preventScroll: true }); }
        else if (st.queue) { closeQueue(); if (upBtn) upBtn.focus({ preventScroll: true }); }
      });
    }
    const finish = () => { if (st.settle) st.settle(); };

    // Replace the card: torn off (Done), or simply printed over the old one (the plan changed).
    // tm: the timer ball this card's top part becomes, if it is a wait.
    const swapTo = (n, tearOff, tm, opts = {}) => {
      finish(); stop();
      const old = cur();
      st.i = n % st.cards.length;
      st.menu = false; st.armed = null; st.paused = false;
      const here = card();
      st.timers.filter((x) => x.card === here).forEach((x) => closeBall(x));
      if (st.queue) renderQueue(false);
      st.vals = opts.restore ? opts.restore.vals.slice() : (here.amt || []).map((r) => r.v);
      st.phase = opts.restore ? "run" : startsHere() || here.notStarted ? "ready" : "run";
      const t = document.createElement("div");
      t.className = "ticket armable inc";
      t.innerHTML = ticketHTML(card(), st.phase === "ready", st.vals, menu);
      if (opts.restore) paintHeld(t, opts.restore);
      const focused = old && old.contains(document.activeElement);
      const landed = () => {
        t.classList.remove("inc"); t.removeAttribute("inert"); t.removeAttribute("aria-hidden"); t.style.visibility = "";
        showNext(false); syncPause();
        if (opts.restore) { holdState(opts.restore); syncPause(); } else if (st.phase === "run") play(t);
        if (focused) $(".go", t).focus({ preventScroll: true });
      };
      if (!old || still() || !old.animate) {
        if (old) old.remove();
        st.timers.forEach((x) => reveal(x));
        slot.append(t); landed();
        return;
      }
      slot.append(t);
      t.setAttribute("inert", ""); t.setAttribute("aria-hidden", "true");
      const anims = [];
      const go = (el, frames, opts) => { const a = el.animate(frames, opts); anims.push(a); return a; };
      const W = old.offsetWidth, travel = slot.offsetHeight + 24;
      let printAt = 0;
      if (tearOff) {
        old.setAttribute("inert", "");
        const a = $(".stub-a", old), b = a.cloneNode(true);
        b.className = "stub-b"; b.setAttribute("aria-hidden", "true");
        $$("[aria-label]", b).forEach((x) => x.removeAttribute("aria-label"));
        a.after(b);
        const f0 = 0.08, crack = { duration: 400, easing: "cubic-bezier(.4,0,.75,.5)", fill: "forwards" };
        go(a, [{ transform: `translateX(${f0 * W}px)` }, { transform: `translateX(${W}px)` }], crack);
        go($(".stub-in", a), [{ transform: `translateX(${-f0 * W}px)` }, { transform: `translateX(${-W}px)` }], crack);
        go(b, [{ transform: `translateX(${-(1 - f0) * W}px) rotate(0deg)` }, { transform: "translateX(0px) rotate(-10deg)" }], crack);
        b.style.filter = "drop-shadow(0 8px 12px rgba(0,0,0,.22))";
        go($(".stub-in", b), [{ transform: `translateX(${(1 - f0) * W}px)` }, { transform: "translateX(0px)" }], crack);
        const tilt = 6 + Math.floor(Math.random() * 7), drift = (Math.floor(Math.random() * 41) - 20) * 0.65;
        const fall = (slot.closest(".now") || slot).getBoundingClientRect().bottom - b.getBoundingClientRect().top + 30;
        go(b, [{ transform: "translateX(0px) rotate(-10deg)" }, { transform: `translate(${drift}px, ${fall}px) rotate(${-(10 + tilt)}deg)` }],
          { duration: 500, delay: 400, easing: "cubic-bezier(.35,.25,.8,.65)", fill: "forwards" });
        // Free of the card, both torn edges show the perforation's half-holes.
        old.classList.add("torn");
        printAt = tm ? 480 : 700;
        if (tm) st.morph = setTimeout(() => { st.morph = 0; flyBall(old, tm); }, 240);
      }
      const print = { duration: 460, delay: printAt, easing: "cubic-bezier(.22,.8,.26,1)", fill: "both" };
      let lowered;
      if (opts.pop) {
        // The due card pops out of its ball: the card it replaces steps back and tucks under the Up next line, then the
        // new card is revealed in the slot by a circle growing from the ball (in bounds, never an empty slab).
        const to = rectIn(slot), X = opts.pop.left + opts.pop.width / 2 - to.left, Y = opts.pop.top + opts.pop.height / 2 - to.top;
        const R = Math.hypot(Math.max(X, to.width - X), Math.max(Y, to.height - Y)) + 12, at = `at ${X}px ${Y}px`;
        slot.style.clipPath = "inset(0)";
        go(old, [{ transform: "none" }, { transform: `translateY(${-(to.height + 16)}px) scale(.88)` }], { duration: 300, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" });
        lowered = go(t, [{ clipPath: `circle(14px ${at})` }, { clipPath: `circle(${R}px ${at})` }], { duration: 520, delay: 230, easing: "cubic-bezier(.3,.8,.3,1)", fill: "both" });
      } else {
        lowered = go(t, [{ transform: `translateY(${-travel}px) scale(1.025)` }, { transform: "translateY(0px) scale(1)" }], print);
        go($(".t-shadow", t), [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { ...print, easing: "linear" });
      }
      const upNext = setTimeout(() => showNext(true, !!opts.pop), opts.pop ? 140 : printAt);
      const settle = () => {
        if (st.settle !== settle) return;
        st.settle = null; clearTimeout(upNext);
        anims.forEach((x) => x.cancel());
        clearGhosts(); st.timers.forEach((x) => reveal(x)); slot.style.clipPath = "";
        old.remove(); landed();
      };
      st.settle = settle;
      lowered.finished.then(settle, () => {});
    };

    slot.addEventListener("click", (e) => {
      const adj = e.target.closest(".a-step");
      if (adj) { step(adj); return; }
      const btn = e.target.closest(".go");
      if (!btn || st.settle || btn.closest(".ticket") !== cur()) return;
      press();
    });
    const press = () => {
      if (st.settle) return;
      const t = cur(), c = card();
      if (c.idle) return;
      if (st.paused) { resume(); return; }
      if (st.phase === "ready") {
        st.phase = "run"; delete c.notStarted;
        $(".t-body", t).innerHTML = bodyHTML(c, true, st.vals, menu);
        setLabel(t, c.wait ? T.track : T.done); play(t); syncPause();
        return;
      }
      root.dispatchEvent(new CustomEvent("deck:done", { detail: { title: c.t, amounts: (c.amt || []).map((r, n) => ({ label: r.l, value: st.vals[n], unit: r.u })) } }));
      setUndo(null); closeQueue();
      const tm = c.wait ? addTimer(c.wait, still() ? 0 : LAND) : null;
      if (st.held && c === st.held.by) { const h = st.held; st.held = null; st.cards[st.i] = h.c; swapTo(st.i, true, tm, { restore: h }); return; }
      if (st.i < st.cards.length - 1) swapTo(st.i + 1, true, tm);
      else if (soonest()) { st.cards.push(idleCard()); swapTo(st.i + 1, true, tm); }
      else { st.cards = fresh(); swapTo(0, true, tm); }
    };
    // Load a set of cards: printed over the card on show, or laid down at once.
    const load = (cards, { print = false } = {}) => {
      finish(); stop(); resetTimers();
      st.gone = new Set(); st.held = null; st.sel = null; cards.forEach((c) => { delete c.notStarted; }); st.menu = false; st.armed = null; st.paused = false;
      setUndo(null); closeQueue();
      st.base = cards; st.cards = cards.slice();
      if (hasTray) { sit.hidden = !cards.sit; chip.textContent = cards.sit || ""; }
      if (print && cur()) { swapTo(0, false); return; }
      slot.textContent = "";
      st.i = 0; st.phase = startsHere() ? "ready" : "run";
      st.vals = (card().amt || []).map((r) => r.v);
      const t = document.createElement("div");
      t.className = "ticket armable"; t.innerHTML = ticketHTML(card(), st.phase === "ready", st.vals, menu);
      slot.append(t); showNext(false); syncPause();
      if (st.phase === "run") play(t);
    };
    // For the demo tile: tap the first due ball, as a finger would.
    const tapDue = () => { const tm = st.timers.find((x) => x.due); if (tm) toggle(tm); };
    return { load, press, tapDue, el: slot };
  };

  // Sets of cards the phones deal from. A first card says Start; the ones that follow are chained (Done).
  // Amounts are rows of { l: label, v: value, u: unit, s: step }. A wait starts a timer ball when its card is done;
  // when that ends, its "then" card is the next one. A set may name the situation it shows beside the tray.
  // <sets>
  const set = (cards, sit) => Object.assign(cards, sit ? { sit } : {});
  const sets = {
    workout: [
      { t: "Push-ups", amt: [{ l: "Reps", v: 8, u: "reps", s: 1 }], note: "Hands under shoulders · chest to the floor · 2 s down" },
      { t: "Rest", clock: 60, rest: true, note: "Shake out your arms · breathe slow", ms: 5000 },
      { t: "Push-ups", amt: [{ l: "Reps", v: 8, u: "reps", s: 1 }], note: "Body in one line · chest to the floor · 2 s down" },
      { t: "Rows", amt: [{ l: "Reps", v: 12, u: "reps", s: 1 }, { l: "Weight", v: 20, u: "kg", s: 2.5 }], note: "Elbows back, squeeze 1 s · 2 s down" },
    ],
    pasta: set([
      { t: "Put the water on", note: "Big pot, lid on · salt like the sea · 8 min",
        wait: { name: "Water", min: 8, then: { t: "Add the pasta", note: "Push it under, stir once · 9 min",
          wait: { name: "Pasta", min: 9, then: { t: "Toss and serve", note: "Oil, garlic, chili · splash of pasta water" } } } } },
      { t: "Slice the garlic", note: "4 cloves, sliced thin · fingertips curled under" },
      { t: "Garlic in the oil", note: "Low heat, keep it pale gold · 3 min",
        wait: { name: "Garlic", min: 3, then: { t: "Take the pan off", note: "Stir in the chili · keep the oil warm" } } },
      { t: "Grate the parmesan", note: "Fine side of the grater · about ½ cup" },
    ], "Cooking"),
    focus: [
      { t: "Outline", clock: 900, note: "One line per section · no full sentences yet", ms: 5000 },
      { t: "Draft sections 1–3", clock: 3000, note: "Write, don’t fix · leave gaps", ms: 5000 },
      { t: "Break", clock: 600, rest: true, note: "Stand up, drink water · screen off", ms: 4000 },
      { t: "Review", clock: 1200, note: "Read it out loud · mark where you stumble", ms: 4000 },
    ],
    // A brain dump, sorted: the smallest first step first, a timer where a block of time makes sense.
    dump: [
      { t: "Open the Q3 deck", note: "Just open it · type the title, then stop" },
      { t: "Write the deck", clock: 1500, note: "Slides 1–3 only · phone face down", ms: 5000 },
      { t: "Email landlord", clock: 300, note: "Three lines: the leak, since when, a date", ms: 4000 },
      { t: "Call mom", note: "Return Sunday’s voicemail · 10 min, then goodnight" },
      { t: "Book the dentist", note: "One call · ask for the first slot next week" },
      { t: "Band pulls", amt: [{ l: "Reps", v: 15, u: "reps", s: 1 }], note: "Light band, elbows in · stop if it pinches" },
    ],
    reset: [
      { t: "Dishes", clock: 480, note: "Glasses first · hot water, sink to rack", ms: 5000 },
      { t: "Wipe the counter", clock: 240, note: "Clear it first · wipe left to right", ms: 4000 },
      { t: "Laundry in", clock: 180, note: "Pockets empty · don’t pack the drum", ms: 4000 },
    ],
  };
  if (ko) Object.assign(sets, {
    workout: [
      { t: "푸시업", amt: [{ l: "횟수", v: 8, u: "회", s: 1 }], note: "손은 어깨 아래에 · 가슴은 바닥 가까이 · 내려갈 땐 2초" },
      { t: "휴식", clock: 60, rest: true, note: "팔을 털어 주세요 · 숨은 천천히", ms: 5000 },
      { t: "푸시업", amt: [{ l: "횟수", v: 8, u: "회", s: 1 }], note: "몸은 일직선으로 · 가슴은 바닥 가까이 · 내려갈 땐 2초" },
      { t: "로우", amt: [{ l: "횟수", v: 12, u: "회", s: 1 }, { l: "무게", v: 20, u: "kg", s: 2.5 }], note: "팔꿈치를 뒤로, 1초 조이기 · 내려갈 땐 2초" },
    ],
    pasta: set([
      { t: "물 올리기", note: "큰 냄비에 뚜껑을 덮고 · 소금은 바닷물 정도로 · 8분",
        wait: { name: "물", min: 8, then: { t: "면 넣기", note: "푹 담그고 한 번 저어요 · 9분",
          wait: { name: "면", min: 9, then: { t: "버무려서 담기", note: "기름, 마늘, 고추 · 면수 조금" } } } } },
      { t: "마늘 썰기", note: "4쪽을 얇게 · 손끝은 안쪽으로 말아요" },
      { t: "마늘 볶기", note: "약불에서 연한 황금색이 되게 · 3분",
        wait: { name: "마늘", min: 3, then: { t: "팬 내리기", note: "고추를 넣고 저어요 · 기름은 따뜻하게" } } },
      { t: "파르메산 갈기", note: "고운 쪽으로 · 약 ½컵" },
    ], "요리"),
    focus: [
      { t: "개요 쓰기", clock: 900, note: "구간마다 한 줄 · 문장은 아직 쓰지 않아요", ms: 5000 },
      { t: "본문 1–3 쓰기", clock: 3000, note: "쓰기만 하고 고치지 않아요 · 빈칸은 그대로", ms: 5000 },
      { t: "휴식", clock: 600, rest: true, note: "일어나서 물 마시기 · 화면은 끄고", ms: 4000 },
      { t: "검토", clock: 1200, note: "소리 내어 읽기 · 걸리는 곳에 표시", ms: 4000 },
    ],
    dump: [
      { t: "발표 자료 열기", note: "파일만 열어요 · 제목만 쓰고 멈추기" },
      { t: "발표 자료 쓰기", clock: 1500, note: "1–3번 슬라이드만 · 휴대폰은 엎어 두세요", ms: 5000 },
      { t: "집주인에게 메일 쓰기", clock: 300, note: "세 줄이면 돼요: 누수, 언제부터, 수리 날짜", ms: 4000 },
      { t: "엄마에게 전화하기", note: "일요일 부재중 전화에 답해요 · 10분 통화하고 굿나잇" },
      { t: "치과 예약하기", note: "전화 한 통 · 다음 주 가장 빠른 시간으로" },
      { t: "밴드 당기기", amt: [{ l: "횟수", v: 15, u: "회", s: 1 }], note: "가벼운 밴드, 팔꿈치는 몸 쪽으로 · 아프면 멈춰요" },
    ],
    reset: [
      { t: "설거지", clock: 480, note: "컵부터 · 뜨거운 물로, 싱크대에서 건조대로", ms: 5000 },
      { t: "조리대 닦기", clock: 240, note: "먼저 치우고 · 왼쪽에서 오른쪽으로 닦아요", ms: 4000 },
      { t: "빨래 돌리기", clock: 180, note: "주머니는 비우고 · 세탁기는 가득 채우지 마세요", ms: 4000 },
    ],
  });
  // </sets>
  const greeting = T.greet;
  $$("[data-greet]").forEach((g) => { g.textContent = greeting(new Date().getHours()); });

  // Product window: each thread is a plan; the phone shows its first card.
  // The brain dump comes first: a messy ramble (segs, grouped by where each piece went) becomes a short reply and a deck.
  // <plans>
  const segHTML = (segs, on) => segs.map(([t, g]) => (g ? `<span class="frag${on ? " on" : ""}" data-g="${g}">${esc(t)}</span>` : esc(t))).join("");
  // A number stays on the line of its unit ("10 min", "3 sets", "60 s").
  const keep = (t) => t.replace(/(\d) (?=(min|s|sets|steps|timers|cards|cloves)\b)/g, "$1\u00a0");
  const threadHTML = (plan, staged) =>
    `<p class="msg me">${plan.segs ? segHTML(plan.segs, !staged) : plan.me}</p>` +
    `<p class="msg ai${staged ? " pre" : ""}">${plan.ai}</p>` +
    `<ul class="msg ai list${staged ? " pre" : ""}">${plan.list.map(([b, t, g]) => `<li${g ? ` data-g="${g}"` : ""}${staged ? ' class="pre"' : ""}>${ck}<span class="l"><b>${b}</b> → ${keep(t)}</span></li>`).join("")}</ul>` +
    `<p class="msg ai${staged ? " pre" : ""}">${plan.end}</p>`;
  const plans = {
    dump: { title: "Brain dump", c: "#e5658a",
      segs: [["ok so my head is full. i have to get ", 0], ["the q3 deck going for priya", "today"], [" and i keep not starting it, and ", 0], ["the email to the landlord about the leak", "today"],
        [", which i’m dreading, and mom left a voicemail sunday so i need to ", 0], ["call her back", "today"], [". i should ", 0], ["work out but my shoulder is still weird", "today"], [". oh and ", 0],
        ["the dentist", "today"], [", i keep forgetting the dentist. ", 0], ["we’re out of eggs and coffee", "later"], [" too. ", 0], ["someday i want to learn spanish lol", "interest"]],
      ai: "that’s a lot, but most of it is small. smallest first step first.",
      list: [["Today", "6 cards · 2 timers", "today"], ["Later this week", "2 · eggs and coffee, slides 4+", "later"], ["Interest", "Spanish · when there’s room", "interest"]],
      end: "first card is on your iPhone." },
    workout: { title: "Tonight’s workout", c: "#3fb6a8", me: "quick workout tonight, then I’m cooking pasta", ai: "Monday was legs, so tonight is upper body. You said your shoulders were still sore on Wednesday, so push-ups are lighter than last time.",
      list: [["Push-ups", "3 sets of 8 · was 10"], ["Rows", "3 sets of 12 · 60 s rests"], ["Pasta", "7 steps · 3 timers"]],
      end: "first card is on your iPhone." },
    pasta: { title: "Garlic pasta", c: "#f2a33a", me: "garlic pasta for two, I’ve got 30 minutes", ai: "doable. the water does most of the waiting.",
      list: [["Water", "on, 8 min · tracked while you prep"], ["Garlic", "slice 4 cloves, 3 min in the oil"], ["Pasta", "9 min · tracked"], ["Toss", "oil, garlic, chili, pasta water"]],
      end: "7 cards. the app keeps track of what’s waiting while you do the next step." },
    focus: { title: "Proposal draft", c: "#6d5df5", me: "I need the proposal draft done by 5", ai: "three blocks with a break, finishing at 4:40.",
      list: [["Outline", "15 min"], ["Sections 1–3", "50 min, then a 10 min break"], ["Review", "20 min · read it out loud"]],
      end: "4 cards. your calendar’s 3:00 call is left alone." },
    reset: { title: "20-minute reset", c: "#3b82f6", me: "my place is a mess and I have 20 minutes", ai: "biggest win first. dishes, then surfaces.",
      list: [["Dishes", "8 min"], ["Counter", "4 min"], ["Laundry", "in the machine · 3 min"], ["Floor", "5 min"]],
      end: "4 cards, 20 minutes. stop when the last one’s done." },
  };
  if (ko) Object.assign(plans, {
    "dump": {
      "title": "머릿속 정리",
      "c": "#e5658a",
      "segs": [
        [
          "머리 복잡하다. ",
          0
        ],
        [
          "내일 발표 자료 시작해야 되는데",
          "today"
        ],
        [
          " 계속 미루는 중이고, ",
          0
        ],
        [
          "집주인한테 누수 얘기 보내야 되고",
          "today"
        ],
        [
          " 엄마한테 ",
          0
        ],
        [
          "전화도 해야 돼",
          "today"
        ],
        [
          ". ",
          0
        ],
        [
          "운동하고 싶은데 어깨가 좀 뻐근해",
          "today"
        ],
        [
          ". 아 ",
          0
        ],
        [
          "치과 예약도 해야 됨",
          "today"
        ],
        [
          ". ",
          0
        ],
        [
          "달걀이랑 커피 다 떨어졌고",
          "later"
        ],
        [
          " 언젠간 ",
          0
        ],
        [
          "스페인어도 배워보고 싶다",
          "interest"
        ]
      ],
      "ai": "하나씩 해 봐요. 가장 쉬운 첫걸음부터요.",
      "list": [
        [
          "오늘",
          "카드 6장 · 타이머 2개",
          "today"
        ],
        [
          "이번 주에",
          "달걀과 커피, 나머지 발표 자료",
          "later"
        ],
        [
          "관심사",
          "스페인어 · 여유가 생기면",
          "interest"
        ]
      ],
      "end": "첫 카드가 iPhone에 도착했어요."
    },
    "workout": {
      "title": "오늘 저녁 운동",
      "c": "#3fb6a8",
      "me": "오늘은 짧게 운동하고 파스타 만들 거야",
      "ai": "월요일에 하체 운동을 했으니 오늘은 상체를 해 봐요. 어깨가 뻐근하다고 했으니 푸시업 횟수는 지난번보다 줄일게요.",
      "list": [
        [
          "푸시업",
          "8회씩 3세트 · 지난번엔 10회"
        ],
        [
          "로우",
          "12회씩 3세트 · 휴식 60초"
        ],
        [
          "파스타",
          "7단계 · 타이머 3개"
        ]
      ],
      "end": "첫 카드가 iPhone에 도착했어요."
    },
    "pasta": {
      "title": "마늘 파스타",
      "c": "#f2a33a",
      "me": "30분 안에 마늘 파스타 2인분 만들고 싶어",
      "ai": "충분해요. 물이 끓는 동안 재료를 준비해요.",
      "list": [
        [
          "물",
          "끓이기 8분 · 준비하는 동안 타이머로"
        ],
        [
          "마늘",
          "4쪽 썰기 · 기름에서 3분"
        ],
        [
          "면",
          "9분 · 타이머로"
        ],
        [
          "섞기",
          "기름, 마늘, 고추, 면수"
        ]
      ],
      "end": "카드 7장이에요. 기다리는 시간은 앱이 챙겨 줄게요."
    },
    "focus": {
      "title": "제안서 초안",
      "c": "#6d5df5",
      "me": "5시까지 제안서 초안 끝내야 돼",
      "ai": "쉬는 시간을 넣어 세 구간으로 나눌게요. 4시 40분에 마치는 계획이에요.",
      "list": [
        [
          "개요",
          "15분"
        ],
        [
          "본문 1–3",
          "50분, 이후 10분 휴식"
        ],
        [
          "검토",
          "20분 · 소리 내어 읽기"
        ]
      ],
      "end": "카드 4장이에요. 캘린더의 3시 통화는 그대로 비워 두었어요."
    },
    "reset": {
      "title": "20분 집 정리",
      "c": "#3b82f6",
      "me": "집 엉망인데 20분밖에 없어",
      "ai": "가장 눈에 띄는 것부터요. 설거지하고, 주변을 정리해요.",
      "list": [
        [
          "설거지",
          "8분"
        ],
        [
          "조리대",
          "4분"
        ],
        [
          "빨래",
          "세탁기에 넣기 · 3분"
        ],
        [
          "바닥",
          "5분"
        ]
      ],
      "end": "카드 4장, 20분이에요. 마지막 카드를 끝내면 오늘은 여기까지."
    }
  });
  // </plans>
  const thread = $("[data-thread]");
  const tryScreen = $('[data-deck="try"]');
  if (thread && tryScreen) {
    const tryDeck = makeDeck(tryScreen);
    const waiting = [{ idle: true, t: T.waitT, note: T.waitNote }];
    const tabs = $$("[data-plan]");
    // The dump, in about two seconds: the AI answers, each group of pieces lights up as its row appears, then the first card prints.
    let timers = [];
    const cancel = () => { timers.forEach(clearTimeout); timers = []; };
    const at = (fn, ms) => timers.push(setTimeout(fn, ms));
    const playDump = () => {
      cancel();
      thread.innerHTML = threadHTML(plans.dump, true);
      tryDeck.load(waiting, { print: true });
      const rev = (el) => { el.classList.remove("pre"); el.classList.add("rev"); };
      const [intro, list, end] = $$(".msg.ai", thread);
      at(() => rev(intro), 500);
      at(() => rev(list), 900);
      $$("li", list).forEach((li, n) => at(() => {
        li.classList.remove("pre");
        $$(`.frag[data-g="${li.dataset.g}"]`, thread).forEach((x) => x.classList.add("on"));
      }, 1050 + n * 380));
      at(() => tryDeck.load(sets.dump, { print: true }), 1750);
      at(() => rev(end), 2150);
    };
    const show = (key) => {
      cancel();
      const plan = plans[key];
      $("[data-plan-title]").textContent = plan.title;
      $("[data-plan-dot]").style.setProperty("--c", plan.c);
      if (plan.segs && !still()) { playDump(); return; }
      thread.innerHTML = threadHTML(plan, false);
      tryDeck.load(sets[key], { print: true });
    };
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      io && io.disconnect();
      tabs.forEach((t) => { t.setAttribute("aria-selected", String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
      show(tab.dataset.plan);
    }));
    roving(tabs);
    // First view: the dump waits until its window is on screen, then plays once.
    let io = null;
    if (!still() && "IntersectionObserver" in window) {
      thread.innerHTML = threadHTML(plans.dump, true);
      tryDeck.load(waiting);
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); playDump(); } }, { threshold: 0.6 });
      io.observe(thread);
    } else tryDeck.load(sets.dump);
  }

  // Jobs: pick an example, or type your own and see it split into cards.
  const dumpText = plans.dump.segs.map((x) => x[0]).join("");
  const jobs = {
    dump: { d: "<b>Say it messy.</b> Your AI sorts it into small cards, smallest first step first, and keeps ideas like Spanish for when there’s room.", cards: sets.dump },
    workout: { d: "<b>Sets and rests, in order.</b> Your AI splits a workout into sets with timed rests, and logs the reps you enter.", cards: sets.workout },
    cooking: { d: "<b>Steps and waits.</b> Recipes become one step at a time. When something has to wait, the app keeps track of it in the corner while you do the next thing.", cards: sets.pasta },
    focus: { d: "<b>Blocks with breaks.</b> A deadline becomes focused blocks with real breaks between them.", cards: sets.focus },
  };
  if (ko) {
    jobs.dump.d = "<b>두서없이 말해도 괜찮아요.</b> AI가 작은 카드로 정리해 가장 쉬운 첫걸음부터 보여 줍니다. 언젠가 해 보고 싶은 일은 여유가 생길 때를 위해 남겨 두고요.";
    jobs.workout.d = "<b>세트와 휴식을 차례대로.</b> AI가 운동을 세트별로 나누고 쉬는 시간을 넣어 줍니다. 입력한 횟수도 기록해요.";
    jobs.cooking.d = "<b>요리도 한 단계씩.</b> 레시피를 지금 할 일로 나눕니다. 기다릴 땐 앱이 시간을 챙기는 동안 다음 단계를 진행하세요.";
    jobs.focus.d = "<b>집중할 시간, 쉴 시간.</b> 마감까지 할 일을 집중 구간으로 나누고, 사이사이 제대로 쉬는 시간을 넣어 줍니다.";
  }
  const own = $("[data-own]"), ownText = $("[data-own-text]"), ownLabel = $("[data-own-label]");
  // Free text into cards: split on sentences, commas and "then", drop the filler words and feelings.
  const fromText = (text) => {
    if (ko) {
      // Korean: split on sentences, commas and "그리고 / 그다음", drop the connectives and the feelings.
      const lead = /^(?:(?:그리고|그래서|그런데|또|아|음|일단|우선|그다음에?)[,\s]+)+/;
      const noise = /^(?:근데|하지만|ㅋㅋ+|너무|머릿속|언젠가)/;
      const parts = text.split(/[.,;\n。]|\s그리고\s|\s그다음에?\s|\s그러고 나서\s/).map((x) => x.trim().replace(lead, "").trim()).filter((x) => x.length > 2 && !noise.test(x)).slice(0, 4);
      if (!parts.length) return [{ t: "첫 번째 카드", note: "위에 적으면 카드로 나뉘어요" }, { t: "두 번째 카드" }];
      const short = (x) => (x.length > 18 ? x.slice(0, 18).replace(/\s\S*$/, "") + "…" : x);
      const cards = parts.map((x, n) => {
        const min = x.match(/(\d+)\s*분/);
        return { t: short(x), note: `${n + 1} / ${parts.length}`, ...(min ? { clock: Number(min[1]) * 60, ms: 4000 } : {}) };
      });
      return parts.length < 2 ? cards.concat([{ t: "나머지는 AI가 채워요" }]) : cards;
    }
    const lead = /^(?:(?:ok(?:ay)?|so|and|also|oh|then|well|plus|i (?:really )?(?:have|need|want|should|gotta|got) to|i keep (?:forgetting|not \w+ing)|need to|gotta|have to)\b[,\s]*)+/i;
    const noise = /^(?:which|but|lol|too|my head|it’s|i’m|someday)\b/i;
    const parts = text.split(/[.,;\n]|\bthen\b|\band then\b/i).map((x) => x.trim().replace(lead, "").trim()).filter((x) => x.length > 3 && !noise.test(x)).slice(0, 4);
    if (!parts.length) return [{ t: "Your first card", note: "Type above to see it split" }, { t: "Your second card" }];
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    // A title is the first clause, cut at a word.
    const short = (x) => {
      const head = x.split(/\s(?:and i|which|but|so)\s/i)[0];
      const t = head.length >= 8 ? head : x;
      return cap(t.length > 36 ? t.slice(0, 36).replace(/\s\S*$/, "") + "…" : t);
    };
    const cards = parts.map((x, n) => {
      const min = x.match(/(\d+)\s*(min|minutes)/i);
      return { t: short(x), note: `${n + 1} of ${parts.length}`, ...(min ? { clock: Number(min[1]) * 60, ms: 4000 } : {}) };
    });
    return parts.length < 2 ? cards.concat([{ t: "Your AI adds the rest" }]) : cards;
  };
  const jobsScreen = $('[data-deck="jobs"]');
  if (jobsScreen) {
    const jobsDeck = makeDeck(jobsScreen);
    jobsDeck.load(jobs.dump.cards);
    const picks = $$("[data-job]");
    const drafts = { dump: dumpText, own: "" };
    // The box grows to its text (then scrolls) and always starts at the top.
    const fit = () => {
      if (own.hidden) return;
      ownText.style.height = "auto";
      ownText.style.height = `${Math.min(ownText.scrollHeight + 2, 360)}px`;
      ownText.scrollTop = 0;
    };
    addEventListener("resize", () => requestAnimationFrame(fit));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
    let job = "dump";
    // The brain dump shows its own words; until they are edited, its cards are the sorted set.
    const cardsNow = () => (job === "dump" && ownText.value === dumpText ? sets.dump : fromText(ownText.value));
    picks.forEach((chip) => chip.addEventListener("click", () => {
      picks.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      job = chip.dataset.job;
      const text = job === "dump" || job === "own";
      own.hidden = !text;
      const desc = $("[data-job-desc]");
      if (text) {
        ownText.value = drafts[job];
        ownLabel.textContent = ko ? "생각나는 대로 적어 보세요" : (job === "dump" ? "Say it however it comes" : "What’s on your plate?");
        fit();
      }
      if (job === "own") {
        desc.innerHTML = ko ? "<b>단계가 있는 일이라면 무엇이든.</b> 오늘 할 일을 편하게 적어 보세요." : "<b>Anything with steps.</b> Type what’s on your plate in your own words.";
        jobsDeck.load(cardsNow(), { print: true }); ownText.focus();
      } else {
        desc.innerHTML = jobs[job].d;
        jobsDeck.load(job === "dump" ? cardsNow() : jobs[job].cards, { print: true });
      }
    }));
    ownText?.addEventListener("input", () => { drafts[job] = ownText.value; fit(); jobsDeck.load(cardsNow()); });
  }

  // Value tiles: short loops. step(later) returns how long the loop waits.
  // They begin when the tile first shows and keep looping while it is on screen. Off screen (or in a
  // hidden tab) a loop finishes its cycle and waits; it resumes at the next cycle, never reset.
  const loopWhileVisible = (el, step) => {
    if (!el || still() || !("IntersectionObserver" in window)) return;
    let seen = false, waiting = true;
    const later = (fn, ms) => setTimeout(fn, ms);
    const showing = () => seen && !document.hidden;
    const run = () => {
      if (!showing()) { waiting = true; return; }
      waiting = false;
      const wait = step(later);
      setTimeout(run, wait);
    };
    const wake = () => { if (waiting && showing()) run(); };
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); }, { threshold: 0.35 }).observe(el);
    document.addEventListener("visibilitychange", wake);
  };
  const animateTo = (ms, fn) => {
    const t0 = performance.now();
    const f = (now) => { const k = Math.max(0, Math.min(1, (now - t0) / ms)); fn(k); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };

  // Only the next card: Done tears the stub off and the next card is printed over it.
  {
    const tile = $('[data-tile="next"]'), screen = $(".viz-next", tile);
    const deck = screen && makeDeck(screen, { chain: true, menu: false });
    const cards = ko ? [
      { t: "푸시업", note: "손은 어깨 아래에 · 내려갈 땐 2초" },
      { t: "휴식", clock: 60, rest: true, ms: 2000 },
      { t: "푸시업", note: "몸은 일직선으로 · 내려갈 땐 2초" },
      { t: "물 올리기", note: "큰 냄비에 뚜껑을 덮고 · 8분" },
    ] : [
      { t: "Push-ups", note: "Hands under shoulders · 2 s down" },
      { t: "Rest", clock: 60, rest: true, ms: 2000 },
      { t: "Push-ups", note: "Body in one line · 2 s down" },
      { t: "Put the water on", note: "Big pot, lid on · 8 min" },
    ];
    let ready = false;
    if (deck) loopWhileVisible(tile, (later) => {
      if (!ready) { deck.load(cards); ready = true; }
      later(() => {
        const go = $(".go", screen); go.classList.add("tap");
        later(() => go.classList.remove("tap"), 150);
        later(() => deck.press(), 90);
      }, 1500);
      return 3600;
    });
  }

  // Waits: "Put the water on" is short to do; Keep track tears the stub, the card shrinks into a ball in the tray,
  // the next card comes while the ring drains, the ball turns red when due, and tapping it brings "Add the pasta" now:
  // the garlic card is held, and comes back with Resume. Two minutes here is a short sweep and five real seconds.
  {
    const tile = $('[data-tile="timer"]'), screen = $(".now", tile);
    const deck = screen && makeDeck(screen, { chain: true, menu: false });
    const cards = ko ? set([
      { t: "물 올리기", note: "큰 냄비에 뚜껑을 덮고 · 2분", wait: { name: "물", min: 2, then: { t: "면 넣기", note: "한 번 저어요" } } },
      { t: "마늘 썰기", note: "4쪽을 얇게" },
      { t: "파르메산 갈기", note: "고운 쪽으로" },
    ], "요리") : set([
      { t: "Put the water on", note: "Big pot, lid on · 2 min", wait: { name: "Water", min: 2, then: { t: "Add the pasta", note: "Stir once" } } },
      { t: "Slice the garlic", note: "4 cloves, sliced thin" },
      { t: "Grate the parmesan", note: "Fine side of the grater" },
    ], "Cooking");
    let first = true;
    const tap = () => {
      const go = $(".slot .ticket:not(.inc) .go", screen);
      if (!go) return;
      go.classList.add("tap");
      setTimeout(() => go.classList.remove("tap"), 150);
      setTimeout(() => deck.press(), 90);
    };
    if (deck) loopWhileVisible(tile, (later) => {
      deck.load(cards, { print: !first }); first = false;
      later(tap, 1300);
      later(() => deck.tapDue(), 9300);
      later(tap, 12100);
      return 16200;
    });
  }

  // Share: the day's numbers count up, then the share sheet rises.
  {
    const tile = $('[data-tile="share"]'), sheet = $(".sheet-up", tile);
    const nums = $$("[data-s-n]", tile), count = $("[data-s-count]", tile);
    const total = Number(count?.dataset.sCount || 0);
    if (sheet && !still() && "IntersectionObserver" in window) sheet.classList.add("hide");
    loopWhileVisible(tile, (later) => {
      sheet.classList.add("hide");
      animateTo(1200, (k) => {
        const e = 1 - Math.pow(1 - k, 3);
        count.textContent = String(Math.round(total * e));
        nums.forEach((n) => { const v = Number(n.dataset.sN) * e; n.textContent = n.dataset.sDec ? v.toFixed(1) : String(Math.round(v)); });
      });
      later(() => sheet.classList.remove("hide"), 1700);
      return 5400;
    });
  }

  // Calendar: suggestions appear around the meeting, then are added.
  {
    const tile = $('[data-tile="cal"]'), before = $("[data-c-before]"), after = $("[data-c-after]");
    loopWhileVisible(tile, (later) => {
      [before, after].forEach((x) => { x.classList.remove("shown", "added"); $("em", x).textContent = T.suggested; });
      later(() => before.classList.add("shown"), 500);
      later(() => after.classList.add("shown"), 900);
      later(() => [before, after].forEach((x) => { x.classList.add("added"); $("em", x).textContent = T.added; }), 2200);
      return 4800;
    });
  }

  // Pricing toggle: two options, one pressed.
  const bills = { monthly: ["US$12.99", ko ? "/ 월" : "/ month", ko ? "매월 결제" : "Billed monthly"], yearly: ["US$5", ko ? "/ 월" : "/ month", ko ? "연간 결제 · 1년에 US$59.99" : "Billed annually · US$59.99 per year"] };
  $$("[data-bill]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-bill]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const [price, per, unit] = bills[b.dataset.bill];
    $("[data-price]").textContent = price; $("[data-per]").textContent = per; $("[data-unit]").textContent = unit;
  }));

  // Launch switch. Before launch every [data-cta] opens the small "launch updates" dialog.
  // TODO(launch): when the app is on the App Store, set LAUNCH = true and put the real App Store URL below.
  // This is the only place to change: each [data-cta] becomes a link to the App Store and
  // each [data-launch-text] (button, section heading, hero pill) shows the text in its attribute.
  const LAUNCH = false;
  const APP_STORE_URL = "https://apps.apple.com/app/id0000000000";

  const dialog = $("[data-notify-dialog]");
  if (LAUNCH) {
    $$("[data-cta]").forEach((b) => {
      const a = document.createElement("a");
      a.className = b.className; a.href = APP_STORE_URL; a.textContent = b.dataset.launchText || b.textContent;
      b.replaceWith(a);
    });
    $$("[data-launch-text]").forEach((el) => { el.textContent = el.dataset.launchText; });
    dialog?.remove();
  } else {
    $$("[data-cta]").forEach((b) => b.addEventListener("click", () => {
      if (dialog?.showModal) dialog.showModal(); else location.hash = "notify";
    }));
    dialog?.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }

  // The wait the server asked for, in words; never a guess.
  const tooMany = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return (ko ? "시도 횟수가 많습니다. 나중에 다시 시도해 주세요." : "Too many tries. Please try again later.");
    const minutes = Math.ceil(seconds / 60);
    return minutes <= 1 ? (ko ? "시도 횟수가 많습니다. 1분 뒤에 다시 시도해 주세요." : "Too many tries. Please wait a minute.")
      : (ko ? `${minutes}분 뒤에 다시 시도해 주세요.` : `Too many tries. Please try again in ${minutes} minutes.`);
  };

  // Waitlist (launch-updates dialog): posts to the configured endpoint; without one, says so plainly.
  document.querySelectorAll("[data-waitlist]").forEach((form) => {
    const status = form.querySelector(".notify-status");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = (ko ? "이메일 주소를 확인해 주세요." : "Please enter a valid email."); form.email.focus(); return; }
      const endpoint = form.dataset.endpoint;
      if (!endpoint) { status.textContent = (ko ? "출시 알림 신청은 곧 열립니다. 조금 뒤에 다시 방문해 주세요." : "The list opens soon. Please check back."); return; }
      const button = form.querySelector("button");
      button.disabled = true; status.textContent = (ko ? "신청 중…" : "Adding you…");
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, credentials: "omit",
          body: JSON.stringify({ email, source: location.pathname, website: form.website.value }) });
        status.textContent = res.status === 202 ? (ko ? "신청되었습니다. 출시할 때 이메일 한 통을 보내 드릴게요." : "You’re on the list. We’ll email you once, at launch.")
          : res.status === 429 ? tooMany(Number(res.headers.get("retry-after")))
          : res.status === 503 ? (ko ? "신청이 몰리고 있습니다. 잠시 후 다시 시도해 주세요." : "The list is busy. Please try again shortly.") : (ko ? "이메일 주소를 확인하고 다시 시도해 주세요." : "Please check the email and try again.");
        if (res.status === 202) form.reset();
      } catch { status.textContent = (ko ? "연결하지 못했습니다. 다시 시도해 주세요." : "Couldn’t reach us. Please try again."); }
      button.disabled = false;
    });
  });
})();
