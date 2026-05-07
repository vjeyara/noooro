import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak } from '../src/streak.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

function dayMs(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

describe('computeStreak', () => {
  test('empty -> 0', () => {
    assert.equal(computeStreak([], dayMs(2026, 5, 8)), 0);
  });

  test('session today only -> 1', () => {
    const today = dayMs(2026, 5, 8);
    assert.equal(computeStreak([{ completedAt: today }], today), 1);
  });

  test('sessions today + yesterday -> 2', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [
      { completedAt: today },
      { completedAt: today - ONE_DAY },
    ];
    assert.equal(computeStreak(sessions, today), 2);
  });

  test('gap breaks the streak (today + day before yesterday)', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [
      { completedAt: today },
      { completedAt: today - 2 * ONE_DAY },
    ];
    assert.equal(computeStreak(sessions, today), 1);
  });

  test('streak extends back through consecutive days', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [];
    for (let i = 0; i < 5; i++) sessions.push({ completedAt: today - i * ONE_DAY });
    assert.equal(computeStreak(sessions, today), 5);
  });

  test('multiple sessions on the same day count as one day', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [
      { completedAt: today },
      { completedAt: today + 60 * 60 * 1000 },
      { completedAt: today + 2 * 60 * 60 * 1000 },
      { completedAt: today - ONE_DAY },
    ];
    assert.equal(computeStreak(sessions, today), 2);
  });

  test('no session today but session yesterday -> streak still alive (1)', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [{ completedAt: today - ONE_DAY }];
    assert.equal(computeStreak(sessions, today), 1);
  });

  test('no session today or yesterday -> 0', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [{ completedAt: today - 3 * ONE_DAY }];
    assert.equal(computeStreak(sessions, today), 0);
  });
});
