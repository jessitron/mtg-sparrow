import { ColorCombo, CardReference, alliedGuilds, enemyGuilds } from './data/combos';

export type Slide = ColorCombo & { selectedCard?: CardReference };

// Timing constants (all in milliseconds)
export const SESSION_CARD_COUNT = 20;
export const REVEAL_DELAY_MS = 2500;   // Time pips show before name fades in
export const ADVANCE_DELAY_MS = 1500;  // Time name stays visible before next card

/**
 * Shuffle an array in place using Fisher-Yates.
 * Returns the same array (mutated).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build a deck of `count` slides by shuffling the source combos
 * and repeating as needed. Each slide pre-selects a random card image.
 */
export function buildDeck(combos: ColorCombo[], count: number): Slide[] {
  const deck: Slide[] = [];
  while (deck.length < count) {
    const batch = shuffle([...combos]);
    for (const combo of batch) {
      if (deck.length >= count) break;
      const selectedCard = combo.cards && combo.cards.length > 0
        ? combo.cards[Math.floor(Math.random() * combo.cards.length)]
        : undefined;
      deck.push({ ...combo, selectedCard });
    }
  }
  return deck;
}

export type GuildSubgroup = "allied" | "enemy";

export type SessionState = {
  deck: Slide[];
  cardCount: number;
  currentIndex: number;
  completed: boolean;
  startTime: number;
  subgroup: GuildSubgroup;
};

export function createSession(subgroup: GuildSubgroup = "allied"): SessionState {
  const pool = subgroup === "allied" ? alliedGuilds : enemyGuilds;
  return {
    deck: buildDeck(pool, SESSION_CARD_COUNT),
    cardCount: SESSION_CARD_COUNT,
    currentIndex: 0,
    completed: false,
    startTime: Date.now(),
    subgroup,
  };
}

export function currentCard(session: SessionState): Slide {
  return session.deck[session.currentIndex];
}

export function advanceCard(session: SessionState): boolean {
  session.currentIndex++;
  if (session.currentIndex >= session.cardCount) {
    session.completed = true;
    return false; // no more cards
  }
  return true; // more cards remain
}
