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
} from './audio.js';
import { buildHeatmapBuckets } from './heatmap.js';
import { selectNote } from './notes.js';
import { currentSequence } from './cycle.js';
import { computeStreak } from './streak.js';
import { weeklyBuckets } from './weekly.js';
import { isDemo, demoStorageKey, loadDemoSeed } from './demo.js';

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────
const RING_LENGTH = 578.05;
const TICK_INTERVAL_MS = 250;
const FLASH_MS = 500;
const ONE_DAY = 24 * 60 * 60 * 1000;

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 4l13 8-13 8V4z"/></svg>';
const PAUSE_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
const SKIP_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>';
const REMOVE_ICON =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';

const NOISE_ACCENT = {
  off: '#A8B89E',
  brown: '#D4937B',
  pink: '#F2C5A0',
  white: '#9C8E82',
};

const STATE_LABEL = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  break: 'Break',
};

const MAX_VISIBLE_TASKS = 5;

// ────────────────────────────────────────────────
// Module state
// ────────────────────────────────────────────────
let appState;
let timerState = initialTimerState();
let activeTaskId = null;
let storageKey = 'noooro';
let tickHandle = null;
let waveformAnimating = false;
let activeNoiseType = 'off';
let waveformCtx = null;
let waveformCanvas = null;
let midnightTimer = null;

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

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

function activeTask() {
  return appState.tasks.find((t) => t.id === activeTaskId);
}

function sessionsToday() {
  const today = dayStart(Date.now());
  return appState.sessions.filter((s) => dayStart(s.completedAt) === today);
}

function sessionsForTaskToday(taskId) {
  return sessionsToday().filter((s) => s.taskId === taskId).length;
}

function justCompletedCycleSignal() {
  const today = sessionsToday();
  if (today.length === 0) return false;
  return today.length % 4 === 0 && timerState.status === 'idle';
}

// ────────────────────────────────────────────────
// Render
// ────────────────────────────────────────────────
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
  $('.app-shell').dataset.status = timerState.status;
}

function renderTaskTitle() {
  const task = activeTask();
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
  const map = {
    idle: { icon: PLAY_ICON, label: 'Start' },
    running: { icon: PAUSE_ICON, label: 'Pause' },
    paused: { icon: PLAY_ICON, label: 'Resume' },
    break: { icon: SKIP_ICON, label: 'Skip break' },
  };
  const { icon, label } = map[timerState.status];
  action.innerHTML = `${icon}<span>${label}</span>`;
}

function renderBreakChip() {
  const chip = $('.break-chip');
  if (!chip) return;
  if (timerState.status === 'break') {
    chip.hidden = true;
    return;
  }
  chip.hidden = false;
  const seq = currentSequence(appState.sessions, Date.now());
  const min =
    seq.breakKind === 'long'
      ? 15
      : appState.settings.breakMin;
  const label = seq.breakKind === 'long' ? 'long break' : 'break';
  chip.textContent = `${min} min ${label} next`;
}

function renderHeader() {
  const streakNum = computeStreak(appState.sessions, Date.now());
  const pill = $('.streak-pill');
  pill.dataset.status = timerState.status;
  pill.dataset.empty = streakNum === 0 ? 'true' : 'false';
  $('.streak-count').textContent = String(streakNum);
  $('.streak-label').textContent = streakNum === 1 ? 'day' : 'days';
  $('.streak-pill .sr-only').textContent = STATE_LABEL[timerState.status];

  const demoEl = $('.demo-pill');
  if (demoEl) demoEl.hidden = !isDemo();
}

function renderTodayCard() {
  const todays = sessionsToday();
  const totalMin = todays.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
  const stats = $$('.stat-value');
  if (stats[0]) stats[0].textContent = String(todays.length);
  if (stats[1]) stats[1].textContent = String(totalMin);
  $('.today-card').dataset.empty = todays.length === 0 ? 'true' : 'false';
  renderWeekly();
}

function renderWeekly() {
  const meter = $('.weekly-meter');
  const buckets = weeklyBuckets(appState.sessions, Date.now());
  if (meter.children.length !== buckets.length) {
    meter.replaceChildren();
    for (let i = 0; i < buckets.length; i++) {
      const cell = document.createElement('div');
      cell.className = 'weekly-cell';
      cell.textContent = buckets[i].dayLabel;
      meter.appendChild(cell);
    }
  }
  buckets.forEach((b, i) => {
    const cell = meter.children[i];
    const heat = b.count === 0 ? 0 : Math.min(4, b.count);
    cell.dataset.heat = String(heat);
    cell.dataset.today = String(b.isToday);
    cell.title = `${b.dayLabel} — ${b.count} Pomodoro${b.count === 1 ? '' : 's'}`;
  });
}

function renderSessionCard() {
  const seq = currentSequence(appState.sessions, Date.now());
  $('.session-current').textContent = String(seq.workIndex);
  $('.session-total').textContent = String(seq.total);

  const dotsEl = $('.session-dots');
  if (dotsEl.children.length !== seq.total) {
    dotsEl.replaceChildren();
    for (let i = 0; i < seq.total; i++) {
      const d = document.createElement('div');
      d.className = 'session-dot';
      dotsEl.appendChild(d);
    }
  }
  for (let i = 0; i < seq.total; i++) {
    const dot = dotsEl.children[i];
    const positionInCycle = seq.completedToday % 4;
    const idx = i; // 0..3
    let state = 'upcoming';
    if (idx < positionInCycle) state = 'done';
    else if (idx === positionInCycle && timerState.status !== 'idle') state = 'current';
    else if (idx === positionInCycle) state = 'current';
    dot.dataset.state = state;
    dot.dataset.kind = idx === 3 ? 'long' : 'short';
  }

  const meta = $('.session-meta');
  if (meta) {
    meta.querySelectorAll('strong')[0].textContent = String(appState.settings.workMin);
    meta.querySelectorAll('strong')[1].textContent = String(appState.settings.breakMin);
    meta.querySelectorAll('strong')[2].textContent = '15';
  }
}

function renderNote() {
  const seq = currentSequence(appState.sessions, Date.now());
  const todays = sessionsToday();
  const streakDays = computeStreak(appState.sessions, Date.now());
  const segmentKind = seq.breakKind; // for break state messaging
  const noteState = {
    status: timerState.status,
    sessionsToday: todays.length,
    streakDays,
    hasTask: !!activeTaskId,
    workIndex: seq.workIndex,
    total: seq.total,
    breakMin: appState.settings.breakMin,
    segmentKind,
    justCompletedCycle: justCompletedCycleSignal(),
  };
  const note = selectNote(noteState);
  $('.note').textContent = note;
}

function renderTasks() {
  const ul = $('.tasks');
  $$('.task', ul).forEach((el) => el.remove());
  const addRow = $('.task-add', ul);

  const visible = appState.tasks.slice(0, MAX_VISIBLE_TASKS);
  for (const task of visible) {
    const li = document.createElement('li');
    li.className = 'task' + (task.id === activeTaskId ? ' task-active' : '');
    li.dataset.id = task.id;

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const noiseChip = document.createElement('span');
    noiseChip.className = 'task-noise';
    noiseChip.dataset.noise = task.noiseType ?? 'off';
    noiseChip.textContent = (task.noiseType ?? 'off').slice(0, 1).toUpperCase();

    const count = sessionsForTaskToday(task.id);
    const countEl = document.createElement('span');
    countEl.className = 'task-count';
    countEl.textContent = count > 0 ? '·'.repeat(Math.min(4, count)) + (count > 4 ? `+${count - 4}` : '') : '';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn task-remove';
    removeBtn.setAttribute('aria-label', 'Remove task');
    removeBtn.innerHTML = REMOVE_ICON;
    removeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      handleRemoveTask(task.id);
    });

    li.append(title, countEl, noiseChip, removeBtn);
    li.addEventListener('click', () => selectTask(task.id));
    ul.insertBefore(li, addRow);
  }

  $('.task-section-count').textContent = String(appState.tasks.length);

  const moreBtn = $('.tasks-more');
  if (moreBtn) {
    const remaining = Math.max(0, appState.tasks.length - MAX_VISIBLE_TASKS);
    moreBtn.hidden = remaining === 0;
    if (remaining > 0) {
      $('.tasks-more-count').textContent = String(remaining);
    }
  }
}

function renderHeatmap() {
  const grid = $('.heatmap-grid');
  if (!grid) return;
  const buckets = buildHeatmapBuckets(appState.sessions, Date.now(), 30);
  grid.dataset.empty = appState.sessions.length === 0 ? 'true' : 'false';

  if (grid.children.length !== buckets.length) {
    grid.replaceChildren();
    for (let i = 0; i < buckets.length; i++) {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      grid.appendChild(cell);
    }
  }
  buckets.forEach((b, i) => {
    const cell = grid.children[i];
    cell.dataset.heat = String(b.heat);
    const dateLabel = new Date(b.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    cell.title =
      b.count === 0
        ? `${dateLabel} · no sessions`
        : `${dateLabel} · ${b.count} Pomodoro${b.count === 1 ? '' : 's'}`;
  });
}

function render() {
  renderTimer();
  renderTaskTitle();
  renderActionButton();
  renderBreakChip();
  renderHeader();
  renderTodayCard();
  renderSessionCard();
  renderNote();
  renderTasks();
  renderHeatmap();
}

// ────────────────────────────────────────────────
// Timer loop
// ────────────────────────────────────────────────
function startTickLoop() {
  stopTickLoop();
  tickHandle = setInterval(onTick, TICK_INTERVAL_MS);
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
      saveAll(appState, storageKey);
      const seq = currentSequence(appState.sessions, Date.now());
      const breakMs =
        (seq.breakKind === 'long' ? 15 : appState.settings.breakMin) * 60 * 1000;
      timerState = complete(timerState, breakMs, Date.now());
      completeBell();
      flashScreen();
    } else if (timerState.status === 'break') {
      timerState = resetTimer();
      stopTickLoop();
      breakChime();
      flashScreen();
    }
  }
  render();
}

function flashScreen() {
  document.body.classList.remove('flash');
  void document.body.offsetWidth;
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), FLASH_MS);
}

// ────────────────────────────────────────────────
// Action handlers
// ────────────────────────────────────────────────
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
    tapSoft();
    stopTickLoop();
  }
  render();
}

function selectTask(id) {
  if (timerState.status === 'running' || timerState.status === 'paused') return;
  activeTaskId = id;
  tapWarm();
  render();
}

function handleAddTask() {
  const title = window.prompt('What do you want to focus on?');
  if (!title || !title.trim()) return;
  appState = addTask(appState, { title: title.trim(), noiseType: 'off' });
  saveAll(appState, storageKey);
  if (!activeTaskId) {
    activeTaskId = appState.tasks[appState.tasks.length - 1].id;
  }
  render();
}

function handleRemoveTask(id) {
  const isActive = id === activeTaskId;
  const inSession = timerState.status === 'running' || timerState.status === 'paused';
  if (isActive && inSession) return;
  appState = removeTask(appState, id);
  saveAll(appState, storageKey);
  if (isActive) {
    activeTaskId = appState.tasks[0]?.id ?? null;
  }
  render();
}

// ────────────────────────────────────────────────
// Noise panel
// ────────────────────────────────────────────────
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

  waveformCtx.strokeStyle = 'rgba(156, 142, 130, 0.25)';
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
  if (!waveformCanvas) return;
  waveformCtx = waveformCanvas.getContext('2d');

  $$('.chip[data-noise]').forEach((chip) => {
    chip.addEventListener('click', () => selectNoise(chip.dataset.noise));
  });

  const slider = $('.noise-volume-slider');
  if (slider) {
    slider.value = String(Math.round(appState.settings.noiseVolume * 100));
    setNoiseVolume(appState.settings.noiseVolume);
    slider.addEventListener('input', () => {
      const v = Number(slider.value) / 100;
      setNoiseVolume(v);
      appState = {
        ...appState,
        settings: { ...appState.settings, noiseVolume: v },
      };
      saveAll(appState, storageKey);
    });
  }
}

// ────────────────────────────────────────────────
// Keyboard shortcuts
// ────────────────────────────────────────────────
function handleKeyboard(ev) {
  // Skip if user is typing in input
  if (
    ev.target.tagName === 'INPUT' ||
    ev.target.tagName === 'TEXTAREA' ||
    ev.target.isContentEditable
  ) {
    return;
  }
  if (ev.code === 'Space') {
    ev.preventDefault();
    handleAction();
  } else if (ev.key === 'n' || ev.key === 'N') {
    handleAddTask();
  } else if (ev.key === '[') {
    cycleTask(-1);
  } else if (ev.key === ']') {
    cycleTask(1);
  }
}

function cycleTask(dir) {
  if (appState.tasks.length === 0) return;
  if (timerState.status === 'running' || timerState.status === 'paused') return;
  const idx = appState.tasks.findIndex((t) => t.id === activeTaskId);
  let next = idx + dir;
  if (next < 0) next = appState.tasks.length - 1;
  if (next >= appState.tasks.length) next = 0;
  activeTaskId = appState.tasks[next].id;
  tapWarm();
  render();
}

// ────────────────────────────────────────────────
// Midnight rollover
// ────────────────────────────────────────────────
function scheduleMidnightRender() {
  if (midnightTimer) clearTimeout(midnightTimer);
  const now = Date.now();
  const tomorrow = dayStart(now) + ONE_DAY;
  const msUntil = tomorrow - now + 1000;
  midnightTimer = setTimeout(() => {
    render();
    scheduleMidnightRender();
  }, msUntil);
}

// ────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────
async function bootstrap() {
  if (isDemo()) {
    await loadDemoSeed();
  }
  storageKey = demoStorageKey();
  appState = loadAll(storageKey);
  activeTaskId = appState.tasks[0]?.id ?? null;

  $('.timer-action').addEventListener('click', handleAction);
  $('.task-add-btn').addEventListener('click', handleAddTask);
  initNoisePanel();
  document.addEventListener('keydown', handleKeyboard);
  scheduleMidnightRender();

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
