import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, parseTime } from '../src/time.js';

describe('formatTime', () => {
  test('formats 1500 seconds as 25:00', () => {
    assert.equal(formatTime(1500), '25:00');
  });

  test('formats 65 seconds as 01:05', () => {
    assert.equal(formatTime(65), '01:05');
  });

  test('formats 0 seconds as 00:00', () => {
    assert.equal(formatTime(0), '00:00');
  });

  test('formats 5 seconds as 00:05', () => {
    assert.equal(formatTime(5), '00:05');
  });

  test('formats 3599 seconds as 59:59', () => {
    assert.equal(formatTime(3599), '59:59');
  });

  test('rejects negative seconds', () => {
    assert.throws(() => formatTime(-1));
  });

  test('rejects non-integer seconds', () => {
    assert.throws(() => formatTime(1.5));
  });

  test('rejects non-number input', () => {
    assert.throws(() => formatTime('25'));
  });
});

describe('parseTime', () => {
  test('parses "25:00" as 1500 seconds', () => {
    assert.equal(parseTime('25:00'), 1500);
  });

  test('parses "01:05" as 65 seconds', () => {
    assert.equal(parseTime('01:05'), 65);
  });

  test('parses "0:30" as 30 seconds', () => {
    assert.equal(parseTime('0:30'), 30);
  });

  test('rejects malformed strings', () => {
    assert.throws(() => parseTime('25'));
    assert.throws(() => parseTime('25:5:5'));
    assert.throws(() => parseTime('abc'));
  });

  test('rejects seconds >= 60', () => {
    assert.throws(() => parseTime('1:60'));
    assert.throws(() => parseTime('1:99'));
  });

  test('rejects non-string input', () => {
    assert.throws(() => parseTime(1500));
  });
});
