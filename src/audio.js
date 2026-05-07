// Web Audio sensory cues. No unit tests — verified E2E in browser.
// All cues share one AudioContext (lazy-init on first user gesture).

let ctx = null;
let enabled = true;
let volume = 0.4;

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
