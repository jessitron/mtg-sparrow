export type GuildDescription = {
  id: string; // matches ColorCombo.id in combos.ts
  description: string; // 3-5 sentences of philosophy and flavor
  scryfallUrl: string; // link to "More [Guild] cards"
};

export const guildDescriptions: GuildDescription[] = [
  // Allied guilds
  {
    id: "azorius",
    description:
      "The Azorius believe civilization rests entirely on their shoulders — and they're not wrong, which makes them insufferable. Pedantic, aloof, and immensely proud of their bureaucratic rationalism, they see a world in perpetual need of structure. Rules aren't restrictions; they're the architecture of order itself. Without law, there is only chaos — and chaos is simply disorder that hasn't been regulated yet.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwu+-is%3Aub",
  },
  {
    id: "dimir",
    description:
      "Secretive and calculating, Dimir understands that information, properly controlled, is the ultimate power. They operate in the shadows where knowledge is currency and identity is a resource to be borrowed. Most of Ravnica doesn't believe they exist — which is exactly how they prefer it. Cold, patient, and ruthlessly precise, every move serves a hidden agenda you'll only understand when it's too late.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dub+-is%3Aub",
  },
  {
    id: "rakdos",
    description:
      "Anarchic entertainers who worship at the altar of spectacle, the Rakdos believe life is too brief to waste on rules and planning. Pain is real, the crowd must be thrilled, and authority is just a punchline waiting for its audience. Chaotic, hedonistic, and genuinely brilliant in their brutal way, they perform with fire and blood and genuine passion. You may not like the show — but you won't look away.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbr+-is%3Aub",
  },
  {
    id: "gruul",
    description:
      "Once the wild heart of Ravnica, now its open wound. The Gruul believe civilization is violence done slowly — the paving over of the world's soul, one cobblestone at a time. Fierce, feral, and righteously furious, they smash what civilization builds and call it liberation. In their ruins, nature breathes again.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drg+-is%3Aub",
  },
  {
    id: "selesnya",
    description:
      "The Conclave believes the self is the enemy of joy. Community, nature, and unity above all — the individual voice matters only as part of the chorus. Warm, harmonious, and quietly powerful, Selesnya doesn't conquer; it grows, gathers, and embraces until the world is woven whole. You don't join the Conclave — you become part of it.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgw+-is%3Aub",
  },

  // Enemy guilds
  {
    id: "orzhov",
    description:
      "The church that became a crime family — or perhaps always was one. Orzhov wraps greed in ceremony, guilt in gilded frames, and debt in obligations that outlast death itself. Shrewd, dignified, and utterly merciless, they believe wealth should extend eternally and every soul that passes through their doors leaves something behind. Salvation is available, of course — at a price.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwb+-is%3Aub",
  },
  {
    id: "izzet",
    description:
      "Brilliant, reckless, and perpetually mid-experiment, the Izzet believe discovery is its own justification. If the occasional explosion occurs, well — that's data. Feverishly creative and constitutionally incapable of patience, they have built Ravnica's infrastructure and very nearly unmade it twice. Led by the draconic genius Niv-Mizzet, the League prizes innovation above caution and competence above permission.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dur+-is%3Aub",
  },
  {
    id: "golgari",
    description:
      "Patient, pragmatic, and completely unashamed of death, the Golgari understand what polite society refuses to acknowledge: decay is generative, death feeds life, and nothing is truly wasted. Beneath the city streets they sustain Ravnica's food supply through rot, reclamation, and reanimation. Grim but not cruel, they see the cycle clearly — and find power in what everyone else throws away.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbg+-is%3Aub",
  },
  {
    id: "boros",
    description:
      "Warriors who believe justice is something you fight for, not wait for. Passionate, disciplined, and fiercely principled, the Boros Legion charges toward injustice with swords drawn and angels overhead. They can seem self-righteous — because they are. But their conviction is genuine, their courage is real, and the city would burn without them.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drw+-is%3Aub",
  },
  {
    id: "simic",
    description:
      "Scientists who believe nature is a first draft. The Simic combine ecological reverence with relentless optimization — honoring what life is while obsessively imagining what it could become. Reclusive, brilliant, and occasionally alarming to outsiders, they perfect organisms the way others perfect recipes: iteratively, systematically, and with remarkable results. Evolution, to the Simic, is simply too important to leave to chance.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgu+-is%3Aub",
  },
];

// Keyed by guild id for easy lookup
export const guildDescriptionMap: Record<string, GuildDescription> =
  Object.fromEntries(guildDescriptions.map((g) => [g.id, g]));
