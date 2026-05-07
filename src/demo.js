// Demo seed loader. ?demo=1 toggles a separate localStorage key so the user's
// real `noooro` key is never touched in demo mode.

const DEMO_KEY = 'noooro_demo';
const REAL_KEY = 'noooro';

function getSearch() {
  if (typeof window === 'undefined' || !window.location) return '';
  return window.location.search ?? '';
}

export function isDemo() {
  const search = getSearch();
  if (!search) return false;
  const params = new URLSearchParams(search);
  return params.get('demo') === '1';
}

export function demoStorageKey() {
  return isDemo() ? DEMO_KEY : REAL_KEY;
}

export function writeDemoSeed(seed) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(seed));
}

export async function loadDemoSeed(fetchImpl = fetch) {
  if (!isDemo()) return null;
  // If we already populated the demo store this session, don't re-fetch.
  const existing = localStorage.getItem(DEMO_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // fall through to refetch on parse error
    }
  }
  try {
    const res = await fetchImpl('tests/fixtures/seed.json');
    if (!res.ok) return null;
    const seed = await res.json();
    writeDemoSeed(seed);
    return seed;
  } catch {
    return null;
  }
}
