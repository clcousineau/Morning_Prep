(function () {
  const data = window.MORNING_PREP_DATA;
  const storageKey = "morning-prep-state-v1";
  const checklist = document.querySelector("#checklist");
  const scheduleButtons = document.querySelectorAll("[data-schedule]");
  const resetButton = document.querySelector("#resetButton");
  const overallPercent = document.querySelector("#overallPercent");
  const overallBar = document.querySelector("#overallBar");
  const overallStatus = document.querySelector("#overallStatus");
  const celebration = document.querySelector("#celebration");
  const installButton = document.querySelector("#installButton");

  let deferredInstallPrompt = null;
  let state = loadState();

  function loadState() {
    const fallback = { schedule: "weekday", counts: {}, celebrated: false };

    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem(storageKey)) };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function getSchedule() {
    return data.schedules[state.schedule];
  }

  function storageId(item) {
    return `${state.schedule}:${item.id}`;
  }

  function getCount(item) {
    return Number(state.counts[storageId(item)] || 0);
  }

  function setCount(item, nextCount) {
    state.counts[storageId(item)] = Math.max(0, nextCount);
    saveState();
    updateItem(item);
    updateProgress();
  }

  function allItems() {
    const schedule = getSchedule();
    return data.categories.flatMap((category) => schedule.categories[category] || []);
  }

  function itemProgress(item) {
    return Math.min(getCount(item), item.required) / item.required;
  }

  function calculateProgress(items) {
    if (!items.length) return 0;
    const completeUnits = items.reduce((sum, item) => sum + itemProgress(item), 0);
    return Math.round((completeUnits / items.length) * 100);
  }

  function itemTemplate(item) {
    const count = getCount(item);
    const complete = count >= item.required;
    const article = document.createElement("article");
    article.className = `item${complete ? " is-complete" : ""}`;
    article.dataset.itemId = item.id;
    article.innerHTML = `
      <div class="item-info">
        <div>
          <span class="item-name">${item.name}</span>
          <span class="required">Required: ${item.required} ${item.unit}</span>
        </div>
        <span class="checkmark" aria-label="${complete ? "Complete" : "Incomplete"}">&#10003;</span>
      </div>
      <div class="counter" aria-label="${item.name} count">
        <button class="count-button" type="button" data-action="minus" aria-label="Subtract ${item.name}">-</button>
        <span class="count-display" aria-live="polite">${count}</span>
        <button class="count-button" type="button" data-action="plus" aria-label="Add ${item.name}">+</button>
      </div>
    `;

    article.querySelector('[data-action="minus"]').addEventListener("click", () => setCount(item, getCount(item) - 1));
    article.querySelector('[data-action="plus"]').addEventListener("click", () => setCount(item, getCount(item) + 1));
    return article;
  }

  function categoryTemplate(categoryName, items) {
    const category = document.createElement("section");
    const percent = calculateProgress(items);
    category.className = "category";
    category.dataset.category = categoryName;
    category.innerHTML = `
      <div class="category-head">
        <h2>${categoryName}</h2>
        <strong data-category-percent>${percent}%</strong>
      </div>
      <div class="category-progress">
        <div class="progress-track" aria-hidden="true"><span data-category-bar style="width: ${percent}%"></span></div>
      </div>
    `;

    items.forEach((item) => category.appendChild(itemTemplate(item)));
    return category;
  }

  function render() {
    const schedule = getSchedule();
    checklist.replaceChildren();

    scheduleButtons.forEach((button) => {
      const active = button.dataset.schedule === state.schedule;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    data.categories.forEach((categoryName) => {
      checklist.appendChild(categoryTemplate(categoryName, schedule.categories[categoryName] || []));
    });

    updateProgress();
  }

  function updateItem(item) {
    const row = checklist.querySelector(`[data-item-id="${item.id}"]`);
    if (!row) return;

    const count = getCount(item);
    const complete = count >= item.required;
    row.classList.toggle("is-complete", complete);
    row.querySelector(".count-display").textContent = count;
    row.querySelector(".checkmark").setAttribute("aria-label", complete ? "Complete" : "Incomplete");
  }

  function updateProgress() {
    const schedule = getSchedule();

    data.categories.forEach((categoryName) => {
      const items = schedule.categories[categoryName] || [];
      const percent = calculateProgress(items);
      const category = checklist.querySelector(`[data-category="${categoryName}"]`);
      if (!category) return;

      category.querySelector("[data-category-percent]").textContent = `${percent}%`;
      category.querySelector("[data-category-bar]").style.width = `${percent}%`;
    });

    const items = allItems();
    const percent = calculateProgress(items);
    overallPercent.textContent = `${percent}%`;
    overallBar.style.width = `${percent}%`;
    overallStatus.textContent = `${schedule.label}: ${completedCount(items)} of ${items.length} items complete.`;

    if (percent === 100 && !state.celebrated) {
      state.celebrated = true;
      saveState();
      showCelebration();
    }

    if (percent < 100 && state.celebrated) {
      state.celebrated = false;
      saveState();
    }
  }

  function completedCount(items) {
    return items.filter((item) => getCount(item) >= item.required).length;
  }

  function showCelebration() {
    celebration.classList.add("is-visible");
    window.setTimeout(() => celebration.classList.remove("is-visible"), 1500);
  }

  scheduleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.schedule = button.dataset.schedule;
      state.celebrated = false;
      saveState();
      render();
    });
  });

  resetButton.addEventListener("click", () => {
    const prefix = `${state.schedule}:`;
    Object.keys(state.counts).forEach((key) => {
      if (key.startsWith(prefix)) delete state.counts[key];
    });
    state.celebrated = false;
    saveState();
    render();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js");
    });
  }

  render();
}());
