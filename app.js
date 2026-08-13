const storeKey = "writers-bay-session-v3";
const oldKeys = ["writers-bay-session", "writers-room-session"];
const createId = () => crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

const schemas = {
  characters: [
    ["name", "Имя", "text"], ["role", "Роль", "text"], ["color", "Цвет/маркер", "color"],
    ["height", "Рост", "text"], ["weight", "Вес", "text"], ["age", "Возраст", "text"],
    ["image", "Картинка", "file"], ["motive", "Цель", "textarea"], ["secret", "Секрет", "textarea"],
    ["appearance", "Внешность", "textarea"], ["voice", "Голос и речь", "textarea"],
    ["arc", "Арка", "textarea"], ["relationships", "Связи", "textarea"], ["notes", "Заметки", "textarea"]
  ],
  events: [["date", "Дата/глава", "text"], ["title", "Событие", "text"], ["notes", "Итог", "textarea"]],
  clues: [["title", "Улика", "text"], ["notes", "Что доказывает", "textarea"]],
  notes: [["title", "Заметка", "text"], ["notes", "Текст", "textarea"]],
  family: [["title", "Имя", "text"], ["relation", "Связь", "text"], ["notes", "Заметки", "textarea"]],
  mind: [["title", "Узел", "text"], ["notes", "Заметки", "textarea"]],
  tracker: [["kind", "Тип", "select"], ["title", "Название", "text"], ["notes", "Где появилось / где раскрыть", "textarea"]],
  archive: [["title", "Материал", "text"], ["kind", "Тип", "text"], ["notes", "Описание или ссылка", "textarea"]]
};

const emptyProject = () => ({ title: "Новая история", characters: [], events: [], clues: [], notes: [], family: [], mind: [], tracker: [], archive: [] });
const seed = {
  title: "Дом на черной воде",
  characters: [
    item("characters", { name: "Мира Вейл", role: "наследница", color: "#8e3036", height: "172 см", weight: "62 кг", age: "27", motive: "Вернуть дом семьи", secret: "Помнит ночь пожара иначе, чем все остальные", appearance: "Темные волосы, узкие перчатки, шрам у виска.", voice: "Говорит коротко, когда боится.", arc: "От бегства от прошлого к праву назвать правду.", x: 8, y: 12 }),
    item("characters", { name: "Элиас Корн", role: "архивариус", color: "#31586a", age: "54", motive: "Спрятать старые письма", secret: "Знал мать Миры", x: 36, y: 42 }),
    item("characters", { name: "Соль Рен", role: "подозреваемая", color: "#53695a", age: "31", motive: "Разорвать помолвку", secret: "Была у причала до полуночи", x: 64, y: 18 })
  ],
  events: [
    item("events", { date: "15 лет назад", title: "Пожар в западном крыле", notes: "Исчез семейный дневник", x: 12, y: 70 }),
    item("events", { date: "Глава 3", title: "Письмо без подписи", notes: "Мира получает карту подвала", x: 42, y: 66 }),
    item("events", { date: "Глава 8", title: "Свидетель у воды", notes: "Элиас впервые лжет вслух", x: 70, y: 70 })
  ],
  clues: [item("clues", { title: "Ключ с солью на бородке", notes: "Нашли у старого причала", x: 76, y: 42 })],
  notes: [item("notes", { title: "Правило канона", notes: "Все факты помечать как канон, версия или вопрос.", x: 48, y: 16 })],
  family: [
    item("family", { title: "Ада Вейл", relation: "мать Миры", x: 24, y: 18 }),
    item("family", { title: "Мира Вейл", relation: "дочь", x: 24, y: 50 }),
    item("family", { title: "Северин Вейл", relation: "дядя", x: 58, y: 35 })
  ],
  mind: [
    item("mind", { title: "Главная тайна", notes: "Кто устроил пожар", x: 42, y: 42 }),
    item("mind", { title: "Мотивы", x: 18, y: 18 }),
    item("mind", { title: "Темы", x: 68, y: 18 }),
    item("mind", { title: "Локации", x: 18, y: 70 })
  ],
  tracker: [
    item("tracker", { kind: "Тайна", title: "Кто написал письмо", notes: "Подкинуть подсказку в главе 3, раскрыть после бала", x: 8, y: 12 }),
    item("tracker", { kind: "Дыра в сюжете", title: "Почему Мира не идет в полицию", notes: "Нужна личная причина и риск для брата", x: 42, y: 18 })
  ],
  archive: [item("archive", { title: "Референс особняка", kind: "ссылка", notes: "Добавить ссылку или описание источника." })]
};

let state = normalize(load());
let editing = null;

function item(type, data = {}) {
  return { id: createId(), type, x: 20, y: 20, ...data };
}

function load() {
  const raw = localStorage.getItem(storeKey) || oldKeys.map((key) => localStorage.getItem(key)).find(Boolean);
  return raw ? JSON.parse(raw) : clone(seed);
}

function normalize(data) {
  const base = emptyProject();
  Object.assign(base, data);
  Object.keys(base).forEach((key) => {
    if (Array.isArray(base[key])) base[key] = base[key].map((entry) => ({ ...item(key), ...entry, type: key }));
  });
  return base;
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify(state));
  $("#saveState").textContent = "сохранено";
}

function render() {
  $("#projectTitle").textContent = state.title;
  $("#itemCount").textContent = `${collections().reduce((sum, key) => sum + state[key].length, 0)} объектов`;
  renderBoard();
  renderCharacters();
  renderTimeline();
  renderFreeCanvas("#familyTree", "family");
  renderFreeCanvas("#mindmapCanvas", "mind");
  renderTracker();
  renderArchive();
}

function collections() {
  return ["characters", "events", "clues", "notes", "family", "mind", "tracker", "archive"];
}

function boardItems() {
  return [...state.characters, ...state.events, ...state.clues, ...state.notes];
}

function renderBoard() {
  const board = $("#caseboard");
  board.innerHTML = "";
  boardItems().forEach((entry, index, list) => {
    if (index > 0) addThread(board, list[index - 1], entry);
  });
  boardItems().forEach((entry) => board.appendChild(makePin(entry)));
}

function makePin(entry) {
  const card = document.createElement("article");
  card.className = `pin-card type-${entry.type}`;
  card.dataset.id = entry.id;
  card.dataset.type = entry.type;
  card.style.left = `${entry.x}%`;
  card.style.top = `${entry.y}%`;
  card.style.setProperty("--pin", entry.color || "#a6782c");
  const image = entry.image ? `<img class="avatar" src="${entry.image}" alt="">` : "";
  card.innerHTML = `${image}<strong>${escapeHtml(entry.name || entry.title)}</strong><span>${escapeHtml(entry.role || entry.date || entry.relation || entry.kind || entry.type)}</span><span>${escapeHtml(entry.secret || entry.notes || "")}</span><button class="edit-chip" data-edit="${entry.type}" data-id="${entry.id}">Редактировать</button>`;
  enableDrag(card);
  return card;
}

function addThread(root, a, b) {
  const line = document.createElement("div");
  const ax = a.x + 9, ay = a.y + 8, bx = b.x + 9, by = b.y + 8;
  const dx = bx - ax, dy = by - ay;
  line.className = "thread";
  line.style.left = `${ax}%`;
  line.style.top = `${ay}%`;
  line.style.width = `${Math.hypot(dx, dy)}%`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  root.appendChild(line);
}

function renderCharacters() {
  $("#characterList").innerHTML = state.characters.map((char) => `
    <article class="card character-card">
      <button class="card-action" data-delete="characters" data-id="${char.id}" aria-label="Удалить">×</button>
      ${char.image ? `<img class="portrait" src="${char.image}" alt="">` : `<div class="portrait empty"></div>`}
      <small style="color:${char.color || "#8e3036"}">${escapeHtml(char.role || "персонаж")}</small>
      <h3>${escapeHtml(char.name)}</h3>
      <dl>
        <dt>Рост</dt><dd>${escapeHtml(char.height || "-")}</dd>
        <dt>Вес</dt><dd>${escapeHtml(char.weight || "-")}</dd>
        <dt>Возраст</dt><dd>${escapeHtml(char.age || "-")}</dd>
      </dl>
      <p><strong>Цель:</strong> ${escapeHtml(char.motive || "не задано")}</p>
      <p><strong>Секрет:</strong> ${escapeHtml(char.secret || "не задано")}</p>
      <button data-edit="characters" data-id="${char.id}">Редактировать</button>
    </article>
  `).join("");
}

function renderTimeline() {
  const list = $("#timelineList");
  list.innerHTML = state.events.map((event) => `
    <article class="timeline-item draggable-row" data-type="events" data-id="${event.id}" style="--pin:${event.color || "#53695a"}">
      <button class="card-action" data-delete="events" data-id="${event.id}" aria-label="Удалить">×</button>
      <small>${escapeHtml(event.date)}</small>
      <h3>${escapeHtml(event.title)}</h3>
      <p>${escapeHtml(event.notes || "")}</p>
      <button data-edit="events" data-id="${event.id}">Редактировать</button>
    </article>
  `).join("");
  list.querySelectorAll(".draggable-row").forEach(enableRowDrag);
}

function renderFreeCanvas(selector, type) {
  const root = $(selector);
  root.innerHTML = "";
  state[type].forEach((entry, index, list) => {
    if (index > 0) addThread(root, list[index - 1], entry);
  });
  state[type].forEach((entry) => root.appendChild(makePin(entry)));
}

function renderTracker() {
  $("#trackerList").innerHTML = state.tracker.map((entry) => `
    <article class="card tracker-card" data-type="tracker" data-id="${entry.id}">
      <button class="card-action" data-delete="tracker" data-id="${entry.id}" aria-label="Удалить">×</button>
      <small>${escapeHtml(entry.kind)}</small>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.notes || "пока без заметок")}</p>
      <button data-edit="tracker" data-id="${entry.id}">Редактировать</button>
    </article>
  `).join("");
}

function renderArchive() {
  $("#archiveList").innerHTML = `
    <div class="toolbar"><button data-quick="archive">Добавить материал</button></div>
    <div class="cards">${state.archive.map((entry) => `
      <article class="card">
        <button class="card-action" data-delete="archive" data-id="${entry.id}" aria-label="Удалить">×</button>
        <small>${escapeHtml(entry.kind || "материал")}</small>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.notes || "")}</p>
        <button data-edit="archive" data-id="${entry.id}">Редактировать</button>
      </article>`).join("")}</div>`;
}

function enableDrag(el) {
  el.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    const parent = el.parentElement.getBoundingClientRect();
    el.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const x = ((moveEvent.clientX - parent.left) / parent.width) * 100;
      const y = ((moveEvent.clientY - parent.top) / parent.height) * 100;
      const entry = findEntry(el.dataset.type, el.dataset.id);
      entry.x = clamp(x, 1, 82);
      entry.y = clamp(y, 1, 82);
      el.style.left = `${entry.x}%`;
      el.style.top = `${entry.y}%`;
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      save();
      render();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up, { once: true });
  });
}

function enableRowDrag(el) {
  el.draggable = true;
  el.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", el.dataset.id));
  el.addEventListener("dragover", (event) => event.preventDefault());
  el.addEventListener("drop", (event) => {
    const fromId = event.dataTransfer.getData("text/plain");
    const toId = el.dataset.id;
    const from = state.events.findIndex((entry) => entry.id === fromId);
    const to = state.events.findIndex((entry) => entry.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = state.events.splice(from, 1);
    state.events.splice(to, 0, moved);
    save();
    render();
  });
}

function openEditor(type, id) {
  editing = { type, id };
  const entry = findEntry(type, id);
  $("#editorTitle").textContent = `Редактор: ${entry.name || entry.title}`;
  $("#editorFields").innerHTML = schemas[type].map(([key, label, fieldType]) => field(entry, key, label, fieldType)).join("");
  $("#editorDialog").showModal();
}

function field(entry, key, label, fieldType) {
  if (fieldType === "textarea") return `<label>${label}<textarea name="${key}">${escapeHtml(entry[key] || "")}</textarea></label>`;
  if (fieldType === "file") return `<label>${label}<input name="${key}" type="file" accept="image/*">${entry[key] ? `<img class="editor-preview" src="${entry[key]}" alt="">` : ""}</label>`;
  if (fieldType === "select") return `<label>${label}<select name="${key}">${["Тайна", "Чеховское ружье", "Дыра в сюжете", "Версия канона"].map((value) => `<option ${entry[key] === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>`;
  return `<label>${label}<input name="${key}" type="${fieldType}" value="${escapeHtml(entry[key] || fieldType === "color" ? entry[key] || "#a6782c" : "")}"></label>`;
}

async function saveEditor(event) {
  event.preventDefault();
  const entry = findEntry(editing.type, editing.id);
  const data = new FormData(event.target);
  for (const [key, value] of data.entries()) {
    if (value instanceof File) {
      if (value.size) entry[key] = await fileToDataUrl(value);
    } else {
      entry[key] = value;
    }
  }
  $("#editorDialog").close();
  save();
  render();
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function findEntry(type, id) {
  return state[type].find((entry) => entry.id === id);
}

function addQuick(type) {
  const factories = {
    character: () => state.characters.push(item("characters", { name: "Новый персонаж", role: "роль", color: "#a6782c" })),
    event: () => state.events.push(item("events", { date: "Глава ?", title: "Новое событие" })),
    clue: () => state.clues.push(item("clues", { title: "Новая улика", notes: "Что она доказывает" })),
    note: () => state.notes.push(item("notes", { title: "Новая заметка", notes: "" })),
    relative: () => state.family.push(item("family", { title: "Новый родственник", relation: "связь" })),
    archive: () => state.archive.push(item("archive", { title: "Новый материал", kind: "референс" }))
  };
  factories[type]?.();
  save();
  render();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item, .view").forEach((el) => el.classList.remove("active"));
    button.classList.add("active");
    $(`#${button.dataset.view}`).classList.add("active");
  });
});

document.body.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  if (edit) openEditor(edit.dataset.edit, edit.dataset.id);
  const del = event.target.closest("[data-delete]");
  if (del) {
    state[del.dataset.delete] = state[del.dataset.delete].filter((entry) => entry.id !== del.dataset.id);
    save();
    render();
  }
  const quick = event.target.closest("[data-quick]");
  if (quick) addQuick(quick.dataset.quick);
});

$("#projectTitle").addEventListener("input", (event) => {
  state.title = event.target.textContent.trim() || "Без названия";
  save();
});

bindForm("#characterForm", (data) => state.characters.push(item("characters", data)));
bindForm("#eventForm", (data) => state.events.push(item("events", data)));
bindForm("#mindForm", (data) => state.mind.push(item("mind", data)));
bindForm("#trackerForm", (data) => state.tracker.push(item("tracker", data)));
$("#editorForm").addEventListener("submit", saveEditor);
$("#closeEditor").addEventListener("click", () => $("#editorDialog").close());
$("#deleteCurrent").addEventListener("click", () => {
  state[editing.type] = state[editing.type].filter((entry) => entry.id !== editing.id);
  $("#editorDialog").close();
  save();
  render();
});
$("#seedBtn").addEventListener("click", () => { state = clone(seed); save(); render(); });
$("#clearBtn").addEventListener("click", () => { state = emptyProject(); save(); render(); });
$("#newProjectBtn").addEventListener("click", () => { state = emptyProject(); save(); render(); });
$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.title || "writers-bay"}-backup.json`;
  link.click();
  URL.revokeObjectURL(url);
});
$("#importInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state = normalize(JSON.parse(await file.text()));
  save();
  render();
  event.target.value = "";
});

function bindForm(selector, onSubmit) {
  $(selector).addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.target)));
    event.target.reset();
    save();
    render();
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function $(selector) {
  return document.querySelector(selector);
}

save();
render();
