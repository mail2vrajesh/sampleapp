(function () {
  const STORAGE_KEY = "gh-pages-todo-items";
  const listEl = document.getElementById("list");
  const formEl = document.getElementById("add-form");
  const inputEl = document.getElementById("new-todo");
  const countEl = document.getElementById("count");
  const clearBtn = document.getElementById("clear-completed");
  const filterButtons = document.querySelectorAll(".filter");

  let todos = [];
  let filter = "all";

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }

  function render() {
    const items = visibleTodos();
    listEl.innerHTML = "";

    items.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "item" + (todo.completed ? " completed" : "");
      li.dataset.id = todo.id;

      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = todo.completed;
      cb.setAttribute("aria-label", "Mark complete");

      const span = document.createElement("span");
      span.className = "item-text";
      span.textContent = todo.text;

      label.append(cb, span);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove task");

      li.append(label, del);
      listEl.appendChild(li);
    });

    const active = todos.filter((t) => !t.completed).length;
    const completed = todos.length - active;
    countEl.textContent =
      active === 1 ? "1 item left" : `${active} items left`;
    clearBtn.hidden = completed === 0;
  }

  todos = load().map((t) => ({
    id: t.id || uid(),
    text: String(t.text || "").slice(0, 500),
    completed: Boolean(t.completed),
  }));
  save();

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    todos.unshift({ id: uid(), text, completed: false });
    save();
    inputEl.value = "";
    render();
    inputEl.focus();
  });

  listEl.addEventListener("change", (e) => {
    const cb = e.target;
    if (!(cb instanceof HTMLInputElement) || cb.type !== "checkbox") return;
    const li = cb.closest(".item");
    if (!li) return;
    const id = li.dataset.id;
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = cb.checked;
      save();
      render();
    }
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target;
    if (!(btn instanceof HTMLButtonElement) || !btn.classList.contains("delete")) return;
    const li = btn.closest(".item");
    if (!li) return;
    const id = li.dataset.id;
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  });

  clearBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.completed);
    save();
    render();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter || "all";
      filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
})();
