# Noooro — v1 PRD

## What this is

A personal-use focus tool for the builder (an ADHD product manager). Pomodoro timer + brown/pink/white noise + visible daily progress, in a single static HTML file.

This is v1. Multi-user, community, and stakes mechanics are deferred to v2.

## Why v1 is small

ADHD users churn on overwhelm. The app must not recreate the problem it is meant to solve. v1 must ship in ~3 days and be usable solo on the builder's laptop.

## v1 scope

### Tasks

- Add, edit, delete tasks (capacity ~50)
- Each task can have a noise type assigned (off / brown / pink / white)
- Local storage only (no cloud, no login)

### Pomodoro timer

- Default 25 min work / 5 min break
- Configurable durations
- Start / pause / reset
- Auto-plays assigned noise during work, pauses on break
- Soft completion bell + brief screen pulse when a session ends (see Sensory feedback)
- Duration controls render as rotary knobs (drag up/down to change), with tick sound per step

### Noise (Web Audio API, no external dependencies)

- Off by default on app open until user picks
- Brown noise (preferred for ADHD focus)
- Pink noise
- White noise
- Volume slider
- Live waveform canvas while playing

### Sensory feedback (Web Audio API)

Every meaningful action plays a small warm tactile sound — Toss / Daangn / Korean-app style. Not optional polish; it is core to how the app feels and reinforces every action for ADHD brains.

- Tap, knob-click, slider-tick, chip-select cues for all UI controls
- Distinct cues for Pomodoro start (whoosh), pause (down), resume (up), complete (warm bell), break start (chime)
- All synthesized via Web Audio API (no audio assets, ~150 lines, shares the AudioContext with the noise generator)
- Master volume slider + on/off toggle in settings (separate from focus-noise volume)
- Auto-disabled when `prefers-reduced-motion: reduce` is set
- See `DESIGN.md` § Sound for the full cue inventory and synthesis parameters

### Tracking

- Today card: Pomodoros completed and total focused minutes
- 30-day heatmap (GitHub-contributions style)
- Streak counter

### Data

- localStorage for tasks and history
- Export / Import JSON button (manual backup, device transfer)

## Out of scope for v1

- Gmail / OAuth login
- Cloud sync
- Multi-user, community, leaderboards
- Pooled escrow stakes
- 360-degree life graph across domains
- Bandwidth / overload visualization
- AI-generated music
- Mobile-specific UI

## Tech

- Static deploy: `index.html` + `styles.css` + `src/*.js` modules. No bundler, no build step, no runtime deps beyond fonts.
- Web Audio API for noise generation and 12 sensory cues
- localStorage for persistence
- Canvas for waveform and 30-day heatmap
- Deployable to noooro.com over HTTPS

## Development

- TDD with Node's built-in test runner (`node --test` + `node:assert/strict`) on pure logic modules in `src/` (target ≥80% coverage)
- `npm run dev` starts a local static server for module loading during development
- Only dev dep is `serve` (Node 22+ ships the test runner); lives in `node_modules/`, gitignored, never ships
- Manual golden-path verification + `regression-test` skill after each build phase

## Build sequence

1. Visual identity via `ui-ux-pro-max` → captured in `DESIGN.md`
2. Build `index.html` (using `DESIGN.md` tokens)
3. Verify with `regression-test`
4. Cleanup pass with `simplify`
5. Use it for a few days, capture v2 notes
