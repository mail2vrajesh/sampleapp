(function () {
  const STORAGE_KEY = "gh-pages-todo-items";
  const listEl = document.getElementById("list");
  const formEl = document.getElementById("add-form");
  const inputEl = document.getElementById("new-todo");
  const countEl = document.getElementById("count");
  const clearBtn = document.getElementById("clear-completed");
  const filterButtons = document.querySelectorAll(".filter");
  const duplicateDialog = document.getElementById("duplicate-dialog");
  const duplicateDialogOk = document.getElementById("duplicate-dialog-ok");
  let duplicateDialogOnClose = null;

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

  function textKey(text) {
    return String(text || "").trim().toLowerCase();
  }

  function isDuplicateText(text, excludeId) {
    const key = textKey(text);
    if (!key) return false;
    return todos.some((t) => {
      if (excludeId != null && t.id === excludeId) return false;
      return textKey(t.text) === key;
    });
  }

  function showDuplicateDialog(onClose) {
    duplicateDialogOnClose = typeof onClose === "function" ? onClose : null;
    duplicateDialog.showModal();
  }

  duplicateDialog.addEventListener("close", () => {
    const cb = duplicateDialogOnClose;
    duplicateDialogOnClose = null;
    if (cb) cb();
  });

  duplicateDialogOk.addEventListener("click", () => {
    duplicateDialog.close();
  });

  function beginEdit(li) {
    const id = li.dataset.id;
    const todo = todos.find((t) => t.id === id);
    if (!todo || li.querySelector(".item-text-edit")) return;

    const span = li.querySelector(".item-text");
    if (!(span instanceof HTMLElement)) return;

    const original = String(todo.text || "");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "item-text item-text-edit";
    input.value = original;
    input.maxLength = 500;
    input.setAttribute("aria-label", "Edit task");

    span.replaceWith(input);
    input.focus();
    input.select();

    function finish(commit) {
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("keydown", onKeydown);
      if (!commit) {
        const back = document.createElement("span");
        back.className = "item-text";
        back.textContent = original;
        input.replaceWith(back);
        return;
      }
      const next = input.value.trim();
      if (!next) {
        window.alert("Task title cannot be empty.");
        input.value = original;
        input.focus();
        input.select();
        input.addEventListener("blur", onBlur);
        input.addEventListener("keydown", onKeydown);
        return;
      }
      if (isDuplicateText(next, id)) {
        showDuplicateDialog(() => {
          input.value = original;
          input.focus();
          input.select();
          input.addEventListener("blur", onBlur);
          input.addEventListener("keydown", onKeydown);
        });
        return;
      }
      todo.text = next.slice(0, 500);
      save();
      render();
    }

    function onBlur() {
      finish(true);
    }

    function onKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    }

    input.addEventListener("blur", onBlur);
    input.addEventListener("keydown", onKeydown);
  }

  function render() {
    const items = visibleTodos();
    listEl.innerHTML = "";

    items.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "item" + (todo.completed ? " completed" : "");
      li.dataset.id = todo.id;

      const label = document.createElement("label");
      label.className = "item-check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = todo.completed;
      cb.setAttribute("aria-label", "Mark complete");
      label.appendChild(cb);

      const span = document.createElement("span");
      span.className = "item-text";
      span.textContent = todo.text;

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "edit";
      edit.setAttribute("aria-label", "Edit task name");
      edit.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';

      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove task");

      li.append(label, span, edit, del);
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
    const duplicate = isDuplicateText(text);
    if (duplicate) {
      showDuplicateDialog(() => {
        inputEl.focus();
      });
      return;
    }
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
    const t = e.target;
    if (!(t instanceof Element)) return;
    const btn = t.closest("button");
    if (!btn) return;
    const li = btn.closest(".item");
    if (!li) return;
    if (btn.classList.contains("edit")) {
      e.preventDefault();
      beginEdit(li);
      return;
    }
    if (!btn.classList.contains("delete")) return;
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
