import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { currentSequence } from '../src/cycle.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

function tsAt(year, month, day, hour) {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
}

const today = tsAt(2026, 5, 8, 14);
const todayStart = (() => { const d = new Date(today); d.setHours(0,0,0,0); return d.getTime(); })();

describe('currentSequence', () => {
  test('0 sessions today -> work 1 of 4, short break next', () => {
    const seq = currentSequence([], today);
    assert.equal(seq.workIndex, 1);
    assert.equal(seq.total, 4);
    assert.equal(seq.breakKind, 'short');
  });

  test('1 session today -> work 2, short break', () => {
    const seq = currentSequence([{ completedAt: today - 60 * 60 * 1000 }], today);
    assert.equal(seq.workIndex, 2);
    assert.equal(seq.breakKind, 'short');
  });

  test('2 sessions today -> work 3, short break', () => {
    const seq = currentSequence([
      { completedAt: today - 2 * 60 * 60 * 1000 },
      { completedAt: today - 1 * 60 * 60 * 1000 },
    ], today);
    assert.equal(seq.workIndex, 3);
    assert.equal(seq.breakKind, 'short');
  });

  test('3 sessions today -> work 4, LONG break next', () => {
    const seq = currentSequence([
      { completedAt: today - 3 * 60 * 60 * 1000 },
      { completedAt: today - 2 * 60 * 60 * 1000 },
      { completedAt: today - 1 * 60 * 60 * 1000 },
    ], today);
    assert.equal(seq.workIndex, 4);
    assert.equal(seq.breakKind, 'long');
  });

  test('4 sessions today -> wraps to work 1 of new cycle', () => {
    const seq = currentSequence(Array.from({ length: 4 }, (_, i) => ({
      completedAt: today - (i + 1) * 60 * 60 * 1000,
    })), today);
    assert.equal(seq.workIndex, 1);
    assert.equal(seq.breakKind, 'short');
  });

  test('7 sessions today -> work 4, long break (mid second cycle)', () => {
    const seq = currentSequence(Array.from({ length: 7 }, (_, i) => ({
      completedAt: today - (i + 1) * 60 * 30 * 1000,
    })), today);
    assert.equal(seq.workIndex, 4);
    assert.equal(seq.breakKind, 'long');
  });

  test('ignores sessions from other days', () => {
    const yesterday = today - ONE_DAY;
    const seq = currentSequence([
      { completedAt: yesterday },
      { completedAt: yesterday - 60 * 60 * 1000 },
    ], today);
    assert.equal(seq.workIndex, 1);
  });

  test('handles missing completedAt gracefully', () => {
    const seq = currentSequence([{}, { completedAt: null }], today);
    assert.equal(seq.workIndex, 1);
  });
});
