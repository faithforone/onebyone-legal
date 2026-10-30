// One evening, card by card (the "ds" section on the home page). While the page scrolls the
// phone stays, and each card is done: the pill fills, the stub tears off and falls, the next
// card prints out of the slot. GSAP and ScrollTrigger load only when the section is near, and
// never under Reduce Motion: there the section is the first card and the list, and no script runs.
(() => {
  const root = document.querySelector("[data-ds]");
  if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const load = (src) => new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = no;
    document.head.append(s);
  });
  const near = new IntersectionObserver((seen) => {
    if (!seen.some((e) => e.isIntersecting)) return;
    near.disconnect();
    load("/assets/vendor/gsap.min.js?v=3.13.0")
      .then(() => load("/assets/vendor/ScrollTrigger.min.js?v=3.13.0"))
      .then(build, () => {});
  }, { rootMargin: "800px 0px" });
  near.observe(root);

  function build() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];
    const slot = root.querySelector(".slot");
    const cards = $$("[data-ds-card]"), steps = $$("[data-ds-step]"), nexts = $$("[data-ds-next]");
    const label = root.querySelector("[data-ds-label]");
    const travel = () => -(slot.offsetHeight + 24);
    const torn = { "--teeth": "radial-gradient(circle 2.4px at 4px 100%, #0000 92%, #000)", "--teeth-size": "8px 100%" };

    const tl = gsap.timeline({ paused: true, onUpdate: () => show(tl.time()) });
    const prints = [];
    cards.forEach((card, i) => {
      if (i > 0) gsap.set(card, { y: travel });
      const next = cards[i + 1];
      if (!next) return;
      const at = 0.15 + i;
      const a = card.querySelector(".stub-a"), b = card.querySelector(".stub-b");
      // Done: the lime fills the pill under the finger.
      tl.to(card.querySelector(".stub-a .go-lit"), { clipPath: "inset(0 0% 0 0)", duration: 0.32, ease: "none" }, at);
      // It tears along the perforation: the stub swings down from its far corner and falls.
      tl.set(a, { opacity: 0 }, at + 0.4).set(b, { opacity: 1 }, at + 0.4).set(card.querySelector(".t-body"), torn, at + 0.4);
      tl.fromTo(b, { rotation: 0, x: 0, y: 0 }, { rotation: -10, duration: 0.12, ease: "power1.in" }, at + 0.4);
      tl.to(b, { y: () => slot.offsetHeight + 140, x: i % 2 ? 8 : -8, rotation: -18 - 3 * i, duration: 0.34, ease: "power1.in" }, at + 0.52);
      // The next card prints down out of the slot, over the torn one.
      // Hidden until then: a waiting card never shows past the phone's edge.
      tl.set(next, { visibility: "visible" }, at + 0.55);
      tl.fromTo(next, { y: travel }, { y: 0, duration: 0.38, ease: "power2.out", immediateRender: false }, at + 0.55);
      tl.set(card, { visibility: "hidden" }, at + 0.95);
      prints.push(at + 0.6);
    });
    tl.to({}, { duration: 0.2 }); // the last card rests before the section scrolls away

    // The list and the Up next line follow the card in hand.
    let shown = -1;
    const show = (time) => {
      const i = prints.filter((t) => time >= t).length;
      if (i === shown) return;
      shown = i;
      steps.forEach((li, n) => { li.toggleAttribute("data-on", n === i); li.toggleAttribute("data-off", n !== i); });
      nexts.forEach((b, n) => { b.style.opacity = n === i ? "1" : "0"; });
      // The last card has nothing after it: the line goes, as Up next does in the app.
      label.style.opacity = nexts[i] && nexts[i].textContent ? "1" : "0";
    };
    show(0);

    // Now the section may be tall. Someone already below it keeps their place on the page.
    const below = root.getBoundingClientRect().bottom < 0, ref = root.nextElementSibling, was = ref ? ref.getBoundingClientRect().top : 0;
    root.classList.add("ds-live");
    if (below && ref) window.scrollBy(0, ref.getBoundingClientRect().top - was);

    // A short screen shows the whole phone, smaller, as one picture (its insides keep their sizes).
    const pin = root.querySelector(".ds-pin"), copy = root.querySelector(".ds-copy"), device = root.querySelector(".ds-phone .device");
    const fit = () => {
      device.style.transform = ""; device.style.marginBottom = "";
      const cs = getComputedStyle(pin), stacked = cs.gridTemplateColumns.split(" ").length < 2;
      const room = pin.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
        - (stacked ? copy.offsetHeight + parseFloat(cs.rowGap) : 0);
      const scale = Math.min(1, room / device.offsetHeight);
      if (scale >= 1) return;
      device.style.transformOrigin = "50% 0";
      device.style.transform = `scale(${scale})`;
      device.style.marginBottom = `${-(1 - scale) * device.offsetHeight}px`;
    };
    fit();
    ScrollTrigger.addEventListener("refreshInit", fit);

    ScrollTrigger.create({
      trigger: root, start: "top top", end: "bottom bottom", scrub: 0.5, animation: tl, invalidateOnRefresh: true,
    });
  }
})();
