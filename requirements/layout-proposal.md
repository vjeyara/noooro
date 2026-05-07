# Noooro — Single-Screen Dashboard Layout Proposal

Target viewport: **1280 × 800** laptop. Usable body region after browser chrome and 32px page padding: **~1216 × 720**. Goal: zero scroll, all primary controls visible, visual identity preserved.

## 1. ASCII Wireframe (1280 × 800)

```
+------------------------------------------------------------------------------+ 0
| [noooro]                                              streak: 4d  [settings] |  56  app-header
+------------------------------+----------------------------+------------------+ 64
|                              |  TODAY                     |  TASKS           |
|   TIMER HERO                 |  ┌──────────┬──────────┐   |  ┌────────────┐  |
|   ┌────────────┐             |  │ Pomos    │ Minutes  │   |  │ Read DDIA  │  |
|   │   ◜◝       │             |  │   3      │   75     │   |  │ ● running  │  |
|   │  ◯ 24:13   │             |  └──────────┴──────────┘   |  ├────────────┤  |
|   │   ◟◞       │             |  Streak ▲ 4d  weekly 12   |  │ Inbox zero │  |
|   └────────────┘             +----------------------------+  ├────────────┤  |
|   Read DDIA                  |  SESSION (3 of 4)  •••○    |  │ Workout    │  |
|   ▶ Pause      Skip break    |  Work 25  Break 5  Long 15 |  ├────────────┤  |
|                              +----------------------------+  │ + Add task │  |
|                              |  NOISE                     |  └────────────┘  |
|                              |  [Off][Brn][Pnk][Wht]      |                  |
|                              |  ─•─────────────  vol 50   |                  |
|                              |  ~~~~~~~~~ waveform ~~~~~~ |                  |
+------------------------------+----------------------------+------------------+ 612
| LAST 30 DAYS                                                                 |
| ▢▢▢▣▣ ▣▣▢▣▣ ▣▣▣▣▣ ▣▣▣▢▢ ▢▣▣▣▣ ▣▣▣▢▣           5×6 grid · 24px cells       |
+------------------------------------------------------------------------------+ 720
                              (32px bottom margin)                              800
```

## 2. Pixel Sizing Table

| Region | Grid area | Width | Height | Notes |
|---|---|---|---|---|
| Page padding | — | — | 32px top, 32px sides | total inset 64h, 64v |
| **app-header** | `header` | 1216 | 48 | logo left, streak chip + settings right |
| **timer-hero** | `timer` | 480 | 540 | shrunk ring (220px), digits clamp 72px |
| **today-card** | `today` | 360 | 152 | 2 stat columns + streak row |
| **session-card** | `session` | 360 | 116 | N-of-M dots + work/break/long durations |
| **noise-panel** | `noise` | 360 | 256 | chips + slider + 32px waveform |
| **task-section** | `tasks` | 320 | 540 | scrollable internal list, 4–5 visible |
| **heatmap** | `heat` | 1216 | 84 | 30 cells, 24px squares, 5×6 |
| Gaps | — | 16px column / 16px row | — | tight but breathable |

Total content height: 48 (header) + 16 + 540 (main row) + 16 + 84 (heatmap) = **704px**. Fits in 720 usable + 16px slack.

## 3. CSS Approach

### Desktop (≥1200px) — three columns

```css
.app-shell {
  display: grid;
  grid-template-columns: 480px 1fr 320px;
  grid-template-rows: 48px 1fr 84px;
  grid-template-areas:
    "header   header   header"
    "timer    middle   tasks"
    "heat     heat     heat";
  gap: 16px;
  padding: 32px;
  max-width: 1280px;
  height: 100vh;
  box-sizing: border-box;
}

.middle-column {
  display: grid;
  grid-template-rows: auto auto 1fr;
  grid-template-areas:
    "today"
    "session"
    "noise";
  gap: 12px;
}
```

### Tablet (960–1199px) — two columns, stack heatmap

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
  .timer-hero { height: 440px; }
}
```

### Mobile (<960px) — single column, scroll allowed

```css
@media (max-width: 959px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header" "timer" "today" "session" "noise" "tasks" "heat";
    height: auto;
  }
}
```

## 4. Compression Decisions

| Element | Original | New | Trade-off |
|---|---|---|---|
| Timer ring | 320px | **220px** | Still hero, but no longer monumental. Acceptable: ADHD users glance often, don't stare. |
| Timer digits | 88px LCD | **clamp(56, 5vw, 72px)** | Drops DSEG7 character slightly but tabular-nums + Fraunces preserves identity. |
| Noise waveform | 600×40 canvas | **320×32** | Visual feedback intact; less spectacle. |
| Today card | full-width | **360×152** sidebar block | Stats stay legible; streak moves inline. |
| Tasks | full-width list | **320px right rail** with internal scroll | 4–5 tasks visible above fold; rest scrolls within rail (not page). |
| Heatmap | spread bottom | **1216×84 strip**, cells 24px | Was 16px cells; bumped up because we have width. |
| Vertical breathing room | 96px hero padding | **32px** | Loss of "Studio Ghibli quiet" — biggest sacrifice. |
| Section headers | h2 22px | h3 14px uppercase tracking | Saves ~24px per panel. |

**Dropped from primary view:** "Skip break" button collapses into context menu on timer card. Settings stays in drawer.

**New element:** session-card (work/break/long-break durations + N-of-M dot row). Currently absent in v1; required by spec.

## 5. Reading Order (ADHD eye flow)

The layout uses a **modified Z-pattern** anchored on the timer:

1. **Top-left: Timer ring** — biggest, most contrast, draws the eye first. Answers "what am I doing right now?"
2. **Right of timer: Today stats** — peripheral glance, "how am I doing today?" (Pomos count, minutes, streak).
3. **Below today: Session context** — "where am I in the sequence?" (3 of 4 dots).
4. **Below session: Noise** — secondary control, only touched when starting/changing.
5. **Far right: Task list** — picked when user wants to switch focus target. Spatially separate so it doesn't compete with the timer.
6. **Bottom strip: Heatmap** — historical, lowest priority, scanned occasionally for motivation.

Rationale: ADHD attention is grabbed by the largest, highest-contrast element. Timer ring (sage stroke on cream) wins. Stats and session info live in the immediate peripheral arc so a single glance answers three questions. Tasks are intentionally distant — choosing a task is a deliberate act, not an accidental one. Heatmap is a "reward strip," seen on entry and exit.

## Top 3 Trade-offs

1. **Timer ring 320 → 220px** — loses some ceremonial weight but gains 100px of vertical space that lets stats + session + noise all fit in one column.
2. **Tasks become a 320px rail with internal scroll** — preserves the "see many tasks" requirement but caps comfortable visibility at ~5. Anything beyond requires scrolling within the rail (acceptable; page itself never scrolls).
3. **Hero vertical padding collapses 96 → 32px** — most significant violation of the design system's "whitespace as feature" principle. Necessary for no-scroll on 800px height. Recovered slightly via 16px gaps and rounded card framing.

## Total Height Estimate at 1280×800

`32 (top pad) + 48 (header) + 16 (gap) + 540 (main row) + 16 (gap) + 84 (heatmap) + 32 (bottom pad) = 768px`.

Fits within 800px viewport with **32px headroom** for browser zoom variance or 14" laptop chrome.
