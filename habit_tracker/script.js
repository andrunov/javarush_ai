(() => {
  'use strict';

  const STORAGE_KEY = 'habit_tracker_data';
  const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

  const form = document.getElementById('habit-form');
  const nameInput = document.getElementById('habit-name');
  const nameError = document.getElementById('name-error');
  const status = document.getElementById('app-status');
  const summary = document.getElementById('today-summary');
  const habitSection = document.getElementById('habit-section');
  const habitCount = document.getElementById('habit-count');
  const habitList = document.getElementById('habit-list');
  const emptyState = document.getElementById('empty-state');

  const state = { habits: [] };
  let statusTimer = null;
  let renderedDate = '';

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function getLocalDateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function isValidDateKey(value) {
    if (typeof value !== 'string') return false;
    const match = value.match(DATE_KEY_PATTERN);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    return year >= 1
      && date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }

  function normalizeName(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function isValidCreatedAt(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    return Number.isFinite(new Date(value).getTime());
  }

  function uniqueValidDates(value, onIssue) {
    if (!Array.isArray(value)) {
      onIssue();
      return [];
    }

    const dates = [];
    const seen = new Set();
    value.forEach((date) => {
      if (!isValidDateKey(date)) {
        onIssue();
      } else if (!seen.has(date)) {
        seen.add(date);
        dates.push(date);
      } else {
        onIssue();
      }
    });
    return dates;
  }

  function sanitizeData(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.habits)) {
      return { rootValid: false, habits: [], hadIssues: true };
    }

    const habits = [];
    const ids = new Set();
    const names = new Set();
    let hadIssues = false;

    parsed.habits.forEach((record) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        hadIssues = true;
        return;
      }

      const name = typeof record.name === 'string' ? normalizeName(record.name) : '';
      if (
        typeof record.id !== 'string'
        || !record.id
        || ids.has(record.id)
        || !name
        || names.has(name)
        || !isValidCreatedAt(record.createdAt)
        || !Array.isArray(record.completedDates)
      ) {
        hadIssues = true;
        return;
      }

      const markIssue = () => { hadIssues = true; };
      const completedDates = uniqueValidDates(record.completedDates, markIssue);
      if (name !== record.name) hadIssues = true;

      ids.add(record.id);
      names.add(name);
      habits.push({
        id: record.id,
        name,
        createdAt: record.createdAt,
        completedDates,
      });
    });

    return { rootValid: true, habits, hadIssues };
  }

  function parseData(raw) {
    if (raw === null) {
      return { rootValid: true, habits: [], hadIssues: false };
    }

    try {
      return sanitizeData(JSON.parse(raw));
    } catch {
      return { rootValid: false, habits: [], hadIssues: true };
    }
  }

  function loadData() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return {
        rootValid: true,
        habits: [],
        hadIssues: true,
        error: 'Не удалось прочитать данные из локального хранилища.',
      };
    }

    const parsed = parseData(raw);
    if (!parsed.rootValid) {
      return {
        ...parsed,
        error: 'Сохранённые данные повреждены. Некорректные записи не загружены.',
      };
    }
    if (parsed.hadIssues) {
      return {
        ...parsed,
        error: 'Часть сохранённых данных повреждена и была пропущена.',
      };
    }
    return parsed;
  }

  function saveData(habits) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits }));
      return true;
    } catch {
      showStatus('Не удалось сохранить изменения. Проверьте доступ к локальному хранилищу.', 'error');
      return false;
    }
  }

  function showStatus(message, type = 'success') {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.className = `status is-${type}`;
    status.hidden = false;

    if (type === 'success') {
      statusTimer = setTimeout(() => {
        status.hidden = true;
      }, 4000);
    }
  }

  function clearNameError() {
    nameError.textContent = '';
    nameError.hidden = true;
    nameInput.setAttribute('aria-invalid', 'false');
  }

  function setNameError(message) {
    nameError.textContent = message;
    nameError.hidden = false;
    nameInput.setAttribute('aria-invalid', 'true');
  }

  function createId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch {
      // Используем запасной генератор ниже.
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function formatCreatedAt(value) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  function isCompletedToday(habit, today = getLocalDateKey()) {
    return habit.completedDates.includes(today);
  }

  function render() {
    const today = getLocalDateKey();
    renderedDate = today;
    const completedToday = state.habits.filter((habit) => isCompletedToday(habit, today)).length;
    summary.textContent = `Сегодня выполнено: ${completedToday} из ${state.habits.length}`;
    habitCount.textContent = String(state.habits.length);
    habitSection.hidden = state.habits.length === 0;
    emptyState.hidden = state.habits.length !== 0;
    habitList.replaceChildren();

    const fragment = document.createDocumentFragment();
    state.habits.forEach((habit) => {
      fragment.appendChild(createHabitElement(habit, today));
    });
    habitList.appendChild(fragment);
  }

  function createHabitElement(habit, today) {
    const completed = isCompletedToday(habit, today);
    const item = document.createElement('li');
    item.dataset.habitId = habit.id;

    const card = document.createElement('article');
    card.className = `habit-card${completed ? ' is-complete' : ''}`;

    const header = document.createElement('div');
    header.className = 'habit-card-header';

    const title = document.createElement('h3');
    title.className = 'habit-name';
    title.textContent = habit.name;

    const completeMark = document.createElement('span');
    completeMark.className = 'complete-mark';
    completeMark.setAttribute('aria-hidden', 'true');
    completeMark.textContent = '✓ сегодня';
    header.append(title, completeMark);

    const meta = document.createElement('div');
    meta.className = 'habit-meta';

    const created = document.createElement('span');
    created.textContent = `Создана: ${formatCreatedAt(habit.createdAt)}`;

    const total = document.createElement('span');
    const count = habit.completedDates.length;
    total.textContent = `${count} ${getDayWord(count)} выполнено`;
    meta.append(created, total);

    const actions = document.createElement('div');
    actions.className = 'habit-actions';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = `action-button toggle-button${completed ? ' is-active' : ''}`;
    toggle.dataset.action = 'toggle';
    toggle.setAttribute('aria-pressed', String(completed));
    toggle.textContent = completed ? 'Выполнено сегодня' : 'Отметить сегодня';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'action-button delete-button';
    remove.dataset.action = 'delete';
    remove.textContent = 'Удалить';
    remove.setAttribute('aria-label', `Удалить привычку «${habit.name}»`);

    actions.append(toggle, remove);
    card.append(header, meta, actions);
    item.appendChild(card);
    return item;
  }

  function getDayWord(number) {
    const remainder100 = number % 100;
    if (remainder100 >= 11 && remainder100 <= 14) return 'дней';
    switch (number % 10) {
      case 1: return 'день';
      case 2:
      case 3:
      case 4: return 'дня';
      default: return 'дней';
    }
  }

  function commit(habits) {
    state.habits = habits;
    render();
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearNameError();

    const name = normalizeName(nameInput.value);
    if (!name) {
      setNameError('Введите название привычки.');
      showStatus('Не удалось добавить привычку: название не заполнено.', 'error');
      nameInput.focus();
      return;
    }

    if (state.habits.some((habit) => habit.name === name)) {
      setNameError('Такая привычка уже есть. Придумайте другое название.');
      showStatus('Не удалось добавить привычку: такое название уже используется.', 'error');
      nameInput.focus();
      return;
    }

    const habit = {
      id: createId(),
      name,
      createdAt: new Date().toISOString(),
      completedDates: [],
    };
    const candidate = [...state.habits, habit];

    if (!saveData(candidate)) return;
    commit(candidate);
    form.reset();
    clearNameError();
    showStatus(`Привычка «${name}» добавлена.`, 'success');
    nameInput.focus();
  }

  function handleToggle(habitId) {
    const today = getLocalDateKey();
    const current = state.habits.find((habit) => habit.id === habitId);
    if (!current) return;

    const wasCompleted = current.completedDates.includes(today);
    const candidate = state.habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      const dates = new Set(habit.completedDates);
      if (wasCompleted) dates.delete(today);
      else dates.add(today);
      return { ...habit, completedDates: [...dates] };
    });

    if (!saveData(candidate)) return;
    commit(candidate);
    showStatus(wasCompleted ? 'Отметка снята.' : 'Привычка отмечена выполненной сегодня.', 'success');
  }

  function handleDelete(habitId) {
    const current = state.habits.find((habit) => habit.id === habitId);
    if (!current) return;
    if (!window.confirm(`Удалить привычку «${current.name}»? Это действие нельзя отменить.`)) return;

    const candidate = state.habits.filter((habit) => habit.id !== habitId);
    if (!saveData(candidate)) return;
    commit(candidate);
    showStatus(`Привычка «${current.name}» удалена.`, 'success');
  }

  function handleListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || !habitList.contains(button)) return;
    const item = button.closest('[data-habit-id]');
    if (!item) return;

    if (button.dataset.action === 'toggle') handleToggle(item.dataset.habitId);
    if (button.dataset.action === 'delete') handleDelete(item.dataset.habitId);
  }

  function handleStorage(event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;

    if (event.newValue === null) {
      commit([]);
      showStatus('Данные обновлены в другой вкладке.', 'success');
      return;
    }

    const parsed = parseData(event.newValue);
    if (!parsed.rootValid) {
      showStatus('В другой вкладке сохранены повреждённые данные. Текущий список оставлен без изменений.', 'error');
      return;
    }

    commit(parsed.habits);
    if (parsed.hadIssues) {
      showStatus('Данные обновлены: некорректные записи были пропущены.', 'error');
    } else {
      showStatus('Данные обновлены в другой вкладке.', 'success');
    }
  }

  function refreshForNewDay() {
    const today = getLocalDateKey();
    if (today !== renderedDate) render();
  }

  const loaded = loadData();
  state.habits = loaded.habits;
  render();
  if (loaded.error) showStatus(loaded.error, 'error');

  form.addEventListener('submit', handleSubmit);
  nameInput.addEventListener('input', clearNameError);
  habitList.addEventListener('click', handleListClick);
  window.addEventListener('storage', handleStorage);
  document.addEventListener('visibilitychange', refreshForNewDay);
  window.setInterval(refreshForNewDay, 60_000);
})();
