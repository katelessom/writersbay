const storeKey = "writers-room-session";

const seed = {
  title: "Дом на черной воде",
  characters: [
    { name: "Мира Вейл", role: "наследница", motive: "Вернуть дом семьи", secret: "Помнит ночь пожара иначе, чем все остальные" },
    { name: "Элиас Корн", role: "архивариус", motive: "Спрятать старые письма", secret: "Знал мать Миры" },
    { name: "Соль Рен", role: "подозреваемая", motive: "Разорвать помолвку", secret: "Была у причала до полуночи" }
  ],
  events: [
    { date: "15 лет назад", title: "Пожар в западном крыле", notes: "Исчез семейный дневник" },
    { date: "Глава 3", title: "Письмо без подписи", notes: "Мира получает карту подвала" },
    { date: "Глава 8", title: "Свидетель у воды", notes: "Элиас впервые лжет вслух" }
  ]
};

let state = load();

function load() {
  const raw = localStorage.getItem(storeKey);
  return raw ? JSON.parse(raw) : structuredClone(seed);
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify(state));
  document.querySelector("#saveState").textContent = "сохранено";
}

function render() {
  document.querySelector("#projectTitle").textContent = state.title;
  document.querySelector("#itemCount").textContent = `${state.characters.length + state.events.length} объектов`;
  renderBoard();
  renderCharacters();
  renderTimeline();
  renderFamily();
  renderMindmap();
}

function renderBoard() {
  const board = document.querySelector("#caseboard");
  board.innerHTML = "";
  const items = [
    ...state.characters.map((item, index) => ({ ...item, type: "person", x: 7 + index * 26, y: 12 + (index % 2) * 34 })),
    ...state.events.map((item, index) => ({ name: item.title, role: item.date, secret: item.notes, type: "event", x: 16 + index * 24, y: 58 - (index % 2) * 16 }))
  ];

  items.forEach((item, index) => {
    if (index > 0) addThread(board, items[index - 1], item);
  });

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "pin-card";
    card.style.left = `${item.x}%`;
    card.style.top = `${item.y}%`;
    card.innerHTML = `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.role || "")}</span><span>${escapeHtml(item.secret || "")}</span>`;
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
  const length = Math.hypot(dx, dy);
  line.className = "thread";
  line.style.left = `${ax}%`;
  line.style.top = `${ay}%`;
  line.style.width = `${length}%`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  board.appendChild(line);
}

function renderCharacters() {
  const list = document.querySelector("#characterList");
  list.innerHTML = state.characters.map((char) => `
    <article class="card">
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
    node.style.left = `${18 + (index % 3) * 28}%`;
    node.style.top = `${18 + Math.floor(index / 3) * 26}%`;
    node.textContent = char.name;
    tree.appendChild(node);
  });
}

function renderMindmap() {
  const map = document.querySelector("#mindmapCanvas");
  const concepts = ["Главная тайна", "Мотивы", "Локации", "Чеховские ружья", "Темы", "Версии канона"];
  map.innerHTML = "";
  concepts.forEach((text, index) => {
    const node = document.createElement("div");
    node.className = "node mind-node";
    node.style.left = `${index === 0 ? 42 : 16 + (index % 3) * 31}%`;
    node.style.top = `${index === 0 ? 42 : 15 + Math.floor(index / 3) * 45}%`;
    node.textContent = text;
    map.appendChild(node);
  });
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item, .view").forEach((el) => el.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}`).classList.add("active");
  });
});

document.querySelector("#projectTitle").addEventListener("input", (event) => {
  state.title = event.target.textContent.trim() || "Без названия";
  document.querySelector("#saveState").textContent = "есть изменения";
  save();
});

document.querySelector("#characterForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  state.characters.push(data);
  event.target.reset();
  save();
  render();
});

document.querySelector("#eventForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  state.events.push(data);
  event.target.reset();
  save();
  render();
});

document.querySelector("#seedBtn").addEventListener("click", () => {
  state = structuredClone(seed);
  save();
  render();
});

document.querySelector("#newProjectBtn").addEventListener("click", () => {
  state = { title: "Новая история", characters: [], events: [] };
  save();
  render();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.title || "writers-room"}-backup.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#importInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state = JSON.parse(await file.text());
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

render();
