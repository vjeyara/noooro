import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
  clear: () => { for (const k of Object.keys(memStore)) delete memStore[k]; },
};

globalThis.window = globalThis.window || {};

const { isDemo, writeDemoSeed, demoStorageKey } = await import('../src/demo.js');

describe('isDemo', () => {
  test('true when ?demo=1 present', () => {
    globalThis.window.location = { search: '?demo=1' };
    assert.equal(isDemo(), true);
  });

  test('true when demo=1 is among other params', () => {
    globalThis.window.location = { search: '?foo=bar&demo=1' };
    assert.equal(isDemo(), true);
  });

  test('false when no query string', () => {
    globalThis.window.location = { search: '' };
    assert.equal(isDemo(), false);
  });

  test('false when demo=0', () => {
    globalThis.window.location = { search: '?demo=0' };
    assert.equal(isDemo(), false);
  });

  test('false when demo flag missing', () => {
    globalThis.window.location = { search: '?other=1' };
    assert.equal(isDemo(), false);
  });
});

describe('writeDemoSeed', () => {
  test('writes seed to noooro_demo key, never noooro', () => {
    localStorage.clear();
    writeDemoSeed({ tasks: [{ id: 'a', title: 'x', noiseType: 'off', createdAt: 1 }], sessions: [], settings: {} });
    assert.ok(localStorage.getItem('noooro_demo'));
    assert.equal(localStorage.getItem('noooro'), null);
  });

  test('overwrites existing demo data', () => {
    localStorage.clear();
    localStorage.setItem('noooro_demo', JSON.stringify({ old: true }));
    writeDemoSeed({ tasks: [], sessions: [], settings: {} });
    const parsed = JSON.parse(localStorage.getItem('noooro_demo'));
    assert.equal(parsed.old, undefined);
    assert.deepEqual(parsed.tasks, []);
  });

  test('does NOT touch the real noooro key even if it has data', () => {
    localStorage.clear();
    localStorage.setItem('noooro', JSON.stringify({ tasks: [{ id: 'real', title: 'real task' }] }));
    writeDemoSeed({ tasks: [], sessions: [], settings: {} });
    const real = JSON.parse(localStorage.getItem('noooro'));
    assert.equal(real.tasks[0].id, 'real');
  });
});

describe('demoStorageKey', () => {
  test('returns noooro_demo when in demo mode', () => {
    globalThis.window.location = { search: '?demo=1' };
    assert.equal(demoStorageKey(), 'noooro_demo');
  });

  test('returns noooro when not in demo mode', () => {
    globalThis.window.location = { search: '' };
    assert.equal(demoStorageKey(), 'noooro');
  });
});
