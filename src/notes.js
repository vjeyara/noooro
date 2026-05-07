// selectNote(state) — single-line state-driven contextual note for ADHD users.
// Triggers checked in priority order; first match wins. No wall-clock triggers.

export function selectNote(state = {}) {
  const status = state.status ?? 'idle';
  const sessionsToday = state.sessionsToday ?? 0;
  const streakDays = state.streakDays ?? 0;
  const hasTask = state.hasTask ?? false;
  const workIndex = state.workIndex ?? 1;
  const total = state.total ?? 4;
  const segmentKind = state.segmentKind ?? 'work';
  const breakMin = state.breakMin ?? 5;
  const justCompletedCycle = state.justCompletedCycle ?? false;

  if (status === 'running' && workIndex === total) {
    return 'Almost there — long break unlocks next.';
  }
  if (status === 'running' && workIndex > 1) {
    return "You're locked in. Phone away.";
  }
  if (status === 'running' && workIndex === 1) {
    return 'First Pomodoro is the hardest. 25 minutes.';
  }
  if (status === 'transition') {
    return `Nice work. ${breakMin} min break.`;
  }
  if (status === 'break' && segmentKind === 'long') {
    return "Real rest. Don't grade yourself.";
  }
  if (status === 'break') {
    return 'Stand. Water. Look outside.';
  }
  if (status === 'idle' && justCompletedCycle) {
    return 'Cycle done. Optional: another, or wrap up.';
  }
  if (status === 'paused') {
    return 'Pick up where you left off when ready.';
  }
  if (status === 'idle' && sessionsToday >= 3) {
    return "You've earned the rest of the afternoon.";
  }
  if (status === 'idle' && sessionsToday >= 1 && streakDays >= 1) {
    return `Streak alive. ${streakDays}-day chain.`;
  }
  if (status === 'idle' && hasTask && sessionsToday === 0) {
    return 'Pick the boring one first.';
  }
  // Default catch-all = trigger #11
  return 'First Pomodoro is the hardest. 25 minutes.';
}
