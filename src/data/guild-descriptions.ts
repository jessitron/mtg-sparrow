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
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "dimir",
    description:
      "Secretive and calculating, Dimir understands that information, properly controlled, is the ultimate power. They operate in the shadows where knowledge is currency and identity is a resource to be borrowed. Most of Ravnica doesn't believe they exist — which is exactly how they prefer it. Cold, patient, and ruthlessly precise, every move serves a hidden agenda you'll only understand when it's too late.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dub+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "rakdos",
    description:
      "Anarchic entertainers who worship at the altar of spectacle, the Rakdos believe life is too brief to waste on rules and planning. Pain is real, the crowd must be thrilled, and authority is just a punchline waiting for its audience. Chaotic, hedonistic, and genuinely brilliant in their brutal way, they perform with fire and blood and genuine passion. You may not like the show — but you won't look away.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbr+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "gruul",
    description:
      "Once the wild heart of Ravnica, now its open wound. The Gruul believe civilization is violence done slowly — the paving over of the world's soul, one cobblestone at a time. Fierce, feral, and righteously furious, they smash what civilization builds and call it liberation. In their ruins, nature breathes again.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "selesnya",
    description:
      "The Conclave believes the self is the enemy of joy. Community, nature, and unity above all — the individual voice matters only as part of the chorus. Warm, harmonious, and quietly powerful, Selesnya doesn't conquer; it grows, gathers, and embraces until the world is woven whole. You don't join the Conclave — you become part of it.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },

  // Enemy guilds
  {
    id: "orzhov",
    description:
      "The church that became a crime family — or perhaps always was one. Orzhov wraps greed in ceremony, guilt in gilded frames, and debt in obligations that outlast death itself. Shrewd, dignified, and utterly merciless, they believe wealth should extend eternally and every soul that passes through their doors leaves something behind. Salvation is available, of course — at a price.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwb+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "izzet",
    description:
      "Brilliant, reckless, and perpetually mid-experiment, the Izzet believe discovery is its own justification. If the occasional explosion occurs, well — that's data. Feverishly creative and constitutionally incapable of patience, they have built Ravnica's infrastructure and very nearly unmade it twice. Led by the draconic genius Niv-Mizzet, the League prizes innovation above caution and competence above permission.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dur+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "golgari",
    description:
      "Patient, pragmatic, and completely unashamed of death, the Golgari understand what polite society refuses to acknowledge: decay is generative, death feeds life, and nothing is truly wasted. Beneath the city streets they sustain Ravnica's food supply through rot, reclamation, and reanimation. Grim but not cruel, they see the cycle clearly — and find power in what everyone else throws away.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "boros",
    description:
      "Warriors who believe justice is something you fight for, not wait for. Passionate, disciplined, and fiercely principled, the Boros Legion charges toward injustice with swords drawn and angels overhead. They can seem self-righteous — because they are. But their conviction is genuine, their courage is real, and the city would burn without them.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "simic",
    description:
      "Scientists who believe nature is a first draft. The Simic combine ecological reverence with relentless optimization — honoring what life is while obsessively imagining what it could become. Reclusive, brilliant, and occasionally alarming to outsiders, they perfect organisms the way others perfect recipes: iteratively, systematically, and with remarkable results. Evolution, to the Simic, is simply too important to leave to chance.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },

  // Wedges
  {
    id: "abzan",
    description:
      "The Abzan clans endure where others perish — not through aggression, but through deep roots and unbreakable community. Hardship is their inheritance and their teacher; the dead are never truly gone while their descendants remember them. Stubborn, resilient, and quietly powerful, Abzan do not charge headlong into battle. They outlast. They outlast everything.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwbg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "jeskai",
    description:
      "The Jeskai way is the marriage of mind and fist — strategy elevated into art, combat as meditation. They seek enlightenment through discipline and cunning, understanding that wisdom without strength is philosophy, and strength without wisdom is violence. Lightning-quick, intellectually fierce, and never predictable, the Jeskai turn their opponents' power against them with effortless precision.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Durw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "sultai",
    description:
      "The Sultai accumulate everything — wealth, power, the dead themselves. Cruelty is not a vice to them but a tool, and sentimentality is simply inefficiency. They see the living world as a resource and the dead as a labor force that never complains. Calculating, decadent, and utterly without mercy, the Sultai understand that true power means owning not just the present, but all that came before it.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbgu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "mardu",
    description:
      "The Mardu live for the charge — for the thunder of hooves, the flash of blades, and the glory of victory before the sun moves. Speed is their religion; hesitation is their sin. They prize martial excellence above lineage and loyalty above everything. Fierce and passionate, the Mardu raid not out of desperation but out of joy — to prove they are alive, they must conquer.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drwb+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "temur",
    description:
      "The Temur live at the edge of civilization and beyond, where spirits walk with shamans and the wilderness is not a danger but a teacher. They celebrate raw strength and elemental fury — not as chaos, but as the honest language of the natural world. Bold, untamed, and spiritually grounded, the Temur know that the wild does not care about your plans, and they wouldn't have it any other way.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgur+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },

  // Shards
  {
    id: "bant",
    description:
      "Bant is a world of knightly honor and sun-drenched plenty — a civilization built on trust, ceremony, and the belief that goodness can be institutionalized. Knights earn sigils through heroic deeds. Order is maintained through virtue rather than fear. Noble, community-minded, and quietly idealistic, Bant believes civilization at its best is a garden: carefully tended, deeply rooted, and always reaching toward the light.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgwu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "esper",
    description:
      "On Esper, flesh is a design flaw. The mages of this shard lace their bodies and creations with etherium — a magical alloy that improves upon the imperfect forms nature provides. Meticulous, haughty, and obsessed with mastery, the sphinxes and artificers of Esper believe that everything can be improved with sufficient intelligence and will. They do not rule through brute force — they engineer outcomes.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwub+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "grixis",
    description:
      "Grixis is a dying world that forgot to stop. The strong consume the weak, the dead rise to serve twisted masters, and what little mana remains is contested with savage desperation. There is no morality here — only power and the will to seize it. Nihilistic, cunning, and brutally pragmatic, those who thrive in Grixis have abandoned every illusion except one: that surviving another day is always worth any price.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dubr+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "jund",
    description:
      "In Jund, you eat or you are eaten — and that is not a metaphor. Dragons rule through raw dominance, feeding on everything below them in the food chain. Every creature fights for survival, every being earns its place through strength alone. Savage, direct, and almost admirably honest about it all, Jund strips away pretense. Here there are no politics, no philosophy — only the predator and the prey.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbrg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "naya",
    description:
      "Naya is a paradise that has never known want — a lush world of overwhelming abundance where leviathans walk the jungle floor and five-color mana flows freely. But paradise breeds complacency. The great beasts are revered as gods, and the elves and humans who tend them have lost sight of the hunger just beyond the tree line. Beautiful, exuberant, and perhaps dangerously naive, Naya celebrates the magnificent present without worrying about tomorrow.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drgw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
];

// Keyed by guild id for easy lookup
export const guildDescriptionMap: Record<string, GuildDescription> =
  Object.fromEntries(guildDescriptions.map((g) => [g.id, g]));
