// Landing A/B (2026-11-02): half the visitors read the slogan as the headline.
// Every App Store link carries the variant as an App Store campaign, so App Store
// Connect counts page views and downloads per variant (Analytics > Campaigns);
// nothing about the visitor is sent anywhere. ?ab=a or ?ab=b shows one variant.
// Loaded in <head> without defer so a B visitor never sees A's words first.
(function () {
  "use strict";
  const PT = "128870540";
  const KEY = "one-by.one-ab-hero";
  const html = document.documentElement;
  const asked = /[?&]ab=([ab])(?:&|$)/.exec(location.search);
  let v = asked ? asked[1] : null;
  if (!v) { try { v = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ } }
  if (v !== "a" && v !== "b") v = Math.random() < 0.5 ? "a" : "b";
  if (!asked) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } }
  html.dataset.ab = v;
  const campaign = `home-${html.lang === "ko" ? "ko" : "en"}-${v}`;

  document.addEventListener("DOMContentLoaded", () => {
    // B: the slogan becomes the headline and the headline the line under it.
    const h1 = document.querySelector(".hero h1[data-b]");
    const lede = document.querySelector(".hero .lede[data-b]");
    if (v === "b" && h1 && lede) {
      const [first, second] = h1.dataset.b.split("|");
      h1.replaceChildren(first, document.createElement("br"), second);
      lede.textContent = lede.dataset.b;
    }
    html.dataset.abReady = "";
    // home.js has already turned the buttons into links (deferred scripts run first).
    document.querySelectorAll('a[href^="https://apps.apple.com/app/id6766732077"]').forEach((a) => {
      a.href = `https://apps.apple.com/app/apple-store/id6766732077?pt=${PT}&ct=${campaign}&mt=8`;
    });
  });
})();
