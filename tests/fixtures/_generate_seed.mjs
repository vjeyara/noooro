// One-shot generator for seed.json. Deterministic via seeded PRNG.
// Run: node tests/fixtures/_generate_seed.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mulberry32 deterministic PRNG.
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20260508);

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedPick(items) {
  const total = items.reduce((s, it) => s + it.w, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Today = 2026-05-08 in local time. Use UTC midnight to keep things stable.
const TODAY = new Date('2026-05-08T00:00:00Z');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 30-day window: day 0 = 30 days ago, day 29 = today.
const WINDOW_START = new Date(TODAY.getTime() - 29 * MS_PER_DAY);

// --- Tasks ---
// 8 tasks for an ADHD product manager: deep work, learning, comms, hobby, household.
const taskDefs = [
  { title: 'Q2 roadmap brief',                noiseType: 'brown', daysAgo: 22 },
  { title: 'User interview synthesis',        noiseType: 'pink',  daysAgo: 18 },
  { title: 'PRD: notifications v2',           noiseType: 'brown', daysAgo: 12 },
  { title: 'Slack & email triage',            noiseType: 'off',   daysAgo: 47 }, // older
  { title: 'Learn SQL window functions',      noiseType: 'white', daysAgo: 9  },
  { title: 'Guitar practice',                 noiseType: 'off',   daysAgo: 51 }, // older
  { title: 'Inbox zero (personal)',           noiseType: 'pink',  daysAgo: 5  },
  { title: 'Tidy workspace & file taxes',     noiseType: 'brown', daysAgo: 3  },
];

const tasks = taskDefs.map((t, i) => ({
  id: `task-${String(i + 1).padStart(2, '0')}`,
  title: t.title,
  noiseType: t.noiseType,
  createdAt: TODAY.getTime() - t.daysAgo * MS_PER_DAY,
}));

// Most-used task ~30% of sessions: deep work item gets the lion's share.
// Build weighted distribution that sums to ~1.
const taskWeights = [
  { id: 'task-01', w: 38 }, // Q2 roadmap brief — most used (~30%)
  { id: 'task-02', w: 14 }, // user research
  { id: 'task-03', w: 16 }, // PRD
  { id: 'task-04', w: 12 }, // slack/email
  { id: 'task-05', w: 10 }, // learning
  { id: 'task-06', w: 6  }, // guitar
  { id: 'task-07', w: 7  }, // inbox zero
  { id: 'task-08', w: 7  }, // household
];
const taskWeightedItems = taskWeights.map((tw) => ({ value: tw.id, w: tw.w }));

// --- Sessions ---
// Day index 0..29, where 29 is today.
// Empty days (sick/travel): pick 3 random non-today days.
const emptyDayCandidates = [];
while (emptyDayCandidates.length < 3) {
  const d = randInt(2, 27); // skip very first/last days
  if (!emptyDayCandidates.includes(d)) emptyDayCandidates.push(d);
}
const emptyDays = new Set(emptyDayCandidates);

// Active streak: last 5 days (25..29) all have >=1 session, today has 1-2.
const STREAK_DAYS = new Set([25, 26, 27, 28, 29]);

function dayOfWeek(dayIdx) {
  // 0..29; resolve to JS getUTCDay (0 = Sun)
  const d = new Date(WINDOW_START.getTime() + dayIdx * MS_PER_DAY);
  return d.getUTCDay();
}

function isWeekend(dayIdx) {
  const dow = dayOfWeek(dayIdx);
  return dow === 0 || dow === 6;
}

// Ramping engagement: low days 0-9, peak 18-25, slight dip last 2 (28, 29).
function targetSessionsForDay(dayIdx) {
  if (emptyDays.has(dayIdx)) return 0;

  const weekend = isWeekend(dayIdx);

  let base;
  if (dayIdx < 10) {
    // ramping up
    base = weekend ? randInt(0, 2) : randInt(2, 4);
  } else if (dayIdx < 18) {
    // mid
    base = weekend ? randInt(0, 2) : randInt(3, 5);
  } else if (dayIdx <= 25) {
    // peak
    base = weekend ? randInt(1, 2) : randInt(4, 6);
  } else if (dayIdx === 29) {
    // today: 1–2
    base = randInt(1, 2);
  } else if (dayIdx === 28) {
    // yesterday: dip but keep streak alive
    base = weekend ? randInt(1, 2) : randInt(2, 3);
  } else {
    // 26, 27 — keep streak rolling
    base = weekend ? randInt(1, 2) : randInt(3, 5);
  }

  // Streak guard: ensure at least 1 session.
  if (STREAK_DAYS.has(dayIdx) && base === 0) base = 1;

  return base;
}

// Build session start times for a given day, clustered 9-12 and 14-17.
// Some sessions are 50 min (back-to-back blocks); most are 25.
function generateSessionsForDay(dayIdx) {
  const count = targetSessionsForDay(dayIdx);
  if (count === 0) return [];

  const sessions = [];
  const dayStart = WINDOW_START.getTime() + dayIdx * MS_PER_DAY;

  // Place sessions in slots. Slots are minutes-from-day-start.
  // Morning window: 9:00–12:00 (540..720). Afternoon: 14:00–17:00 (840..1020).
  // Occasional outliers up to 19:00.
  const slots = [];
  for (let i = 0; i < count; i++) {
    const useMorning = rng() < 0.55;
    let minuteOfDay;
    if (useMorning) {
      minuteOfDay = randInt(9 * 60, 12 * 60 - 25);
    } else if (rng() < 0.92) {
      minuteOfDay = randInt(14 * 60, 17 * 60 - 25);
    } else {
      // rare evening session 17–19
      minuteOfDay = randInt(17 * 60, 19 * 60 - 25);
    }
    slots.push(minuteOfDay);
  }
  slots.sort((a, b) => a - b);

  // Walk slots, push apart if overlapping, decide 25 vs 50 min.
  let lastEnd = -Infinity;
  for (const slotMin of slots) {
    let start = slotMin;
    if (start < lastEnd + 5) start = lastEnd + 5; // 5 min gap
    // Cap to keep <= 19:00 finish.
    if (start > 19 * 60 - 25) start = 19 * 60 - 25;

    // 12% chance of 50-min back-to-back block when there's room.
    const wantLong = rng() < 0.12 && start + 50 <= 19 * 60;
    const durationMin = wantLong ? 50 : 25;

    const startedAt = dayStart + start * 60 * 1000;
    const completedAt = startedAt + durationMin * 60 * 1000;

    // For "today" (dayIdx === 29) ensure completedAt <= today + ~late afternoon
    // (the user is mid-day on 2026-05-08; treat sessions as already completed earlier).
    sessions.push({
      taskId: weightedPick(taskWeightedItems),
      startedAt,
      completedAt,
      durationMin,
    });

    lastEnd = start + durationMin;
  }

  return sessions;
}

const allSessions = [];
for (let d = 0; d < 30; d++) {
  allSessions.push(...generateSessionsForDay(d));
}

// Tag with stable session ids.
const sessions = allSessions.map((s, i) => ({
  id: `session-${String(i + 1).padStart(3, '0')}`,
  taskId: s.taskId,
  startedAt: s.startedAt,
  completedAt: s.completedAt,
  durationMin: s.durationMin,
}));

const settings = {
  workMin: 25,
  breakMin: 5,
  noiseVolume: 0.55,
  sensoryVolume: 0.4,
  sensoryEnabled: true,
};

const seed = { tasks, sessions, settings };

writeFileSync(
  join(__dirname, 'seed.json'),
  JSON.stringify(seed, null, 2) + '\n',
);

// Quick stats for sanity printout.
const byTask = {};
for (const s of sessions) byTask[s.taskId] = (byTask[s.taskId] ?? 0) + 1;
const totalDays = new Set(
  sessions.map((s) => Math.floor((s.completedAt - WINDOW_START.getTime()) / MS_PER_DAY)),
).size;
console.log('tasks:', tasks.length, 'sessions:', sessions.length, 'active days:', totalDays);
console.log('per-task:', byTask);
