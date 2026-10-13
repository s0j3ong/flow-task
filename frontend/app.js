const API_BASE = "/api";
const STATUS_ORDER = ["TODO", "DOING", "DONE"];
const STATUS_LABELS = { TODO: "할 일", DOING: "진행 중", DONE: "완료" };
const PRIORITY_ORDER = ["HIGH", "NORMAL", "LOW"];
const PRIORITY_LABELS = { HIGH: "높음", NORMAL: "보통", LOW: "낮음" };
const MAX_DESCRIPTION_LENGTH = 2000;

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title-input");
const errorMessage = document.getElementById("error-message");
const taskList = document.getElementById("task-list");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");

let tasks = [];
let editingTaskId = null;

function validateTitle(rawTitle) {
  const title = rawTitle.trim();
  if (title.length < 1 || title.length > 100) {
    return { valid: false, title };
  }
  return { valid: true, title };
}

function validateDescription(rawDescription) {
  if (rawDescription.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, description: rawDescription };
  }
  return { valid: true, description: rawDescription };
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOverdue(task) {
  if (!task.due_date || task.status === "DONE") {
    return false;
  }
  return task.due_date < getLocalDateString(new Date());
}

function getFilters() {
  return {
    query: searchInput.value.trim(),
    status: statusFilter.value,
    priority: priorityFilter.value,
  };
}

function extractErrorMessage(body) {
  if (!body || !body.detail) {
    return null;
  }
  if (typeof body.detail === "string") {
    return body.detail;
  }
  if (Array.isArray(body.detail)) {
    return body.detail.map((item) => item.msg).join(" ");
  }
  return null;
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (networkError) {
    throw new Error("서버에 연결할 수 없습니다. API 서버 상태를 확인해주세요.");
  }

  if (response.status === 204) {
    return null;
  }

  let body = null;
  try {
    body = await response.json();
  } catch (parseError) {
    body = null;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(body) || "요청을 처리하지 못했습니다.");
  }

  return body;
}

async function fetchTasks() {
  const filters = getFilters();
  const params = new URLSearchParams();
  if (filters.query) {
    params.set("q", filters.query);
  }
  if (filters.status !== "ALL") {
    params.set("status", filters.status);
  }
  if (filters.priority !== "ALL") {
    params.set("priority", filters.priority);
  }
  const query = params.toString();
  return apiRequest(`/tasks${query ? `?${query}` : ""}`);
}

async function loadAndRender() {
  try {
    tasks = await fetchTasks();
    errorMessage.textContent = "";
  } catch (e) {
    tasks = [];
    errorMessage.textContent = e.message;
  }
  renderTasks();
}

function buildStatusSelect(task) {
  const select = document.createElement("select");
  select.className = "status-select";
  for (const status of STATUS_ORDER) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = STATUS_LABELS[status];
    if (status === task.status) {
      option.selected = true;
    }
    select.appendChild(option);
  }
  return select;
}

function buildPrioritySelect(task) {
  const select = document.createElement("select");
  select.className = "priority-select";
  for (const priority of PRIORITY_ORDER) {
    const option = document.createElement("option");
    option.value = priority;
    option.textContent = PRIORITY_LABELS[priority];
    if (priority === task.priority) {
      option.selected = true;
    }
    select.appendChild(option);
  }
  return select;
}

function buildDueDateInput(task) {
  const input = document.createElement("input");
  input.type = "date";
  input.className = "due-date-input";
  input.value = task.due_date || "";
  return input;
}

function buildViewContent(task) {
  const fragment = document.createDocumentFragment();

  const titleSpan = document.createElement("span");
  titleSpan.className = "task-title";
  titleSpan.textContent = task.title;
  fragment.appendChild(titleSpan);

  if (task.description) {
    const descSpan = document.createElement("span");
    descSpan.className = "task-description";
    descSpan.textContent = task.description;
    fragment.appendChild(descSpan);
  }

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "edit-btn";
  editBtn.textContent = "수정";
  fragment.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "삭제";
  fragment.appendChild(deleteBtn);

  return fragment;
}

function buildEditContent(task) {
  const fragment = document.createDocumentFragment();

  const titleInputEl = document.createElement("input");
  titleInputEl.type = "text";
  titleInputEl.className = "edit-title-input";
  titleInputEl.maxLength = 100;
  titleInputEl.value = task.title;
  fragment.appendChild(titleInputEl);

  const descTextarea = document.createElement("textarea");
  descTextarea.className = "edit-description-input";
  descTextarea.maxLength = MAX_DESCRIPTION_LENGTH;
  descTextarea.value = task.description;
  fragment.appendChild(descTextarea);

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "save-btn";
  saveBtn.textContent = "저장";
  fragment.appendChild(saveBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "cancel-btn";
  cancelBtn.textContent = "취소";
  fragment.appendChild(cancelBtn);

  return fragment;
}

function renderTasks() {
  taskList.innerHTML = "";

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = String(task.id);

    const metaRow = document.createElement("div");
    metaRow.className = "task-meta";
    metaRow.appendChild(buildStatusSelect(task));
    metaRow.appendChild(buildPrioritySelect(task));
    metaRow.appendChild(buildDueDateInput(task));
    if (isOverdue(task)) {
      const badge = document.createElement("span");
      badge.className = "overdue-badge";
      badge.textContent = "지연";
      metaRow.appendChild(badge);
    }
    li.appendChild(metaRow);

    const contentRow = document.createElement("div");
    contentRow.className = "task-content";
    contentRow.appendChild(
      editingTaskId === task.id ? buildEditContent(task) : buildViewContent(task)
    );
    li.appendChild(contentRow);

    taskList.appendChild(li);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const { valid, title } = validateTitle(titleInput.value);
  if (!valid) {
    errorMessage.textContent = "제목은 공백을 제외하고 1~100자여야 합니다.";
    return;
  }

  try {
    await apiRequest("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    titleInput.value = "";
    titleInput.focus();
    await loadAndRender();
  } catch (e) {
    errorMessage.textContent = e.message;
  }
});

searchInput.addEventListener("input", loadAndRender);
statusFilter.addEventListener("change", loadAndRender);
priorityFilter.addEventListener("change", loadAndRender);

taskList.addEventListener("click", async (event) => {
  const li = event.target.closest("li[data-id]");
  if (!li) {
    return;
  }
  const id = Number(li.dataset.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return;
  }

  if (event.target.classList.contains("edit-btn")) {
    editingTaskId = id;
    errorMessage.textContent = "";
    renderTasks();
    return;
  }

  if (event.target.classList.contains("cancel-btn")) {
    editingTaskId = null;
    errorMessage.textContent = "";
    renderTasks();
    return;
  }

  if (event.target.classList.contains("save-btn")) {
    const titleInputEl = li.querySelector(".edit-title-input");
    const descTextarea = li.querySelector(".edit-description-input");
    const titleResult = validateTitle(titleInputEl.value);
    const descResult = validateDescription(descTextarea.value);

    if (!titleResult.valid) {
      errorMessage.textContent = "제목은 공백을 제외하고 1~100자여야 합니다.";
      return;
    }
    if (!descResult.valid) {
      errorMessage.textContent = "설명은 최대 2000자까지 입력할 수 있습니다.";
      return;
    }

    try {
      await apiRequest(`/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleResult.title,
          description: descResult.description,
        }),
      });
      editingTaskId = null;
      await loadAndRender();
    } catch (e) {
      errorMessage.textContent = e.message;
    }
    return;
  }

  if (event.target.classList.contains("delete-btn")) {
    const confirmed = window.confirm(
      `"${task.title}" 항목을 삭제하시겠습니까?`
    );
    if (!confirmed) {
      return;
    }
    try {
      await apiRequest(`/tasks/${id}`, { method: "DELETE" });
      if (editingTaskId === id) {
        editingTaskId = null;
      }
      await loadAndRender();
    } catch (e) {
      errorMessage.textContent = e.message;
    }
  }
});

taskList.addEventListener("change", async (event) => {
  const li = event.target.closest("li[data-id]");
  if (!li) {
    return;
  }
  const id = Number(li.dataset.id);

  let patch = null;
  if (event.target.classList.contains("status-select")) {
    patch = { status: event.target.value };
  } else if (event.target.classList.contains("priority-select")) {
    patch = { priority: event.target.value };
  } else if (event.target.classList.contains("due-date-input")) {
    patch = { due_date: event.target.value || null };
  } else {
    return;
  }

  try {
    await apiRequest(`/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await loadAndRender();
  } catch (e) {
    errorMessage.textContent = e.message;
    await loadAndRender();
  }
});

loadAndRender();
