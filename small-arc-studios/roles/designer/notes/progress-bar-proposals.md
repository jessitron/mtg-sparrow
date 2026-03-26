# Progress Bar Proposals — Slides Page Footer

**Date:** 2026-03-25
**Trigger:** Client request to replace the `7 / 25` text counter (`.progress-counter`) with a progress bar.
**Context:** The counter sits in `.footer-controls` — a right-aligned flex row alongside the pause button and Exit button.
**Status:** Proposals presented. Awaiting client direction.

---

## Design Constraints

- Must live in `.footer-controls` alongside the pause button (48px circle) and Exit button
- `.footer-controls` is `display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem`
- Everything is right-aligned — nothing pushes left
- Must work on mobile (narrow screens, touch targets, small vertical footprint)
- The dark MTG aesthetic: `--bg-brown-dark` (#272817), turquoise accent (`--card-back-turquoise` #6C9FB0), gold (#c8b88a)
- Should animate on card transitions (the crossfade is 250ms)
- Screen readers need a fallback — a visually-hidden `<span>` with "Card 7 of 25" is assumed for all options

---

## Option A: Slim Thread (Subtle / Minimal)

### Appearance

A thin horizontal bar, 3px tall, full-width across the entire footer row, sitting flush against the bottom edge of the `.done-zone` container — **not** inside the flex row alongside the buttons. It spans edge-to-edge like a page load indicator.

The filled portion uses the turquoise accent at reduced opacity (~60%). The unfilled track is nearly invisible — `rgba(255,255,255,0.06)`. No rounded corners on the fill end (flat/blunt — feels more like a measurement instrument than a pill). The outer track has very slight rounding (2px).

On card advance, the fill width transitions with `transition: width 300ms ease-out` — a smooth continuous sweep.

No numbers. No labels. No segment markers.

**Size:** 3px tall × 100% wide (full footer width)
**Position:** Bottom edge of `.done-zone` — below the controls row, spanning full width
**Color:** Fill: `rgba(108, 159, 176, 0.6)` (turquoise at 60%); Track: `rgba(255,255,255,0.06)`

### Why It Fits

This is the most disciplined interpretation of the design principle "the card is the star." A 3px thread at the bottom edge is peripheral vision territory — present enough to orient the user ("I'm about halfway through"), invisible enough that it never draws the eye. It echoes how loading bars appear on the web: ambient status, not focal content.

The turquoise echo is a quiet nod to the accent without demanding attention. It feels like a page-edge mark on a physical card sleeve.

### Accessibility

- No information is conveyed by color alone: position of fill encodes progress geometrically
- Add `role="progressbar" aria-valuenow="7" aria-valuemin="1" aria-valuemax="25" aria-label="Card 7 of 25"` on the element
- The bar element should have a minimum WCAG touch clearance — since it's decorative/non-interactive, no touch target needed
- Users with reduced motion: skip `transition`, update width instantly

### Approximate CSS

```css
/* Sits below .done-zone as a pseudo-element — no DOM addition needed */
.done-zone {
  position: relative;
}

.done-zone::after {
  content: '';
  display: block;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(108, 159, 176, 0.6);
  border-radius: 2px;
  transition: width 300ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .progress-bar { transition: none; }
}
```

JS sets `style.width` as a percentage: `progressBar.style.width = (currentIndex / total * 100) + '%'`

**DOM addition:** One `<div class="progress-bar" role="progressbar" ...>` inside `.done-zone`. The `::after` pseudo provides the track.

---

## Option B: Segmented Pip Track (Balanced / Readable)

### Appearance

A horizontal row of small circular dots — one dot per card in the sequence. Each dot starts as an empty circle (ring only, `2px border`) and fills solid on completion. The active card's dot pulses very gently (a single slow pulse, not a repeating animation) to signal "this is where you are."

Dots are small: 6px diameter with 4px gap between them. On a 25-card sequence, the row is roughly 25×6 + 24×4 = 246px — comfortable on most screens. On narrow mobile (320px wide viewport), at 25 cards this would be ~246px which still fits within available width alongside the buttons (which together are ~48 + 0.75rem + ~80px Exit ≈ 145px). The pip track would use `flex: 1` to absorb available space and center itself.

Completed dots: `background: rgba(108, 159, 176, 0.7)` (filled turquoise)
Active dot: `background: rgba(108, 159, 176, 0.9)` with a brief `scale(1.4)` keyframe on advance
Empty dots: `border: 2px solid rgba(255,255,255,0.2)`, no fill

On card advance, the previously active dot transitions from "active" to "completed" (scale returns to 1, opacity drops slightly). The new active dot pulses once. The visual metaphor is a card game scoreboard — a very natural fit for MTG.

### Why It Fits

Segmented pips are an MTG-native idiom — life counters, loyalty counters, +1/+1 counters. A row of pips reads immediately to any Magic player as "a countable quantity." Unlike a smooth bar, the discrete segments also communicate the exact total (you can count the dots) without requiring a number label.

The dots are also more honest about where you are than a smooth fill: if you're on card 7 of 25, the 7th dot is unmistakably highlighted. A smooth bar at 28% requires interpretation; seven filled dots are immediate.

The gold/warm palette from `#c8b88a` could also be applied here (filled dots in gold rather than turquoise) — this would evoke a warmer, more parchment-and-gold MTG feel. Either works; turquoise maintains visual consistency with the pause button's active state.

### Accessibility

- The element gets `role="progressbar" aria-valuenow="7" aria-valuemin="1" aria-valuemax="25" aria-label="Card 7 of 25"`
- Individual dot elements have `aria-hidden="true"` — the progressbar role on the container is sufficient
- Color is not the only differentiator: filled vs. empty (solid vs. ring) communicates state by shape as well
- Reduced motion: remove the scale pulse; dots switch states instantly

### Approximate CSS

```css
.progress-pips {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1; /* absorbs available space in the flex row */
  justify-content: flex-end; /* right-aligns the pip cluster */
  overflow: hidden; /* clips if screen is very narrow */
}

.progress-pip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  flex-shrink: 0;
  transition: background 200ms ease, border-color 200ms ease, transform 200ms ease;
}

.progress-pip--completed {
  background: rgba(108, 159, 176, 0.7);
  border-color: transparent;
}

.progress-pip--active {
  background: rgba(108, 159, 176, 0.9);
  border-color: transparent;
  animation: pipActivate 300ms ease-out;
}

@keyframes pipActivate {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.5); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .progress-pip--active { animation: none; }
  .progress-pip { transition: none; }
}

/* Mobile: if viewport is very narrow and dots overflow, hide overflow gracefully */
@media (max-width: 360px) {
  .progress-pips {
    max-width: 120px; /* shows roughly first 15 dots */
  }
}
```

JS renders one `.progress-pip` element per card. On advance, classes cycle between `--completed`, `--active`, and default.

**Limitation:** At very high card counts (30+), this becomes dense. If sequences grow, dots would need to shrink to 4px. Above ~40 cards, Option A or C becomes more viable.

---

## Option C: Arc Sweep with Numeric Ghost (Expressive / Distinctive)

### Appearance

A compact circular arc progress indicator — like a watch face or a spell charge meter. The arc sits inline in the footer controls row, replacing the text counter in approximately the same spatial slot.

**Size:** 36px × 36px (slightly smaller than the 48px pause button so it reads as secondary)
**Shape:** Circular track, 270° arc (three-quarters of a full circle), opening at the bottom-left. The remaining 90° gap sits at bottom-left, giving it an asymmetric energy — not a loading spinner, not a pie chart.
**Track:** `rgba(255,255,255,0.08)` — nearly invisible
**Fill:** SVG `stroke-dasharray` / `stroke-dashoffset` technique on a `<circle>` element. Fill color: `rgba(108, 159, 176, 0.85)` (turquoise, stronger than Options A or B because the shape is smaller and needs more visual weight to register)
**Number inside:** The current card number rendered in a tiny text inside the arc center — `font-size: 0.65rem`, `color: #888`, using the Jost font. This is the "ghost" — barely visible, present for users who want the specific number.
**Line weight:** SVG stroke-width of 3px

On card advance, the arc fill sweeps forward: `stroke-dashoffset` transitions with `300ms ease-out`. This is the watch-hand sweep motion — very satisfying and unlike any other element on the page.

**When paused:** The arc fill color shifts to `rgba(200, 184, 138, 0.85)` (gold) — a warm state change that visually signals "session paused" without a separate label. The number ghost also shifts to gold.

### Why It Fits

The arc sweep is the most expressive of the three options, but it earns that expressiveness. It visually references MTG card aesthetics — loyalty counters, energy counters, and the circular iconography throughout Magic's visual language. A three-quarter arc (rather than a full circle) avoids looking like a loading spinner. The asymmetric gap gives it the off-balance tension that Magic's visual design often employs.

Critically, it takes up the least horizontal space (~36px) while conveying the most information (exact position via arc fill + ghost number). This makes it the best choice if the footer is tight, especially on mobile where fitting pips at 25+ cards gets challenging.

The gold-shift-on-pause is a small moment of design coherence: the same gold used on the level intro rule (`#c8b88a`, `--allied-line-color`) appears here as a pause signal. The palette remains self-consistent.

### Accessibility

- SVG `<circle>` with `role="progressbar"` on the parent container
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="Card 7 of 25"` on the container
- The ghost number provides a non-graphical redundant cue visible to sighted users without magnification
- Color shift on pause is supplemented by the pause button icon state (bars → triangle) — pause state is not communicated by arc color alone
- Reduced motion: `stroke-dashoffset` transitions to `none`; number updates immediately

### Approximate CSS & SVG Structure

```html
<div class="progress-arc" role="progressbar"
     aria-valuenow="7" aria-valuemin="1" aria-valuemax="25"
     aria-label="Card 7 of 25">
  <svg viewBox="0 0 36 36" width="36" height="36">
    <!-- Track -->
    <circle class="arc-track" cx="18" cy="18" r="14"
            fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="66 22"
            transform="rotate(135 18 18)" />
    <!-- Fill -->
    <circle class="arc-fill" cx="18" cy="18" r="14"
            fill="none" stroke="#6C9FB0" stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="0 88"
            transform="rotate(135 18 18)" />
  </svg>
  <!-- Ghost number -->
  <span class="arc-number" aria-hidden="true">7</span>
</div>
```

```css
.progress-arc {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.progress-arc svg {
  display: block;
}

/*
  Arc math: radius=14, circumference=2π×14≈87.96
  270° arc = 87.96 × 0.75 ≈ 65.97 ≈ 66 (track dasharray: 66 22)
  Fill: stroke-dasharray = (progress * 66) + " " + (88 - progress * 66)
*/

.arc-fill {
  stroke: rgba(108, 159, 176, 0.85);
  transition: stroke-dasharray 300ms ease-out, stroke 250ms ease;
}

.arc-fill--paused {
  stroke: rgba(200, 184, 138, 0.85);
}

.arc-number {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-family: 'Jost', system-ui, sans-serif;
  color: #888;
  line-height: 1;
  pointer-events: none;
  transition: color 250ms ease;
}

.arc-number--paused {
  color: rgba(200, 184, 138, 0.85);
}

@media (prefers-reduced-motion: reduce) {
  .arc-fill { transition: stroke 250ms ease; } /* keep color transition, kill dasharray */
}
```

JS computes `filledLength = (currentIndex / total) * 66` and sets
`arcFill.style.strokeDasharray = filledLength + ' ' + (88 - filledLength)`

---

## Comparison

| | Option A: Thread | Option B: Pips | Option C: Arc Sweep |
|---|---|---|---|
| Horizontal space in footer | Zero (full-width, below row) | Medium (~150–250px) | Small (~36px) |
| Information density | Low (position only) | High (exact + total by counting) | Medium (position + ghost number) |
| MTG feel | Minimal / modern | Native / counter-like | Distinctive / magical |
| Mobile viability | Excellent | Good (up to ~30 cards) | Excellent |
| Motion richness | Subtle (sweep) | Moderate (pip pulse) | Rich (arc sweep + color shift) |
| Expressive range | None | Low (binary: filled/not) | High (pause color, ghost number) |

---

## Designer Recommendation

**Option C (Arc Sweep)** if the client wants the footer to feel distinctive and the arc's smaller footprint is valued.

**Option A (Thread)** if minimal is the priority and the client feels the footer is already doing enough work — a 3px thread requires zero layout adjustment and has the lowest cognitive weight.

**Option B (Pips)** is the most immediately readable for low-count sequences (10 guilds, 5 shards) but becomes dense at 25+ cards. It would work especially well for Level 1 (Guilds: 10 cards) and less well for large mixed-pool sessions.

**Hybrid possibility:** Use Option A for its simplicity but replace the bare full-width positioning with one that aligns left-to-right with card flow — start at the left edge of the footer, fill rightward. This gives it spatial grammar (left = beginning, right = end) that users intuitively parse.

---

## Open Questions for the Project Lead

1. Should the progress indicator show the card index within the current level sequence (7 of 25), or within some larger arc (e.g., total cards seen in the session)? The current `.progress-counter` shows sequence position — assuming that continues.

2. Option B with pips: if the card sequence can vary in length (different levels have different pool sizes), the pip count needs to be dynamic. Is there a fixed maximum? If level sequences can exceed 30 cards, pips become impractical.

3. Any preference on whether the bar/indicator also communicates pause state, or should that remain solely the province of the pause button icon?
