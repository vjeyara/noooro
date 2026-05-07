// Web Audio sensory cues + focus noise playback.
// Cues are E2E-verified; noise generation is unit-tested in src/noise.js.
// All sources share one AudioContext (lazy-init on first user gesture).

import {
  generateWhiteNoise,
  generatePinkNoise,
  generateBrownNoise,
} from './noise.js';

let ctx = null;
let enabled = true;
let volume = 0.4;
let noiseVolume = 0.5;
let noiseSource = null;
let noiseGain = null;
let noiseAnalyser = null;

export function setEnabled(value) {
  enabled = Boolean(value);
}

export function setVolume(value) {
  volume = Math.max(0, Math.min(1, Number(value) || 0));
}

function getCtx() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

function isReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function gateOpen() {
  if (!enabled) return false;
  if (isReducedMotion()) return false;
  const c = getCtx();
  if (!c) return false;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  return true;
}

function playOscillator({ type = 'sine', startFreq, endFreq, durationMs, peak = 0.4 }) {
  if (!gateOpen()) return;
  const c = ctx;
  const dur = durationMs / 1000;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  if (endFreq && endFreq !== startFreq) {
    osc.frequency.linearRampToValueAtTime(endFreq, now + dur);
  }
  const peakLevel = Math.max(0.001, peak * volume);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(peakLevel, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

export function tapSoft() {
  playOscillator({ type: 'sine', startFreq: 800, durationMs: 50, peak: 0.18 });
}

export function startWhoosh() {
  playOscillator({ type: 'sine', startFreq: 320, endFreq: 660, durationMs: 220, peak: 0.28 });
}

export function pauseDown() {
  playOscillator({ type: 'sine', startFreq: 660, endFreq: 380, durationMs: 160, peak: 0.28 });
}

export function resumeUp() {
  playOscillator({ type: 'sine', startFreq: 380, endFreq: 660, durationMs: 160, peak: 0.28 });
}

export function completeBell() {
  if (!gateOpen()) return;
  const c = ctx;
  const now = c.currentTime;
  const dur = 0.9;
  const fundamental = c.createOscillator();
  const harmonic = c.createOscillator();
  const gain = c.createGain();
  fundamental.type = 'sine';
  fundamental.frequency.value = 528;
  harmonic.type = 'sine';
  harmonic.frequency.value = 1056;
  const peak = Math.max(0.001, 0.55 * volume);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  fundamental.connect(gain);
  harmonic.connect(gain);
  gain.connect(c.destination);
  fundamental.start(now);
  harmonic.start(now);
  fundamental.stop(now + dur + 0.05);
  harmonic.stop(now + dur + 0.05);
}

export function breakChime() {
  playOscillator({ type: 'sine', startFreq: 660, durationMs: 500, peak: 0.36 });
}

export function tapWarm() {
  playOscillator({ type: 'sine', startFreq: 600, durationMs: 50, peak: 0.22 });
}

// ────────────────────────────────────────────────
// Focus noise playback (brown / pink / white loop)
// Bypasses sensory `enabled` and reduced-motion gates — noise is the
// user's explicit choice, not an ambient cue.
// ────────────────────────────────────────────────

export function setNoiseVolume(value) {
  noiseVolume = Math.max(0, Math.min(1, Number(value) || 0));
  if (noiseGain) noiseGain.gain.value = noiseVolume;
}

export function getNoiseAnalyser() {
  return noiseAnalyser;
}

export function stopNoise() {
  if (noiseSource) {
    try { noiseSource.stop(); } catch {}
    try { noiseSource.disconnect(); } catch {}
    noiseSource = null;
  }
  if (noiseGain) {
    try { noiseGain.disconnect(); } catch {}
    noiseGain = null;
  }
  if (noiseAnalyser) {
    try { noiseAnalyser.disconnect(); } catch {}
    noiseAnalyser = null;
  }
}

export function playNoise(type) {
  if (type === 'off' || !type) {
    stopNoise();
    return;
  }
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  stopNoise();

  const seconds = 2;
  const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const channel = buffer.getChannelData(0);
  let samples;
  if (type === 'brown') samples = generateBrownNoise(c.sampleRate, seconds);
  else if (type === 'pink') samples = generatePinkNoise(c.sampleRate, seconds);
  else samples = generateWhiteNoise(c.sampleRate, seconds);
  channel.set(samples);

  noiseSource = c.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  noiseGain = c.createGain();
  noiseGain.gain.value = noiseVolume;

  noiseAnalyser = c.createAnalyser();
  noiseAnalyser.fftSize = 256;
  noiseAnalyser.smoothingTimeConstant = 0.6;

  noiseSource.connect(noiseGain);
  noiseGain.connect(noiseAnalyser);
  noiseAnalyser.connect(c.destination);
  noiseSource.start();
}
