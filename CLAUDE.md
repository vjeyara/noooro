# Noooro — Project Instructions

Personal-use ADHD focus tool. Single static HTML file. Pomodoro + Web Audio noise + sensory audio cues + visible daily progress. Cream-soaked Korean-app aesthetic.

**Read first:**
- `PRD.md` — v1 scope, what is in and what is out
- `DESIGN.md` — color tokens, typography, components, full sound inventory

**Global rules:** `~/.claude/CLAUDE.md` and `~/.claude/rules/ecc/common/*.md` apply.

## Tech

- **Deploy artifact:** static files (`index.html` + sibling CSS/JS in `src/`), no build step, no bundler. Served over HTTPS at noooro.com.
- **Dev tooling:** npm + Vitest + jsdom for unit tests, plus `serve` for local module loading. All dev deps live in `node_modules/`, gitignored, never ship.
- **Local dev:** `npm run dev` starts a static server (ES modules require this; `file://` is blocked by Chrome/Firefox).
- Web Audio API: noise generation + 12 sensory cues, single shared `AudioContext`
- localStorage for persistence
- Canvas for live waveform and 30-day heatmap
- Fonts via CDN (Fraunces from Google Fonts, Pretendard from jsdelivr)
- Inline Lucide SVG icons (never emoji)

## Hard constraints (do not negotiate)

- Single user only — no login, no cloud, no multi-user code paths
- No external **runtime** deps beyond fonts in the deployed app (no React, no Tailwind, no animation libs)
- Dev-time deps (test runner, local server, linter) are fine — they live in `node_modules/` and never ship
- Default state on app open: focus noise off, 25/5 min Pomodoro, sensory cues on
- Capacity: ~50 tasks
- Mobile is not the v1 target (responsive layout welcome, not the focus)
- All visual tokens come from `DESIGN.md` — never invent new colors, sizes, or radii

## Out of scope for v1

Gmail/OAuth, cloud sync, community/leaderboards, escrow stakes, 360-degree life graph, bandwidth meter, AI-generated music, dedicated mobile UI, multi-device sync.

If a "while we're at it" feature appears mid-build, push back and defer to v2. Scope creep is the failure mode this app is designed to fight.

## Build sequence

1. ✅ Visual identity → `DESIGN.md`
2. Build `index.html` (using `DESIGN.md` tokens)
3. Verify with `regression-test` skill after each milestone
4. Cleanup pass with `simplify` skill
5. Use it for a few days, capture v2 notes

## Code style

- Plain JS, no framework
- Functions over classes unless state truly requires it
- camelCase for vars and functions, kebab-case for CSS classes
- Immutable patterns where reasonable; avoid in-place mutation of tasks and sessions
- Keep `index.html` under 800 lines; split CSS and JS into sibling files BEFORE it gets unwieldy
- Every CSS custom property maps to a token in `DESIGN.md`

## ADHD anti-patterns (the app is for ADHD users, including the builder)

- No nested menus — every primary action visible on the main screen
- No notification spam — only `complete-bell` and `break-chime` for milestones
- No badges, levels, points, confetti
- No required setup — open file, app works
- No `scale` transform on hover (layout shift = jitter)
- No high-saturation colors — accents stay muted per `DESIGN.md`

## Data shape (localStorage)

Single key `noooro`:

```
{
  tasks:    [ { id, title, noiseType: off|brown|pink|white, createdAt } ],
  sessions: [ { taskId, startedAt, completedAt, durationMin } ],
  settings: { workMin, breakMin, noiseVolume, sensoryVolume, sensoryEnabled }
}
```

Export/Import wraps this object as a single JSON file.

## Sensory audio rules

- All cues share one `AudioContext` with the noise generator
- Each cue: oscillator + GainNode, 1–5 ms attack, per-cue decay envelope
- No reverb, no delay — keep it dry and immediate
- Disabled when `prefers-reduced-motion: reduce` OR `settings.sensoryEnabled === false`
- Full cue inventory and synthesis parameters: `DESIGN.md` § Sound

## Testing (TDD)

**Workflow per global rule:** RED → GREEN → REFACTOR. Write the failing test first, then minimal code to pass, then improve.

**Stack:** Vitest + jsdom. `npm test` for watch mode, `npm run test:run` for single run.

**Unit-tested (target ≥80% coverage on pure logic in `src/`):**

- Time formatting (`formatTime`, `parseTime`)
- Pomodoro state machine (transitions: idle ↔ running ↔ paused ↔ break ↔ complete)
- Streak calculation from session history
- Heatmap intensity classification (count → heat-0…heat-4)
- Daily aggregation (today's Pomodoros, total minutes)
- Settings validation (workMin ∈ [5,60], breakMin ∈ [1,30])

**E2E only** (verified via `regression-test` skill or manual):

- DOM rendering and event wiring
- Web Audio synthesis (noise generators, sensory cues)
- localStorage persistence behavior
- Drag interactions (rotary knobs, volume slider)

**Manual golden paths to verify after each phase:**

1. Add task → start Pomodoro → noise plays → timer ends → `complete-bell` plays → session logged → today card updates
2. Pause / resume mid-session — `pause-down` and `resume-up` cues fire, timer state correct
3. Switch noise type while running — waveform updates, no audio glitch
4. Refresh page → state restored from localStorage, no data loss

## Deployment

Deploy `index.html` (and any sibling files) as a static file to noooro.com. No backend needed for v1.
