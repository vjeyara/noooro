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
- Soft completion ding + brief screen pulse when a session ends

### Noise (Web Audio API, no external dependencies)

- Off by default on app open until user picks
- Brown noise (preferred for ADHD focus)
- Pink noise
- White noise
- Volume slider
- Live waveform canvas while playing

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

- Single `index.html` with inline CSS and JS, no build step
- Web Audio API for noise generation
- localStorage for persistence
- Canvas for waveform and heatmap
- Deployable as a static file to noooro.com when ready

## Build sequence

1. Visual identity via `ui-ux-pro-max` (palette, typography, vibe)
2. Build `index.html`
3. Verify with `regression-test`
4. Cleanup pass with `simplify`
5. Use it for a few days, capture v2 notes
