// currentSequence(sessions, now) — where in the 4-Pomodoro cycle is the user?

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function currentSequence(sessions, now) {
  const todayStart = dayStart(now);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  let count = 0;
  for (const s of sessions ?? []) {
    if (typeof s?.completedAt !== 'number') continue;
    if (s.completedAt >= todayStart && s.completedAt < tomorrowStart) count += 1;
  }
  const positionInCycle = count % 4; // 0..3
  const workIndex = positionInCycle + 1; // 1..4
  const breakKind = workIndex === 4 ? 'long' : 'short';
  return { workIndex, total: 4, breakKind, completedToday: count };
}
