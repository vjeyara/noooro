// computeStreak(sessions, now) — count of consecutive calendar days with at
// least one session, ending at TODAY (if today has a session) or YESTERDAY
// (if today has no session yet, the streak is still alive from yesterday).

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function computeStreak(sessions, now) {
  if (!sessions || sessions.length === 0) return 0;
  const days = new Set();
  for (const s of sessions) {
    if (typeof s?.completedAt !== 'number') continue;
    days.add(dayStart(s.completedAt));
  }
  if (days.size === 0) return 0;

  const todayStart = dayStart(now);
  // Start cursor at today; if no session today, fall back to yesterday.
  let cursor = days.has(todayStart) ? todayStart : todayStart - ONE_DAY;
  if (!days.has(cursor)) return 0;

  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor -= ONE_DAY;
  }
  return count;
}
