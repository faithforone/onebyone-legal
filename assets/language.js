// Explicit choices win. Only a first, external arrival can choose a language.
// Loading: a plain blocking <script> in the head of / and /connect/ (the only pages this can redirect away from), so the choice
// is made before anything is painted; with defer on every other page, where it only records the visit and the language links.
(function () {
  "use strict";
  const key = "obo-language";
  const visitedKey = "obo-language-visited";
  const choice = new URLSearchParams(location.search).get("lang");
  let saved = null;
  let visited = false;
  try { saved = localStorage.getItem(key); visited = !!localStorage.getItem(visitedKey); } catch (_) {}
  try { visited = visited || !!sessionStorage.getItem(visitedKey); } catch (_) {}
  if (choice === "en" || choice === "ko" || choice === "ja") {
    saved = choice;
    try { localStorage.setItem(key, choice); } catch (_) {}
  }
  let internal = false;
  try { internal = new URL(document.referrer).origin === location.origin; } catch (_) {}
  const bot = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless/i.test(navigator.userAgent);
  const firstLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  const path = location.pathname.replace(/\/index\.html$/, "/");
  const korean = path === "/ko" || path.startsWith("/ko/");
  try { localStorage.setItem(visitedKey, "1"); } catch (_) {}
  try { sessionStorage.setItem(visitedKey, "1"); } catch (_) {}
  if (!bot && !saved && !visited && !internal && !korean && /^ko(?:-|$)/i.test(firstLanguage)) {
    const corresponding = path === "/" ? "/ko/" : /^\/connect\/?$/.test(path) ? "/ko/connect/" : null;
    // Pages without a Korean counterpart (legal, support) stay where the visitor arrived.
    if (corresponding) location.replace(corresponding + location.search + location.hash);
  }
  // The query marker also protects deliberate navigation when storage is blocked,
  // and when a language link is opened in a new tab.
  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest("a[data-language]");
    if (!link) return;
    try { localStorage.setItem(key, link.dataset.language); } catch (_) {}
  });
})();
