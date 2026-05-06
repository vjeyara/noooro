import { describe, it, expect } from 'vitest';
import { formatTime, parseTime } from '../src/time.js';

describe('formatTime', () => {
  it('formats 1500 seconds as 25:00', () => {
    expect(formatTime(1500)).toBe('25:00');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 5 seconds as 00:05', () => {
    expect(formatTime(5)).toBe('00:05');
  });

  it('formats 3599 seconds as 59:59', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('rejects negative seconds', () => {
    expect(() => formatTime(-1)).toThrow();
  });

  it('rejects non-integer seconds', () => {
    expect(() => formatTime(1.5)).toThrow();
  });

  it('rejects non-number input', () => {
    expect(() => formatTime('25')).toThrow();
  });
});

describe('parseTime', () => {
  it('parses "25:00" as 1500 seconds', () => {
    expect(parseTime('25:00')).toBe(1500);
  });

  it('parses "01:05" as 65 seconds', () => {
    expect(parseTime('01:05')).toBe(65);
  });

  it('parses "0:30" as 30 seconds', () => {
    expect(parseTime('0:30')).toBe(30);
  });

  it('rejects malformed strings', () => {
    expect(() => parseTime('25')).toThrow();
    expect(() => parseTime('25:5:5')).toThrow();
    expect(() => parseTime('abc')).toThrow();
  });

  it('rejects seconds >= 60', () => {
    expect(() => parseTime('1:60')).toThrow();
    expect(() => parseTime('1:99')).toThrow();
  });

  it('rejects non-string input', () => {
    expect(() => parseTime(1500)).toThrow();
  });
});
