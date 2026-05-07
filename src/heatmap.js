// Pure functions for the 30-day Pomodoro heatmap.

const ONE_DAY = 24 * 60 * 60 * 1000;

export function classifyHeat(count) {
  if (count <= 0) return 0;
  if (count >= 4) return 4;
  return count;
}

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function buildHeatmapBuckets(sessions, todayMs, days = 30) {
  const todayBucket = dayStart(todayMs);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    buckets.push({ date: todayBucket - i * ONE_DAY, count: 0, heat: 0 });
  }
  const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));

  for (const session of sessions) {
    if (typeof session?.completedAt !== 'number') continue;
    const bucketDate = dayStart(session.completedAt);
    const idx = indexByDate.get(bucketDate);
    if (idx === undefined) continue;
    buckets[idx].count += 1;
  }

  for (const b of buckets) b.heat = classifyHeat(b.count);
  return buckets;
}
