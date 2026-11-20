// Reading pages (blog, connect): copy buttons, the app picker on the connect guide, and the
// "on this page" marker. Without this file every block is still readable and selectable.
(() => {
  "use strict";

  const ko = document.documentElement.lang === "ko";
  const words = ko
    ? { copy: "복사", copied: "복사됨", manual: "자동 복사를 쓸 수 없어 내용을 선택했어요. 직접 복사해 주세요." }
    : { copy: "Copy", copied: "Copied", manual: "Automatic copy is unavailable. The text is selected; copy it manually." };

  // One copy routine for every button. The label cuts to "Copied" and back; nothing fades.
  const wire = (button, source, status) => {
    const label = button.textContent;
    let timer;
    const rest = () => {
      clearTimeout(timer);
      button.textContent = label;
      button.classList.remove("is-copied");
    };
    button.hidden = false;
    button.addEventListener("click", async () => {
      rest();
      if (status) status.textContent = "";
      try {
        await navigator.clipboard.writeText(source.textContent);
        button.textContent = words.copied;
        button.classList.add("is-copied");
        if (status) status.textContent = words.copied;
        timer = setTimeout(() => {
          rest();
          if (status) status.textContent = "";
        }, 2200);
      } catch (_) {
        rest();
        const range = document.createRange();
        range.selectNodeContents(source);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        if (status) status.textContent = words.manual;
      }
    });
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    const source = document.getElementById(button.dataset.copy);
    const block = button.closest(".copy-block");
    if (source) wire(button, source, block && block.querySelector("[role=status]"));
  });

  // Plain code blocks get a small copy button of their own, and a line that speaks the result.
  document.querySelectorAll(".prose pre").forEach((pre) => {
    if (pre.closest(".copy-block")) return;
    const box = document.createElement("div");
    box.className = "code";
    pre.replaceWith(box);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy";
    button.textContent = words.copy;
    const status = document.createElement("span");
    status.className = "sr";
    status.setAttribute("role", "status");
    box.append(pre, button, status);
    wire(button, pre.querySelector("code") || pre, status);
  });

  // A link to something inside a closed "details" opens it.
  const openTarget = () => {
    const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const details = target && (target.closest("details") || target.querySelector(":scope > details"));
    if (details) details.open = true;
  };
  openTarget();
  addEventListener("hashchange", openTarget);

  // Connect guide: one app's steps at a time. A link to #cursor (from a post, or typed) opens Cursor.
  const tabs = document.querySelector("[data-tabs]");
  const pairs = tabs
    ? [...tabs.querySelectorAll("a")].map((link) => ({ link, panel: document.getElementById(link.hash.slice(1)) })).filter((pair) => pair.panel)
    : [];
  if (pairs.length) {
    tabs.setAttribute("role", "tablist");
    tabs.closest("section").classList.add("has-tabs");

    const pick = (index, focus) => {
      pairs.forEach(({ link, panel }, i) => {
        const on = i === index;
        link.setAttribute("aria-selected", on);
        link.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
      });
      const { link } = pairs[index];
      if (focus) link.focus();
      const row = tabs.getBoundingClientRect();
      const chip = link.getBoundingClientRect();
      if (chip.left < row.left || chip.right > row.right) tabs.scrollLeft += chip.left - row.left - 20;
    };

    pairs.forEach(({ link, panel }, index) => {
      link.setAttribute("role", "tab");
      link.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-label", link.textContent);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        pick(index);
        history.replaceState(null, "", link.hash);
      });
      link.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = (index + step + pairs.length) % pairs.length;
        pick(next, true);
        history.replaceState(null, "", pairs[next].link.hash);
      });
    });

    // Only an app's own fragment moves the picker; #permissions and the rest leave it alone.
    const fromHash = () => {
      const index = pairs.findIndex(({ panel }) => `#${panel.id}` === location.hash);
      if (index < 0) return false;
      pick(index);
      tabs.scrollIntoView();
      return true;
    };
    if (!fromHash()) pick(0);
    // The browser's own jump to the fragment can land after ours: put the picker back in view once loaded.
    else addEventListener("load", () => requestAnimationFrame(() => tabs.scrollIntoView()), { once: true });
    addEventListener("hashchange", fromHash);
  }

  // "On this page": mark the section being read.
  const toc = document.querySelector("[data-toc]");
  const marks = toc
    ? [...toc.querySelectorAll("a")].map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) })).filter((mark) => mark.section)
    : [];
  if (marks.length) {
    const mark = () => {
      const line = Math.max(innerHeight * 0.3, 160);
      let current = 0;
      marks.forEach(({ section }, index) => { if (section.getBoundingClientRect().top <= line) current = index; });
      marks.forEach(({ link }, index) => link.setAttribute("aria-current", index === current));
    };
    let queued = false;
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; mark(); });
    };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    mark();
  }
})();
