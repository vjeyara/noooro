export function initialState() {
  return {
    status: 'idle',
    taskId: null,
    startedAt: null,
    durationMs: 0,
    remainingMs: 0,
  };
}

export function start(state, taskId, durationMs, now) {
  if (state.status !== 'idle' && state.status !== 'break') {
    throw new Error(`start: cannot start from status "${state.status}"`);
  }
  return {
    status: 'running',
    taskId,
    startedAt: now,
    durationMs,
    remainingMs: 0,
  };
}

export function pause(state, now) {
  if (state.status !== 'running') {
    throw new Error(`pause: cannot pause from status "${state.status}"`);
  }
  const elapsed = now - state.startedAt;
  const remaining = Math.max(0, state.durationMs - elapsed);
  return { ...state, status: 'paused', remainingMs: remaining };
}

export function resume(state, now) {
  if (state.status !== 'paused') {
    throw new Error(`resume: cannot resume from status "${state.status}"`);
  }
  return {
    ...state,
    status: 'running',
    startedAt: now,
    durationMs: state.remainingMs,
    remainingMs: 0,
  };
}

export function complete(state, breakMs, now) {
  return {
    ...state,
    status: 'break',
    startedAt: now,
    durationMs: breakMs,
    remainingMs: 0,
  };
}

export function reset() {
  return initialState();
}

export function tick(state, now) {
  if (state.status === 'paused') {
    return { remainingMs: state.remainingMs, isComplete: false };
  }
  if (state.status !== 'running' && state.status !== 'break') {
    return { remainingMs: 0, isComplete: false };
  }
  const elapsed = now - state.startedAt;
  const remaining = Math.max(0, state.durationMs - elapsed);
  return { remainingMs: remaining, isComplete: remaining === 0 };
}
