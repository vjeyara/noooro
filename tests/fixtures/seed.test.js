import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, 'seed.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

// Window: 30 days ending on 2026-05-08 (today).
const TODAY = new Date('2026-05-08T00:00:00Z').getTime();
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WINDOW_START = TODAY - 29 * MS_PER_DAY;
// Allow completion through the very end of "today" (2026-05-08 23:59:59Z).
const WINDOW_END = TODAY + MS_PER_DAY - 1;

describe('seed.json fixture', () => {
  test('has 8 tasks (within 6-10)', () => {
    assert.ok(Array.isArray(seed.tasks), 'tasks is an array');
    assert.ok(
      seed.tasks.length >= 6 && seed.tasks.length <= 10,
      `expected 6-10 tasks, got ${seed.tasks.length}`,
    );
    // Tighter expectation: 8 +/- 2.
    assert.ok(Math.abs(seed.tasks.length - 8) <= 2);
  });

  test('has 80-110 sessions', () => {
    assert.ok(Array.isArray(seed.sessions), 'sessions is an array');
    assert.ok(
      seed.sessions.length >= 80 && seed.sessions.length <= 110,
      `expected 80-110 sessions, got ${seed.sessions.length}`,
    );
  });

  test('every session.completedAt is within the trailing 30-day window', () => {
    for (const s of seed.sessions) {
      assert.ok(
        s.completedAt >= WINDOW_START && s.completedAt <= WINDOW_END,
        `session ${s.id ?? '?'} completedAt ${new Date(s.completedAt).toISOString()} out of window`,
      );
    }
  });

  test('every session.taskId resolves to a task', () => {
    const taskIds = new Set(seed.tasks.map((t) => t.id));
    for (const s of seed.sessions) {
      assert.ok(
        taskIds.has(s.taskId),
        `session.taskId ${s.taskId} does not resolve to any task`,
      );
    }
  });

  test('settings carries the expected demo values', () => {
    assert.equal(seed.settings.workMin, 25);
    assert.equal(seed.settings.breakMin, 5);
    assert.equal(seed.settings.sensoryEnabled, true);
  });
});
