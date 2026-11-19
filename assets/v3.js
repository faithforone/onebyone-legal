(() => {
  const variant = new URLSearchParams(location.search).get("h");
  const heading = document.querySelector("#hero-heading");

  if (variant === "b") {
    heading.replaceChildren("할 일은 AI가 정리하고,", document.createElement("br"), "나는 한 장씩 하기만.");
  } else if (variant === "c") {
    const phrase = document.createElement("span");
    phrase.textContent = "한 번에 한 장만.";
    heading.replaceChildren("오늘 할 일, ", phrase);
  }

  // Keep the v2 fallback until at least 50 places are held.
  const founders = document.querySelector("[data-v2-founders]");
  fetch("https://uaiszwblgrohzwucqbdb.supabase.co/functions/v1/founders")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data || !Number.isInteger(data.taken) || data.taken < 50) return;
      if (!Number.isInteger(data.places) || data.places < data.taken) return;

      const bar = founders.querySelector(".v2-f-bar");
      bar.hidden = false;
      bar.style.setProperty("--f", `${(data.taken / data.places) * 100}%`);

      const count = founders.querySelector(".v2-f-n");
      const number = new Intl.NumberFormat(count.dataset.numberLocale);
      count.textContent = count.dataset.countText
        .replace("{taken}", number.format(data.taken))
        .replace("{places}", number.format(data.places))
        .replace("{left}", number.format(data.places - data.taken));
    })
    .catch(() => {});
})();
