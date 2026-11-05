// Landing A/B (2026-11-02): half the visitors read the slogan as the headline.
// Every App Store link and QR code carries the variant as an App Store campaign, so
// App Store Connect counts page views and downloads per variant (Analytics >
// Acquisition > Campaigns); analytics.js also sends the variant with page views and App Store clicks.
// The HTML is variant A (no-JS visitors and crawlers stay on it). ?ab=a or ?ab=b shows one.
// Loaded in <head> without defer so a B visitor never sees A's words first.
(function () {
  "use strict";
  const PT = "128870540";
  const KEY = "one-by.one-ab-hero";
  const html = document.documentElement;
  const lang = html.lang === "ko" ? "ko" : "en";
  const asked = /[?&]ab=([ab])(?:&|$)/.exec(location.search);
  const bot = /bot|crawl|spider|slurp|preview/i.test(navigator.userAgent);
  let v = asked ? asked[1] : bot ? "a" : null;
  if (!v) { try { v = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ } }
  if (v !== "a" && v !== "b") v = Math.random() < 0.5 ? "a" : "b";
  // Kept only where analytics may remember a visitor (same rule as analytics.js): not before
  // Accept in the EEA/UK/Switzerland, never after Decline.
  let zone = "";
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* old browser */ }
  let choice = null;
  try { choice = localStorage.getItem("obo-analytics"); } catch (e) { /* storage blocked */ }
  const askFirst = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Asia\/(Nicosia|Famagusta))/.test(zone);
  const keep = choice === "yes" || (choice === null && !askFirst);
  if (!asked && !bot && keep) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } }
  html.dataset.ab = v;
  const campaign = `home-${lang}-${v}`;

  // B: the slogan becomes the headline and the headline the line under it, as soon
  // as the parser is past both (the phone after them exists), not after the deferred scripts.
  let swapped = false;
  const swap = (parsed) => {
    const h1 = document.querySelector(".hero h1[data-b]");
    const lede = document.querySelector(".hero .lede[data-b]");
    if (!h1 || !lede || !(parsed || document.querySelector(".hero [data-hero]"))) return;
    if (v === "b") {
      const [first, second] = h1.dataset.b.split("|");
      h1.replaceChildren(first, document.createElement("br"), second);
      lede.textContent = lede.dataset.b;
    }
    swapped = true;
    html.dataset.abReady = "";
  };
  // Links and QR codes get this variant's campaign as they appear, home.js's included.
  const link = `https://apps.apple.com/app/apple-store/id6766732077?pt=${PT}&ct=${campaign}&mt=8`;
  const qr = `/assets/app-store-qr-${lang}-${v}.svg`;
  const stamp = () => {
    document.querySelectorAll('a[href^="https://apps.apple.com/app/"]').forEach((a) => {
      if (a.href !== link) a.href = link;
    });
    document.querySelectorAll("[data-store-qr] img").forEach((img) => {
      if (img.getAttribute("src") !== qr) img.setAttribute("src", qr);
    });
  };
  const watch = new MutationObserver(() => { if (!swapped) swap(); stamp(); });
  watch.observe(html, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", () => {
    watch.disconnect();
    if (!swapped) swap(true);
    html.dataset.abReady = "";
    stamp();
  });
})();
