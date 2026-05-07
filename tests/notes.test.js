import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { selectNote } from '../src/notes.js';

const baseState = {
  status: 'idle',
  sessionsToday: 0,
  streakDays: 0,
  hasTask: false,
  workIndex: 1,
  total: 4,
  breakKind: 'short',
  segmentKind: 'work',
};

describe('selectNote priority cascade', () => {
  test('1: running last work segment of cycle', () => {
    const note = selectNote({ ...baseState, status: 'running', workIndex: 4 });
    assert.match(note, /long break/i);
  });

  test('2: running mid-cycle (not first, not last)', () => {
    const note = selectNote({ ...baseState, status: 'running', workIndex: 2, sessionsToday: 1 });
    assert.match(note, /locked in|phone away/i);
  });

  test('3: running first work segment of the day', () => {
    const note = selectNote({ ...baseState, status: 'running', workIndex: 1, sessionsToday: 0 });
    assert.match(note, /first|hardest/i);
  });

  test('4: just-completed work segment (transition)', () => {
    const note = selectNote({ ...baseState, status: 'transition', breakMin: 5 });
    assert.match(note, /nice|5/i);
  });

  test('5: short break', () => {
    const note = selectNote({ ...baseState, status: 'break', segmentKind: 'short' });
    assert.match(note, /stand|water/i);
  });

  test('6: long break', () => {
    const note = selectNote({ ...baseState, status: 'break', segmentKind: 'long' });
    assert.match(note, /rest/i);
  });

  test('7: just-completed cycle', () => {
    const note = selectNote({ ...baseState, status: 'idle', sessionsToday: 4, justCompletedCycle: true });
    assert.match(note, /cycle|wrap/i);
  });

  test('8: paused', () => {
    const note = selectNote({ ...baseState, status: 'paused' });
    assert.match(note, /pick up|left off/i);
  });

  test('9: idle 3+ sessions today', () => {
    const note = selectNote({ ...baseState, status: 'idle', sessionsToday: 3 });
    assert.match(note, /earned|afternoon/i);
  });

  test('10: idle 1-2 sessions, streak ≥ 1', () => {
    const note = selectNote({ ...baseState, status: 'idle', sessionsToday: 1, streakDays: 4 });
    assert.match(note, /streak/i);
    assert.match(note, /4/);
  });

  test('11: idle no task, no sessions', () => {
    const note = selectNote({ ...baseState, status: 'idle', hasTask: false, sessionsToday: 0 });
    assert.match(note, /first|hardest/i);
  });

  test('12: idle, task selected, no sessions today (post-break-style nudge)', () => {
    const note = selectNote({ ...baseState, status: 'idle', hasTask: true, sessionsToday: 0 });
    assert.match(note, /boring/i);
  });

  test('returns a non-empty string for any reasonable state', () => {
    assert.ok(typeof selectNote(baseState) === 'string');
    assert.ok(selectNote(baseState).length > 0);
  });

  test('does not throw on partial state', () => {
    assert.doesNotThrow(() => selectNote({ status: 'idle' }));
  });
});
