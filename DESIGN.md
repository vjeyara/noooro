# Noooro — Design System

## Vibe

Cream-soaked, Studio-Ghibli-warm, Korean-lifestyle-app calm. The screen feels like soft afternoon light through linen — a paper page, not a glowing screen. Pastel accents are whispered, not shouted. Every surface is rounded, every shadow gentle, every motion unhurried, every action confirmed with a small sensory cue. The app should feel like a friend, not a tool.

Reference apps: **Toss**, **Daangn (Karrot)**, **Naver Lifestyle**. Reference style: **Studio Ghibli** color sensibility (washed earth tones, never primary).

Hard ADHD-friendly rules: low saturation throughout. No harsh contrasts. No busy patterns. No aggressive accent reds or oranges. No visual noise. Whitespace is a feature.

## Color

All colors are warm-shifted (no pure greys, no pure whites, no cool blues). Text is warm-black, not pure black.

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--cream-bg` | `#F8F1E4` | Page background. The paper itself. |
| `--cream-card` | `#FEFAF1` | Card surface. One shade lighter than bg. |
| `--cream-well` | `#F0E6D2` | Inset surfaces (drawer, heatmap empty cells, slider tracks). |
| `--cream-border` | `#EADFC9` | Soft dividers and borders. |

### Accents (low saturation, ~70% lightness)

| Token | Hex | Soft variant | Use |
|---|---|---|---|
| `--sage` | `#A8B89E` | `--sage-soft #C9D4C2` | Primary running state (timer active, focus on) |
| `--peach` | `#F2C5A0` | `--peach-soft #F8DDC8` | Warm action accent, hover surfaces |
| `--butter` | `#EED9A6` | `--butter-soft #F5E8C8` | Paused state, gentle highlights |
| `--lavender` | `#C7B8D4` | `--lavender-soft #DCD0E4` | Break state, secondary contrast |
| `--terracotta` | `#D4937B` | `--terracotta-soft #E5B6A3` | Primary CTA, completion |

### Text

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#3D332B` | Primary text (warm-black, never pure black) |
| `--ink-soft` | `#6B5D52` | Secondary text, labels |
| `--ink-mute` | `#9C8E82` | Muted text, timestamps, placeholders |

### State colors

| State | Color |
|---|---|
| Running (timer active) | `--sage` |
| Paused | `--butter` |
| Break | `--lavender` |
| Complete | `--terracotta` |
| Idle | `--cream-card` (no special color) |

### Heatmap intensity (5 steps)

| Step | Hex | Meaning |
|---|---|---|
| `--heat-0` | `#F0E6D2` | Empty (no Pomodoros that day) |
| `--heat-1` | `#E8D9C0` | 1 Pomodoro |
| `--heat-2` | `#DDC7A6` | 2 |
| `--heat-3` | `#D0B387` | 3 |
| `--heat-4` | `#C19E6B` | 4+ |

### Contrast

`--ink` on `--cream-bg`: 9.8:1 (AAA). `--ink-soft` on `--cream-bg`: 5.2:1 (AA). `--ink-mute` on `--cream-bg`: 3.0:1 — use only for non-essential text (placeholders, timestamps), never for primary content.

## Typography

### Faces

| Role | Font | Source | Why |
|---|---|---|---|
| **Numbers (timer + stat values)** | **DSEG7 Classic** | self-hosted `assets/DSEG7Classic-Regular.woff2` | 7-segment LCD aesthetic. User direction: "Casio digital watch face." Used for ALL numeric displays (timer digits, today-card stats, streak count). |
| Display (Fraunces) | **Fraunces** | Google Fonts (variable) | Warm serif. Used for the `noooro` logo and select display headers only. NOT used for numbers. |
| Body / UI | **Pretendard** | jsdelivr CDN (variable) | Korean+Latin, the de-facto modern Korean app font (Toss, Naver). Warm without being playful. |
| Fallback (numbers) | `'Courier New', monospace` | — | If DSEG7 woff2 fails to load. |
| Fallback (text) | system-ui, sans-serif | — | If CDN fails. |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..700,30..100&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
```

DSEG7 is self-hosted (CDN was 404). Loaded via `@font-face` in `styles.css`:

```css
@font-face {
  font-family: 'DSEG7 Classic';
  src: url('assets/DSEG7Classic-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### Scale (16px base)

| Token | Size | Use |
|---|---|---|
| `xs` | 12px | Captions, timestamps, heatmap tooltips |
| `sm` | 14px | Secondary labels, chip text, streak text |
| `base` | 16px | Body |
| `lg` | 18px | Task titles |
| `xl` | 22px | Section headers |
| `2xl` | 32px | Card display numbers (today card) |
| `3xl` | 48px | Minor display |
| `timer` | clamp(56px, 6vw, 72px) | Hero timer digits (DSEG7) — fits 5-char DSEG7 width inside a 300px ring's 294px inner usable area with ~14px each-side margin |
| `stat` | 48px | Today-card stat numbers (DSEG7) |

### Usage

- **Numbers (everywhere):** DSEG7 Classic. Always tabular by nature of the font. Use for timer digits, today-card stats, streak count, sequence counters, weekly counts, heatmap tooltips.
- **Body / UI:** Pretendard 400 default, 500 emphasis, 600 strong. 700 sparingly. Used for task titles, button labels, chips, notes, captions.
- **Display headers (logo + section labels):** Fraunces 400, optical-size auto, SOFT axis at 60-80. NOT used for numbers.
- **Line height:** 1.5 body, 1.3 headers, 1.0 timer/stat numbers.
- **Letter-spacing:** -0.01em on Fraunces display sizes for tighter feel; default on body; 0 on DSEG7 (the font's native spacing is correct).
- **DSEG7 ghost effect:** for the timer digits, render an `inset:0; opacity:0.07` overlay showing `88:88` to give the unlit-segments backdrop. Don't apply to today-card stats (they're not framed in a "screen").

## Spacing & Radius

### Spacing (4px base)

| Token | Value |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `base` | 16 |
| `lg` | 24 |
| `xl` | 32 |
| `2xl` | 48 |
| `3xl` | 64 |
| `4xl` | 96 |

Generous use is encouraged. Hero sections breathe with 64–96px vertical padding.

### Border radius

| Token | Value | Use |
|---|---|---|
| `xs` | 6px | Heatmap cells, small chips |
| `sm` | 10px | Buttons, inputs |
| `md` | 14px | Small cards, drawer rows |
| `lg` | 20px | Main cards (task list, today card) |
| `xl` | 28px | Drawer, large surfaces |
| `pill` | 999px | Chips, toggle pills, slider thumbs |
| `circle` | 50% | Knobs, avatar circles |

Default to `lg` for primary cards. Nothing should feel sharp.

## Elevation

Cream-tinted shadows. Never blue/black.

| Token | Value |
|---|---|
| `--shadow-soft` | `0 1px 2px rgba(61, 51, 43, 0.04), 0 2px 8px rgba(61, 51, 43, 0.04)` |
| `--shadow-lift` | `0 2px 4px rgba(61, 51, 43, 0.05), 0 8px 24px rgba(61, 51, 43, 0.06)` |
| `--shadow-press` | `inset 0 2px 4px rgba(61, 51, 43, 0.06)` |

`soft` for resting cards. `lift` for the running timer card and active drawer. `press` for inputs, slider tracks, knob wells.

## Sound (Sensory)

**Philosophy.** Every meaningful action gets a tiny, warm-toned sensory confirmation — like Toss/Daangn. ADHD users benefit enormously from immediate tactile feedback: each cue is a micro-reward that reduces "did that work?" anxiety. Sounds are quiet, brief, low-pitched, never abrasive. All synthesized in Web Audio API — no audio files, no extra dependencies, ~150 lines total.

**Volume.** Default master sensory volume: -16 dBFS. User-adjustable in settings (separate from focus-noise volume). Auto-off when `prefers-reduced-motion: reduce`. Auto-off if user explicitly toggles in settings.

**Sound inventory:**

| Cue | Trigger | Synthesis |
|---|---|---|
| `tap-soft` | Button press | Sine 800 Hz, 30 ms decay, -16 dBFS |
| `tap-warm` | Chip / segment select | Sine 600 Hz, 50 ms decay, -14 dBFS |
| `knob-click` | Knob increment (per minute step) | Square 1200 Hz pulse 8 ms, -18 dBFS |
| `slider-tick` | Volume slider drag (every 10%) | Sine 900 Hz pulse 5 ms, -22 dBFS |
| `pop-add` | Task added | Rising sine 400→700 Hz over 60 ms, -14 dBFS |
| `pop-remove` | Task deleted | Falling sine 700→300 Hz over 80 ms, -16 dBFS |
| `start-whoosh` | Pomodoro starts | Filtered white-noise sweep, 200 ms, -18 dBFS |
| `pause-down` | Pause | Falling sine 600→400 Hz, 120 ms, -16 dBFS |
| `resume-up` | Resume | Rising sine 400→600 Hz, 120 ms, -16 dBFS |
| `complete-bell` | Pomodoro completes | Warm bell: 528 Hz + 1056 Hz harmonic, 800 ms exponential decay, -10 dBFS |
| `break-chime` | Break starts | Soft chime 660 Hz, 600 ms decay, -14 dBFS |
| `error-thud` | Invalid action | Low square 100 Hz, 50 ms decay, -20 dBFS |

**Implementation pattern:**

```js
function playCue(name) {
  if (!settings.sensoryEnabled) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = audioContext();
  // build oscillator + gain envelope per name
}
```

All cues share one `AudioContext` (the same one that drives the noise generator). Each cue is an oscillator + GainNode with a fast attack (1–5 ms) and a per-cue decay envelope. No reverb, no delay — keep it dry and immediate.

## Motion

- **Default duration:** 200 ms
- **Easing:** `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out, calm)
- **Hover:** color, border, opacity transitions only. **Never `scale` on hover** — it shifts layout and feels jittery.
- **Press:** subtle inset shadow + 1px translateY (max).
- **Timer ring fill:** smooth `stroke-dashoffset` animation, never jumpy.
- **Reduced motion:** instant transitions, static heatmap, waveform freezes (still updates color, no animation), sensory sounds disabled.

## Components

### Timer (hero)

- Centered, vertical composition with 64–96 px vertical breathing room above and below.
- **Ring:** SVG circle, stroke-width 3 px, background stroke `--cream-border`, active stroke `--sage` (running) / `--butter` (paused) / `--lavender` (break) / `--terracotta` (complete pulse).
- **Digits:** Fraunces, `timer` size, tabular-nums, `--ink`. Format: `MM:SS` (no hours).
- **Below ring:** current task title (Pretendard `lg`, `--ink-soft`).
- **Below title:** primary action button — pill, `--terracotta` filled when paused (label "Resume"), `--sage-soft` border-only when running (label "Pause"), `--cream-card` outline when idle (label "Start").
- **Skeleton on load:** ring drawn at empty, digits show "25:00", action says "Start".

### Task list

- Vertical list of cards, max ~50 items.
- **Card:** `--cream-card` bg, radius `lg`, `--shadow-soft`, padding `base`.
- **Layout:** title (Pretendard `lg`, `--ink`) on left; noise chip + play button on right.
- **Noise chip:** pill, `sm` text. State color = corresponding accent. Off = border-only `--cream-border`. Brown = `--terracotta-soft` filled. Pink = `--peach-soft` filled. White = `--cream-well` filled with `--ink-soft` text.
- **Selected task** (currently running): `--sage-soft` background tint over the card.
- **Add button:** dashed `--cream-border`, `--ink-mute` `+ Add task`, fills to `--peach-soft` on hover. Last item in list.
- **Hover:** `--shadow-lift`. `cursor: pointer` on the entire card.
- **Tap card** → `tap-warm` cue. **Tap chip** → `tap-soft` cue. **Add** → `pop-add`. **Delete** → `pop-remove`.

### Noise control panel

- Compact horizontal strip below the timer.
- **Type chips:** four pills — `Off · Brown · Pink · White`. Selected = filled accent (off = `--cream-card` outline; brown/pink/white = corresponding `-soft` accent). Others = border-only `--cream-border`.
- **Volume slider:** track in `--cream-well` with `--shadow-press`, thumb is a `--terracotta` circle (24 px, `--shadow-soft`).
- **Live waveform canvas:** 40 px tall, full-width, drawn over `--cream-card` bg, stroke = current accent (matches selected noise type), `--ink-mute` 1 px reference line at midpoint. Smooths via `AnalyserNode`.
- **Drag thumb** → `slider-tick` cue every 10%. **Tap chip** → `tap-warm`.

### Today card

- Single card, `--cream-card`, radius `lg`, `--shadow-soft`, padding `lg`.
- **Layout:** two stats side-by-side.
  - Left: big number (Fraunces `2xl`, `--ink`) + label "Pomodoros" (Pretendard `sm`, `--ink-soft`).
  - Right: big number + label "Minutes focused".
- **Below stats:** streak pill — small sage sprout SVG icon + "4 day streak" (Pretendard `sm`, `--ink-soft`). When streak ≥ 7, sprout becomes a small leaf cluster.

### 30-day heatmap

- Grid of 30 cells, layout 5 wide × 6 rows (or 6 × 5), 1 px gap.
- Each cell: 16 px square, radius `xs`, color from `--heat-0` … `--heat-4`.
- Hover: tooltip in `--ink` on `--cream-card`, soft shadow, "May 4 · 3 Pomodoros".
- Above grid: caption "Last 30 days" in Pretendard `sm`, `--ink-soft`.
- Empty days remain `--heat-0` — never gaps. The visible row is the streak.

### Streak counter

- Inline pill embedded in today card (see above), or top-right of header on desktop.
- Format: `[sage sprout SVG] 4 day streak`.

### Settings drawer

- Slide-in from right, full-height, width 360 px (320 px on mobile).
- `--cream-card` bg, left edge radius `xl`, `--shadow-lift`.
- **Header:** "Settings" Fraunces `xl`, close icon (X) in `--ink-soft`.
- **Sections** (separated by `--cream-border` 1 px dividers):
  - **Pomodoro:** Work duration (rotary knob, 5–60 min), Break duration (rotary knob, 1–30 min). Knobs: 56 px circle, `--cream-well` track ring, `--terracotta` indicator dot, label below shows current value (Fraunces `2xl`).
  - **Sound:** Master volume (slider), Sensory cues (toggle), Focus noise default on launch (toggle).
  - **Data:** "Export JSON" button (`--terracotta-soft` border, `--terracotta` text, `pill` radius, full-width). "Import JSON" button (same treatment, file picker). Below: tiny hint text "Backup or move to another device" (Pretendard `xs`, `--ink-mute`).
- **Knob interaction:** drag up/down to change value (1 unit per ~6 px), each step plays `knob-click`.

### Buttons (general)

- **Primary:** `--terracotta` filled, `--cream-bg` text, `pill` radius, padding `12px 20px`. Hover: shift 4% darker (`brightness(0.96)`). Press: `--shadow-press`. Cue: `tap-soft`.
- **Secondary:** `--cream-card` filled, `--cream-border` 1 px, `--ink` text. Hover: `--peach-soft` background. Cue: `tap-soft`.
- **Ghost:** transparent, `--ink-soft` text. Hover: `--cream-card` background. Cue: `tap-soft`.
- **Disabled:** `--cream-well` filled, `--ink-mute` text, no cue, no pointer.
- **All buttons:** focus ring is `2px solid --terracotta` with 2 px offset.

### Inputs

- `--cream-card` background with `--shadow-press`, `--cream-border` 1 px border, radius `sm`, padding `12px 14px`, Pretendard `base`.
- Focus: border becomes `--terracotta`, shadow stays inset.
- Number inputs (durations) hide native arrows; rely on knobs/steppers.

## ADHD anti-patterns (do not violate)

- No nested menus — every primary action visible on the main screen.
- No `scale` transforms on hover (layout shift = jitter).
- No notification spam beyond `complete-bell` + `break-chime`.
- No achievement badges, levels, points, confetti.
- No required input on first run — open file, app works.
- No high-saturation reds, oranges, or fluorescent greens — accents stay muted.
- No mixing of icon sets (use Lucide SVG inline, consistent 24 × 24).
- No emoji as icons.

## Pre-delivery checklist

- [ ] No emojis as icons (use inline Lucide SVG, 24 × 24)
- [ ] All clickable elements have `cursor: pointer`
- [ ] Hover states use color/shadow only (no scale)
- [ ] Focus rings visible on every interactive element (`--terracotta`, 2 px)
- [ ] All text contrast ≥ 4.5:1 against its surface
- [ ] `prefers-reduced-motion` respected (animations off, sensory sounds off)
- [ ] Sensory sounds toggleable in settings
- [ ] Tabular-nums on timer digits (no width jitter)
- [ ] Page renders correctly at 375 px, 768 px, 1024 px, 1440 px
- [ ] No horizontal scroll on mobile
- [ ] CDN fonts have system fallbacks
