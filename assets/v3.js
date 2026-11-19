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
      bar.firstElementChild.hidden = false;
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

(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!window.KeyframeEffect || !window.Animation || !CSS.supports("overflow", "clip")) return;

  const focus = document.querySelector(".focus-scene");
  const story = document.querySelector(".story");
  const focusPin = focus.querySelector(".scene-pin");
  const storyPin = story.querySelector(".scene-pin");
  const captions = storyPin.querySelector(".story-captions");
  const stage = storyPin.querySelector(".story-stage");
  const wall = focus.querySelector(".list-wall");
  const duration = 1000;
  const easing = "cubic-bezier(.25,.55,.45,1)";

  // Paused effects use scroll position as their clock, in either direction.
  function track(element, frames, segmentEasing = easing) {
    const keyframes = frames.map(([at, properties]) => ({
      offset: at / 100,
      easing: segmentEasing,
      ...properties,
    }));
    return new Animation(new KeyframeEffect(element, keyframes, { duration, fill: "both" }));
  }

  function slide(element, frames) {
    return track(element, frames.map(([at, y]) => [at, { transform: `translateY(${y}px)` }]));
  }

  function wipe(element, frames) {
    return track(element, frames.map(([at, inset]) => [at, { clipPath: `inset(${inset})` }]));
  }

  // A blank slot on the strip separates each line so only one can be in the mask.
  function roll(box, windows) {
    const travel = box.clientHeight * 2;
    return Array.from(box.children, (line, index) => {
      const enter = windows[index - 1];
      const exit = windows[index];
      return slide(line, [
        ...(enter ? [[0, travel], [enter[0], travel], [enter[1], 0]] : [[0, 0]]),
        ...(exit ? [[exit[0], 0], [exit[1], -travel], [100, -travel]] : [[100, 0]]),
      ]);
    });
  }

  function makeWall() {
    const tasks = Array.from(focus.querySelector(".wall-source").children, (row) => row.textContent);
    for (let column = 0; column < 5; column++) {
      const list = document.createElement("ul");
      list.className = "wall-column";
      for (let index = 0; index < 21; index++) {
        const row = document.createElement("li");
        row.className = "wall-row";
        const label = document.createElement("span");
        if (column === 2 && index === 10) {
          row.classList.add("is-gap");
        } else {
          label.textContent = tasks[(index + column * 13) % tasks.length];
        }
        row.append(label);
        list.append(row);
      }
      wall.append(list);
    }
    const check = document.createElement("span");
    check.className = "focus-row-check";
    focus.querySelector(".focus-box").prepend(check);
  }

  function makeStage() {
    const copy = (selector) => story.querySelector(`.story-steps ${selector}`).cloneNode(true);
    for (const heading of story.querySelectorAll(".story-step h2")) {
      captions.append(heading.cloneNode(true));
    }

    const pip = copy(".story-print .story-pip");
    const eye = document.createElementNS("http://www.w3.org/2000/svg", "path");
    eye.setAttribute("fill", "#fff");
    eye.classList.add("story-eyes");
    pip.lastElementChild.replaceWith(eye);

    const deck = document.createElement("ol");
    deck.className = "story-deck";
    const papers = copy(".paper-deck");
    const stubs = copy(".story-finish .done-pile");
    const now = [
      copy(".story-current .feature-ticket"),
      copy(".story-next .feature-ticket"),
      copy(".story-next .feature-ticket"),
    ];
    now[2].querySelector(".feature-title").textContent = papers.lastElementChild.querySelector("span").textContent;
    now[2].querySelector(".feature-clock").textContent = "30:00";

    Array.from(papers.children).forEach((paper, index) => {
      const sheet = document.createElement("li");
      sheet.className = "story-sheet";
      const faces = document.createElement("div");
      faces.className = "story-faces";
      faces.append(paper, now[index]);
      sheet.append(faces, stubs.firstElementChild);
      deck.append(sheet);
    });

    const cut = document.createElement("div");
    cut.className = "story-cut";
    stage.append(copy(".story-chat"), pip, deck, cut);
  }

  function focusEffects() {
    const ticket = focus.querySelector(".focus-ticket");
    const box = ticket.querySelector(".focus-box");
    const title = ticket.querySelector(".feature-title");
    const label = ticket.querySelector(".focus-label-mask");
    const clock = ticket.querySelector(".focus-clock-mask");
    const action = ticket.querySelector(".focus-action-mask");
    const note = focus.querySelector(".focus-note-mask");
    const lines = focus.querySelector(".focus-lines");
    const backplate = focus.querySelector(".focus-backplate");
    const gap = wall.querySelector(".is-gap");
    const height = focusPin.clientHeight;
    const ticketRect = ticket.getBoundingClientRect();
    const gapRect = gap.getBoundingClientRect();
    const rowHeight = gapRect.height;
    const rowTop = gapRect.top - ticketRect.top;
    const rowLeft = gapRect.left - ticketRect.left;
    const titleY = rowTop + rowHeight / 2 - title.offsetTop - title.offsetHeight / 2;
    const titleScale = parseFloat(getComputedStyle(wall).fontSize) / parseFloat(getComputedStyle(title).fontSize);
    const startTitle = `translate(${rowLeft}px, ${titleY}px) scale(${titleScale})`;
    const width = ticket.offsetWidth;
    const cardHeight = ticket.offsetHeight;
    const plateRect = backplate.parentElement.getBoundingClientRect();
    const backplateRect = backplate.getBoundingClientRect();
    const snap = (y, round) => gapRect.top + round((y - gapRect.top) / rowHeight) * rowHeight;
    const plateTrim = Math.max(0, (plateRect.width - gapRect.width) / 2);
    const closedPlate = `${snap(plateRect.top, Math.floor) - backplateRect.top}px ${plateTrim}px ${backplateRect.bottom - snap(plateRect.bottom, Math.ceil)}px`;
    const openPlate = `${plateRect.top - backplateRect.top}px 0 ${backplateRect.bottom - plateRect.bottom}px`;
    const frames = Array.from(wall.querySelectorAll(".wall-row:not(.is-gap)"), (row) => {
      const column = Array.from(wall.children).indexOf(row.parentElement);
      const index = Array.from(row.parentElement.children).indexOf(row);
      const start = 5 + (20 - index) * 1.05 + [2, 0, 3, 5, 1][column];
      const drop = height + rowHeight * 5;
      return slide(row, [[0, 0], [start, 0], [start + 36, drop], [100, drop]]);
    });

    const footprint = (x, y, width, height, borderRadius) => ({
      transform: `translate(${x}px, ${y}px)`,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius,
    });

    frames.push(
      ...roll(lines, [[27, 39]]),
      wipe(backplate, [[0, closedPlate], [24, closedPlate], [39, openPlate], [100, openPlate]]),
      slide(note.firstElementChild, [[0, note.offsetHeight + 2], [44, note.offsetHeight + 2], [57, 0], [100, 0]]),
      track(box, [
        [0, footprint(rowLeft, rowTop, gap.offsetWidth, rowHeight, "0px")],
        [27, footprint(rowLeft, rowTop, gap.offsetWidth, rowHeight, "0px")],
        [43, footprint(rowLeft / 2, rowTop - 12, (gap.offsetWidth + width) / 2, rowHeight + 29, "12px")],
        [65, footprint(0, 0, width, cardHeight, "24px")],
        [100, footprint(0, 0, width, cardHeight, "24px")],
      ]),
      wipe(box.querySelector(".feature-surface"), [[0, "0 0 100%"], [37, "0 0 100%"], [62, "0"], [100, "0"]]),
      slide(box.querySelector(".focus-row-check"), [[0, 0], [32, 0], [48, rowHeight * 2.5], [100, cardHeight]]),
      track(title, [
        [0, { transform: startTitle }],
        [32, { transform: startTitle }],
        [65, { transform: "translate(0, 0) scale(1)" }],
        [100, { transform: "translate(0, 0) scale(1)" }],
      ]),
    );
    for (const [mask, start, end] of [[label, 63, 72], [clock, 65, 77], [action, 71, 84]]) {
      const hiddenY = -mask.offsetHeight - 2;
      frames.push(slide(mask.firstElementChild, [[0, hiddenY], [start, hiddenY], [end, 0], [100, 0]]));
    }
    return frames;
  }

  function storyEffects() {
    const height = stage.clientHeight;
    const chat = stage.querySelector(".story-chat");
    const history = chat.querySelector(".chat-history").getBoundingClientRect();
    const pip = stage.querySelector(".story-pip");
    const pipSize = pip.getBoundingClientRect().height;
    const deck = stage.querySelector(".story-deck");
    const sheets = Array.from(deck.children);
    const paperHeight = sheets[0].offsetHeight;
    const cardHeight = sheets[0].querySelector(".feature-ticket").offsetHeight;
    const stubHeight = sheets[0].querySelector(".done-stub").offsetHeight;
    const stubStep = stubHeight - 7;
    const cardWidth = sheets[0].offsetWidth;
    const stubWidth = Math.min(cardWidth * .82, 328);
    const mobile = matchMedia("(max-width: 760px)").matches;
    const pipY = Math.max(5, Math.min(height * (mobile ? .065 : .105), height - pipSize - cardHeight - stubHeight - 62));
    const mouth = pipY + pipSize - 3;
    const cardY = mouth + 16;
    const cutY = cardY + cardHeight;
    const pileY = Math.max(cutY + 10, Math.min(cutY + 56, height - stubHeight - stubStep * 2 - 9));
    const endPip = mobile ? 12 : (height - pipSize - 15 - stubHeight - stubStep * 2) / 2;
    const endPile = endPip + pipSize + 15;
    const layout = stage.parentElement;
    const paperGap = Math.min(paperHeight - 16, Math.max(55, paperHeight * .71));
    const presses = [[59, 63, 68], [72, 75.5, 80.5], [84, 87.5, 92.5]];
    const cut = stage.querySelector(".story-cut");
    cut.style.top = `${cutY}px`;

    const frames = [
      ...roll(captions, [[18, 23], [49, 54], [63, 68], [92, 97]]),
      slide(chat, [[0, 0], [16, 0], [24, height + 4], [100, height + 4]]),
      slide(pip, [[0, -pipSize - 4], [17, -pipSize - 4], [25, pipY], [92.5, pipY], [97, endPip], [100, endPip]]),
      wipe(deck, [[0, `${mouth}px 0 0`], [92.5, `${mouth}px 0 0`], [97, `${endPip + pipSize - 3}px 0 0`], [100, `${endPip + pipSize - 3}px 0 0`]]),
      wipe(cut, [
        [0, "0 50%"],
        ...presses.flatMap(([press, release, land]) => [[press, "0 50%"], [release, "0"], [land - 1, "0"], [land, "0 50%"]]),
        [100, "0 50%"],
      ]),
    ];

    if (mobile) {
      const groupMiddle = (stage.offsetTop + endPile + stubHeight + stubStep * 2 + captions.offsetTop) / 2;
      const center = Math.max(0, storyPin.clientHeight / 2 - groupMiddle);
      frames.push(slide(layout, [[0, 0], [91, 0], [98, center], [100, center]]));
    }

    Array.from(chat.querySelectorAll(".bubble")).forEach((bubble, index) => {
      const hiddenY = history.bottom - bubble.getBoundingClientRect().top + 2;
      // The person's message is already sent when the scene arrives; only the reply comes up.
      frames.push(slide(bubble, index ? [[0, hiddenY], [3, hiddenY], [10, 0], [100, 0]] : [[0, 0], [100, 0]]));
    });

    sheets.forEach((sheet, index) => {
      const visible = [22, 29, 36][index];
      const printedY = mouth + 9 + index * paperGap;
      const stackedY = cardY + index * 11;
      const stackedWidth = cardWidth - index * 18;
      const [rise, ready] = [[49, 54], [66, 70], [78.5, 82.5]][index];
      const [press, release, land] = presses[index];
      const stub = sheet.querySelector(".done-stub");
      const faces = sheet.querySelector(".story-faces");
      const card = sheet.querySelector(".feature-ticket");
      const paperLine = sheet.querySelector(".paper-line");
      const landingY = pileY + index * stubStep + stubHeight - cardHeight;
      const finishY = endPile + index * stubStep + stubHeight - cardHeight;
      const drop = landingY - cardY;
      const pose = (y, width, height) => ({
        transform: `translateY(${y}px)`,
        width: `${width}px`,
        height: `${height}px`,
      });

      frames.push(
        track(sheet, [
          [0, pose(mouth - paperHeight - 2, cardWidth, paperHeight)],
          [visible, pose(mouth - paperHeight - 2, cardWidth, paperHeight)],
          [visible + 8, pose(printedY, cardWidth, paperHeight)],
          [44, pose(printedY, cardWidth, paperHeight)],
          [52, pose(stackedY, stackedWidth, cardHeight)],
          ...(index ? [[rise, pose(stackedY, stackedWidth, cardHeight)], [ready, pose(cardY, cardWidth, cardHeight)]] : []),
          [release, pose(cardY, cardWidth, cardHeight)],
          [land, pose(landingY, cardWidth, cardHeight)],
          ...(land < 92.5 ? [[92.5, pose(landingY, cardWidth, cardHeight)]] : []),
          [97, pose(finishY, cardWidth, cardHeight)],
          [100, pose(finishY, cardWidth, cardHeight)],
        ]),
        wipe(card, [[0, "0 0 100%"], [rise, "0 0 100%"], [ready, "0"], [100, "0"]]),
        track(card.querySelector(".go-fill"), [
          [0, { transform: "scaleX(0)" }], [press, { transform: "scaleX(0)" }],
          [release, { transform: "scaleX(1)" }], [100, { transform: "scaleX(1)" }],
        ]),
        // The face passes behind the cut line while its bottom slip falls onto the pile.
        track(faces, [
          [0, { transform: "translateY(0)", clipPath: "inset(0)" }],
          [release, { transform: "translateY(0)", clipPath: "inset(0)" }],
          [land, { transform: `translateY(${cardHeight - drop}px)`, clipPath: "inset(0 0 100%)" }],
          [100, { transform: `translateY(${cardHeight - drop}px)`, clipPath: "inset(0 0 100%)" }],
        ]),
        track(stub, [
          [0, { clipPath: "inset(100% 0 0)", width: `${cardWidth}px` }],
          [release, { clipPath: "inset(100% 0 0)", width: `${cardWidth}px` }],
          [land, { clipPath: `inset(${stubHeight - drop}px 0 0)`, width: `${stubWidth}px` }],
          [100, { clipPath: "inset(0)", width: `${stubWidth}px` }],
        ]),
      );
      if (index) {
        frames.push(slide(paperLine, [[0, 0], [43.5, 0], [51, -40], [100, -40]]));
      }
    });
    return frames;
  }

  // Both expressions use the same five cubic segments per eye.
  const openEye = [20.5, 67, 20.5, 54, 25, 48.5, 35, 48.5, 45, 48.5, 49.5, 54, 49.5, 67, 49.5, 80, 45, 85.5, 35, 85.5, 29, 85.5, 25, 83, 23, 79, 21, 75, 20.5, 72, 20.5, 67];
  const smilingEye = [15.75, 71, 15.75, 68, 25, 59.5, 35, 59.5, 45, 59.5, 54.25, 68, 54.25, 71, 54.25, 75, 50, 77, 46, 74, 39, 66.5, 31, 66.5, 24, 74, 20, 77, 15.75, 75, 15.75, 71];

  function drawEyes(time) {
    const position = Math.max(0, Math.min(1, (time / duration - .915) / .045));
    const progress = position * position * (3 - 2 * position);
    const points = openEye.map((point, index) => point + (smilingEye[index] - point) * progress);
    const paths = [0, 50].map((offset) => {
      const coordinates = points.map((point, index) => (point + (index % 2 ? 0 : offset)).toFixed(2));
      return `M${coordinates.slice(0, 2).join(" ")}C${coordinates.slice(2).join(" ")}Z`;
    });
    stage.querySelector(".story-eyes").setAttribute("d", paths.join(""));
  }

  let scenes = [];
  let frame = 0;
  let needsLayout = true;
  let mounted = false;

  function render() {
    frame = 0;
    if (needsLayout) {
      needsLayout = false;
      for (const scene of scenes) {
        for (const animation of scene.animations) animation.cancel();
        scene.distance = scene.root.clientHeight - scene.pin.clientHeight;
        scene.top = parseFloat(getComputedStyle(scene.pin).top);
        scene.animations = scene.build();
        scene.time = -1;
      }
    }
    const times = scenes.map(({ root, distance, top }) => duration * Math.min(1, Math.max(0, (top - root.getBoundingClientRect().top - root.clientTop) / distance)));
    scenes.forEach((scene, index) => {
      if (scene.time === times[index]) return;
      scene.time = times[index];
      for (const animation of scene.animations) animation.currentTime = scene.time;
      scene.update?.(scene.time);
    });
  }

  function scroll() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function resize() {
    needsLayout = true;
    if (scenes.length) scroll();
  }

  function configure() {
    if (motion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const scene of scenes) {
        for (const animation of scene.animations) animation.cancel();
        scene.root.classList.remove("is-scrubbed");
      }
      scenes = [];
      storyPin.hidden = true;
      removeEventListener("scroll", scroll);
      removeEventListener("resize", resize);
      return;
    }
    if (!mounted) {
      makeWall();
      makeStage();
      mounted = true;
    }
    scenes = [
      { root: focus, pin: focusPin, build: focusEffects, animations: [] },
      { root: story, pin: storyPin, build: storyEffects, update: drawEyes, animations: [] },
    ];
    storyPin.hidden = false;
    for (const scene of scenes) scene.root.classList.add("is-scrubbed");
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", resize);
    needsLayout = true;
    render();
  }

  motion.addEventListener("change", configure);
  document.fonts.ready.then(resize);
  configure();
})();
