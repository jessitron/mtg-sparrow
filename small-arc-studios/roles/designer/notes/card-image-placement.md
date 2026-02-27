# Card Image Placement — Design Options

**Context:** We are adding one representative MTG card image per quiz slide. The current slide shows mana color pips, a hidden guild name, and answer buttons (in future versions). Cards are drawn from the per-guild lists in `small-arc-studios/roles/domain-expert/notes/allied-guild-cards.md`.

**Client constraint:** Keep the mana symbols — they are essential.
**Client starting point:** Card on the left, symbols + guild name on the right.

---

## Option A: Card Left, Quiz Right

**File:** `mockups/option-a-side-by-side.html`

The card image occupies the left half of a two-column layout. The right side holds the mana pips, the guild name (hidden until reveal), and answer buttons.

**Strengths:**
- Directly implements the client's instinct
- Good use of horizontal space on desktop
- Card is immediately visible — it contextualizes the challenge
- The card art and the quiz content coexist rather than compete

**Weaknesses:**
- On mobile, the columns stack vertically (card on top, quiz below), which makes the layout taller
- Card is visible before the answer is revealed — a knowledgeable player could read the mana cost in the card image, though it is small at normal size
- Requires a wider container than the current 600px max-width (probably 700-760px)

**Best for:** Desktop-first experience where players want visual context from the start.

---

## Option B: Card as Background Watermark

**File:** `mockups/option-b-card-watermark.html`

The card image fills the background of the existing quiz card element, blurred and darkened. All quiz content sits above it on an overlay layer. The layout structure does not change.

**Strengths:**
- Zero layout restructuring — drops in as a CSS change to the existing `.card` element
- Creates immersive, atmospheric feel — you are in the card's world
- Works at any screen size without layout changes
- Subtle enough that it does not compete with the quiz content

**Weaknesses:**
- The card is barely recognizable as a specific card — it reads as texture, not reference
- Inconsistent card art (some dark, some bright) may require per-card opacity tuning
- Players who want to study the card image cannot — it is too obscured to be informative
- Blur and overlay reduce the visual richness that makes real card art appealing

**Best for:** Ambience and theming over card education. If the goal is mood, not reference.

---

## Option C: Card Centered Below Mana Symbols, Above Buttons

**File:** `mockups/option-c-card-below-pips.html`

The layout remains a single column. The card image is inserted between the guild name and the answer buttons. Reading order: pips → name → card → buttons.

**Strengths:**
- Natural extension of the current vertical layout — no structural change
- The card serves as a visual memory anchor between the name reveal and the buttons
- Works cleanly at all screen sizes
- The sequence matches the learning flow: identify the colors → see the name → see an example card

**Weaknesses:**
- The card is visible before the answer is revealed, which could serve as a hint
- The quiz card becomes significantly taller — may require scrolling on small viewports
- The answer buttons end up below the fold on short screens, which disrupts the interaction flow

**Best for:** Single-column mobile-first design where the card is a reference, not a reward.

---

## Option D: Card Slides In After Answer Reveal (Card as Reward)

**File:** `mockups/option-d-card-reveal-reward.html`

The card image is hidden during the challenge phase. When the guild name is revealed, the card slides in with a brief animation — arriving at exactly the moment the player is forming the association.

The mockup includes a live interactive demo you can tap/Space to experience the timing.

**Strengths:**
- No spoiler risk — the card only appears after the answer
- The card arrival is a small moment of delight, which reinforces memory encoding
- The learning moment is maximally concentrated: name + card image arrive together
- Clean before-state with no clutter; after-state gains richness
- Consistent with how flashcard apps use imagery — as reinforcement, not hint

**Weaknesses:**
- Slightly more complex to implement (animation, state management for the reveal zone)
- If players advance quickly through cards, they see the card image only briefly
  - Mitigation: extend post-reveal dwell time slightly when card images are present
- The before-state looks exactly like the current design (no visual change until reveal)

**Best for:** Learning effectiveness — this is the option most aligned with how memory encoding works. The card is the payoff for completing the challenge.

---

## Designer Recommendation

**Option D** is the strongest design from a learning perspective. The card arrives as a reward, not a hint. It creates a satisfying micro-moment — the name and a concrete example of that guild appear together — which is exactly the kind of associative pairing that builds durable memory.

**Option A** is the most visually appealing and would be the right call if the primary goal is immersive visual richness over pure learning efficiency. It is closer to a "browse the collection" experience.

**Option C** is the simplest to implement and the most conservative — it changes the least about the existing design. It is a reasonable low-risk first step if the team wants to ship quickly.

**Option B** is primarily atmospheric and not recommended if card recognition is a goal.

---

*Mockups created 2026-02-26. All use Azorius (White/Blue) with Supreme Verdict as the example card. Each mockup is self-contained HTML — open in a browser to review.*
