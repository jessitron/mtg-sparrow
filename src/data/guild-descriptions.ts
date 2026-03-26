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
      "The Azorius believe civilization rests entirely on their shoulders — and they're not wrong, which makes them insufferable. They see a world in perpetual need of structure. Without law, there is only chaos — and chaos is simply disorder that hasn't been regulated yet.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "dimir",
    description:
      "Dimir understands that information, properly controlled, is the ultimate power. In the shadows,  knowledge is currency and identity a resource to be borrowed. Most of Ravnica doesn't believe they exist — exactly as they prefer. Every move serves a hidden agenda you'll understand when it's too late.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dub+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "rakdos",
    description:
      "Anarchic entertainers who worship spectacle, the Rakdos believe life is too brief to waste on rules and planning. Pain is real, the crowd must be thrilled, and authority is a punchline. You may not like the show — but you won't look away.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbr+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "gruul",
    description:
      "Once the wild heart of Ravnica, now its open wound. The Gruul believe civilization is violence done slowly. Feral and furious, they smash what civilization builds and call it liberation. In their ruins, nature breathes again.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "selesnya",
    description:
      "The Conclave sees the self as the enemy of joy. Community, nature, and unity above all! Selesnya doesn't conquer; it grows, gathers, and embraces until the world is woven whole. You don't join the Conclave — you become part of it.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },

  // Enemy guilds
  {
    id: "orzhov",
    description:
      "Church, crime family, is there a difference? Orzhov wraps greed in ceremony and debt in obligations that outlast death. Wealth extends eternally; every soul that passes through their doors leaves something behind. Salvation is available at a price.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwb+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "izzet",
    description:
      "Perpetually mid-experiment, the Izzet believe discovery is its own justification. If the occasional explosion occurs, well — that's data. They built Ravnica's infrastructure and nearly unmade it twice. Led by draconic genius Niv-Mizzet, the League prizes innovation above caution.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dur+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "golgari",
    description:
      "Patient, pragmatic, and unashamed of death, the Golgari understand: decay is generative, death feeds life, and nothing is wasted. They sustain Ravnica's food supply through rot, reclamation, and reanimation. Grim but not cruel, they find power in what everyone else throws away.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "boros",
    description:
      "The Boros Legion charges toward injustice with swords drawn and angels overhead. They can seem self-righteous (because they are). But their courage is real, and the city would burn without them.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "simic",
    description:
      "The Simic scientists combine ecological reverence with relentless optimization. Reclusive, brilliant, and alarming to outsiders, they perfect organisms the way others perfect recipes. Nature is a first draft. Evolution, to the Simic, is too important to leave to chance.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },

  // Wedges
  {
    id: "abzan",
    description:
      "The Abzan clans endure where others perish, through deep roots and unbreakable community. Hardship is their inheritance and their teacher; the dead are never gone while their descendants remember them. Stubborn, resilient, and quietly powerful, Abzan outlast. They outlast everything.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwbg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "jeskai",
    description:
      "The Jeskai way is mind + fist — strategy elevated into art, combat as meditation. They seek enlightenment through discipline and cunning. Wisdom without strength is philosophy, and strength without wisdom is violence. The Jeskai turn their opponents' power against them.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Durw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "sultai",
    description:
      "The Sultai accumulate everything: wealth, power, the dead themselves. Cruelty is a tool. The living world is a resource and the dead a labor force. True power means owning not just the present, but all that came before it.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbgu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "mardu",
    description:
      "The Mardu live for the thunder of hooves, the flash of blades, and the glory of victory. Speed is their religion; hesitation is their sin. Fierce and passionate, the Mardu raid out of joy — to prove they are alive, they must conquer.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drwb+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "temur",
    description:
      "The Temur live at the edge of civilization, where spirits walk with shamans and wilderness is a teacher. They celebrate raw strength and elemental fury as the honest language of the natural world. The wild does not care about your plans, and they wouldn't have it any other way.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgur+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },

  // Shards
  {
    id: "bant",
    description:
      "Bant is a world of knightly honor — a civilization built on trust, ceremony, and the institutionalization of goodness. Noble, community-minded, and quietly idealistic, Bant believes civilization is a garden: carefully tended, deeply rooted, reaching toward the light.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dgwu+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "esper",
    description:
      "On Esper, flesh is a design flaw. The mages of this shard lace their bodies and creations with etherium to improve upon the forms nature provides. The sphinxes and artificers of Esper believe that everything can be improved with intelligence and will. They do not rule through brute force — they engineer outcomes.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwub+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "grixis",
    description:
      "Grixis is a dying world that forgot to stop. The strong consume the weak, the dead rise, and mana is contested with savage desperation. There is only power and the will to seize it. Nihilistic, cunning, and brutally pragmatic, Grixis abandons every illusion but one: that surviving is worth any price.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dubr+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "jund",
    description:
      "In Jund, you eat or you are eaten. Dragons feed on everything below them in the food chain. Every creature earns its place through strength alone. Savage, direct, and honest about it all, Jund strips away pretense. Here there is no philosophy — only the predator and the prey.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbrg+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
  {
    id: "naya",
    description:
      "Naya is a paradise, a lush world of abundance. Leviathans walk the jungle floor and five-color mana flows freely. But paradise breeds complacency. Beautiful, exuberant, and naive, Naya celebrates the magnificent present without worrying about tomorrow.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drgw+-set%3Asld+-is%3Aub+legal%3Atimeless",
  },
];

// Keyed by guild id for easy lookup
export const guildDescriptionMap: Record<string, GuildDescription> =
  Object.fromEntries(guildDescriptions.map((g) => [g.id, g]));
