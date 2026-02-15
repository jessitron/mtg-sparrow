# Sparrow Deck Technique - Domain Research

## What Is a Sparrow Deck?

A Sparrow Deck is a rapid-fire classification learning technique created by **Llewellyn Falco**. It applies machine learning principles to the human brain — "AI for I" as Falco puts it. The technique trains pattern recognition and intuition through compressed exposure to many examples.

The name comes from the original deck: learning to distinguish **House Sparrows from Song Sparrows** — a task where the differences are subtle and hard to articulate, but the brain can learn to classify them rapidly through exposure.

## How It Works

### The Core Cycle (per card)

1. **See** — A stimulus is presented (an image, code snippet, or label)
2. **Guess** — The learner attempts to classify it before the answer is revealed
3. **Say it out loud** — Verbal engagement reinforces the neural pathway
4. **See the answer** — Immediate feedback confirms or corrects
5. **Move on quickly** — No dwelling; the speed is the point

### Session Structure

- **50–100 examples** shown in a **3-minute burst**
- The rapid pace is essential — it engages the brain's pattern recognition system rather than analytical reasoning
- Sessions are short and intense, not long and studious

### Key Differences from Standard Flashcards

| Aspect | Flashcards | Sparrow Deck |
|--------|-----------|--------------|
| Goal | Memorize facts | Build intuitive classification |
| Pace | Self-paced, slow | Rapid-fire, timed |
| Duration | Long sessions | 3-minute bursts |
| Response | Silent recall | Say it out loud |
| Focus | Individual items | Pattern across many items |
| Learning type | Explicit/declarative | Implicit/perceptual |
| Deck size | Varies | 50-100 examples per burst |

## Theoretical Foundation

### Perceptual Learning

The Sparrow Deck is grounded in **perceptual learning** research, as documented by Kathy Sierra in "Badass: Making Users Awesome." Key principles:

- **The brain identifies "that which does not vary"** across diverse examples — it extracts the pattern automatically
- **Tacit knowledge transfer** — learners develop ability they can't fully articulate (like chicken sexers who achieve 98%+ accuracy but can't explain how)
- **Large quantity of diverse examples in compressed time** is the critical ingredient
- **Immediate feedback** on each guess
- **Positive examples primarily** — learn what's "right" and deviations become obvious

### Why Rapid Pace Matters

The speed prevents the analytical/conscious mind from taking over. When you can't "think about it," the pattern recognition system — which is far more powerful for classification tasks — engages instead. This is the same mechanism that lets pilots read instruments after just 120 minutes of perceptual learning exercises (matching performance that normally requires 1,000+ flight hours).

## Existing Sparrow Decks

Falco has created decks for several domains:

- **Sparrow classification**: House vs. Song sparrows (the original)
- **Code quality**: Cluttered vs. Relevant code, Long vs. Short lines, Long vs. Short methods, Good vs. Bad names
- **Duplication detection**: Duplication vs. Distinct code, Inconsistency vs. Duplication
- **Language identification**: Rust vs. Go, Rust vs. Haskell
- **Testing patterns**: Property-based tests, Unit test stories
- **Frameworks**: Cynefin framework classification

The existing implementation is an Angular web app at https://learnwithllew.github.io/SparrowDecks/

## Application to MTG Color Combination Names

### The Learning Challenge

MTG has **31 named color combinations** (including mono-colors):
- 5 mono-colors (White, Blue, Black, Red, Green — WUBRG)
- 10 two-color **guilds** (from Ravnica: Azorius, Dimir, Rakdos, etc.)
- 5 three-color **shards** (from Alara: Bant, Esper, Grixis, Jund, Naya)
- 5 three-color **wedges** (from Tarkir: Abzan, Jeskai, Sultai, Mardu, Temur)
- 5 four-color combinations (from Nephilim: Glint, Dune, Ink, Witch, Yore)
- 1 five-color (WUBRG / "Five-Color")

The names are **arbitrary proper nouns** mapped to **specific color combinations**. This is exactly the kind of classification task that perceptual learning excels at — the associations are non-obvious and must become intuitive.

### How the Sparrow Deck Technique Maps

**Stimulus → Classification format options:**

1. **Colors → Name**: Show the color symbols (e.g., White + Blue), learner guesses "Azorius"
2. **Name → Colors**: Show "Azorius", learner guesses which colors
3. **Both directions** in separate decks or interleaved

**Design considerations for digital adaptation:**

- The color symbols (mana pips) are highly visual — perfect for rapid recognition
- The "say it out loud" step is crucial and should be encouraged in the UI (perhaps with a brief prompt)
- 3-minute timed sessions with a visible timer
- Start with smaller subsets (just guilds, or just shards) before mixing
- Progressive difficulty: guilds → shards → wedges → four-color → mixed
- The 50-100 card range works well since we have ~26 non-mono combinations that can be shown multiple times per session
- Immediate reveal after each guess (tap/click to flip)
- No scoring or grading — the technique is about exposure, not testing

### Critical Design Insight

The Sparrow Deck is **not a quiz**. It's a training tool. The distinction matters:
- No pass/fail
- No scores to optimize
- No penalty for wrong answers
- The value is in the rapid exposure cycle, not the accuracy measurement
- Speed and volume of exposure are what drive learning

That said, **confidence tracking** could be valuable — not as a grade, but as a signal to the learner about their progress.

## Sources

- [Sparrow Decks - LearnWithLlew](https://learnwithllew.github.io/SparrowDecks/)
- [Llewellyn Falco's Blog - Sparrow Decks](https://llewellynfalco.blogspot.com/p/sparrow-decks.html)
- [Developing Design Sense of Code Smells - SlideShare](https://www.slideshare.net/llewellynfalco/developing-design-sense-of-code-smells-67002791)
- [Chicken Sexing and Perceptual Learning - Commoncog](https://commoncog.com/chicken-sexing-and-perceptual-learning-as-a-path-to-expertise/)
- [Canton Coders - Sparrow Deck: Code Pattern Recognition](https://cantoncoders.org/2020/05/29/the-sparrow-deck-code-pattern-recognition-with-camille-bell/)
- [LearnWithLlew GitHub](https://github.com/learnwithllew)
- [All 26 MTG Color Combinations - Draftsim](https://draftsim.com/mtg-color-combinations/)
