import { ColorCombo, CardReference, alliedGuilds, enemyGuilds, wedges, shards } from './data/combos';
import { buildDeck, Familiarity } from './sparrow-deck';

export type Slide = ColorCombo & { selectedCard?: CardReference };

// Timing constants (all in milliseconds)
export const SESSION_CARD_COUNT = 25;
export const REVEAL_DELAY_MS = 3000;   // Time pips show before name fades in
export const ADVANCE_DELAY_MS = 2000;  // Time name stays visible before next card

export type GuildSubgroup = "allied" | "enemy" | "wedges" | "shards";

export type SessionState = {
  deck: Slide[];
  cardCount: number;
  currentIndex: number;
  completed: boolean;
  startTime: number;
  subgroup: GuildSubgroup;
};

export function createSession(subgroup: GuildSubgroup = "allied", familiarity: Familiarity = 'new'): SessionState {
  const poolMap: Record<GuildSubgroup, typeof alliedGuilds> = {
    allied: alliedGuilds,
    enemy: enemyGuilds,
    wedges,
    shards,
  };
  const pool = poolMap[subgroup];
  return {
    deck: buildDeck(pool, SESSION_CARD_COUNT, familiarity),
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
