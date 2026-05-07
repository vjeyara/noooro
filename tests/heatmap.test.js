import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildHeatmapBuckets, classifyHeat } from '../src/heatmap.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

function dayMs(year, month, day) {
  return new Date(year, month - 1, day).getTime();
}

describe('classifyHeat', () => {
  test('0 sessions -> heat 0', () => assert.equal(classifyHeat(0), 0));
  test('1 session -> heat 1', () => assert.equal(classifyHeat(1), 1));
  test('2 sessions -> heat 2', () => assert.equal(classifyHeat(2), 2));
  test('3 sessions -> heat 3', () => assert.equal(classifyHeat(3), 3));
  test('4 sessions -> heat 4', () => assert.equal(classifyHeat(4), 4));
  test('many sessions cap at heat 4', () => assert.equal(classifyHeat(99), 4));
  test('negative count clamps to 0', () => assert.equal(classifyHeat(-3), 0));
});

describe('buildHeatmapBuckets', () => {
  test('returns 30 buckets by default, oldest first', () => {
    const today = dayMs(2026, 5, 8);
    const buckets = buildHeatmapBuckets([], today);
    assert.equal(buckets.length, 30);
    assert.ok(buckets[0].date < buckets[29].date);
  });

  test('honors custom days arg', () => {
    const today = dayMs(2026, 5, 8);
    assert.equal(buildHeatmapBuckets([], today, 7).length, 7);
    assert.equal(buildHeatmapBuckets([], today, 14).length, 14);
  });

  test('all buckets heat-0 when no sessions', () => {
    const today = dayMs(2026, 5, 8);
    const buckets = buildHeatmapBuckets([], today);
    for (const b of buckets) {
      assert.equal(b.count, 0);
      assert.equal(b.heat, 0);
    }
  });

  test("today's bucket counts a session completed today", () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [{ completedAt: today + 8 * 60 * 60 * 1000 }];
    const buckets = buildHeatmapBuckets(sessions, today);
    assert.equal(buckets[buckets.length - 1].count, 1);
    assert.equal(buckets[buckets.length - 1].heat, 1);
  });

  test('counts multiple sessions on the same day as one bucket', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [
      { completedAt: today + 9 * 60 * 60 * 1000 },
      { completedAt: today + 11 * 60 * 60 * 1000 },
      { completedAt: today + 14 * 60 * 60 * 1000 },
    ];
    const buckets = buildHeatmapBuckets(sessions, today);
    assert.equal(buckets[buckets.length - 1].count, 3);
    assert.equal(buckets[buckets.length - 1].heat, 3);
  });

  test('places sessions in correct historical buckets', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [
      { completedAt: today - 1 * ONE_DAY }, // yesterday: 1
      { completedAt: today - 5 * ONE_DAY }, // 5 days ago: 1
      { completedAt: today - 5 * ONE_DAY + 3600000 }, // 5 days ago: another 1 (count=2)
    ];
    const buckets = buildHeatmapBuckets(sessions, today);
    const today_b = buckets[29];
    const yesterday_b = buckets[28];
    const fiveAgo_b = buckets[24];
    assert.equal(today_b.count, 0);
    assert.equal(yesterday_b.count, 1);
    assert.equal(fiveAgo_b.count, 2);
    assert.equal(fiveAgo_b.heat, 2);
  });

  test('sessions older than the window are ignored', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [
      { completedAt: today - 60 * ONE_DAY }, // way past 30 days
    ];
    const buckets = buildHeatmapBuckets(sessions, today);
    for (const b of buckets) assert.equal(b.count, 0);
  });

  test('future-dated sessions are ignored', () => {
    const today = dayMs(2026, 5, 8);
    const sessions = [{ completedAt: today + 5 * ONE_DAY }];
    const buckets = buildHeatmapBuckets(sessions, today);
    for (const b of buckets) assert.equal(b.count, 0);
  });
});
