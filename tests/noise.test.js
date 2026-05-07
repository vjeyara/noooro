import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateWhiteNoise,
  generatePinkNoise,
  generateBrownNoise,
} from '../src/noise.js';

const SR = 44100;

function adjacentDelta(buf) {
  let d = 0;
  for (let i = 1; i < buf.length; i++) d += Math.abs(buf[i] - buf[i - 1]);
  return d / buf.length;
}

describe('generateWhiteNoise', () => {
  test('returns Float32Array of correct length', () => {
    const buf = generateWhiteNoise(SR, 1);
    assert.ok(buf instanceof Float32Array);
    assert.equal(buf.length, SR);
  });

  test('handles fractional duration', () => {
    const buf = generateWhiteNoise(SR, 0.5);
    assert.equal(buf.length, SR / 2);
  });

  test('all samples within [-1, 1]', () => {
    const buf = generateWhiteNoise(SR, 0.1);
    for (const s of buf) assert.ok(s >= -1 && s <= 1, `sample ${s} out of range`);
  });

  test('mean is approximately 0 over a full second', () => {
    const buf = generateWhiteNoise(SR, 1);
    const sum = buf.reduce((a, b) => a + b, 0);
    const mean = sum / buf.length;
    assert.ok(Math.abs(mean) < 0.05, `mean too far from 0: ${mean}`);
  });

  test('different calls produce different buffers', () => {
    const a = generateWhiteNoise(SR, 0.1);
    const b = generateWhiteNoise(SR, 0.1);
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    assert.ok(diff > a.length * 0.9, 'buffers should be ~all different');
  });
});

describe('generateBrownNoise', () => {
  test('returns Float32Array of correct length', () => {
    const buf = generateBrownNoise(SR, 1);
    assert.ok(buf instanceof Float32Array);
    assert.equal(buf.length, SR);
  });

  test('all samples within [-1, 1]', () => {
    const buf = generateBrownNoise(SR, 1);
    for (const s of buf) assert.ok(s >= -1 && s <= 1, `sample ${s} out of range`);
  });

  test('adjacent samples are highly correlated (much smoother than white)', () => {
    const white = generateWhiteNoise(SR, 1);
    const brown = generateBrownNoise(SR, 1);
    const wd = adjacentDelta(white);
    const bd = adjacentDelta(brown);
    assert.ok(bd < wd * 0.3, `brown delta ${bd.toFixed(4)} should be << white ${wd.toFixed(4)}`);
  });
});

describe('generatePinkNoise', () => {
  test('returns Float32Array of correct length', () => {
    const buf = generatePinkNoise(SR, 1);
    assert.ok(buf instanceof Float32Array);
    assert.equal(buf.length, SR);
  });

  test('all samples within [-1, 1]', () => {
    const buf = generatePinkNoise(SR, 1);
    for (const s of buf) assert.ok(s >= -1 && s <= 1, `sample ${s} out of range`);
  });

  test('spectral roll-off intermediate between brown and white', () => {
    const white = generateWhiteNoise(SR, 1);
    const pink = generatePinkNoise(SR, 1);
    const brown = generateBrownNoise(SR, 1);
    const wd = adjacentDelta(white);
    const pd = adjacentDelta(pink);
    const bd = adjacentDelta(brown);
    assert.ok(pd < wd, `pink ${pd.toFixed(4)} should be < white ${wd.toFixed(4)}`);
    assert.ok(pd > bd, `pink ${pd.toFixed(4)} should be > brown ${bd.toFixed(4)}`);
  });
});
