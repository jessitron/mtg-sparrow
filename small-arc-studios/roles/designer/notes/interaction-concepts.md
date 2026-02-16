# Interaction Concepts — Sparrow Deck for MTG Color Combos

> Designer: Small Arc Studio
> Date: 2026-02-15
> Status: Updated with auto-reveal model (client-confirmed)

---

## Design Philosophy

This app trains **perceptual recognition**, not analytical recall. Every design choice must serve rapid-fire exposure. The enemy is friction — anything that makes the user pause, think about the interface, or feel evaluated slows them down and breaks the learning mechanism.

The feel should be: **a shuffling deck of cards, not a test.**

---

## Core Interaction: The Card Cycle

### The Loop (per card)

```
[See mana pips] → [Say name aloud] → [~2.5s delay] → [Name appears] → [Auto-advance to next card]
                                  OR → [Tap to skip ahead early]
```

**Timing per card:** ~3-4 seconds typical (2.5s reveal delay + brief name display). At this pace, a 3-minute session delivers ~50-60 exposures. Users who tap early will see more cards.

**The reveal delay (~2.5s default) is a tuning parameter** — designed to be easily adjusted based on observability data. The range is 1.5s–3s.

### Card States

1. **Pips Showing (Question Phase)**
   - Shows 2-3 colored mana pip symbols, large and centered
   - A subtle "say it" prompt visible but not intrusive (see below)
   - The card background is neutral/dark so pips pop visually
   - This phase lasts ~2.5s (the reveal delay), giving the learner time to guess

2. **Name Revealed (Answer Phase)**
   - The combination name appears large and bold (e.g., "Azorius")
   - The mana pips remain visible but shift smaller/secondary
   - Brief hold (~1s) then auto-advance to next card

3. **Transition**
   - Cards don't "flip" — the name fades/slides in over the pips
   - This keeps the color association visually connected to the name
   - Transition is fast (200-300ms) — no elaborate animations

### Early Advance (Tap to Skip)

- **Tap anywhere** on the card (mobile) or **click/spacebar** (desktop) to advance early
- The entire card is the tap target — no small buttons
- Tapping during the question phase skips the delay: the name is briefly revealed (~500ms), then the next card appears
- Tapping during the answer phase skips directly to the next card
- This means confident learners move faster — **speed is self-regulating**

### Why Auto-Reveal Instead of Tap-to-Reveal?

The original design required tapping to see the answer. The client corrected this: **the answer should appear automatically after a delay.** This is a better model because:

- It removes the mandatory interaction — the learner can be purely passive if desired
- It creates a metronomic rhythm (consistent pacing) rather than user-driven pacing
- Tapping becomes an *accelerator* ("I know this, move on") rather than a gate
- It provides a natural observability signal: early taps suggest recognition, full waits suggest uncertainty
- The dwell time before tap (or absence of tap) is meaningful data without being "scoring"

---

## "Say It Out Loud" — The Hardest UX Problem

The verbal component is critical to the technique but inherently invisible to the interface. We can't enforce it, only encourage it.

### Approach: Ambient Prompting

- On the question side of each card, show a small speech bubble icon or the text **"say it"** in a muted color near the bottom
- It should be visible enough to remind, quiet enough to ignore once habitual
- **Not** a modal, popup, or interstitial — it lives on the card
- On the very first card of a user's first session, show a slightly larger onboarding hint: "Say your guess out loud before the answer appears." Then fade to the subtle version.

### Why Not a Microphone?

Tempting but wrong. Audio detection adds:
- Permission friction (browser mic access)
- Privacy concerns
- Technical complexity
- False negatives (quiet environments, accents)
- It turns the experience into "being listened to" rather than "learning by doing"

The prompt is a nudge, not a gate. Trust the learner.

---

## Session Structure

### Timing: 3-Minute Bursts

- A **countdown timer** is visible but not dominant — top corner, small
- Timer counts down from 3:00
- When time runs out, the current card completes, then the session ends
- No abrupt cutoff mid-card

### Session Flow

```
[Start Screen] → [Tier Selection] → [3-Minute Session] → [Session End] → [Start Screen or Next Session]
```

### What Happens During a Session

- Cards are drawn from the selected tier's pool
- Cards appear in shuffled order
- The same combination can appear multiple times per session (this is intentional — repetition is learning)
- No progress bar during the session (it creates evaluation anxiety)
- Just the timer and the cards

---

## Progressive Tiers

### Tier Structure

| Tier | Content | Count | Unlock |
|------|---------|-------|--------|
| **Guilds** | 10 two-color guild names | 10 | Default / always available |
| **Shards & Wedges** | 5 shards + 5 wedges | 10 | Available after first Guilds session |
| **All Core** | Guilds + Shards + Wedges mixed | 20 | Available after first Shards & Wedges session |
| **Deep Cuts** | Four-color Nephilim + WUBRG | 6 | Available after first All Core session |
| **Everything** | All combinations mixed | 26 | Available after first Deep Cuts session |

### Unlock Philosophy

- Tiers unlock after **completing one session** at the prior tier — not based on accuracy
- This prevents the "I need to get good before I move on" trap
- The user self-selects when to progress; unlocking just makes it available
- A user who already knows guilds can blast through a quick session and unlock shards immediately

### Tier Selection UI

- Simple list of tiers on the start screen
- Locked tiers show a lock icon and "Complete a [Previous Tier] session to unlock"
- Current/selected tier is highlighted
- Each tier shows a brief description: "The 10 Ravnica guild names" / "Alara shards and Tarkir wedges"

---

## Start Screen / Landing

### First Visit

```
┌──────────────────────────────────────┐
│                                      │
│        ⚪🔵⚫🔴🟢                  │
│                                      │
│     SPARROW DECK                     │
│     for MTG Color Combos             │
│                                      │
│  Learn the names of every color      │
│  combination in Magic: The Gathering │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  🎴  Start: Guilds           │    │
│  └──────────────────────────────┘    │
│                                      │
│  How does this work?                 │
│                                      │
└──────────────────────────────────────┘
```

- Clean, minimal, inviting
- One primary CTA: Start with Guilds (the natural entry point)
- "How does this work?" expands an inline explainer (not a separate page):
  - "You'll see color symbols. Say the name out loud before the answer appears. Tap to skip ahead if you know it. 3 minutes per round."
  - Keeps it to 2-3 sentences max

### Returning Visit

- Shows all tiers (with unlocked state)
- Remembers which tiers are unlocked (localStorage)
- No accounts, no login — this is a static app

---

## Session End Screen

When the timer hits zero:

```
┌──────────────────────────────────────┐
│                                      │
│         Session Complete             │
│                                      │
│     You saw 72 cards in 3 minutes    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  🔄  Go Again (same tier)      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  ⬆️  Try Next Tier             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  🏠  Done for now              │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

- Shows card count only (how many exposures) — **not** accuracy
- Card count reinforces the "volume of exposure" model
- Two clear next actions: repeat or level up
- "Done for now" returns to start screen

### What We Deliberately Omit

- No score
- No percentage correct
- No "streak" counters
- No leaderboards
- No "you got X wrong" summary

These all trigger evaluation anxiety and analytical thinking — the opposite of what the technique needs.

---

## Card Visual Design

### Mana Pips

- Use recognizable MTG mana symbols (circular icons with the canonical imagery)
- Large, centered, high contrast
- For multi-color combos, pips displayed in WUBRG order (canonical)
- Pips should feel like physical game pieces — slight shadow, rounded, tactile

### Color Associations

Each pip uses its traditional MTG color:
- W: White/gold sun on light background
- U: Blue water drop
- B: Black skull on dark background
- R: Red fireball
- G: Green tree

### Name Typography

- The combination name appears in a clean, bold sans-serif
- Large enough to read instantly
- Centered below or overlaid on the pips

### Card Container

- Rounded rectangle with subtle shadow
- Dark/neutral background (charcoal or dark slate)
- Enough contrast for all pip colors to pop
- Card takes up the center 60-70% of the viewport

---

## Mobile vs Desktop

### Mobile (Primary Target)

- Card fills most of the viewport
- Tap anywhere to reveal
- Swipe is tempting but wrong — it adds a directional decision. Tap is instantaneous.
- Timer in top-left, small
- Mana pips stacked vertically for 3+ color combos on narrow screens
- Full-screen feel; minimize browser chrome distraction

### Desktop

- Card centered with generous whitespace
- Click anywhere or press spacebar/Enter to reveal
- Keyboard shortcuts for power users who want maximum speed
- Same layout scaled up, not a different design

### Key Principle

The app should feel like a **single-screen experience**. During a session, the user never navigates, scrolls, or manages anything. They watch, they say, and optionally they tap to go faster. That's it.

---

## Accessibility

### Visual

- All mana pips include alt text (e.g., "White and Blue mana")
- Name text meets WCAG AA contrast on the card background
- Pips are distinguishable by shape, not just color (sun, drop, skull, fire, tree)
- Support for reduced motion: disable transitions, instant reveal

### Motor

- Huge tap target (entire card)
- No precision required
- Auto-advance reduces interaction to single repeated taps
- Keyboard fully supported (spacebar/Enter)

### Screen Readers

- Each card announces: "White and Blue mana. Tap to reveal." → "Azorius."
- Timer announces at 1 minute and 30 seconds remaining
- Session end is announced

### Cognitive

- Minimal UI reduces cognitive load
- No complex navigation
- One action at a time
- Consistent rhythm

---

## Engagement Without Gamification

The technique's power is in rhythm and repetition, not rewards. But we can still make it **feel good**:

- **Satisfying transitions**: Cards should feel tactile. A subtle "thunk" or slide as each card appears.
- **Visual momentum**: A subtle counter ticking up ("Card 47") gives a sense of flow without judgment
- **Color richness**: The mana pips are inherently beautiful — lean into the visual appeal of the color combinations
- **Speed as reward**: Users who tap early see more cards. The card count at the end implicitly rewards pace.
- **Session brevity**: 3 minutes is short enough that starting feels easy. "Just one more round" is the engagement loop.

---

## Resolved Questions

1. **Direction of learning**: Colors→Name only. Reverse deferred to future enhancement. (DEC-016)
2. **Mana symbol assets**: Standard community mana symbols (Scryfall/Gatherer style). (DEC-017)
3. **Sound effects**: Silent by default. Audio deferred. (DEC-018)
4. **Language**: English only. (DEC-019)
5. **Reveal model**: Auto-reveal after ~2.5s delay (tunable 1.5–3s), not tap-to-reveal. Tap advances early. (Client feedback on Proposal)

---

## Design Principles (for this project)

1. **Speed over polish** — If a design choice adds friction, cut it
2. **Rhythm over reward** — The interaction should feel like shuffling cards, not taking a test
3. **Trust the learner** — Don't gatekeep, don't evaluate, don't patronize
4. **Zero required actions** — During a session, the user can be purely passive; tapping is an optional accelerator
5. **The content is the experience** — Mana pips and names are inherently interesting; the UI should showcase them, not compete with them
