import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  start,
  pause,
  resume,
  complete,
  reset,
  tick,
} from '../src/state.js';

describe('initialState', () => {
  test('returns idle state', () => {
    const s = initialState();
    assert.equal(s.status, 'idle');
    assert.equal(s.taskId, null);
    assert.equal(s.startedAt, null);
    assert.equal(s.durationMs, 0);
  });
});

describe('start', () => {
  test('transitions idle to running', () => {
    const s = initialState();
    const next = start(s, 'task-1', 1500000, 1000);
    assert.equal(next.status, 'running');
    assert.equal(next.taskId, 'task-1');
    assert.equal(next.startedAt, 1000);
    assert.equal(next.durationMs, 1500000);
  });

  test('does not mutate input', () => {
    const s = initialState();
    start(s, 'task-1', 1500000, 1000);
    assert.equal(s.status, 'idle');
  });

  test('throws if running', () => {
    const s = initialState();
    const running = start(s, 'task-1', 1500000, 1000);
    assert.throws(() => start(running, 'task-2', 1500000, 2000));
  });

  test('throws if paused', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = pause(s, 1100);
    assert.throws(() => start(s, 'task-2', 1500000, 2000));
  });

  test('allows starting from break (next task)', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = complete(s, 300000, 1500001);
    const next = start(s, 'task-2', 1500000, 2000000);
    assert.equal(next.status, 'running');
    assert.equal(next.taskId, 'task-2');
  });
});

describe('pause', () => {
  test('transitions running to paused with computed remaining', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = pause(s, 301000);
    assert.equal(s.status, 'paused');
    assert.equal(s.remainingMs, 1200000);
  });

  test('does not allow remaining below 0', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = pause(s, 9999999);
    assert.equal(s.remainingMs, 0);
  });

  test('throws if not running', () => {
    const s = initialState();
    assert.throws(() => pause(s, 1000));
  });
});

describe('resume', () => {
  test('transitions paused to running with new startedAt', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = pause(s, 301000);
    s = resume(s, 5000000);
    assert.equal(s.status, 'running');
    assert.equal(s.startedAt, 5000000);
    assert.equal(s.durationMs, 1200000);
  });

  test('throws if not paused', () => {
    const s = initialState();
    assert.throws(() => resume(s, 1000));
  });
});

describe('tick', () => {
  test('returns remaining time when running', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    const result = tick(s, 301000);
    assert.equal(result.remainingMs, 1200000);
    assert.equal(result.isComplete, false);
  });

  test('returns isComplete when remaining hits 0', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    const result = tick(s, 1501000);
    assert.equal(result.remainingMs, 0);
    assert.equal(result.isComplete, true);
  });

  test('does not return negative remaining', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    const result = tick(s, 9999999);
    assert.equal(result.remainingMs, 0);
    assert.equal(result.isComplete, true);
  });

  test('returns paused remaining when paused', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = pause(s, 301000);
    const result = tick(s, 9999999);
    assert.equal(result.remainingMs, 1200000);
    assert.equal(result.isComplete, false);
  });

  test('returns 0 isComplete=false when idle', () => {
    const s = initialState();
    const result = tick(s, 1000);
    assert.equal(result.remainingMs, 0);
    assert.equal(result.isComplete, false);
  });
});

describe('complete', () => {
  test('transitions running to break with break duration', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = complete(s, 300000, 1501000);
    assert.equal(s.status, 'break');
    assert.equal(s.durationMs, 300000);
    assert.equal(s.startedAt, 1501000);
  });

  test('preserves taskId during break', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = complete(s, 300000, 1501000);
    assert.equal(s.taskId, 'task-1');
  });
});

describe('reset', () => {
  test('returns idle state from running', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = reset(s);
    assert.equal(s.status, 'idle');
    assert.equal(s.taskId, null);
  });

  test('returns idle state from paused', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = pause(s, 1100);
    s = reset(s);
    assert.equal(s.status, 'idle');
  });

  test('returns idle state from break', () => {
    let s = initialState();
    s = start(s, 'task-1', 1500000, 1000);
    s = complete(s, 300000, 1501000);
    s = reset(s);
    assert.equal(s.status, 'idle');
  });
});
