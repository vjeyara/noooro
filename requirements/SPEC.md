# Noooro — Dashboard Spec v2 (locked)

Synthesized from `ux-requirements.md` + `layout-proposal.md`, with all CRITICAL and HIGH findings from `CRITIQUE.md` resolved. This is the canonical spec for implementation.

---

## Step 0 — DESIGN.md prerequisite (mandatory before any render code)

Before implementing, update `DESIGN.md` typography table to make **DSEG7 Classic** the canonical typeface for timer digits AND stat values. Existing locally hosted at `assets/DSEG7Classic-Regular.woff2`. Fall-back stack remains `'Courier New', monospace`. Numbers everywhere = DSEG7. Labels = Pretendard. Display headers = Fraunces.

---

## Constraints

- **Target viewport heights:** 720, 760, 800 (test all three with `dvh`)
- **Width:** 1280 desktop. Tablet 960–1199. Mobile <960 may scroll.
- **No scroll** at any tested desktop viewport height
- **All visual tokens** come from `DESIGN.md` v2 (cream / sage / peach / butter / lavender / terracotta + DSEG7 + Pretendard + Fraunces)

## Vertical budget at 720px viewport

| Slot | Height | Running total |
|---|---|---|
| Top padding | 24 | 24 |
| Status indicator (header-pinned, not full-bleed) | 0 (inside header) | 24 |
| Header | 48 | 72 |
| Gap | 16 | 88 |
| Main row (timer / middle / tasks) | 480 | 568 |
| Gap | 16 | 584 |
| Heatmap | 64 | 648 |
| Bottom padding | 24 | 672 |

**Total: 672 px** in 720 visible. Slack: **48 px**. At 800px viewport, slack = 128 px (room for browser zoom).

## Layout (locked)

### Desktop (≥1200 px)

```css
.app-shell {
  display: grid;
  grid-template-columns: 480px 1fr 320px;
  grid-template-rows: 48px 1fr 64px;
  grid-template-areas:
    "header  header  header"
    "timer   middle  tasks"
    "heat    heat    heat";
  gap: 16px;
  padding: 24px 32px;
  max-width: 1280px;
  height: 100dvh;
  min-height: 640px;
  box-sizing: border-box;
}

.middle-col {
  display: grid;
  grid-template-rows: 124px 88px 96px 24px 1fr; /* today / session / noise / note / spacer */
  grid-template-areas: "today" "session" "noise" "note" ".";
  gap: 12px;
}
```

### Tablet (960–1199 px)

```css
@media (max-width: 1199px) {
  .app-shell {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "header  header"
      "timer   middle"
      "tasks   tasks"
      "heat    heat";
  }
  .timer-hero { /* same internals, container will adjust */ }
}
```

### Mobile (<960 px)

```css
@media (max-width: 959px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "timer" "today" "session" "noise" "note" "tasks" "heat";
    height: auto;
  }
}
```

## Element specs

| Region | Width | Height | Notes |
|---|---|---|---|
| `.app-header` | 1216 | 48 | logo · streak pill (state-coloured) · settings icon |
| `.streak-pill` | auto | 32 | `[sprout SVG] 12 days` Pretendard md weight 500. Color carries timer state (sage running, butter paused, lavender break, ink-mute idle). Replaces R14 standalone band. |
| `.timer-hero` | 480 | 480 | ring 300, digits clamp(56,6vw,72) DSEG7, task-title or "Focus", action button + break-chip |
| `.timer-ring` | 300×300 | — | stroke-width 3, inner usable ~294 |
| `.timer-digits` | DSEG7 clamp(56,6vw,72) | — | 5-char width @72px ≈ 266 ≤ 294. Margin ~14px each side. |
| `.session-card` | 360 | 88 | "Pomodoro 3 / 4" + 4 sequence dots (12px, work=sage filled circle, short break=lavender outlined circle, long break=terracotta outlined diamond) + work/break/long durations |
| `.today-card` | 360 | 124 | Pomos · Minutes (DSEG7 48px) + 7-cell weekly meter (24px squares) |
| `.note` | 360 | 24 | single-line, Pretendard md ink-soft, fixed height (no growth) |
| `.noise-panel` | 360 | 96 | row 1: chips (left auto) + slider (140px center) + waveform (160×24 right). row 2: empty padding for breathing. |
| `.task-section` | 320 | 480 | active task highlighted + next 4 + `+N more` pill that opens popover. NO internal scroll. |
| `.heatmap` | 1216 | 64 | 30 cells × 24px squares, 1px gap, single horizontal row (`grid-template-columns: repeat(30, 24px)`), centered in 1216. Hover tooltip per DESIGN.md. |

## Requirements (locked, with severity)

| # | Requirement | Severity | Location |
|---|---|---|---|
| R1 | Pomodoro N of M counter | MUST | session-card |
| R2 | Sequence dots (shape + color, 12px) | SHOULD | session-card |
| R3 | Today total (DSEG7 48px, tick-up flash) | MUST | today-card |
| R4 | Break duration chip pre-break + ring color during | MUST | timer-hero |
| R5 | Daily streak in header pill | MUST | app-header |
| R6 | Weekly 7-cell meter | MUST | today-card |
| R7 | Time-of-day bar | DEFERRED to v2 | — |
| R8 | Single state-driven contextual note | MUST | middle-col.note |
| R9 | Compact timer (ring 300, digits 72 max) | MUST | timer-hero |
| R10 | Top-5 inline task list, `+N more` popover, no scroll | MUST | task-section |
| R11 | Per-task session count dots | SHOULD | each task row |
| R12 | 30-day heatmap (30×24 strip) | MUST | heatmap |
| R13 | Milestone callout (ephemeral 30s, no persistence, settings toggle off by default) | NICE | streak-pill flash |
| R14 | Status colour merged into streak pill (no separate band) | RESOLVED | header pill carries state |
| R15 | Compact noise control (chips + slider + waveform in 96px) | MUST | noise-panel |

## R8 Contextual note — `selectNote(state)` priority cascade

Triggers checked in this order; first match wins. **No wall-clock triggers.**

```
1. running, last work segment of cycle (e.g. 4 of 4)  → "Almost there — long break unlocks next."
2. running, work segment N of 4 where N > 1            → "You're locked in. Phone away."
3. running, first work segment of the day              → "First Pomodoro is the hardest. 25 minutes."
4. just-completed work segment, before break starts    → "Nice work. {breakMin} min break."
5. break, short                                        → "Stand. Water. Look outside."
6. break, long                                         → "Real rest. Don't grade yourself."
7. just-completed cycle (4/4 done, ready for new)      → "Cycle done. Optional: another, or wrap up."
8. paused                                              → "Pick up where you left off when ready."
9. idle, ≥3 sessions today                             → "You've earned the rest of the afternoon."
10. idle, 1–2 sessions today, streak ≥1                → "Streak alive. {N}-day chain."
11. idle, no task selected, no sessions today          → "First Pomodoro is the hardest. 25 minutes."
12. idle, task selected, no sessions today             → "Pick the boring one first."
```

Implementation: pure function `selectNote(state) → string` in `src/notes.js`. Unit-tested per CLAUDE.md TDD rule.

## Time handling (locked)

- A session **belongs to the day it started.** A 23:50 → 00:15 session counts for the start day.
- "Today" = local calendar day per `Date#getHours()`.
- Streak: any session that started in the last calendar day OR today keeps the streak alive.
- A `setTimeout(rerender, msUntilMidnight)` re-renders when midnight arrives; this is the only time-driven action allowed.
- If timer is paused across midnight, no streak break; both days are marked active if a session started in either.

## Demo data semantics (locked)

- Seed lives at `tests/fixtures/seed.json`.
- Seed loads ONLY when URL contains `?demo=1`. No auto-seed-on-empty.
- Demo writes to a **separate** localStorage key: `noooro_demo`. The real key `noooro` is never touched in demo mode.
- App on `?demo=1` reads from `noooro_demo`; app without flag reads from `noooro`. Empty real launch shows clean empty state per PRD.
- Seed loader shows a small "demo mode" pill in the header so it's never invisible.

## Accessibility (locked, new in v2)

- **Keyboard:** Spacebar = Start/Pause/Resume. `[` / `]` = prev/next task. `Esc` = close popover/drawer.
- **Focus order** (Tab): logo → streak pill → settings → action button → first task → noise chip Off → noise chip Brown → ... → slider → waveform (skip via `tabindex=-1`).
- **ARIA live region:** `aria-live="polite"` on `.note`. Changes announce automatically.
- **Status text-equivalent:** an `.sr-only` `<span role="status">` inside the streak pill that text-reads "Running" / "Paused" / "Break" / "Idle" matching the color. Color is never the sole carrier of state.
- **Focus rings** visible on every interactive element per DESIGN.md Pre-Delivery Checklist.

## Reduced-motion (full coverage)

`prefers-reduced-motion: reduce` disables all of:

- R8 cross-dissolve
- R3 today-total tick-up flash
- Timer ring stroke-dashoffset animation (instant snap to target)
- Sequence-dot fill animation
- R13 milestone ribbon entrance
- Streak-pill state colour transitions
- Noise-panel slider thumb animation

(All becomes instant; no layout shifts.)

## State table (visuals per timer state)

| State | Ring stroke | Digits color | Task line | Action btn | Break chip | Note line |
|---|---|---|---|---|---|---|
| idle, no task | sage (full ring) | ink | "Focus" ink-mute | "Start" terracotta | "5 min break" lavender-soft chip | per cascade |
| idle, task | sage (full ring) | ink | task title ink | "Start" terracotta | "5 min break" | per cascade |
| running | sage (animated drain) | ink | task title ink | "Pause" sage-soft outline | "5 min break" | per cascade |
| paused | butter (frozen) | ink | task title ink | "Resume" terracotta | "5 min break" | per cascade |
| break short | lavender (animated) | ink | "Break" ink-soft | "Skip break" terracotta-soft outline | hidden | per cascade |
| break long | lavender (animated) | ink | "Long break" ink-soft | "Skip break" terracotta-soft outline | hidden | per cascade |

## New modules introduced (TDD required)

| Module | Pure logic | Test file |
|---|---|---|
| `src/notes.js` | `selectNote(state) → string` per cascade above | `tests/notes.test.js` |
| `src/cycle.js` | `currentSequence(sessions, settings, now)` returning `{ index, total, kind: 'work'|'short'|'long' }` for the 4-Pomodoro cycle | `tests/cycle.test.js` |
| `src/streak.js` | `computeStreak(sessions, now)` extracted from app.js inline | `tests/streak.test.js` |
| `src/weekly.js` | `weeklyBuckets(sessions, now)` returning 7-cell day-counts | `tests/weekly.test.js` |
| `src/demo.js` | `loadDemoSeed()` + `isDemo()` helpers | `tests/demo.test.js` |

Each module ships with ≥80% unit coverage per global testing rule.

## Acceptance criteria

- [ ] `npm run snap` at 1280×800 + 1280×760 + 1280×720 — **no scroll** in any
- [ ] Timer, sequence dots, today total, streak, weekly meter, contextual note, noise control, top-5 tasks, 30-day heatmap all visible without interaction
- [ ] Break duration chip visible **before** break starts
- [ ] All colors map to existing `--cream-*` / `--sage*` / `--peach*` / `--butter*` / `--lavender*` / `--terracotta*` / `--ink*` / `--heat-*` tokens
- [ ] Timer + stat numbers in DSEG7; body in Pretendard; section labels (when present) in Pretendard xs uppercase ink-mute
- [ ] `prefers-reduced-motion: reduce` disables all 7 motion items above
- [ ] `selectNote(state)` returns expected note for each of 12 triggers (unit-tested)
- [ ] Streak does not break across midnight while timer paused (unit-tested)
- [ ] Today total animates only on session-complete, not on reload
- [ ] Per-task session counts reset at local midnight
- [ ] All previously-passing tests stay GREEN (79+) AND new module tests pass (~30+ new)
- [ ] Demo mode `?demo=1` writes to `noooro_demo` only; real `noooro` key untouched
- [ ] Snap with synthetic data shows populated dashboard (every panel has content)
- [ ] Snap in idle / running / paused / break states all visually correct (4 snaps)
- [ ] Spacebar toggles Start/Pause from any focus position
- [ ] Tab order matches §Accessibility list

## Out of scope

R7 time-of-day bar, R13 milestone ribbon (NICE only). Stake mechanics, multi-user, leaderboards (v2). Calendar/Gmail (v2). Achievement badges, levels, points, confetti (forbidden). Mobile-specific design (basic stack only).
