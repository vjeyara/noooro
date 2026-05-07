import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { weeklyBuckets } from '../src/weekly.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

function dayMs(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

describe('weeklyBuckets', () => {
  test('returns 7 buckets', () => {
    const buckets = weeklyBuckets([], dayMs(2026, 5, 8));
    assert.equal(buckets.length, 7);
  });

  test('buckets are Mon..Sun in order with day labels', () => {
    const buckets = weeklyBuckets([], dayMs(2026, 5, 8));
    assert.deepEqual(buckets.map((b) => b.dayLabel), ['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });

  test('all buckets have count 0 when no sessions', () => {
    const buckets = weeklyBuckets([], dayMs(2026, 5, 8));
    for (const b of buckets) assert.equal(b.count, 0);
  });

  test("today's bucket is marked isToday=true (Friday 2026-05-08)", () => {
    const today = dayMs(2026, 5, 8); // 2026-05-08 is a Friday
    const buckets = weeklyBuckets([], today);
    const todayCount = buckets.filter((b) => b.isToday).length;
    assert.equal(todayCount, 1);
    assert.equal(buckets[4].isToday, true);
  });

  test('counts sessions on the right day', () => {
    const today = dayMs(2026, 5, 8); // Fri
    const sessions = [
      { completedAt: today },
      { completedAt: today },
      { completedAt: today - 1 * ONE_DAY }, // Thu
    ];
    const buckets = weeklyBuckets(sessions, today);
    assert.equal(buckets[3].count, 1); // Thu
    assert.equal(buckets[4].count, 2); // Fri (today)
  });

  test('ignores sessions outside this week', () => {
    const today = dayMs(2026, 5, 8); // Fri
    const lastWeek = today - 8 * ONE_DAY;
    const buckets = weeklyBuckets([{ completedAt: lastWeek }], today);
    for (const b of buckets) assert.equal(b.count, 0);
  });

  test('multiple sessions same day aggregate', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = Array.from({ length: 5 }, () => ({ completedAt: today }));
    const buckets = weeklyBuckets(sessions, today);
    assert.equal(buckets[4].count, 5);
  });
});
