(function () {
  "use strict";
  const ko = document.documentElement.lang === "ko";
  const copied = ko ? "복사됨" : "Copied";
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.textContent;
    let timer;
    button.hidden = false;
    button.addEventListener("click", async () => {
      const code = document.getElementById(button.dataset.copy);
      const status = button.closest(".copy-block").querySelector("[role=status]");
      status.textContent = "";
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = copied;
        button.textContent = copied;
        timer = setTimeout(() => { button.textContent = label; status.textContent = ""; }, 2500);
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = ko ? "자동 복사를 사용할 수 없어 내용을 선택했습니다. 직접 복사해 주세요." : "Automatic copy is unavailable. Text selected; copy it manually.";
      }
    });
  });
})();
