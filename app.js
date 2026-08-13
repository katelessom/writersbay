const storeKey = "writers-bay-session";

const seed = {
  title: "Дом на черной воде",
  characters: [
    { id: crypto.randomUUID(), name: "Мира Вейл", role: "наследница", motive: "Вернуть дом семьи", secret: "Помнит ночь пожара иначе, чем все остальные" },
    { id: crypto.randomUUID(), name: "Элиас Корн", role: "архивариус", motive: "Спрятать старые письма", secret: "Знал мать Миры" },
    { id: crypto.randomUUID(), name: "Соль Рен", role: "подозреваемая", motive: "Разорвать помолвку", secret: "Была у причала до полуночи" }
  ],
  events: [
    { id: crypto.randomUUID(), date: "15 лет назад", title: "Пожар в западном крыле", notes: "Исчез семейный дневник" },
    { id: crypto.randomUUID(), date: "Глава 3", title: "Письмо без подписи", notes: "Мира получает карту подвала" },
    { id: crypto.randomUUID(), date: "Глава 8", title: "Свидетель у воды", notes: "Элиас впервые лжет вслух" }
  ],
  clues: [
    { id: crypto.randomUUID(), title: "Ключ с солью на бородке", notes: "Нашли у старого причала" }
  ],
  mind: [
    { id: crypto.randomUUID(), title: "Главная тайна" },
    { id: crypto.randomUUID(), title: "Мотивы" },
    { id: crypto.randomUUID(), title: "Локации" },
    { id: crypto.randomUUID(), title: "Темы" }
  ],
  tracker: [
    { id: crypto.randomUUID(), kind: "Тайна", title: "Кто написал письмо", notes: "Подкинуть подсказку в главе 3, раскрыть после бала" },
    { id: crypto.randomUUID(), kind: "Дыра в сюжете", title: "Почему Мира не идет в полицию", notes: "Нужна личная причина и риск для брата" }
  ]
};

let state = normalize(load());

function load() {
  const raw = localStorage.getItem(storeKey);
  return raw ? JSON.parse(raw) : structuredClone(seed);
}

function normalize(data) {
  return {
    title: data.title || "Новая история",
    characters: (data.characters || []).map(withId),
    events: (data.events || []).map(withId),
    clues: (data.clues || []).map(withId),
    mind: (data.mind || []).map(withId),
    tracker: (data.tracker || []).map(withId)
  };
}

function withId(item) {
  return item.id ? item : { ...item, id: crypto.randomUUID() };
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify(state));
  document.querySelector("#saveState").textContent = "сохранено";
}

function render() {
  document.querySelector("#projectTitle").textContent = state.title;
  const total = state.characters.length + state.events.length + state.clues.length + state.tracker.length + state.mind.length;
  document.querySelector("#itemCount").textContent = `${total} объектов`;
  renderBoard();
  renderCharacters();
  renderTimeline();
  renderFamily();
  renderMindmap();
  renderTracker();
}

function renderBoard() {
  const board = document.querySelector("#caseboard");
  board.innerHTML = "";
  const items = [
    ...state.characters.map((item, index) => ({ ...item, title: item.name, meta: item.role, body: item.secret, x: 6 + index * 23, y: 12 + (index % 2) * 30 })),
    ...state.events.map((item, index) => ({ ...item, meta: item.date, body: item.notes, x: 14 + index * 24, y: 58 - (index % 2) * 16 })),
    ...state.clues.map((item, index) => ({ ...item, meta: "улика", body: item.notes, x: 62 + index * 8, y: 20 + index * 20 }))
  ];

  items.forEach((item, index) => {
    if (index > 0) addThread(board, items[index - 1], item);
  });

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "pin-card";
    card.style.left = `${item.x}%`;
    card.style.top = `${item.y}%`;
    card.innerHTML = `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta || "")}</span><span>${escapeHtml(item.body || "")}</span>`;
    board.appendChild(card);
  });
}

function addThread(board, a, b) {
  const line = document.createElement("div");
  const ax = a.x + 9;
  const ay = a.y + 8;
  const bx = b.x + 9;
  const by = b.y + 8;
  const dx = bx - ax;
  const dy = by - ay;
  line.className = "thread";
  line.style.left = `${ax}%`;
  line.style.top = `${ay}%`;
  line.style.width = `${Math.hypot(dx, dy)}%`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  board.appendChild(line);
}

function renderCharacters() {
  const list = document.querySelector("#characterList");
  list.innerHTML = state.characters.map((char) => `
    <article class="card">
      <button class="card-action" data-delete="characters" data-id="${char.id}" aria-label="Удалить">×</button>
      <small>${escapeHtml(char.role || "персонаж")}</small>
      <h3>${escapeHtml(char.name)}</h3>
      <p><strong>Цель:</strong> ${escapeHtml(char.motive || "не задано")}</p>
      <p><strong>Секрет:</strong> ${escapeHtml(char.secret || "не задано")}</p>
    </article>
  `).join("");
}

function renderTimeline() {
  const list = document.querySelector("#timelineList");
  list.innerHTML = state.events.map((event) => `
    <article class="timeline-item">
      <button class="card-action" data-delete="events" data-id="${event.id}" aria-label="Удалить">×</button>
      <small>${escapeHtml(event.date)}</small>
      <h3>${escapeHtml(event.title)}</h3>
      <p>${escapeHtml(event.notes || "")}</p>
    </article>
  `).join("");
}

function renderFamily() {
  const tree = document.querySelector("#familyTree");
  tree.innerHTML = "";
  state.characters.forEach((char, index) => {
    const node = document.createElement("div");
    node.className = "node";
    node.style.left = `${14 + (index % 3) * 30}%`;
    node.style.top = `${16 + Math.floor(index / 3) * 28}%`;
    node.textContent = char.name;
    tree.appendChild(node);
  });
}

function renderMindmap() {
  const map = document.querySelector("#mindmapCanvas");
  map.innerHTML = "";
  state.mind.forEach((item, index) => {
    const node = document.createElement("div");
    node.className = "node mind-node";
    node.style.left = `${index === 0 ? 42 : 12 + (index % 3) * 31}%`;
    node.style.top = `${index === 0 ? 42 : 14 + Math.floor(index / 3) * 32}%`;
    node.innerHTML = `${escapeHtml(item.title)} <button class="mini-delete" data-delete="mind" data-id="${item.id}" aria-label="Удалить">×</button>`;
    map.appendChild(node);
  });
}

function renderTracker() {
  const list = document.querySelector("#trackerList");
  list.innerHTML = state.tracker.map((item) => `
    <article class="card tracker-card">
      <button class="card-action" data-delete="tracker" data-id="${item.id}" aria-label="Удалить">×</button>
      <small>${escapeHtml(item.kind)}</small>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.notes || "пока без заметок")}</p>
    </article>
  `).join("");
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item, .view").forEach((el) => el.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}`).classList.add("active");
  });
});

document.body.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const collection = deleteButton.dataset.delete;
    state[collection] = state[collection].filter((item) => item.id !== deleteButton.dataset.id);
    save();
    render();
  }

  const quickButton = event.target.closest("[data-quick]");
  if (quickButton) {
    addQuick(quickButton.dataset.quick);
  }
});

function addQuick(type) {
  if (type === "character") {
    state.characters.push({ id: crypto.randomUUID(), name: "Новый персонаж", role: "роль", motive: "", secret: "" });
  }
  if (type === "event") {
    state.events.push({ id: crypto.randomUUID(), date: "Глава ?", title: "Новое событие", notes: "" });
  }
  if (type === "clue") {
    state.clues.push({ id: crypto.randomUUID(), title: "Новая улика", notes: "Что она доказывает" });
  }
  save();
  render();
}

document.querySelector("#projectTitle").addEventListener("input", (event) => {
  state.title = event.target.textContent.trim() || "Без названия";
  document.querySelector("#saveState").textContent = "есть изменения";
  save();
});

bindForm("#characterForm", (data) => state.characters.push({ id: crypto.randomUUID(), ...data }));
bindForm("#eventForm", (data) => state.events.push({ id: crypto.randomUUID(), ...data }));
bindForm("#mindForm", (data) => state.mind.push({ id: crypto.randomUUID(), ...data }));
bindForm("#trackerForm", (data) => state.tracker.push({ id: crypto.randomUUID(), ...data }));

function bindForm(selector, onSubmit) {
  document.querySelector(selector).addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.target)));
    event.target.reset();
    save();
    render();
  });
}

document.querySelector("#seedBtn").addEventListener("click", () => {
  state = structuredClone(seed);
  save();
  render();
});

document.querySelector("#clearBtn").addEventListener("click", () => {
  state = { title: "Новая история", characters: [], events: [], clues: [], mind: [], tracker: [] };
  save();
  render();
});

document.querySelector("#newProjectBtn").addEventListener("click", () => {
  state = { title: "Новая история", characters: [], events: [], clues: [], mind: [], tracker: [] };
  save();
  render();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.title || "writers-bay"}-backup.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#importInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state = normalize(JSON.parse(await file.text()));
  save();
  render();
  event.target.value = "";
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

save();
render();
