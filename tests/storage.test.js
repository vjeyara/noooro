import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
  clear: () => { for (const k of Object.keys(memStore)) delete memStore[k]; },
};

const {
  defaultState,
  loadAll,
  saveAll,
  addTask,
  removeTask,
  updateTask,
  addSession,
} = await import('../src/storage.js');

describe('defaultState', () => {
  test('returns empty tasks and sessions', () => {
    const s = defaultState();
    assert.deepEqual(s.tasks, []);
    assert.deepEqual(s.sessions, []);
  });

  test('returns sane default settings', () => {
    const s = defaultState();
    assert.equal(s.settings.workMin, 25);
    assert.equal(s.settings.breakMin, 5);
    assert.equal(s.settings.sensoryEnabled, true);
  });
});

describe('loadAll', () => {
  test('returns default state when storage is empty', () => {
    localStorage.clear();
    const data = loadAll();
    assert.equal(data.tasks.length, 0);
    assert.equal(data.settings.workMin, 25);
  });

  test('returns stored state when valid', () => {
    localStorage.clear();
    localStorage.setItem('noooro', JSON.stringify({
      tasks: [{ id: 'a', title: 'Test', noiseType: 'brown', createdAt: 1 }],
      sessions: [],
      settings: { workMin: 30, breakMin: 5, noiseVolume: 0.5, sensoryVolume: 0.4, sensoryEnabled: true },
    }));
    const data = loadAll();
    assert.equal(data.tasks.length, 1);
    assert.equal(data.tasks[0].title, 'Test');
    assert.equal(data.settings.workMin, 30);
  });

  test('returns default on corrupt JSON', () => {
    localStorage.setItem('noooro', 'not-json{{{');
    const data = loadAll();
    assert.equal(data.tasks.length, 0);
    assert.equal(data.settings.workMin, 25);
  });

  test('merges partial settings with defaults', () => {
    localStorage.clear();
    localStorage.setItem('noooro', JSON.stringify({
      tasks: [],
      sessions: [],
      settings: { workMin: 45 },
    }));
    const data = loadAll();
    assert.equal(data.settings.workMin, 45);
    assert.equal(data.settings.breakMin, 5);
    assert.equal(data.settings.sensoryEnabled, true);
  });
});

describe('saveAll', () => {
  test('persists state as JSON', () => {
    localStorage.clear();
    const state = defaultState();
    state.tasks.push({ id: 'a', title: 'Hello', noiseType: 'off', createdAt: 1 });
    saveAll(state);
    const raw = localStorage.getItem('noooro');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.tasks.length, 1);
    assert.equal(parsed.tasks[0].title, 'Hello');
  });
});

describe('addTask', () => {
  test('appends a task with id and createdAt', () => {
    const initial = defaultState();
    const next = addTask(initial, { title: 'Read', noiseType: 'brown' });
    assert.equal(next.tasks.length, 1);
    assert.equal(next.tasks[0].title, 'Read');
    assert.equal(next.tasks[0].noiseType, 'brown');
    assert.equal(typeof next.tasks[0].id, 'string');
    assert.ok(next.tasks[0].id.length > 0);
    assert.equal(typeof next.tasks[0].createdAt, 'number');
  });

  test('does not mutate input state', () => {
    const initial = defaultState();
    addTask(initial, { title: 'Read', noiseType: 'brown' });
    assert.equal(initial.tasks.length, 0);
  });

  test('defaults noiseType to off when omitted', () => {
    const initial = defaultState();
    const next = addTask(initial, { title: 'Read' });
    assert.equal(next.tasks[0].noiseType, 'off');
  });

  test('throws on empty title', () => {
    const initial = defaultState();
    assert.throws(() => addTask(initial, { title: '', noiseType: 'off' }));
  });

  test('throws on whitespace-only title', () => {
    const initial = defaultState();
    assert.throws(() => addTask(initial, { title: '   ', noiseType: 'off' }));
  });

  test('trims title whitespace', () => {
    const initial = defaultState();
    const next = addTask(initial, { title: '  Read  ', noiseType: 'off' });
    assert.equal(next.tasks[0].title, 'Read');
  });
});

describe('removeTask', () => {
  test('removes task by id', () => {
    let state = defaultState();
    state = addTask(state, { title: 'A' });
    state = addTask(state, { title: 'B' });
    const id = state.tasks[0].id;
    const next = removeTask(state, id);
    assert.equal(next.tasks.length, 1);
    assert.equal(next.tasks[0].title, 'B');
  });

  test('is no-op when id missing', () => {
    let state = defaultState();
    state = addTask(state, { title: 'A' });
    const next = removeTask(state, 'missing-id');
    assert.equal(next.tasks.length, 1);
  });
});

describe('updateTask', () => {
  test('patches a task by id', () => {
    let state = defaultState();
    state = addTask(state, { title: 'Read', noiseType: 'off' });
    const id = state.tasks[0].id;
    const next = updateTask(state, id, { noiseType: 'brown' });
    assert.equal(next.tasks[0].noiseType, 'brown');
    assert.equal(next.tasks[0].title, 'Read');
  });

  test('does not mutate input', () => {
    let state = defaultState();
    state = addTask(state, { title: 'Read', noiseType: 'off' });
    const id = state.tasks[0].id;
    updateTask(state, id, { noiseType: 'brown' });
    assert.equal(state.tasks[0].noiseType, 'off');
  });
});

describe('addSession', () => {
  test('appends session to history', () => {
    const state = defaultState();
    const session = {
      taskId: 'a',
      startedAt: 1000,
      completedAt: 2500000,
      durationMin: 25,
    };
    const next = addSession(state, session);
    assert.equal(next.sessions.length, 1);
    assert.deepEqual(next.sessions[0], session);
  });
});
