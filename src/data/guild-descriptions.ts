export type ExampleDeck = {
  commander: string; // commander card name
  commanderImageUrl: string; // Scryfall image URL for the commander
  deckName: string; // precon deck name
  setName: string; // set the precon is from
  deckUrl: string; // link to deck page (EDHREC, Archidekt, etc.)
  description: string; // what the deck does / flavor
};

export type GuildDescription = {
  id: string; // matches ColorCombo.id in combos.ts
  description: string; // 3-5 sentences of philosophy and flavor
  scryfallUrl: string; // link to "More [Guild] cards"
  flavor?: string; // editorial commentary from the client
  exampleDecks?: ExampleDeck[]; // optional precon commander decks
};

export const guildDescriptions: GuildDescription[] = [
  // Strixhaven Colleges
  {
    id: "silverquill",
    description:
      "Silverquill is the magic of words — spoken or written, sharp as a blade or soft as a benediction. Same colors as Orzhov, completely different weapons: Orzhov wants your soul as collateral, Silverquill wants to win the argument. One uses ghosts and debt; the other uses a well-timed rebuttal that ends careers. Ink and light manifest as spells; the pen is not mightier than the sword, it IS the sword. Their culture is fiercely competitive and eloquent, full of debate champions and published poets who treat every argument as a duel.",
    scryfallUrl: "https://scryfall.com/search?q=set%3Astx+c%3Awb+-is%3Asplit+-is%3Adfc",
  },
  {
    id: "prismari",
    description:
      "Prismari sees no line between magic and art — elemental power is their medium, and spectacle is the point. Izzet and Prismari are cut from the same Spellslinger cloth — both love casting instants and sorceries in great quantity — but Izzet are mad scientists while Prismari are performance artists. Giant fire tornadoes and choreographed water displays are not byproducts of their magic — they are the magic. Huge, showy, and unapologetic, Prismari instants and sorceries function as paintings. The bigger the mana cost, the grander the artistic statement.",
    scryfallUrl: "https://scryfall.com/search?q=set%3Astx+c%3Aur+-is%3Asplit+-is%3Adfc",
  },
  {
    id: "witherbloom",
    description:
      "Witherbloom studies the interchange between life and death with scholarly rigor and gothic aesthetics. Golgari and Witherbloom share the life/death cycle theme, but Golgari IS the ecosystem — Witherbloom runs experiments on it. Their biomancers drain life to gain it back, sacrifice creatures to fuel healing, and maintain a botanical garden that smells faintly of decay. More laboratory than swamp, more biology department than death cult — though the distinction blurs near exam season. Pests are their mascots: small, morbid, and oddly endearing.",
    scryfallUrl: "https://scryfall.com/search?q=set%3Astx+c%3Abg+-is%3Asplit+-is%3Adfc",
  },
  {
    id: "lorehold",
    description:
      "Lorehold archaeomancers dig up the past and put it back to work. This is the sharpest guild-vs-college contrast: Boros attacks, Lorehold archives. Think Indiana Jones as a mage — passionate, reckless about history, and definitely going to disturb something that should have stayed buried. Spirit Statues of historical figures walk the campus. Flashback is their mechanic, the past never truly gone. Same colors as Boros; completely opposite momentum.",
    scryfallUrl: "https://scryfall.com/search?q=set%3Astx+c%3Arw+-is%3Asplit+-is%3Adfc",
  },
  {
    id: "quandrix",
    description:
      "Quandrix works in the mathematics of reality — fractals, patterns, theoretical systems underlying all of nature. Both Simic and Quandrix grow things with +1/+1 counters, but for completely different reasons: Simic mutates flesh through biological experimentation ('What if this newt had four fins?'), while Quandrix solves equations ('The Fibonacci sequence implies this creature should be this large'). Their students manifest Fractal constructs as creatures, and their magic scales up through mathematical principles. Abstract, brilliant, and occasionally incomprehensible to normal people. Different kinds of terrifying.",
    scryfallUrl: "https://scryfall.com/search?q=set%3Astx+c%3Agu+-is%3Asplit+-is%3Adfc",
  },

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
    flavor: "Infiltrators, tricksters, thieves and hostage takers; whispered disinformation, multifarious masterminds--what's not to like?? I have a Dimir deck made of Horrors and Furbies, captained by Umbris, Fear Manifest. People hate it.",
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
    exampleDecks: [
      {
        commander: "Ygra, Eater of All",
        commanderImageUrl: "https://cards.scryfall.io/normal/front/b/9/b9ac7673-eae8-4c4b-889e-5025213a6151.jpg?1721427242",
        deckName: "Ygra Especially Likes to Eat Squirrels",
        setName: "Duskmourn: House of Horror",
        deckUrl: "https://archidekt.com/decks/15406376/ygra_especially_likes_to_eat_squirrels",
        description: "There is no life without death. I know there's more to this guild than making squirrels and eating them, but I'm not tired of Ygra yet.",
      },
    ],
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
      "On Esper, flesh is a design flaw. The mages of this shard lace their bodies and creations with etherium to improve upon the forms nature provides. The sphinxes and artificers of Esper believe that everything can be improved with intelligence and will. They do not rule through brute force — they engineer outcomes. Gameplay includes artifacts and control (like counters and removal).",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dwub+-set%3Asld+-is%3Aub+legal%3Atimeless",
    exampleDecks: [
      {
        commander: "Y'shtola, Night's Blessed",
        commanderImageUrl: "https://cards.scryfall.io/normal/front/c/7/c7f2c2d5-e052-49e8-b5de-712858c2ea78.jpg?1752052932",
        deckName: "Scions & Spellcraft",
        setName: "Final Fantasy",
        deckUrl: "https://edhrec.com/precon/scions-spellcraft",
        description: "She dinks you for 2 life and you think 'no big deal' until suddenly you're at ten life and you can't defend from it.",
      },
    ],
  },
  {
    id: "grixis",
    description:
      "Grixis is a dying world that forgot to stop. The strong consume the weak, the dead rise, and mana is contested with savage desperation. There is only power and the will to seize it. Nihilistic, cunning, and brutally pragmatic, Grixis abandons every illusion but one: that surviving is worth any price. Gameplay includes graveyard recursion and stealing opponents' creatures.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dubr+-set%3Asld+-is%3Aub+legal%3Atimeless",
    exampleDecks: [
      {
        commander: "Admiral Brass, Unsinkable",
        commanderImageUrl: "https://cards.scryfall.io/normal/front/b/d/bdc2d492-9d1e-4543-8b9c-c66ee67992ce.jpg?1699972732",
        deckName: "Ahoy Mateys",
        setName: "The Lost Caverns of Ixalan",
        deckUrl: "https://edhrec.com/precon/ahoy-mateys",
        description: "Pirates are very Grixis. Steal creatures, create treasure, and reanimate Pirates from the graveyard.",
      },
    ],
  },
  {
    id: "jund",
    description:
      "In Jund, you eat or you are eaten. Dragons feed on everything below them in the food chain. Every creature earns its place through strength alone. Savage, direct, and honest about it all, Jund strips away pretense. Here there is no philosophy — only the predator and the prey Gameplay includes sacrificing your own permanents to fuel bigger ones.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Dbrg+-set%3Asld+-is%3Aub+legal%3Atimeless",
    exampleDecks: [
      {
        commander: "Szarel, Genesis Shepherd",
        commanderImageUrl: "https://cards.scryfall.io/normal/front/8/9/89b61123-b10f-4bcf-b5f9-1f302f9b22d1.jpg?1754673465",
        deckName: "World Shaper",
        setName: "Edge of Eternities",
        deckUrl: "https://edhrec.com/precon/world-shaper",
        description: "Sacrifice lands, replay them from the graveyard, sacrifice them again. It gets complicated, with long turns, and then it wins.",
      },
    ],
  },
  {
    id: "naya",
    description:
      "Naya is a paradise, a lush world of abundance. Leviathans walk the jungle floor and five-color mana flows freely. But paradise breeds complacency. Beautiful, exuberant, and naive, Naya celebrates the magnificent present without worrying about tomorrow. Gameplay is about big, smashy creatures.",
    scryfallUrl: "https://scryfall.com/search?q=c%3Drgw+-set%3Asld+-is%3Aub+legal%3Atimeless",
    exampleDecks: [
      {
        commander: "Pantlaza, Sun-Favored",
        commanderImageUrl: "https://cards.scryfall.io/normal/front/2/5/2524645e-b066-4351-885b-10faa8d819d7.jpg?1699972737",
        deckName: "Veloci-Ramp-Tor",
        setName: "The Lost Caverns of Ixalan",
        deckUrl: "https://edhrec.com/precon/veloci-ramp-tor",
        description: "Full of ramp, big dinosaurs, and dinosaurs that pull out other dinosaurs. My friend says, \"There's not much, and then there's Pantlaza, and then suddenly there are tons of huge dinosaurs out!\"",
      },
    ],
  },
];

// Keyed by guild id for easy lookup
export const guildDescriptionMap: Record<string, GuildDescription> =
  Object.fromEntries(guildDescriptions.map((g) => [g.id, g]));
