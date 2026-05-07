const DEFAULT_KEY = 'noooro';

export function defaultState() {
  return {
    tasks: [],
    sessions: [],
    settings: {
      workMin: 25,
      breakMin: 5,
      noiseVolume: 0.5,
      sensoryVolume: 0.4,
      sensoryEnabled: true,
    },
  };
}

export function loadAll(key = DEFAULT_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const def = defaultState();
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      settings: { ...def.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultState();
  }
}

export function saveAll(state, key = DEFAULT_KEY) {
  localStorage.setItem(key, JSON.stringify(state));
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function addTask(state, { title, noiseType }) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('addTask: title is required');
  }
  return {
    ...state,
    tasks: [
      ...state.tasks,
      {
        id: makeId(),
        title: title.trim(),
        noiseType: noiseType ?? 'off',
        createdAt: Date.now(),
      },
    ],
  };
}

export function removeTask(state, id) {
  return { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
}

export function updateTask(state, id, patch) {
  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
}

export function addSession(state, session) {
  return { ...state, sessions: [...state.sessions, session] };
}
