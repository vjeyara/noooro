// weeklyBuckets(sessions, now) — Mon..Sun bucket counts for the current week.
// Returns 7 elements in order [Mon, Tue, Wed, Thu, Fri, Sat, Sun].

const ONE_DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function mondayStart(ms) {
  const d = new Date(dayStart(ms));
  // JS getDay: Sun=0 Mon=1 .. Sat=6. We want offset back to Monday.
  const dow = d.getDay();
  const offsetDays = dow === 0 ? 6 : dow - 1;
  return d.getTime() - offsetDays * ONE_DAY;
}

export function weeklyBuckets(sessions, now) {
  const weekStart = mondayStart(now);
  const todayStart = dayStart(now);
  const buckets = [];
  for (let i = 0; i < 7; i++) {
    const date = weekStart + i * ONE_DAY;
    buckets.push({
      date,
      dayLabel: DAY_LABELS[i],
      count: 0,
      isToday: date === todayStart,
    });
  }
  const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));
  for (const s of sessions ?? []) {
    if (typeof s?.completedAt !== 'number') continue;
    const sessionDay = dayStart(s.completedAt);
    const idx = indexByDate.get(sessionDay);
    if (idx === undefined) continue;
    buckets[idx].count += 1;
  }
  return buckets;
}
