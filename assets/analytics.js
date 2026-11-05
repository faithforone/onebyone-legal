// Site analytics (PostHog, 2026-11-05): page views, how far people scroll, and clicks on
// App Store links, split by the landing A/B variant (ab.js) and language.
// Visitors in the EEA, UK and Switzerland (told by the time zone) get no cookies or stored
// ids until they press Accept on the small bar; everyone else is counted with a cookie and
// can turn it off on /privacy/#cookies. The choice itself is kept in local storage.
(function () {
  "use strict";
  const KEY = "phc_mP99LquEcaUjg5F5N6BYk4L3rWWGBbAz9YrpTUA6Kyje";
  const API = "https://us.i.posthog.com";
  const ASSETS = "https://us-assets.i.posthog.com";
  const CHOICE = "obo-analytics";
  const html = document.documentElement;
  const lang = html.lang === "ko" ? "ko" : html.lang === "ja" ? "ja" : "en";

  let zone = "";
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
  const askFirst = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Asia\/(Nicosia|Famagusta))/.test(zone);
  const read = () => { try { return localStorage.getItem(CHOICE); } catch (_) { return null; } };
  const write = (v) => { try { localStorage.setItem(CHOICE, v); } catch (_) {} };
  let choice = read(); // "yes" | "no" | null
  const remembered = () => choice === "yes" || (choice === null && !askFirst);

  // posthog-js's queue stub: calls made before the library loads are replayed by it.
  const ph = (window.posthog = window.posthog || []);
  if (!ph.__SV) {
    ph._i = [];
    ph.init = function (key, config, name) {
      const target = name ? (ph[name] = []) : ph;
      ["capture", "register", "set_config", "opt_in_capturing", "opt_out_capturing", "startSessionRecording", "stopSessionRecording", "reset"].forEach((m) => {
        target[m] = function () { target.push([m].concat(Array.prototype.slice.call(arguments))); };
      });
      ph._i.push([key, config, name]);
    };
    ph.__SV = 1;
    const s = document.createElement("script");
    s.async = true;
    s.src = ASSETS + "/static/array.js";
    document.head.appendChild(s);
  }
  // array.js swaps window.posthog for the real library, so later calls look it up each time.
  const live = () => window.posthog;

  const on = remembered();
  ph.init(KEY, {
    api_host: API,
    person_profiles: "identified_only",
    persistence: on ? "localStorage+cookie" : "memory",
    disable_session_recording: !on,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    mask_all_text: false,
    // The home demo copies what people type into its cards, so its text is hidden too.
    session_recording: { maskAllInputs: true, maskTextSelector: '[data-deck="jobs"]' },
  });
  if (choice === "no") ph.opt_out_capturing();
  const props = { site_lang: lang, page_path: location.pathname };
  if (html.dataset.ab) props.hero_variant = html.dataset.ab;
  ph.register(props);

  // Clicks on App Store links, with where on the page they were.
  document.addEventListener("click", (event) => {
    const a = event.target.closest && event.target.closest('a[href^="https://apps.apple.com/"]');
    if (!a) return;
    const section = a.closest("section");
    const place = a.closest(".site-nav") ? "nav" : a.closest("[data-dock]") ? "dock"
      : section ? section.id || section.classList[0] || "section" : "page";
    live().capture("app_store_click", {
      hero_variant: html.dataset.ab || null,
      place,
      campaign: (/[?&]ct=([^&]+)/.exec(a.href) || [])[1] || null,
    }, { send_instantly: true });
  });

  const words = {
    en: ["We use cookies to see which version of this site helps people.", "Accept", "Decline", "Details"],
    ko: ["어떤 화면이 더 도움이 되는지 보려고 쿠키를 써요.", "허용", "거부", "자세히"],
    ja: ["どのページがより役立つかを見るためにクッキーを使います。", "許可", "拒否", "詳細"],
  }[lang];

  // After any choice: the bar goes and the privacy page shows the new state.
  const settle = () => {
    document.getElementById("obo-consent")?.remove();
    const s = document.querySelector("[data-analytics-state]");
    if (s) s.textContent = choice === "no" ? s.dataset.off : s.dataset.on;
  };
  const accept = () => {
    choice = "yes"; write("yes");
    // Keep the home version already shown, so the next visit shows the same one.
    if (html.dataset.ab) { try { localStorage.setItem("one-by.one-ab-hero", html.dataset.ab); } catch (_) {} }
    live().opt_in_capturing();
    live().set_config({ persistence: "localStorage+cookie", disable_session_recording: false });
    live().startSessionRecording();
    settle();
  };
  const decline = () => {
    choice = "no"; write("no");
    live().stopSessionRecording();
    live().opt_out_capturing();
    settle();
  };

  // The bar: only for visitors asked first, only until they answer. It sits at the bottom
  // and never covers the top of the page.
  const showBar = () => {
    if (!askFirst || choice !== null || document.getElementById("obo-consent")) return;
    const bar = document.createElement("div");
    bar.id = "obo-consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", words[3]);
    bar.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:50;max-width:560px;margin:0 auto;" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 14px;border-radius:14px;" +
      "background:#1a1c20;color:#fff;font:14px/1.4 system-ui,-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.18)";
    const text = document.createElement("span");
    text.style.cssText = "flex:1 1 220px";
    text.textContent = words[0] + " ";
    const more = document.createElement("a");
    more.href = (lang === "ja" ? "/ja" : lang === "ko" ? "/ko" : "") + "/privacy/#cookies";
    more.textContent = words[3];
    more.style.cssText = "color:#c6ef4e";
    text.appendChild(more);
    const button = (label, primary, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.cssText = "font:inherit;font-weight:600;border:0;border-radius:999px;padding:8px 14px;cursor:pointer;" +
        (primary ? "background:#c6ef4e;color:#1a1c20" : "background:transparent;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)");
      b.addEventListener("click", fn);
      return b;
    };
    bar.append(text, button(words[2], false, decline), button(words[1], true, accept));
    document.body.appendChild(bar);
  };

  // On /privacy/#cookies: buttons that change the choice at any time.
  const wireSettings = () => {
    const s = document.querySelector("[data-analytics-state]");
    if (s) s.textContent = choice === "no" ? s.dataset.off : s.dataset.on;
    document.querySelectorAll("[data-analytics]").forEach((b) => {
      b.addEventListener("click", () => (b.dataset.analytics === "on" ? accept() : decline()));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { showBar(); wireSettings(); });
  } else { showBar(); wireSettings(); }
})();
