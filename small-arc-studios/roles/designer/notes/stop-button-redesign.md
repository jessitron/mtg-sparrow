# Stop Button Redesign — Discoverability Analysis

**Date:** 2026-02-26
**Trigger:** Real user could not find the stop button during a session; sat through all 50 cards rather than ending early.
**Status:** Design exploration — four concrete proposals

---

## Current State (The Problem)

The current in-session UI renders:
- A large card (the focus of attention)
- Below the card: a `.progress-row` containing three equally-weighted items in a flex row: `Card X / Y` counter, `Pause` button, `Stop` button

**Why it fails:**

1. **"Stop" is the wrong word.** "Stop" implies an error state, or giving up. Users who have practiced enough and feel satisfied don't think "I want to stop." They think "I'm done" or "I want to see how I did." The word doesn't match the user's mental model.

2. **Visually invisible.** `.control-button` is styled at `font-size: 0.75rem`, `color: #777`, transparent background, thin `1px solid #555` border. On a dark background, this is nearly invisible. Intentionally so — the card is the focus. But the cost is that users in "passive" mode (watching cards appear) never register that the button exists.

3. **All three controls are identical.** Counter, Pause, and Stop look the same weight. Nothing signals "this one takes you somewhere different." The counter and the stop action are visually equivalent, which makes the stop action look like metadata rather than a control.

4. **Located below the card — below the fold on mobile.** During a session, the card is the full visual experience. The progress row is below it. On phones, users may never scroll down or even know there's anything below the card.

5. **No affordance that a result is waiting.** The user doesn't know that ending the session leads to a summary screen. "Stop" suggests cancellation, not reward. There's no hint that clicking it produces something interesting.

---

## Design Principles to Honor

From `interaction-concepts.md`:
- The app should feel like a shuffling deck of cards, not a test.
- Zero required actions — tapping is an accelerator, not a gate.
- The UI should showcase the content, not compete with it.
- Trust the learner. Don't patronize.

Any redesign must not disrupt the card rhythm. The "end early" action must be discoverable without being distracting — visible at a glance, but not demanding attention mid-session.

---

## Proposal 1: "I'm Done" — Rename + Elevate

**The core insight:** Users don't want to "stop." They want to declare satisfaction. This is a completion gesture, not a cancellation.

**What it looks like:**
- Keep the button in the progress row
- Rename it from "Stop" to "I'm done"
- Style it meaningfully different from "Pause": slightly larger text (`0.875rem`), slightly brighter color (`#aaa` instead of `#777`), and a warmer border tint — something that reads as "positive action" not "cancel"
- Keep it right-aligned in the progress row so it's spatially distinct from the counter on the left

**Specific label options, ranked:**
1. "I'm done" — conversational, positive, matches internal state
2. "Done for now" — softer, less final
3. "See results" — forward-looking, reveals that something waits on the other side
4. "Scoop" — MTG lingo for leaving a match (picking up your cards); charming for MTG players, confusing for newcomers. Probably too obscure for a first-time user.
5. "Concede" — Same caveat. "Concede" in MTG means you formally acknowledge you've lost; wrong connotation here.

**Why it's more discoverable:**
- "I'm done" matches the thought a user actually has. Recognition is faster than parsing "Stop."
- Slightly increased weight/brightness means users see it as a choice, not metadata.
- Lowest implementation risk — no layout changes.

**Concern:** Still relies on the user knowing to look below the card. Does not solve the visibility problem for passive users.

---

## Proposal 2: Persistent Footer Bar with "Done?" CTA

**The core insight:** The progress row shouldn't just be informational — it should be a persistent affordance. Give it enough visual weight that users know it's there.

**What it looks like:**
- The progress row becomes a proper **footer bar**, visually separated from the card
- Fixed position at the bottom of the screen (not scroll-dependent)
- Slightly increased height — enough to feel like a real nav bar, not fine print
- Left: card counter (unchanged)
- Right: a more prominent "Done?" button — styled with a real background color, like a ghost button with a visible fill on hover

**Visual treatment for the button:**
- Background: `rgba(102, 102, 170, 0.2)` (the app's accent purple, very subtle)
- Border: `1px solid rgba(102, 102, 170, 0.6)`
- Text: `#c0c0e0`
- Font size: `0.875rem`
- On hover: background brightens, border sharpens
- Label: "Done?" — the question mark is intentional. It's an invitation, not a command. It asks the user if they're satisfied, rather than telling them to stop.

**Why it's more discoverable:**
- Fixed footer means it's visible even on mobile without scrolling.
- The distinct background color (subtle accent) makes it visually distinct from the counter. Users register two different kinds of things — information and action.
- "Done?" is softer than "Stop" — it feels like permission, not interruption.

**Concern:** A styled footer bar adds more visual weight to an interface designed to be minimal. Need to ensure the card still feels dominant.

---

## Proposal 3: "Done for now" — Appearing After N Cards

**The core insight:** The button's discovery problem partly comes from when it appears. On card 1, most users aren't looking for an exit. By card 10 or 15, some users want out. An exit that appears after enough cards have passed reduces noise and increases signal.

**What it looks like:**
- First 5 cards: no "Done" button visible. Just the card and the counter.
- After 5 cards: the "Done for now" button fades in at the bottom of the screen
- Fades in with a gentle `opacity` transition (`500ms ease`) so it doesn't feel like a jump
- Styled as a ghost button with the accent purple border, clearly visible but not demanding

**Interaction:**
- Once visible, it stays visible for the rest of the session
- Positioned at center-bottom, below the card, with enough padding to be thumb-reachable on mobile

**Copy:** "Done for now" — implies "I've had enough for this session" which is exactly right. It acknowledges the user has practiced, and frames ending as a natural pause rather than a failure.

**Variant:** Instead of fading in silently, a subtle first appearance could include a one-time hint text above the button: "Tap here when you've practiced enough." This surfaces on card 6 (or whenever the button first appears) and disappears after 3 seconds. The hint text never shows again. This makes the button self-explaining the first time.

**Why it's more discoverable:**
- Users are most likely to want an early exit after they've seen several cards — the button appears at exactly that moment
- The fade-in is noticeable enough to register without being disruptive
- Timing the appearance to user activity reduces the "why is this always here?" noise in early cards

**Concern:** Users who arrive already knowing the material (returning users) may want to exit at card 3. The 5-card delay could frustrate them. Consider making the threshold configurable or lower (e.g., 3 cards, matching `SELF_ASSESSMENT_MIN_CARDS`).

---

## Proposal 4: Overlay Hint on Long Pause

**The core insight:** Users who are confused about how to exit tend to stop tapping and stare at the screen. A context-sensitive hint that appears during an inactivity period could surface the exit without permanently adding UI.

**What it looks like:**
- After ~8 seconds of no taps (the user hasn't tapped at all during 2-3 card cycles), a subtle overlay hint appears at the bottom of the screen
- The hint is a semi-transparent pill: `"Tap anywhere to advance · Tap 'Done' to end"`
- After 5 seconds the hint fades away
- The "Done" in the hint is a tappable link/button in the same pill, styled with the accent color
- This hint only appears once per session (doesn't repeat if the user resumes tapping)

**Why it's more discoverable:**
- This is exactly the situation the confused user was in — not tapping, not knowing what to do
- The hint surfaces *contextually*, only when the user seems stuck
- It introduces the "Done" label in context, alongside the tap-to-advance instruction, so the user understands both affordances together
- After dismissal it disappears, keeping the interface clean for the rest of the session

**Concern:** Detecting "confusion" vs. "deliberately passive watching" is hard. A user who enjoys watching the auto-reveal without tapping would see this hint and might find it annoying. The 8-second threshold should be generous — maybe 10-12 seconds. The hint should feel like help, not nagging.

---

## Recommendation

These proposals are not mutually exclusive. The strongest combination:

**Short term (low effort):** Apply Proposal 1 immediately. Rename "Stop" to "I'm done" and give it a small visual bump (brightness, size). This requires a one-line code change and a CSS tweak. It directly addresses the labeling failure.

**Medium term (medium effort):** Apply Proposal 2's persistent footer approach — fix the progress row to the bottom of the screen and give the "Done?" or "I'm done" button a subtly distinct visual treatment using the accent color. This solves the visibility-on-mobile problem.

**Together:** Rename + visible footer is the minimum viable fix. These two changes address both failure modes: wrong label AND hidden position.

**Do not implement Proposal 4 (inactivity hint)** in the first iteration. It's clever but adds interaction complexity and risks feeling patronizing. Revisit if user testing after Proposals 1+2 still shows confusion.

**On MTG lingo ("Concede", "Scoop"):** These are fun for experienced MTG players but will confuse newcomers. This app is explicitly trying to *teach* MTG color combos — many users may not know these terms yet. Save them for a future "experienced player mode" or Easter egg, not the primary label.

---

## Open Questions for the Project Lead

1. Should the "end session" action have a confirmation step? ("Done for now?" → Yes / Keep going) Or is single-tap fine? Given the app's philosophy (low friction, trust the learner), a single tap is probably correct — but the session-end screen immediately follows, so there's no accidental data loss.

2. Is the "Done?" question-mark framing (Proposal 2) too cute? Or does it match the app's personality? The welcome screen copy ("I swear, this will work") has some warmth — "Done?" might fit.

3. What does the Pause button do in practice? If users are pausing frequently (observable in Honeycomb), it might be worth merging the two controls into a single "Pause / Done" toggle pattern. If Pause is rarely used, consider removing it to reduce the button cluster.
