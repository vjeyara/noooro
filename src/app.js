import { formatTime } from './time.js';
import {
  initialState as initialTimerState,
  start,
  pause,
  resume,
  complete,
  reset as resetTimer,
  tick,
} from './state.js';
import {
  loadAll,
  saveAll,
  addTask,
  removeTask,
  addSession,
} from './storage.js';
import {
  tapSoft,
  tapWarm,
  startWhoosh,
  pauseDown,
  resumeUp,
  completeBell,
  breakChime,
  playNoise,
  stopNoise,
  setNoiseVolume,
  getNoiseAnalyser,
  setVolume as setSensoryVolume,
  setEnabled as setSensoryEnabled,
} from './audio.js';

const RING_LENGTH = 578.05;

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 4l13 8-13 8V4z"/></svg>';
const PAUSE_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
const SKIP_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>';
const REMOVE_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';

let appState = loadAll();
let timerState = initialTimerState();
let activeTaskId = appState.tasks[0]?.id ?? null;
let tickHandle = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function fullSegmentMs() {
  const min =
    timerState.status === 'break'
      ? appState.settings.breakMin
      : appState.settings.workMin;
  return min * 60 * 1000;
}

function displayMs() {
  if (timerState.status === 'idle') {
    return appState.settings.workMin * 60 * 1000;
  }
  return tick(timerState, Date.now()).remainingMs;
}

function renderTimer() {
  const ms = displayMs();
  const sec = Math.ceil(ms / 1000);
  $('.timer-digits').textContent = formatTime(sec);

  const total = fullSegmentMs();
  const progress = total > 0 ? ms / total : 1;
  const ringFg = $('.ring-fg');
  ringFg.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));

  const hero = $('.timer-hero');
  hero.dataset.status = timerState.status;
}

function renderTaskTitle() {
  const task = appState.tasks.find((t) => t.id === activeTaskId);
  const el = $('.timer-task');
  if (task) {
    el.textContent = task.title;
    el.dataset.empty = 'false';
  } else if (appState.tasks.length === 0) {
    el.textContent = 'Add a task to begin';
    el.dataset.empty = 'true';
  } else {
    el.textContent = 'Pick a task';
    el.dataset.empty = 'true';
  }
}

function renderActionButton() {
  const action = $('.timer-action');
  if (timerState.status === 'idle') {
    action.innerHTML = `${PLAY_ICON} <span>Start</span>`;
  } else if (timerState.status === 'running') {
    action.innerHTML = `${PAUSE_ICON} <span>Pause</span>`;
  } else if (timerState.status === 'paused') {
    action.innerHTML = `${PLAY_ICON} <span>Resume</span>`;
  } else if (timerState.status === 'break') {
    action.innerHTML = `${SKIP_ICON} <span>Skip break</span>`;
  }
}

function renderTasks() {
  const ul = $('.tasks');
  $$('.task', ul).forEach((el) => el.remove());
  const addRow = $('.task-add', ul);

  for (const task of appState.tasks) {
    const li = document.createElement('li');
    li.className = 'task' + (task.id === activeTaskId ? ' task-active' : '');
    li.dataset.id = task.id;

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const chip = document.createElement('span');
    const noiseType = task.noiseType ?? 'off';
    chip.className = `chip chip-noise chip-${noiseType}`;
    chip.textContent = noiseType[0].toUpperCase() + noiseType.slice(1);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn task-remove';
    removeBtn.setAttribute('aria-label', 'Remove task');
    removeBtn.innerHTML = REMOVE_ICON;
    removeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      handleRemoveTask(task.id);
    });

    li.append(title, chip, removeBtn);
    li.addEventListener('click', () => selectTask(task.id));
    ul.insertBefore(li, addRow);
  }
}

function renderToday() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const todaySessions = appState.sessions.filter(
    (s) => s.completedAt >= todayMs,
  );
  const totalMin = todaySessions.reduce((sum, s) => sum + s.durationMin, 0);
  const stats = $$('.stat-value');
  if (stats[0]) stats[0].textContent = String(todaySessions.length);
  if (stats[1]) stats[1].textContent = String(totalMin);

  const card = $('.today-card');
  if (card) card.dataset.empty = todaySessions.length === 0 ? 'true' : 'false';

  const streakNum = computeStreak(appState.sessions);
  const streakSpan = $('.streak span');
  const streakEl = $('.streak');
  if (streakSpan) {
    if (streakNum === 0) {
      streakSpan.textContent = 'Start your first session';
    } else if (streakNum === 1) {
      streakSpan.textContent = '1 day streak';
    } else {
      streakSpan.textContent = `${streakNum} day streak`;
    }
  }
  if (streakEl) streakEl.dataset.empty = streakNum === 0 ? 'true' : 'false';
}

function computeStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set();
  for (const s of sessions) {
    const d = new Date(s.completedAt);
    d.setHours(0, 0, 0, 0);
    days.add(d.getTime());
  }
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let count = 0;
  while (days.has(cursor.getTime())) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function render() {
  renderTimer();
  renderTaskTitle();
  renderActionButton();
  renderTasks();
  renderToday();
}

function startTickLoop() {
  stopTickLoop();
  tickHandle = setInterval(onTick, 250);
}

function stopTickLoop() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

function onTick() {
  const result = tick(timerState, Date.now());
  if (result.isComplete) {
    if (timerState.status === 'running') {
      const session = {
        taskId: timerState.taskId,
        startedAt: timerState.startedAt,
        completedAt: Date.now(),
        durationMin: appState.settings.workMin,
      };
      appState = addSession(appState, session);
      saveAll(appState);
      const breakMs = appState.settings.breakMin * 60 * 1000;
      timerState = complete(timerState, breakMs, Date.now());
      flashScreen();
    } else if (timerState.status === 'break') {
      timerState = resetTimer();
      activeTaskId = appState.tasks[0]?.id ?? null;
      stopTickLoop();
      flashScreen();
    }
  }
  render();
}

function flashScreen() {
  document.body.classList.remove('flash');
  void document.body.offsetWidth;
  document.body.classList.add('flash');
}

function handleAction() {
  if (timerState.status === 'idle') {
    if (!activeTaskId) {
      if (appState.tasks.length === 0) {
        tapSoft();
        handleAddTask();
        return;
      }
      activeTaskId = appState.tasks[0].id;
    }
    const workMs = appState.settings.workMin * 60 * 1000;
    timerState = start(timerState, activeTaskId, workMs, Date.now());
    startWhoosh();
    startTickLoop();
  } else if (timerState.status === 'running') {
    timerState = pause(timerState, Date.now());
    pauseDown();
    stopTickLoop();
  } else if (timerState.status === 'paused') {
    timerState = resume(timerState, Date.now());
    resumeUp();
    startTickLoop();
  } else if (timerState.status === 'break') {
    timerState = resetTimer();
    activeTaskId = appState.tasks[0]?.id ?? null;
    tapSoft();
    stopTickLoop();
  }
  render();
}

function selectTask(id) {
  if (timerState.status === 'running' || timerState.status === 'paused') {
    return;
  }
  activeTaskId = id;
  render();
}

function handleAddTask() {
  const title = window.prompt('What do you want to focus on?');
  if (!title || !title.trim()) return;
  appState = addTask(appState, { title: title.trim(), noiseType: 'off' });
  saveAll(appState);
  if (!activeTaskId) {
    activeTaskId = appState.tasks[appState.tasks.length - 1].id;
  }
  render();
}

function handleRemoveTask(id) {
  const isActive = id === activeTaskId;
  const inSession =
    timerState.status === 'running' || timerState.status === 'paused';
  if (isActive && inSession) return;
  appState = removeTask(appState, id);
  saveAll(appState);
  if (isActive) {
    activeTaskId = appState.tasks[0]?.id ?? null;
  }
  render();
}

// ────────────────────────────────────────────────
// Focus noise: chips, volume, waveform
// ────────────────────────────────────────────────

let waveformCanvas = null;
let waveformCtx = null;
let waveformAnimating = false;
let activeNoiseType = 'off';

const NOISE_ACCENT = {
  off: '#A8B89E',
  brown: '#D4937B',
  pink: '#F2C5A0',
  white: '#9C8E82',
};

function selectNoise(type) {
  activeNoiseType = type;
  $$('.chip[data-noise]').forEach((chip) => {
    chip.classList.toggle('chip-active', chip.dataset.noise === type);
  });
  tapWarm();
  if (type === 'off') {
    stopNoise();
    waveformAnimating = false;
    if (waveformCtx) {
      waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    }
    return;
  }
  playNoise(type);
  if (!waveformAnimating) {
    waveformAnimating = true;
    requestAnimationFrame(drawWaveform);
  }
}

function drawWaveform() {
  if (!waveformAnimating || !waveformCtx) return;
  const w = waveformCanvas.width;
  const h = waveformCanvas.height;
  waveformCtx.clearRect(0, 0, w, h);

  waveformCtx.strokeStyle = 'rgba(156, 142, 130, 0.3)';
  waveformCtx.lineWidth = 1;
  waveformCtx.beginPath();
  waveformCtx.moveTo(0, h / 2);
  waveformCtx.lineTo(w, h / 2);
  waveformCtx.stroke();

  const an = getNoiseAnalyser();
  if (an) {
    const data = new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(data);
    waveformCtx.strokeStyle = NOISE_ACCENT[activeNoiseType] || '#A8B89E';
    waveformCtx.lineWidth = 1.5;
    waveformCtx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * w;
      const y = (data[i] / 255) * h;
      if (i === 0) waveformCtx.moveTo(x, y);
      else waveformCtx.lineTo(x, y);
    }
    waveformCtx.stroke();
  }
  requestAnimationFrame(drawWaveform);
}

function initNoisePanel() {
  waveformCanvas = $('.noise-waveform');
  waveformCtx = waveformCanvas.getContext('2d');

  $$('.chip[data-noise]').forEach((chip) => {
    chip.addEventListener('click', () => selectNoise(chip.dataset.noise));
  });

  const slider = $('.noise-volume input[type="range"]');
  slider.value = String(Math.round(appState.settings.noiseVolume * 100));
  setNoiseVolume(appState.settings.noiseVolume);
  slider.addEventListener('input', () => {
    const v = Number(slider.value) / 100;
    setNoiseVolume(v);
    appState = {
      ...appState,
      settings: { ...appState.settings, noiseVolume: v },
    };
    saveAll(appState);
  });
}

function init() {
  $('.timer-action').addEventListener('click', handleAction);
  $('.task-add-btn').addEventListener('click', handleAddTask);
  initNoisePanel();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
