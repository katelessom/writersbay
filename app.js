const storeKey = "writers-bay-session-v8";
const multiStoreKey = "writers-bay-projects-v1";
const oldKeys = ["writers-bay-session-v3", "writers-bay-session", "writers-room-session"];
const createId = () => crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const $ = (selector) => document.querySelector(selector);

const icons = {
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  delete: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></svg>',
  unlink: '<svg viewBox="0 0 24 24"><path d="M17 7l-10 10"/><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1"/></svg>'
};

const schemas = {
  project: [["title", "Название", "text"], ["startedAt", "Дата начала", "date"], ["currentAt", "Текущий этап", "text"], ["cover", "Обложка", "file"], ["notes", "Заметки проекта", "textarea"]],
  characters: [["name", "Имя", "text"], ["role", "Роль", "text"], ["color", "Цвет", "color"], ["height", "Рост", "text"], ["weight", "Вес", "text"], ["age", "Возраст", "text"], ["image", "Фото/портрет", "file"], ["motive", "Цель", "textarea"], ["secret", "Секрет", "textarea"], ["appearance", "Внешность", "textarea"], ["voice", "Голос", "textarea"], ["arc", "Арка", "textarea"], ["relationships", "Связи", "textarea"], ["notes", "Заметки", "textarea"]],
  events: [["date", "Дата/порядок", "text"], ["chapter", "Глава", "text"], ["characters", "Персонажи", "text"], ["image", "Картинка", "file"], ["caption", "Подпись к картинке", "text"], ["title", "Событие", "text"], ["notes", "Итог", "textarea"]],
  clues: [["title", "Улика", "text"], ["kind", "Тип", "select"], ["notes", "Что доказывает", "textarea"]],
  notesBoard: [["title", "Заметка", "text"], ["kind", "Тип", "select"], ["notes", "Текст", "textarea"]],
  tracker: [["kind", "Тип", "select"], ["title", "Название", "text"], ["notes", "Где появилось / где раскрыть", "textarea"]],
  family: [["title", "Имя", "text"], ["relation", "Связь", "text"], ["notes", "Заметки", "textarea"]],
  mind: [["title", "Узел", "text"], ["notes", "Заметки", "textarea"]],
  archive: [["title", "Материал", "text"], ["kind", "Тип", "text"], ["notes", "Описание или ссылка", "textarea"]]
  ,notebook: [["title", "Заголовок", "text"], ["image", "Картинка", "file"], ["caption", "Подпись к картинке", "text"], ["body", "Текст", "textarea"]]
};

const selectValues = ["Тайна", "Чеховское ружье", "Дыра в сюжете", "Версия канона", "Факт", "Подозрение", "Ложь"];
const boardTypes = ["characters", "events", "clues", "notesBoard", "tracker"];
let boardFilters = new Set(boardTypes);
let editing = null;
let pendingLink = null;

function item(type, data = {}) {
  return { id: createId(), type, x: 20, y: 20, ...data };
}

function emptyProject() {
  return { id: createId(), title: "Новая история", startedAt: "", currentAt: "", notes: "", cover: "", links: [], characters: [], events: [], clues: [], notesBoard: [], tracker: [], family: [], mind: [], archive: [], notebook: [] };
}

const seed = {
  ...emptyProject(),
  title: "Дом на черной воде",
  startedAt: "2026-08-13",
  currentAt: "Черновик",
  notes: "Готический детектив о памяти, наследстве и доме, который хранит чужие версии правды.",
  characters: [
    item("characters", { name: "Мира Вейл", role: "наследница", color: "#173a24", height: "172 см", weight: "62 кг", age: "27", motive: "Вернуть дом семьи", secret: "Помнит ночь пожара иначе, чем все остальные", x: 8, y: 12 }),
    item("characters", { name: "Элиас Корн", role: "архивариус", color: "#243439", age: "54", motive: "Спрятать старые письма", secret: "Знал мать Миры", x: 36, y: 42 }),
    item("characters", { name: "Соль Рен", role: "подозреваемая", color: "#3c1d28", age: "31", motive: "Разорвать помолвку", secret: "Была у причала до полуночи", x: 64, y: 18 })
  ],
  events: [
    item("events", { date: "15 лет назад", chapter: "Пролог", title: "Пожар в западном крыле", notes: "Исчез семейный дневник", characters: "Мира, Ада", x: 12, y: 70 }),
    item("events", { date: "Глава 3", chapter: "Глава 3", title: "Письмо без подписи", notes: "Мира получает карту подвала", characters: "Мира", x: 42, y: 66 }),
    item("events", { date: "Глава 8", chapter: "Глава 8", title: "Свидетель у воды", notes: "Элиас впервые лжет вслух", characters: "Элиас, Соль", x: 70, y: 70 })
  ],
  clues: [item("clues", { kind: "Факт", title: "Ключ с солью на бородке", notes: "Нашли у старого причала", x: 76, y: 42 })],
  notesBoard: [item("notesBoard", { kind: "Версия канона", title: "Правило канона", notes: "Все факты помечать как канон, версия или вопрос.", x: 48, y: 16 })],
  tracker: [item("tracker", { kind: "Тайна", title: "Кто написал письмо", notes: "Подсказка в главе 3, раскрыть после бала", x: 24, y: 28 })],
  family: [item("family", { title: "Ада Вейл", relation: "мать", x: 42, y: 10 }), item("family", { title: "Мира Вейл", relation: "дочь", x: 28, y: 45 }), item("family", { title: "Северин Вейл", relation: "дядя", x: 58, y: 45 })],
  mind: [item("mind", { title: "Главная тайна", x: 42, y: 42 }), item("mind", { title: "Мотивы", x: 18, y: 20 }), item("mind", { title: "Темы", x: 68, y: 20 }), item("mind", { title: "Локации", x: 18, y: 70 })],
  archive: [item("archive", { title: "Референс особняка", kind: "ссылка", notes: "Добавить ссылку или описание источника." })]
  ,notebook: [item("notebook", { title: "Первая заметка", body: "Здесь можно вести страницы блокнота по сценам, главам, идеям и правкам.", caption: "" })],
  links: []
};

let appState = loadAppState();
let state = currentProject();

function loadLegacyProject() {
  const raw = localStorage.getItem(storeKey) || oldKeys.map((key) => localStorage.getItem(key)).find(Boolean);
  return raw ? JSON.parse(raw) : clone(seed);
}

function loadAppState() {
  const raw = localStorage.getItem(multiStoreKey);
  if (raw) return JSON.parse(raw);
  const first = normalize(loadLegacyProject());
  first.id = first.id || createId();
  return { activeProjectId: first.id, projects: [first] };
}

function currentProject() {
  return appState.projects.find((project) => project.id === appState.activeProjectId) || appState.projects[0];
}

function normalize(data) {
  const base = emptyProject();
  Object.assign(base, data);
  base.id = base.id || createId();
  if (Array.isArray(data.notes) && !data.notesBoard) base.notesBoard = data.notes;
  Object.keys(base).forEach((key) => {
    if (Array.isArray(base[key])) base[key] = base[key].map((entry) => ({ ...item(key), ...entry, type: key }));
  });
  return base;
}

function save() {
  localStorage.setItem(multiStoreKey, JSON.stringify(appState));
  localStorage.setItem(storeKey, JSON.stringify(state));
  $("#saveState").textContent = "сохранено";
}

function render() {
  $("#projectTitle").textContent = state.title;
  $("#projectCover").src = state.cover || "assets/writer-planning-kit.png";
  $("#projectMeta").textContent = [state.startedAt && `Дата начала: ${state.startedAt}`, state.currentAt && `Сейчас: ${state.currentAt}`].filter(Boolean).join(" | ") || "Настрой проект: обложка, даты, этап и заметки.";
  $("#projectNotes").textContent = state.notes || "";
  $("#itemCount").textContent = `${["characters", "events", "clues", "notesBoard", "tracker", "family", "mind", "archive", "notebook"].reduce((sum, key) => sum + state[key].length, 0)} объектов`;
  renderFilters();
  renderProjectList();
  renderBoard();
  renderCharacters();
  renderTimeline();
  renderFamilyTree();
  renderMindMap();
  renderNotebook();
  renderArchive();
}

function renderProjectList() {
  $("#projectList").innerHTML = appState.projects.map((project) => `
    <button class="project-pill ${project.id === state.id ? "active" : ""}" data-project="${project.id}">
      <strong>${escapeHtml(project.title || "Без названия")}</strong>
      <span>${escapeHtml(project.currentAt || "проект")}</span>
      ${appState.projects.length > 1 ? `<span class="project-delete" data-delete-project="${project.id}">${icons.delete}</span>` : ""}
    </button>
  `).join("");
}

function renderFilters() {
  document.querySelectorAll(".filter-chip").forEach((button) => button.classList.toggle("active", boardFilters.has(button.dataset.filter)));
}

function boardItems() {
  return [...state.characters, ...state.events, ...state.clues, ...state.notesBoard, ...state.tracker].filter((entry) => boardFilters.has(entry.type));
}

function renderBoard() {
  const board = $("#caseboard");
  board.innerHTML = "";
  const items = boardItems();
  state.links.forEach((link) => {
    const a = items.find((entry) => entry.id === link.from);
    const b = items.find((entry) => entry.id === link.to);
    if (a && b) addThread(board, a, b, link.id);
  });
  items.forEach((entry) => board.appendChild(makePin(entry)));
}

function iconButton(kind, type, id) {
  const attr = kind === "edit" ? "data-edit" : kind === "link" ? "data-link" : "data-delete";
  const label = kind === "edit" ? "Редактировать" : kind === "link" ? "Связать" : "Удалить";
  return `<button class="icon-tool ${kind}" ${attr}="${type}" data-id="${id}" aria-label="${label}">${icons[kind]}</button>`;
}

function makePin(entry) {
  const card = document.createElement("article");
  card.className = `pin-card type-${entry.type}`;
  card.dataset.id = entry.id;
  card.dataset.type = entry.type;
  card.style.left = `${entry.x}%`;
  card.style.top = `${entry.y}%`;
  card.style.setProperty("--pin", entry.color || "#8b6a18");
  const image = entry.image ? `<figure class="pinned-photo"><img src="${entry.image}" alt=""><figcaption>${escapeHtml(entry.caption || "")}</figcaption></figure>` : "";
  card.innerHTML = `<div class="icon-row">${iconButton("link", entry.type, entry.id)}${iconButton("edit", entry.type, entry.id)}${iconButton("delete", entry.type, entry.id)}</div>${image}<small>${escapeHtml(entry.kind || entry.role || entry.chapter || entry.date || entry.relation || labelFor(entry.type))}</small><strong>${escapeHtml(entry.name || entry.title)}</strong><span>${escapeHtml(entry.secret || entry.notes || "")}</span>`;
  enableDrag(card);
  return card;
}

function addThread(root, a, b, linkId = "") {
  const line = document.createElement("div");
  const ax = a.x + 9, ay = a.y + 8, bx = b.x + 9, by = b.y + 8;
  const dx = bx - ax, dy = by - ay;
  line.className = "thread";
  line.dataset.linkId = linkId;
  if (linkId) line.title = "Двойной клик удалит связь";
  line.style.left = `${ax}%`;
  line.style.top = `${ay}%`;
  line.style.width = `${Math.hypot(dx, dy)}%`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  root.appendChild(line);
}

function renderCharacters() {
  $("#characterList").innerHTML = state.characters.map((char) => `
    <article class="dossier-card" data-type="characters" data-id="${char.id}" style="--pin:${char.color || "#173a24"}">
      <div class="dossier-strip">POLICE DOSSIER</div>
      <div class="icon-row">${iconButton("edit", "characters", char.id)}${iconButton("delete", "characters", char.id)}</div>
      ${char.image ? `<img class="mugshot" src="${char.image}" alt="">` : `<div class="mugshot empty"></div>`}
      <div class="dossier-body">
        <small>${escapeHtml(char.role || "персонаж")}</small>
        <h3>${escapeHtml(char.name)}</h3>
        <dl><dt>Рост</dt><dd>${escapeHtml(char.height || "-")}</dd><dt>Вес</dt><dd>${escapeHtml(char.weight || "-")}</dd><dt>Возраст</dt><dd>${escapeHtml(char.age || "-")}</dd></dl>
        <p><strong>Цель:</strong> ${escapeHtml(char.motive || "-")}</p>
        <p><strong>Секрет:</strong> ${escapeHtml(char.secret || "-")}</p>
      </div>
    </article>
  `).join("");
}

function renderTimeline() {
  const list = $("#timelineList");
  list.innerHTML = state.events.map((event) => `
    <article class="timeline-item draggable-row" data-type="events" data-id="${event.id}">
      <div class="drag-handle" title="Перетащить">≡</div>
      ${event.image ? `<figure class="album-photo event-photo"><img src="${event.image}" alt=""><figcaption>${escapeHtml(event.caption || "")}</figcaption></figure>` : ""}
      <div class="timeline-content">
        <small>${escapeHtml([event.chapter, event.date].filter(Boolean).join(" | "))}</small>
        <h3>${escapeHtml(event.title)}</h3>
        <p>${escapeHtml(event.notes || "")}</p>
        ${event.characters ? `<p class="linked-people">${escapeHtml(event.characters)}</p>` : ""}
      </div>
      <div class="icon-row">${iconButton("edit", "events", event.id)}${iconButton("delete", "events", event.id)}</div>
    </article>
  `).join("");
  list.querySelectorAll(".draggable-row").forEach(enableRowDrag);
}

function renderFamilyTree() {
  const root = $("#familyTree");
  root.innerHTML = `<div class="family-trunk"></div>`;
  state.family.forEach((entry) => {
    const card = makePin(entry);
    card.classList.add("family-node");
    root.appendChild(card);
  });
}

function renderMindMap() {
  const root = $("#mindmapCanvas");
  root.innerHTML = "";
  const center = state.mind[0];
  state.mind.forEach((entry, index) => index && center && addThread(root, center, entry));
  state.mind.forEach((entry, index) => {
    const card = makePin(entry);
    card.classList.add(index === 0 ? "mind-center" : "mind-branch");
    root.appendChild(card);
  });
}

function renderArchive() {
  $("#archiveList").innerHTML = `<div class="toolbar"><button data-quick="archive">Добавить материал</button></div><div class="cards">${state.archive.map((entry) => `
    <article class="archive-card card" data-type="archive" data-id="${entry.id}">
      <div class="icon-row">${iconButton("edit", "archive", entry.id)}${iconButton("delete", "archive", entry.id)}</div>
      <small>${escapeHtml(entry.kind || "материал")}</small><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.notes || "")}</p>
    </article>`).join("")}</div>`;
}

function renderNotebook() {
  $("#notebookPages").innerHTML = state.notebook.map((page) => `
    <article class="notebook-page" data-type="notebook" data-id="${page.id}">
      <div class="icon-row">${iconButton("edit", "notebook", page.id)}${iconButton("delete", "notebook", page.id)}</div>
      <h3>${escapeHtml(page.title)}</h3>
      ${page.image ? `<figure class="album-photo"><img src="${page.image}" alt=""><figcaption>${escapeHtml(page.caption || "")}</figcaption></figure>` : ""}
      <p>${escapeHtml(page.body || "")}</p>
    </article>
  `).join("");
}

function enableDrag(el) {
  el.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    event.preventDefault();
    const parent = el.parentElement.getBoundingClientRect();
    let moved = false;
    const startX = event.clientX, startY = event.clientY;
    el.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      moved = moved || Math.abs(moveEvent.clientX - startX) > 4 || Math.abs(moveEvent.clientY - startY) > 4;
      const entry = findEntry(el.dataset.type, el.dataset.id);
      entry.x = clamp(((moveEvent.clientX - parent.left) / parent.width) * 100, 1, 92);
      entry.y = clamp(((moveEvent.clientY - parent.top) / parent.height) * 100, 1, 90);
      el.style.left = `${entry.x}%`;
      el.style.top = `${entry.y}%`;
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      save();
      moved ? render() : openEditor(el.dataset.type, el.dataset.id);
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
    const from = state.events.findIndex((entry) => entry.id === event.dataTransfer.getData("text/plain"));
    const to = state.events.findIndex((entry) => entry.id === el.dataset.id);
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
  $("#deleteCurrent").style.display = "";
  $("#editorDialog").showModal();
}

function openProjectEditor() {
  editing = { type: "project", id: "project" };
  $("#editorTitle").textContent = "Редактор проекта";
  $("#editorFields").innerHTML = schemas.project.map(([key, label, fieldType]) => field(state, key, label, fieldType)).join("");
  $("#deleteCurrent").style.display = "none";
  $("#editorDialog").showModal();
}

function field(entry, key, label, fieldType) {
  if (fieldType === "textarea") return `<label>${label}<textarea name="${key}">${escapeHtml(entry[key] || "")}</textarea></label>`;
  if (fieldType === "file") return `<label>${label}<input name="${key}" type="file" accept="image/*">${entry[key] ? `<img class="editor-preview" src="${entry[key]}" alt="">` : ""}</label>`;
  if (fieldType === "select") return `<label>${label}<select name="${key}">${selectValues.map((value) => `<option ${entry[key] === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>`;
  const value = fieldType === "color" ? entry[key] || "#173a24" : entry[key] || "";
  return `<label>${label}<input name="${key}" type="${fieldType}" value="${escapeHtml(value)}"></label>`;
}

async function saveEditor(event) {
  event.preventDefault();
  const entry = editing.type === "project" ? state : findEntry(editing.type, editing.id);
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

function addQuick(type) {
  const factories = {
    character: () => state.characters.push(item("characters", { name: "Новый персонаж", role: "роль", color: "#173a24" })),
    event: () => state.events.push(item("events", { date: "Сцена ?", chapter: "Глава ?", title: "Новое событие" })),
    clue: () => state.clues.push(item("clues", { kind: "Факт", title: "Новая улика", notes: "Что она доказывает" })),
    note: () => state.notesBoard.push(item("notesBoard", { kind: "Версия канона", title: "Новая заметка", notes: "" })),
    tracker: () => state.tracker.push(item("tracker", { kind: "Тайна", title: "Новая тайна", notes: "" })),
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
  const projectButton = event.target.closest("[data-project]");
  const deleteProject = event.target.closest("[data-delete-project]");
  if (deleteProject) {
    event.stopPropagation();
    appState.projects = appState.projects.filter((project) => project.id !== deleteProject.dataset.deleteProject);
    appState.activeProjectId = appState.projects[0].id;
    state = currentProject();
    save();
    return render();
  }
  if (projectButton) {
    appState.activeProjectId = projectButton.dataset.project;
    state = currentProject();
    save();
    return render();
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    boardFilters.has(filter.dataset.filter) ? boardFilters.delete(filter.dataset.filter) : boardFilters.add(filter.dataset.filter);
    render();
    return;
  }
  const link = event.target.closest("[data-link]");
  if (link) return handleLink(link.dataset.id);
  const thread = event.target.closest(".thread[data-link-id]");
  if (thread && event.detail >= 2) {
    state.links = state.links.filter((entry) => entry.id !== thread.dataset.linkId);
    save();
    return render();
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) return openEditor(edit.dataset.edit, edit.dataset.id);
  const del = event.target.closest("[data-delete]");
  if (del) {
    state[del.dataset.delete] = state[del.dataset.delete].filter((entry) => entry.id !== del.dataset.id);
    save();
    return render();
  }
  const quick = event.target.closest("[data-quick]");
  if (quick) return addQuick(quick.dataset.quick);
  const editable = event.target.closest(".dossier-card[data-type], .archive-card[data-type], .timeline-item[data-type], .notebook-page[data-type]");
  if (editable) openEditor(editable.dataset.type, editable.dataset.id);
});

$("#projectTitle").addEventListener("input", (event) => { state.title = event.target.textContent.trim() || "Без названия"; save(); });
bindForm("#characterForm", (data) => state.characters.push(item("characters", data)));
bindForm("#eventForm", (data) => state.events.push(item("events", data)));
bindForm("#mindForm", (data) => state.mind.push(item("mind", data)));
bindAsyncForm("#notePageForm", async (data, form) => {
  const file = form.elements.image.files[0];
  delete data.image;
  state.notebook.push(item("notebook", { ...data, image: file ? await fileToDataUrl(file) : "" }));
});
$("#editorForm").addEventListener("submit", saveEditor);
$("#closeEditor").addEventListener("click", () => $("#editorDialog").close());
$("#deleteCurrent").addEventListener("click", () => {
  if (editing.type !== "project") state[editing.type] = state[editing.type].filter((entry) => entry.id !== editing.id);
  $("#editorDialog").close();
  save();
  render();
});
$("#editProjectBtn").addEventListener("click", openProjectEditor);
$("#archiveEditProjectBtn").addEventListener("click", openProjectEditor);
$("#addProjectBtn").addEventListener("click", () => {
  const project = emptyProject();
  appState.projects.push(project);
  appState.activeProjectId = project.id;
  state = project;
  save();
  render();
});
$("#seedBtn").addEventListener("click", () => { replaceCurrentProject(normalize(clone(seed))); });
$("#clearBtn").addEventListener("click", () => { replaceCurrentProject(emptyProject()); });
$("#newProjectBtn").addEventListener("click", () => {
  const project = emptyProject();
  appState.projects.push(project);
  appState.activeProjectId = project.id;
  state = project;
  save();
  render();
});
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
  replaceCurrentProject(normalize(JSON.parse(await file.text())));
  event.target.value = "";
});

function replaceCurrentProject(project) {
  const index = appState.projects.findIndex((entry) => entry.id === appState.activeProjectId);
  project.id = index >= 0 ? appState.projects[index].id : project.id || createId();
  if (index >= 0) appState.projects[index] = project;
  else appState.projects.push(project);
  appState.activeProjectId = project.id;
  state = project;
  save();
  render();
}

function bindForm(selector, onSubmit) {
  const form = $(selector);
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.target)));
    event.target.reset();
    save();
    render();
  });
}

function bindAsyncForm(selector, onSubmit) {
  const form = $(selector);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await onSubmit(Object.fromEntries(new FormData(event.target)), event.target);
    event.target.reset();
    save();
    render();
  });
}

function handleLink(id) {
  if (!pendingLink) {
    pendingLink = id;
    return;
  }
  if (pendingLink !== id && !state.links.some((link) => (link.from === pendingLink && link.to === id) || (link.from === id && link.to === pendingLink))) {
    state.links.push({ id: createId(), from: pendingLink, to: id });
  }
  pendingLink = null;
  save();
  render();
}

function labelFor(type) {
  return ({ characters: "персонаж", events: "событие", clues: "улика", notesBoard: "заметка", tracker: "тайна", family: "родословная", mind: "узел", archive: "архив" })[type] || type;
}

function findEntry(type, id) {
  return state[type].find((entry) => entry.id === id);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

save();
render();
