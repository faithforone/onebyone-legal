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
  function effect(element, frames) {
    return new Animation(new KeyframeEffect(element, frames, { duration, fill: "both", easing: "linear" }));
  }

  function move(element, frames) {
    return effect(element, frames.map(([at, y, opacity, scale = 1]) => ({
      offset: at / 100,
      transform: `translateY(${y}px) scale(${scale})`,
      opacity,
      easing,
    })));
  }

  function fade(element, frames) {
    return effect(element, frames.map(([at, opacity]) => ({ offset: at / 100, opacity })));
  }

  function makeWall() {
    const tasks = Array.from(focus.querySelector(".wall-source").children, (row) => row.textContent);
    // Offset each column so the repeated texture continues beyond the viewport.
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
  }

  function makeStage() {
    const copy = (selector) => story.querySelector(`.story-steps ${selector}`).cloneNode(true);
    for (const heading of story.querySelectorAll(".story-step h2")) {
      captions.append(heading.cloneNode(true));
    }
    const pile = copy(".story-finish .done-pile");
    const tickets = document.createElement("div");
    tickets.className = "story-tickets";
    const dental = copy(".story-next .feature-ticket");
    const exercise = dental.cloneNode(true);
    const finalPaper = story.querySelector(".paper-ticket:last-child");
    exercise.querySelector(".feature-title").textContent = finalPaper.querySelector("span").textContent;
    exercise.querySelector(".feature-clock").textContent = "30:00";
    for (let index = 0; index < 2; index++) {
      const edge = document.createElement("div");
      edge.className = "story-edge";
      tickets.append(edge);
    }
    tickets.prepend(copy(".story-current .feature-ticket"), dental, exercise);
    stage.append(copy(".story-chat"), copy(".story-print .story-pip"), copy(".paper-deck"), tickets, pile);
  }

  function focusEffects() {
    const ticket = focus.querySelector(".focus-ticket");
    const title = ticket.querySelector(".feature-title");
    const surface = ticket.querySelector(".feature-surface");
    const visibleTitle = title.firstElementChild;
    const rowTitle = ticket.querySelector(".focus-row-title");
    const height = focusPin.clientHeight;
    const wallFont = parseFloat(getComputedStyle(wall).fontSize);
    const titleFont = parseFloat(getComputedStyle(title).fontSize);
    const titleCenter = height * .59 - ticket.offsetHeight / 2 + title.offsetTop + title.offsetHeight / 2;
    const rowY = height * .56 - titleCenter;
    const frames = Array.from(wall.querySelectorAll(".wall-row"), (row, index) => {
      const column = Math.floor(index / 21);
      const rowIndex = index % 21;
      const wave = (20 - rowIndex) * 1.12 + ((rowIndex * 7 + column * 13) % 11) * .84;
      const start = 5 + wave;
      return move(row, [[0, 0, 1], [start, 0, 1], [start + 30, 33 + column * 5, 0], [100, 54, 0]]);
    });

    frames.push(
      fade(wall, [[0, 1], [55, 1], [65, 0], [100, 0]]),
      move(focus.querySelector(".focus-before"), [[0, height * .15, 1], [24, height * .15, 1], [48, height * .19, 0], [100, height * .19, 0]]),
      move(focus.querySelector("#comparison-heading"), [[0, -14, 0], [44, -14, 0], [65, 0, 1], [100, 0, 1]]),
      move(focus.querySelector(".focus-note"), [[0, -12, 0], [61, -12, 0], [74, 0, 1], [100, 0, 1]]),
      effect(title, [
        { offset: 0, transform: `translateY(${rowY}px) scale(${wallFont / titleFont})` },
        { offset: .34, transform: `translateY(${rowY}px) scale(${wallFont / titleFont})`, easing },
        { offset: .71, transform: "translateY(0) scale(1)" },
        { offset: 1, transform: "translateY(0) scale(1)" },
      ]),
      fade(rowTitle, [[0, 1], [47, 1], [60, 0], [100, 0]]),
      fade(visibleTitle, [[0, 0], [50, 0], [64, 1], [100, 1]]),
      effect(surface, [
        { offset: 0, transform: `translateY(${height * -.03}px) scale(.88,.19)`, opacity: 0 },
        { offset: .39, transform: `translateY(${height * -.03}px) scale(.88,.19)`, opacity: 0, easing },
        { offset: .56, transform: "translateY(-5px) scale(.99,.89)", opacity: 1, easing },
        { offset: .65, transform: "translateY(0) scale(1,1)", opacity: 1 },
        { offset: 1, transform: "translateY(0) scale(1,1)", opacity: 1 },
      ]),
    );
    for (const selector of [".current-label", ".feature-clock"]) {
      frames.push(move(ticket.querySelector(selector), [[0, -7, 0], [54, -7, 0], [70, 0, 1], [100, 0, 1]]));
    }
    frames.push(fade(ticket.querySelector(".feature-action"), [[0, 0], [61, 0], [74, 1], [100, 1]]));
    return frames;
  }

  function storyEffects() {
    const height = stage.clientHeight;
    const chat = stage.querySelector(".story-chat");
    const pip = stage.querySelector(".story-pip");
    const papers = Array.from(stage.querySelectorAll(".paper-ticket"));
    const cards = Array.from(stage.querySelectorAll(".feature-ticket"));
    const stubs = Array.from(stage.querySelectorAll(".done-stub"));
    const pile = stage.querySelector(".done-pile");
    const cardHeight = cards[0].offsetHeight;
    const pipY = Math.round(height * .11);
    const pipSize = pip.getBoundingClientRect().height;
    const mouth = Math.round(pipY + pipSize - 4);
    const cardTop = Math.max(mouth + 14, Math.round((height - cardHeight) * .48));
    const cardY = cardTop - mouth;
    const gap = Math.max(47, Math.min(68, height * .10));
    const stubGap = Math.round(stubs[0].offsetHeight * .85);
    const pileY = Math.min(height - stubs[0].offsetHeight - stubGap * 2 - 14, Math.max(cardTop + cardHeight + 22, height * .69));
    const endPip = pileY - pipSize - Math.min(35, height * .055);

    stage.style.setProperty("--mouth", `${mouth}px`);
    stage.style.setProperty("--edge-height", `${cardHeight}px`);
    const frames = [
      move(chat, [[0, (height - chat.offsetHeight) * .43, 1], [13, (height - chat.offsetHeight) * .43, 1], [21, (height - chat.offsetHeight) * .43 - 82, 0], [100, -chat.offsetHeight, 0]]),
      move(pip, [[0, pipY - 32, 0], [16, pipY - 32, 0], [24, pipY, 1], [89, pipY, 1], [96, endPip, 1], [100, endPip, 1]]),
      fade(pip.querySelector(".pip-open"), [[0, 1], [91, 1], [94, 0], [100, 0]]),
      fade(pip.querySelector(".pip-happy"), [[0, 0], [91, 0], [94, 1], [100, 1]]),
      move(pile, [[0, pileY, 1], [100, pileY, 1]]),
    ];

    const changes = [0, 18, 47, 62, 92];
    Array.from(captions.children).forEach((heading, index) => {
      const start = changes[index];
      const end = changes[index + 1] ?? 107;
      frames.push(move(heading, [
        [0, index ? -8 : 0, index ? 0 : 1],
        ...(index ? [[start, -8, 0], [start + 3, 0, 1]] : []),
        [Math.min(end - 3, 100), 0, 1],
        ...(end <= 100 ? [[end, 8, 0], [100, 8, 0]] : []),
      ]));
    });

    papers.forEach((paper, index) => {
      const start = [17, 23, 34][index];
      const printedY = 10 + index * gap;
      frames.push(move(paper, [
        [0, -paper.offsetHeight - 13, 0], [start - 1, -paper.offsetHeight - 13, 0],
        [start, -paper.offsetHeight - 13, 1], [start + 9, printedY, 1], [44, printedY, 1],
        [52, cardY + index * 8, index === 0 ? .4 : 1, 1 - index * .045],
        [55, cardY + index * 8, 0, 1 - index * .045],
        [100, cardY, 0],
      ]));
    });

    const presses = [64, 75, 86];
    cards.forEach((card, index) => {
      const appear = [47, 69, 80][index];
      const press = presses[index];
      const release = press + (index === 0 ? 5 : 4);
      frames.push(
        move(card, [
          [0, cardY - 10, 0, .955], [appear, cardY - 10, 0, .955], [appear + 6, cardY, 1],
          [press, cardY, 1], [release, cardY + 3, 1, .993],
          [release + 4, height - mouth, .2, .96], [release + 6, height - mouth + cardHeight, 0, .96],
          [100, height - mouth + cardHeight, 0, .96],
        ]),
        effect(card.querySelector(".go-fill"), [
          { offset: 0, opacity: 0, transform: "scaleX(0)" },
          { offset: press / 100, opacity: 1, transform: "scaleX(0)" },
          { offset: release / 100, opacity: 1, transform: "scaleX(1)" },
          { offset: 1, opacity: 1, transform: "scaleX(1)" },
        ]),
        move(card.querySelector(".go b"), [[0, 0, 1], [press, 0, 1], [release, 2, 1, .9], [100, 2, 1, .9]]),
        move(stubs[index], [
          [0, cardTop + cardHeight - pileY - 32, 0, .93],
          [release, cardTop + cardHeight - pileY - 32, 0, .93],
          [release + 1.5, index * stubGap - 18, 1, .97],
          [release + 5, index * stubGap, 1],
          [100, index * stubGap, 1],
        ]),
      );
    });

    Array.from(stage.querySelectorAll(".story-edge")).forEach((edge, index) => {
      const y = cardY + (index + 1) * 13;
      const scale = 1 - (index + 1) * .045;
      const end = index ? 69 : 79;
      frames.push(move(edge, [[0, y, 0, scale], [50, y, 0, scale], [55, y, 1, scale], [end, y, 1, scale], [end + 4, y, 0, scale], [100, y, 0, scale]]));
    });
    return frames;
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
      { root: story, pin: storyPin, build: storyEffects, animations: [] },
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
