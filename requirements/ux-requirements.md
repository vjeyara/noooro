# Noooro — Dashboard UX Requirements

## Purpose

The user (an ADHD product manager who is also the builder) reported that the current vertical-stack page "doesn't do anything" because monitoring multiple Pomodoros, breaks, notes, and streaks requires scrolling through a ~3000px page. This document specifies a single-screen dashboard that fits in a 1280x800 viewport with **zero scrolling**, surfaces session and streak state at a glance, and respects the ADHD-friendly design constraints already documented in `PRD.md`, `CLAUDE.md`, and `DESIGN.md`.

All visual tokens referenced below resolve to the existing design system (cream/sage/peach/butter/lavender/terracotta surfaces, Fraunces display + Pretendard body, soft cream-tinted shadows, low-saturation accents). No new colors, fonts, or radii are introduced.

> Note: the upstream brief mentioned "DSEG7 LCD digits" for the timer. `DESIGN.md` specifies **Fraunces, opsz 144, SOFT 80, tabular-nums** for the hero timer; that token wins per the project's hard constraint that "all visual tokens come from DESIGN.md." Treat any DSEG7 mention as out of scope unless DESIGN.md is updated first.

## Layout target

- **Viewport budget:** 1280 x 800. No scroll. No horizontal scroll. No overflow clipping that hides state.
- **Grid:** 12-column, 24px gutter, 16px outer padding. Roughly: left rail (timer + session sequence), center column (today + streaks + notes), right rail (heatmap + tasks).
- **Density rule:** every primary monitoring element is visible without interaction. Details on hover/click, never required to view state.
- **Whitespace as a feature:** density is achieved by removing duplicated section headers, not by shrinking padding inside cards.

---

## Requirements

### R1. Session counter — current Pomodoro number in sequence

- **What the user sees:** A small "Pomodoro 3 of 4" indicator immediately under the timer digits, showing where they are in the current focus cycle.
- **Why it matters for ADHD:** Working memory deficit + time blindness. Without an explicit position-in-sequence cue, the user loses track of which session they are in and whether the next break is a short or long one. This is the #1 anchor that converts "I am doing focus" into "I am 3/4 through a measurable thing."
- **Visualization:** Pretendard `sm`, `--ink-soft`. Format: `Pomodoro 3 / 4`. Adjacent: 4 tiny dots (8px circles) showing completed (`--terracotta` filled), current (`--sage` filled), upcoming (`--cream-border` outline). Position: centered below the timer ring, above the action button.
- **Severity:** **MUST**

### R2. Sequence dots — next-up break-vs-work indicator

- **What the user sees:** The dot row from R1 also encodes whether the next slot is a short break, work, or long break by shape — circle for work, half-circle for short break, full small leaf for long break (15-min after 4 cycles).
- **Why it matters for ADHD:** Reduces the "wait, do I get the long break now?" anticipation anxiety that breaks hyperfocus. Pre-loading what comes next reduces transition cost.
- **Visualization:** Same 8px row, mixed glyphs in `--lavender-soft` (break) and `--sage-soft` (work). Hover any dot → tooltip in `--cream-card`: "Work · 25 min" or "Short break · 5 min" or "Long break · 15 min".
- **Severity:** **SHOULD**

### R3. Today total — sessions completed today, always visible

- **What the user sees:** A persistent "Today: 5" big number at the top-right of the timer card, separate from the in-sequence counter.
- **Why it matters for ADHD:** Dopamine reinforcement. The total grows monotonically; seeing it climb is the single most reliable mood-and-momentum signal for ADHD users. Currently buried in the today card below the fold.
- **Visualization:** Fraunces `2xl` (32px), `--ink`, with `Pretendard sm` `--ink-soft` label "today" below. Tabular-nums. Animates with a 200ms color flash to `--terracotta` when it ticks up after a session completes.
- **Severity:** **MUST**

### R4. Break duration — visible, not hidden in state

- **What the user sees:** When a Pomodoro completes and break starts, the break duration ("5:00" or "15:00") replaces the work timer with a `--lavender` ring. When idle/working, the upcoming break length is shown as a small chip ("next break · 5 min") next to the action button.
- **Why it matters for ADHD:** The user explicitly named this. ADHD users will not "trust" the break unless they know its length up front. Hidden break length causes them to skip breaks (then crash) or extend them (then drift). Making it pre-visible converts the break from a surprise into a planned segment.
- **Visualization:** Pill chip, `--lavender-soft` background, `--ink` text, Pretendard `sm`. Position: below or beside primary action button. During break: ring color flips to `--lavender`, digits stay Fraunces tabular-nums, label "Break" appears in place of task title.
- **Severity:** **MUST**

### R5. Daily streak — front and center

- **What the user sees:** The current streak ("12 days") is in the top header bar to the right of the logo, not buried in the today card.
- **Why it matters for ADHD:** Loss aversion is the strongest behavior-driver in ADHD users — losing a streak hurts more than gaining a Pomodoro feels good. Surfacing the streak globally turns it into a passive ambient pressure (good kind) every time the user looks at the screen.
- **Visualization:** Inline pill: sage sprout SVG (existing) + `12 days` in Fraunces `lg`. Background `--cream-card`, border `--cream-border`. When streak ≥ 7, sprout becomes leaf cluster (already in DESIGN.md). When streak ≥ 30, color shifts subtly to `--terracotta` text.
- **Severity:** **MUST**

### R6. Weekly streak meter — last 7 days at a glance

- **What the user sees:** A 7-cell row showing this week (Mon–Sun) with each day filled if the user hit their daily Pomodoro target, partial if some, empty if none. Today is outlined.
- **Why it matters for ADHD:** Time blindness — ADHD users often genuinely don't know if it's Tuesday or Thursday. A week-shape gives temporal grounding ("oh, it's Wednesday and I have 2/4 days hit"). Also bridges the gap between daily streak (R5) and 30-day heatmap (R12).
- **Visualization:** 7 cells × 24px, radius `xs`, `--heat-0` to `--heat-4` from existing tokens. Day-letter labels in Pretendard `xs` `--ink-mute` below each cell. Today cell has `--terracotta` outline. Position: a single horizontal strip in the center column.
- **Severity:** **MUST**

### R7. Time-of-day indicator — where in the day am I

- **What the user sees:** A thin horizontal bar (about 240px) at the top of the dashboard showing 6am → midnight, with a small `--terracotta` marker showing current time, and translucent `--sage-soft` blocks marking when Pomodoros were completed today.
- **Why it matters for ADHD:** Direct compensation for time blindness. Most ADHD users routinely under- or over-estimate elapsed work time by 30–60%. Seeing the day as a fixed bar with completed-work positions anchors them in real time without forcing them to consult a clock.
- **Visualization:** `--cream-well` track with `--shadow-press`. Tick marks at 9am/12pm/3pm/6pm in `--ink-mute`. Completed Pomodoros: 4px tall `--sage-soft` segments at their position. Current time: 2px `--terracotta` vertical line. Hover any block → "10:45 — 25 min — Read DDIA" tooltip.
- **Severity:** **SHOULD**

### R8. ADHD contextual notes — one rotating, situation-aware nudge

- **What the user sees:** A single-line note in `--ink-soft` below the timer ring, e.g. "You're 3 in — long break unlocks after this one" or "Streak intact. Two Pomodoros today keeps it alive." Rotates based on actual state, not on a timer.
- **Why it matters for ADHD:** The user explicitly named this. ADHD brains respond to *contextual* prompts much better than to static UI. But too many notes = visual noise. ONE note that always shows the highest-priority context-relevant message is the sweet spot. Examples by trigger:
  - **Idle, no sessions today:** "First Pomodoro is the hardest. 25 minutes."
  - **Mid-session 1 of 4:** "You're locked in. Phone away."
  - **Mid-session 3 of 4:** "Long break after this one."
  - **On break:** "Stand up. Water. Look outside."
  - **After break, about to start:** "Pick the boring one first."
  - **Streak at 6:** "One more day = leaf cluster."
  - **Streak at risk (no session yet by 6pm):** "Today still counts. 25 minutes."
  - **3+ sessions in:** "You've earned the rest of the afternoon."
- **Visualization:** Pretendard `base`, `--ink-soft`, italic-off. Single line, max 60 chars, no wrap. Fades cross-dissolve over 200ms when the trigger changes. No icon — text only — so it doesn't read as a "notification."
- **Severity:** **MUST**

### R9. Big timer digits stay hero, but compact

- **What the user sees:** The timer ring shrinks from current 240px to ~200px, digits scale to clamp(72px, 10vw, 96px). Still the largest element on screen, but no longer dominates 50% of the page.
- **Why it matters for ADHD:** Hyperfocus risk. A 240px timer at the top of a tall page is fine; a 240px timer in a compact dashboard becomes visually monopolizing and pulls attention away from streak/sequence/notes. Right-sizing the hero is what makes the rest of the dashboard breathe.
- **Visualization:** SVG ring 200×200, stroke 3px, Fraunces digits clamp(72,10vw,96), tabular-nums, `--ink`. Color rules unchanged from DESIGN.md.
- **Severity:** **MUST**

### R10. Inline task list — top 5 tasks, no full scroll list

- **What the user sees:** A right-rail card showing the active task (highlighted) + next 4 tasks. "+N more" pill at the bottom expands a popover (does not push layout).
- **Why it matters for ADHD:** Working memory ceiling is roughly 5-7 items. Showing all ~50 tasks crashes the dashboard concept and recreates the original scrolling problem. Showing top 5 + collapsed remainder gives "just enough" without becoming a backlog museum.
- **Visualization:** Vertical stack of 5 task rows (each ~48px), `--cream-card` bg, active row `--sage-soft` tint. Each row: title (Pretendard `base`, truncate at 28 chars with ellipsis), noise chip (existing), tiny per-task session count "·· 2" in `--ink-mute`. Add row pinned at top of card.
- **Severity:** **MUST**

### R11. Per-task session count — micro dopamine

- **What the user sees:** Two tiny `--terracotta` dots next to each task title indicating completed Pomodoros on that specific task today.
- **Why it matters for ADHD:** Connects abstract "today total" to specific tasks. ADHD users frequently feel "I worked all day but got nothing done." Per-task counts give concrete proof that yes, you did three sessions on the deck and one on email.
- **Visualization:** Inline 6px dots, max 4 visible, then `+N`. `--terracotta` filled. Pretendard `xs` for the +N. Resets at midnight.
- **Severity:** **SHOULD**

### R12. 30-day heatmap — compact, in the corner

- **What the user sees:** Existing 30-day heatmap, repositioned to bottom-right corner at smaller cell size (12px instead of 16px), 6×5 layout. Same `--heat-0` to `--heat-4` tokens.
- **Why it matters for ADHD:** Long-arc reinforcement and "has my pattern shifted?" check-in. Has to remain visible (it's a major retention signal) but should not compete with weekly meter (R6) for attention.
- **Visualization:** 6×5 grid, 12px cells, 1px gap, radius `xs`. Caption "30 days" in Pretendard `xs` `--ink-mute`. Hover tooltip unchanged.
- **Severity:** **MUST**

### R13. Milestone callout — only at unlock moments

- **What the user sees:** A small `--peach-soft` ribbon appears at the top of the streak pill *only* when the user crosses 7, 14, 30, 60, 100 day streaks. Auto-dismisses after 24h.
- **Why it matters for ADHD:** ADHD users undervalue passive achievement. A momentary callout at milestone crossings provides the dopamine hit without polluting steady-state UI with permanent badges (which DESIGN.md forbids — "no achievement badges"). This is the legal version: ephemeral, contextual, dismissible.
- **Visualization:** Single-line ribbon above streak pill. Pretendard `sm`, `--ink`, `--peach-soft` background, radius `pill`, padding `xs sm`. Text examples: "7 days. Leaf cluster unlocked." or "30-day streak." Soft `complete-bell` cue on first appearance.
- **Severity:** **NICE**

### R14. Status color band — entire dashboard reads state at a glance

- **What the user sees:** A 4px tall band at the very top of the viewport reflects current Pomodoro state: `--sage` running, `--butter` paused, `--lavender` break, `--cream-bg` idle. No motion, just color.
- **Why it matters for ADHD:** Peripheral vision processes color faster than central vision processes text. A user glancing back at the screen after looking away can know "I'm still running" or "I'm on break" in 100ms without reading anything. Reduces re-orientation cost after the inevitable distraction.
- **Visualization:** 4px high `<div>` pinned to top of viewport. Color transitions over 200ms with the same easing as the timer ring. No text. Below the band: existing header.
- **Severity:** **SHOULD**

### R15. Compact noise control — single row, not a section

- **What the user sees:** Noise chips (Off / Brown / Pink / White) + volume slider + waveform collapse into a single ~40px-tall horizontal strip docked under the timer card. Waveform shrinks to 24px.
- **Why it matters for ADHD:** The current noise panel takes ~200px of vertical space for what is fundamentally one decision ("which sound, how loud") plus passive feedback. Compressing it to one row buys back the vertical real estate needed for sequence dots, contextual note, and break chip.
- **Visualization:** Flexbox row: chips (left), slider (center, ~120px wide), waveform (right, ~200px wide × 24px tall, stroke colors unchanged). All existing tokens, just shorter.
- **Severity:** **MUST**

---

## Out of scope (explicitly deferred)

- Stake mechanics, multi-user, leaderboards (per PRD.md v2)
- Calendar integration, Gmail (per PRD.md v2)
- Achievement badges, levels, points, confetti (forbidden by DESIGN.md ADHD anti-patterns)
- Mobile-specific layout (v1 target is 1280x800 desktop)
- Per-task time-of-day analytics (R7 shows today only; trend view is v2)

## Acceptance criteria (single-screen sanity check)

- [ ] At 1280×800, no vertical scroll, no horizontal scroll
- [ ] Timer, sequence dots, today total, streak, weekly meter, contextual note, noise control, top-5 tasks, and 30-day heatmap are all visible without interaction
- [ ] Break duration is visible **before** the break starts, not just during it
- [ ] Current Pomodoro position in sequence is visible at all times (R1 + R2)
- [ ] All colors map to existing DESIGN.md tokens (no new hex codes)
- [ ] All fonts are Fraunces (display) or Pretendard (body), no DSEG7 / no other font additions
- [ ] `prefers-reduced-motion: reduce` disables the cross-dissolve in R8 and the band transition in R14
- [ ] Contextual note in R8 changes only on real state changes, never on a timer (no "blinking")
- [ ] Per-task session counts (R11) reset at local midnight and persist across reload
