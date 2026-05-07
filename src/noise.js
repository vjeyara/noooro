// Pure noise buffer generators. Web Audio side effects live in audio.js.

export function generateWhiteNoise(sampleRate, durationSec) {
  const length = Math.floor(sampleRate * durationSec);
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = Math.random() * 2 - 1;
  }
  return buf;
}

// Brown (Brownian / red) noise: integrated white noise with leak to prevent DC drift.
export function generateBrownNoise(sampleRate, durationSec) {
  const length = Math.floor(sampleRate * durationSec);
  const buf = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    let s = last * 3.5;
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    buf[i] = s;
  }
  return buf;
}

// Pink noise via Paul Kellet's refined 7-pole IIR filter.
// http://www.firstpr.com.au/dsp/pink-noise/
export function generatePinkNoise(sampleRate, durationSec) {
  const length = Math.floor(sampleRate * durationSec);
  const buf = new Float32Array(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    let pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    if (pink > 1) pink = 1;
    else if (pink < -1) pink = -1;
    buf[i] = pink;
  }
  return buf;
}
