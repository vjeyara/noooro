export function formatTime(seconds) {
  if (typeof seconds !== 'number' || !Number.isInteger(seconds) || seconds < 0) {
    throw new Error(`formatTime requires a non-negative integer, got ${seconds}`);
  }
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function parseTime(value) {
  if (typeof value !== 'string') {
    throw new Error(`parseTime requires a string, got ${typeof value}`);
  }
  const match = /^(\d+):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`parseTime: invalid format "${value}", expected "MM:SS"`);
  }
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  if (seconds >= 60) {
    throw new Error(`parseTime: seconds must be 0-59, got ${seconds}`);
  }
  return minutes * 60 + seconds;
}
