import { ColorCombo, alliedGuilds, enemyGuilds } from './data/combos';

// Timing constants (all in milliseconds)
export const SESSION_CARD_COUNT = 50;
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
 * Build a deck of `count` cards by shuffling the source combos
 * and repeating as needed.
 */
export function buildDeck(combos: ColorCombo[], count: number): ColorCombo[] {
  const deck: ColorCombo[] = [];
  while (deck.length < count) {
    const batch = shuffle([...combos]);
    for (const card of batch) {
      if (deck.length >= count) break;
      deck.push(card);
    }
  }
  return deck;
}

export type GuildSubgroup = "allied" | "enemy";

export type SessionState = {
  deck: ColorCombo[];
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

export function currentCard(session: SessionState): ColorCombo {
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
