# Noooro SPEC.md Critique

Brutal pass over `requirements/SPEC.md` against `ux-requirements.md`, `layout-proposal.md`, `PRD.md`, `DESIGN.md`, and `CLAUDE.md`. Findings are sorted by severity. Fixes are concrete edits to SPEC.md.

## Counts

- CRITICAL: 6
- HIGH: 11
- MEDIUM: 7

---

## CRITICAL

### C1. Vertical math does not fit a real laptop viewport

- **Issue:** Spec locks `height: 100vh` at 1280x800 with row budget `4 + 48 + main + 84 + gaps + 32 bottom padding`. The numbers add to ~768px ONLY in headless Chromium. On a real 13"/14" MacBook the visible area inside Chrome is ~720-755px (top chrome 87-92px). The page WILL scroll on the user's actual machine even though `npm run snap` says it does not.
- **Why it matters:** This is the single thing the user explicitly said tonight: "I want no scroll." Passing the headless snap and then scrolling on his laptop is the worst possible failure mode.
- **Fix:** Replace `height: 100vh` with `height: 100dvh; min-height: 640px;` AND change the acceptance criterion from "headless Chromium snap" to "tested at viewport heights 720, 760, 800 with `dvh`." Also reduce timer-hero from 540 to 480 and heatmap from 84 to 64 to leave 60px slack. Add a clear "viewport height budget" table to the spec.

### C2. Timer digit math is internally inconsistent and breaks DSEG7 readability

- **Issue:** Row 21 says `clamp(40, 4vw, 48px)` to fit DSEG7 5-char (~178px) inside the 234px ring. But row 19 says ring 240px outer (preserves "5:1 ring-to-digit ratio"); 240/48 = 5:1 only at the max. At 1280px viewport, `4vw` = 51.2px, clamp resolves to 48px. The ring INNER (240 - 2*stroke) is ~234px, but DSEG7 5-char width at 48px is closer to 220-230px (DSEG7 Classic glyph aspect ~0.92), leaving 4-14px total margin, NOT 28px each side. And R9 in `ux-requirements.md` says `clamp(72,10vw,96)` — the spec arbitrarily shrunk to 48px to fit math the user did not approve.
- **Why it matters:** A 48px hero timer is not a hero. The "biggest, most contrast" element from layout-proposal §5 reading order is destroyed. ADHD users reported the timer must "anchor the eye" — at 48px it competes with body text.
- **Fix:** Either (a) keep DSEG7 and grow ring to 280-320px so digits can be 80-96px, OR (b) accept Fraunces tabular-nums per DESIGN.md and keep digits at 88-96px. Document which one and update both ring outer and digit clamp consistently. Show the actual measured DSEG7 5-char width with citation.

### C3. DESIGN.md does not define DSEG7 and the spec mandates a token override

- **Issue:** Resolved-conflict row 19 says "Update DESIGN.md to make DSEG7 canonical." DESIGN.md currently specifies Fraunces opsz 144 SOFT 80 for the timer. CLAUDE.md hard rule: "All visual tokens come from `DESIGN.md` — never invent new colors, sizes, or radii." The spec is asking implementation to violate the hard rule, OR is asking for a DESIGN.md edit that has not happened.
- **Why it matters:** The user is asleep. Implementation will either (a) ship DSEG7 by silently editing DESIGN.md without his approval, (b) ship Fraunces and the spec lies, or (c) get stuck. None are acceptable.
- **Fix:** Add an explicit prerequisite step at top of SPEC.md: "Step 0: Edit DESIGN.md typography table to add DSEG7 row before any rendering work. If the user's DSEG7 font file is not in repo, fall back to Fraunces tabular-nums and flag in handoff." Include the font-face declaration and where to host the file (or which CDN).

### C4. R8 contextual note triggers have a silent gap and a wrong-state risk

- **Issue:** Eleven triggers but no defined precedence when two fire (e.g., "running, session 3 of 4" AND "streak intact, ≥1 session today" both true). Also no trigger for: a) just-completed-session, mid-cycle, before break starts (5-30s window where the user is most receptive); b) "you skipped a break, this one matters more"; c) idle, AFTER a completed cycle (state has "post-break" but not "post-completion"). The "streak at risk by 6pm" trigger is wall-clock driven — that violates the spec's own rule "state-driven, never time-driven."
- **Why it matters:** The contextual note IS the ADHD value prop ("the user explicitly named this"). Two notes flickering or the wrong note showing destroys trust in the rotation. A clock-driven trigger is exactly the "blinking" the spec forbids.
- **Fix:** Add an ordered priority list (1 = highest). Define a single `selectNote(state)` function with explicit `if/else if` cascade in pseudocode. Replace "no session by 6pm" with "no session AND less than `dailyTarget` AND now > sunset-2h" derived from a daylight calc, OR drop this trigger from v1 and note as v2. Add the missing post-completion-pre-break and post-cycle-completion triggers.

### C5. No keyboard, focus, or screen reader spec at all

- **Issue:** SPEC.md has zero accessibility requirements beyond `prefers-reduced-motion`. Missing: keyboard shortcut for Start/Pause (most-used action), focus order across columns, ARIA live region for the contextual note (it changes silently), ARIA label on the 4px status band (color-only = fails WCAG 1.4.1 use-of-color), focus ring tokens for the new sequence dots and chips, and screen-reader announcement when "today total" ticks up.
- **Why it matters:** ADHD users (and the builder) keyboard-drive heavily. The 4px color-only status band fails WCAG without redundant text/icon coding. DESIGN.md pre-delivery checklist already requires "Focus rings visible on every interactive element."
- **Fix:** Add a §Accessibility section: spacebar = start/pause, `1-9` = jump to task N, `Esc` = close drawer; focus order; `aria-live="polite"` on the contextual note; `role="status"` with text-equivalent on the band ("Running" / "Paused" / "Break" / "Idle") rendered in `.sr-only` span; keep visible focus ring per DESIGN.md.

### C6. `?demo=1` semantics + auto-seed-on-empty corrupts real-user first-launch

- **Issue:** Spec line 122: "App loads this when localStorage is empty AND `?demo=1` is in the URL." Then in parens, "TBD: confirm via critique whether auto-seed-on-empty is OK." This is a load-bearing decision left as TBD in the canonical spec while the user is asleep. Two failure modes: (a) auto-seed-on-empty means the user's first real launch shows fake tasks he has to delete (terrible first impression for an app "designed to fight overwhelm"); (b) `?demo=1`-only means dev/screenshot work must remember the flag, easy to forget.
- **Why it matters:** Once seed pollutes localStorage, the user cannot tell what is real. PRD.md says "Local storage only (no cloud, no login)" — there is no rollback.
- **Fix:** Resolve to: `?demo=1` ALWAYS required to seed; seed writes to a separate localStorage key `noooro_demo` that the app reads ONLY when `?demo=1` is present; real key `noooro` is never touched in demo mode. Empty real launch shows the empty state from PRD ("open file, app works") with a single ghost CTA "+ Add task." Document this as a locked decision, not TBD.

---

## HIGH

### H1. Tasks rail internal scroll violates the no-scroll spirit and PRD capacity

- **Issue:** Rail is 320x540 with 5 visible at ~48px each = 240px content + padding, then `internal scroll for the rest`. PRD says ~50 tasks. Scrolling 5-of-50 inside a no-scroll dashboard is a workaround that the user already rejected ("doesn't do anything because monitoring requires scrolling").
- **Fix:** Collapse to "5 visible + `+N more` pill that opens a popover/drawer" (matches R10 in ux-requirements). No internal scroll on the dashboard surface itself. Add this as an explicit acceptance criterion.

### H2. Header "streak: 4d" is ambiguous and inconsistent with R5 spec

- **Issue:** Layout-proposal wireframe shows `streak: 4d`. SPEC element table says "sage sprout SVG + '12 days' Fraunces lg". Two different formats. "4d" reads as "4 days" or "4 deletions" or noise. R5 says "12 days." DESIGN.md streak component says "4 day streak."
- **Fix:** Lock single canonical format: `[sage sprout SVG] 12 days` (Fraunces lg, no "streak:" prefix; the icon already conveys meaning). For users with 0-day streak, show "Start a streak" in `--ink-mute`, not "0 days" (loss-aversion misfires on zero).

### H3. 4px status band is a WCAG fail and an ADHD distractor risk

- **Issue:** 4px color-only band at top-of-viewport with 200ms transitions on every state change. (a) Color-only = WCAG 1.4.1 violation. (b) For an ADHD user with peripheral-vision sensitivity, a band at the top edge that shifts color on every pause/resume/break IS the kind of peripheral motion the design system bans ("no scale on hover... layout shift = jitter"). It's also functionally redundant with the timer ring (which already encodes state via stroke color).
- **Fix:** Either (a) drop R14 to NICE and make it opt-in via settings, OR (b) move band to a 2px line UNDER the header (less peripheral), encode state with a 6px-wide colored dot + text label inside the header pill, and remove the 200ms transition (instant per `prefers-reduced-motion` and per "no jitter").

### H4. Heatmap dimensions contradict between layout-proposal, SPEC, and DESIGN.md

- **Issue:** SPEC element table: "30 cells, 6 wide x 5 rows, 24px squares" (1216 wide). Layout-proposal §1: "5x6 grid, 24px cells." DESIGN.md component spec: "30 cells, 5 wide x 6 rows, 16px square." Three different sizings. At 24px cells x 6 cols = 144px; the strip is 1216px wide — mostly empty.
- **Fix:** Lock one. Recommended: 30 cells x 24px x 1px gap = 30*24 + 29*1 = 749px wide, in a single horizontal row (`grid-template-columns: repeat(30, 24px)`). Center it within the 1216px strip. Update DESIGN.md accordingly. This also gives a continuous "30-day timeline" reading instead of a square chunk.

### H5. Cross-day midnight transition is undefined

- **Issue:** Spec says "Per-task session counts reset at local midnight" but does not define: what happens to a session that starts at 23:50 and ends at 00:15? Which day owns it? Does the streak break if "today" rolls over with zero sessions while the timer is paused at 23:59? Is the "today" total recomputed live or only on app-open? What about timezone changes?
- **Why it matters:** ADHD users routinely focus past midnight. Misattributed sessions and surprise streak breaks at 00:00 will cause the exact loss-aversion injury R5 is supposed to prevent.
- **Fix:** Add §Time-handling: a session belongs to the day it STARTED. Streak is computed from "any session that started in the last calendar day or today." Update "today" total via a `setTimeout(..., msUntilMidnight)` that re-renders. If the app is paused across midnight, neither day breaks the streak.

### H6. Reduced-motion coverage is incomplete

- **Issue:** Spec disables R8 cross-dissolve and R14 band transition under `prefers-reduced-motion`. But it does NOT disable: today-total tick-up flash (R3), timer ring stroke-dashoffset animation, milestone ribbon (R13) entrance, sequence dot fill on completion. DESIGN.md motion section is more complete; SPEC.md regresses.
- **Fix:** Replace ad-hoc reduced-motion list with: "ALL motion documented in DESIGN.md §Motion applies; new motion introduced in this spec (R8 dissolve, R14 transition, R3 tick-up flash, sequence-dot fill, R13 ribbon entrance) becomes instant under reduced-motion."

### H7. Sequence-dot shape semantics will not be readable at 8px

- **Issue:** R2 encodes work=circle, short break=half-circle, long break=leaf. At 8px on `--cream-border` outline, half-circle vs circle vs leaf are indistinguishable to a non-pixel-perfect viewer. ADHD users glance, they do not zoom in.
- **Fix:** Either (a) increase dot size to 12px and use shape AND color (work=`--sage` filled circle, break=`--lavender` outlined circle, long=`--terracotta` outlined diamond), OR (b) drop shape encoding and use color + a "next: long break" text chip beside the dots. Add a hover/focus tooltip on each dot per ux-requirements R2.

### H8. Today-card height shrunk from 152 to 132 with no math

- **Issue:** Layout-proposal: today-card 360x152. SPEC element table: 360x132. Removed 20px without explanation. Today-card is 2 stat columns (DSEG7 numbers ~64-72px tall) + weekly meter (24px) + labels (14px each) + padding. At 132px the math is tight: 24 (meter) + 8 + 64 (stats) + 8 + 14 (labels) + 12 padding x2 = 142px. Will overflow.
- **Fix:** Either restore 152, OR reduce DSEG7 stat numbers to 48px and recalc. Show the math in the spec.

### H9. Streak number font: DSEG7 in stats but Fraunces in pill

- **Issue:** Element table line 71 says "Fraunces lg" for streak pill. But §Acceptance line 130 says "DSEG7 Classic (timer + stat values)." Streak is a stat value. Which one?
- **Fix:** Lock: numbers everywhere = DSEG7 (timer, today stats, streak count). Labels = Pretendard. Display headers = Fraunces. Update both lines for consistency.

### H10. No spec for "running" state visual when task title is empty

- **Issue:** Timer-hero shows "task title." What if no task is selected? PRD allows starting a Pomodoro without picking a task (default state). Spec is silent.
- **Fix:** Add: when no task selected, show "Focus" in `--ink-mute` Pretendard lg. Also add a state spec table covering: idle/no-task, idle/task-selected, running, paused, break-short, break-long, complete.

### H11. R13 milestone ribbon "auto-dismiss after 24h" is a state-persistence trap

- **Issue:** Ribbon shows for 24h after a milestone crossing. Persists across reload? Survives if user closes browser? On re-open, does the timer restart? localStorage-stored timestamps and live re-render windows are easy to get wrong. Also DESIGN.md ADHD anti-patterns says "no badges, levels, points" — a 24h-persistent ribbon is dangerously close.
- **Fix:** Reduce to "shows once at the moment of crossing, auto-dismisses on next state change OR after 30s OR on click — whichever first." No localStorage persistence. Drop R13 to NICE and gate behind a settings toggle defaulting OFF.

---

## MEDIUM

### M1. Grid template-rows missing for tablet, and `auto auto auto 1fr` for middle column has 4 rows but only 4 areas — counts ok but `1fr` will absorb undefined slack and grow `note` unboundedly when tasks run short. Lock note height explicitly.

### M2. Section headers were saved by "h3 14px uppercase tracking" (layout-proposal) but SPEC removes section headers entirely (no "TODAY" / "SESSION" / "NOISE" labels visible). Without labels, density is achieved by removing context — for an ADHD user re-orienting after distraction, this is a regression. Restore minimal `xs uppercase ink-mute` labels above each card.

### M3. Noise panel chips + slider + waveform in a 360x96 strip means each region is ~120px wide. Current waveform spec is 200x24 which already overflows. Math needs a re-do or panel needs to be 480 wide (matching timer column).

### M4. Heatmap tooltip on hover is documented in DESIGN.md but not in SPEC. Add: "hover any heatmap cell shows date + Pomodoro count tooltip in `--cream-card` with `--shadow-soft`."

### M5. No spec for what happens when settings drawer opens — does it overlay tasks rail (fine) or push layout (forbidden)? Lock as overlay with backdrop.

### M6. Acceptance criteria are mostly visual, very few testable. Missing: "selectNote(state) returns expected note for each of 11 triggers" (unit-testable per CLAUDE.md TDD rule), "streak does not break across midnight while timer paused", "today total animates on session-complete, not on reload."

### M7. Spec says "All 79+ tests stay GREEN" but adds R1-R15 features including new `selectNote`, sequence-dot rendering, weekly meter. Those need NEW tests per CLAUDE.md TDD requirement, not just keeping old ones green. Add: "Each new module ships with ≥80% unit coverage (per global testing rule)."

---

## Recommendations: priority order for fixes

1. C1 (viewport math) and C3 (DSEG7 token) — blocking
2. C2 (digit/ring math) — blocking visual
3. C4 (note triggers) and C6 (`?demo=1`) — blocking behavior
4. C5 (a11y) — blocking quality
5. H1-H5 — fix before implementation
6. H6-H11 — fix during implementation (low rework cost)
7. M1-M7 — fold into spec polish or punt

## Verdict

**Rework before ship.**

The spec has good bones (column allocation, R8 idea, no-scroll target) but four CRITICAL blockers (real viewport math, digit/ring math contradiction, DSEG7 token rule violation, demo-seed corruption risk) and an entire missing accessibility surface. Shipping as-is overnight produces a dashboard that scrolls on the user's actual laptop, possibly mis-renders the timer, and may pollute his real localStorage on first launch.

## Time estimate

- Critical fixes (C1-C6) + lock the canonical numbers: **45-60 min** of spec editing
- High fixes (H1-H11): **30-45 min** of spec editing
- Medium fixes: **15-20 min**

Total: **~2 hours of spec work** before any implementation begins. After that, a competent implementation pass against the locked spec is its own multi-hour effort.
