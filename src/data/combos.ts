export type CardReference = {
  name: string;
  imageUrl: string;
};

export type ColorCombo = {
  id: string;
  name: string;
  colors: string[];
  tier: "guild" | "shard" | "wedge";
  subgroup?: "allied" | "enemy";
  cards?: CardReference[];
};

export const colorEmojiMap: Record<string, string> = {
  W: "☀️",
  U: "💧",
  B: "💀",
  R: "🔥",
  G: "🌿",
};

export const guilds: ColorCombo[] = [
  // Allied guilds
  {
    id: "azorius", name: "Azorius", colors: ["W", "U"], tier: "guild", subgroup: "allied",
    cards: [
      { name: "Supreme Verdict", imageUrl: "https://cards.scryfall.io/normal/front/4/e/4e9648f9-7a67-4717-bca1-861d1f7fed43.jpg?1562786100" },
      { name: "Detention Sphere", imageUrl: "https://cards.scryfall.io/normal/front/a/f/afee5464-83b7-4d7a-b407-9ee7de21535b.jpg?1562791607" },
      { name: "Grand Arbiter Augustin IV", imageUrl: "https://cards.scryfall.io/normal/front/a/2/a2ac328b-923f-48dd-a4f5-de389ade9125.jpg?1593273615" },
      { name: "Sphinx's Revelation", imageUrl: "https://cards.scryfall.io/normal/front/4/0/404d9413-ef57-4b6e-8584-48a1dc7fe6f1.jpg?1562785356" },
      { name: "Absorb", imageUrl: "https://cards.scryfall.io/normal/front/1/e/1e8a43c1-42d1-45ef-8a63-4b87775a6e88.jpg?1584831352" },
      { name: "Lavinia, Azorius Renegade", imageUrl: "https://cards.scryfall.io/normal/front/c/4/c497d496-1232-4614-93b0-9864fa93c29f.jpg?1584831655" },
      { name: "Isperia, Supreme Judge", imageUrl: "https://cards.scryfall.io/normal/front/b/2/b2cce2d4-3944-4ff0-98e8-80f19697f108.jpg?1562791805" },
      { name: "Azorius Charm", imageUrl: "https://cards.scryfall.io/normal/front/2/6/26adc211-d089-4102-91e5-225bbeb5f382.jpg?1562783945" },
      { name: "Deputy of Detention", imageUrl: "https://cards.scryfall.io/normal/front/7/e/7e362055-78a1-48fa-a4ef-6cf7e0b21b14.jpg?1584831457" },
      { name: "Dovin, Grand Arbiter", imageUrl: "https://cards.scryfall.io/normal/front/e/6/e6784910-0204-4a39-bb38-50daa03e94c2.jpg?1584831473" },
      { name: "Azor, the Lawbringer", imageUrl: "https://cards.scryfall.io/normal/front/3/0/30dc237e-b28a-4b65-9790-6b434828bf2e.jpg?1555040794" },
    ],
  },
  {
    id: "dimir", name: "Dimir", colors: ["U", "B"], tier: "guild", subgroup: "allied",
    cards: [
      { name: "Glimpse the Unthinkable", imageUrl: "https://cards.scryfall.io/normal/front/4/8/48058253-54b8-403b-8d95-94d8da986e69.jpg?1598917057" },
      { name: "Consuming Aberration", imageUrl: "https://cards.scryfall.io/normal/front/6/3/6354de66-f7f8-4e33-98d0-52624d3d7828.jpg?1561829179" },
      { name: "Lazav, Dimir Mastermind", imageUrl: "https://cards.scryfall.io/normal/front/6/9/69c8fcdb-4798-4961-995a-e128a3ff431a.jpg?1561830562" },
      { name: "Lazav, the Multifarious", imageUrl: "https://cards.scryfall.io/normal/front/2/4/24c1e710-f61c-4dd6-b620-6d2e1ecab689.jpg?1572893714" },
      { name: "Thief of Sanity", imageUrl: "https://cards.scryfall.io/normal/front/3/0/307543ca-8e17-433f-9758-4c77da6c0870.jpg?1572893852" },
      { name: "Etrata, the Silencer", imageUrl: "https://cards.scryfall.io/normal/front/f/a/fa36b142-e67e-49da-9080-c5994e275266.jpg?1572893618" },
      { name: "Disinformation Campaign", imageUrl: "https://cards.scryfall.io/normal/front/6/9/69a79ff3-58ed-4cc2-9ebc-0edbb86cd6fb.jpg?1572893597" },
      { name: "Whispering Madness", imageUrl: "https://cards.scryfall.io/normal/front/6/4/64e4b0cc-e611-4a4b-8392-b37bfc3a77e1.jpg?1561829595" },
      { name: "Dimir Charm", imageUrl: "https://cards.scryfall.io/normal/front/f/3/f3f4cfa7-8ee4-4a85-9e6a-65a7541f62c1.jpg?1561852231" },
      { name: "Nightveil Specter", imageUrl: "https://cards.scryfall.io/normal/front/e/3/e3754b8c-16d2-41e3-b41b-4b2e70833e82.jpg?1588456579" },
    ],
  },
  {
    id: "rakdos", name: "Rakdos", colors: ["B", "R"], tier: "guild", subgroup: "allied",
    cards: [
      { name: "Rakdos, Lord of Riots", imageUrl: "https://cards.scryfall.io/normal/front/0/4/04f3db71-802f-488c-b40d-ac90df2d660a.jpg?1562782015" },
      { name: "Judith, the Scourge Diva", imageUrl: "https://cards.scryfall.io/normal/front/0/a/0a742125-730d-4082-bfd8-5feb7733def4.jpg?1584831612" },
      { name: "Bedevil", imageUrl: "https://cards.scryfall.io/normal/front/8/1/81e2b96b-ecf2-4dd9-bc9d-3c46ee8c59e6.jpg?1584831400" },
      { name: "Dreadbore", imageUrl: "https://cards.scryfall.io/normal/front/a/8/a83945c6-4dc6-4d9a-9bc2-2d4a264e5422.jpg?1562791208" },
      { name: "Rakdos's Return", imageUrl: "https://cards.scryfall.io/normal/front/d/7/d72981c0-1632-4d64-9341-2a76047d9b36.jpg?1562793869" },
      { name: "Captive Audience", imageUrl: "https://cards.scryfall.io/normal/front/0/6/065f63b2-472e-4148-8294-88ed38a5685f.jpg?1584831422" },
      { name: "Theater of Horrors", imageUrl: "https://cards.scryfall.io/normal/front/a/d/ad42efd5-79c8-44f9-b3d6-d9058e0cb0f6.jpg?1584831925" },
      { name: "Havoc Festival", imageUrl: "https://cards.scryfall.io/normal/front/0/4/04560623-c768-4273-a40d-7e3f39e832cf.jpg?1562781987" },
      { name: "Lyzolda, the Blood Witch", imageUrl: "https://cards.scryfall.io/normal/front/1/8/18df285f-4cb9-4998-bd26-eefbe28f80c7.jpg?1593273653" },
      { name: "Pain Magnification", imageUrl: "https://cards.scryfall.io/normal/front/8/4/844801e4-cf37-4f20-9149-b58a57b9276e.jpg?1593273683" },
    ],
  },
  {
    id: "gruul", name: "Gruul", colors: ["R", "G"], tier: "guild", subgroup: "allied",
    cards: [
      { name: "Borborygmos Enraged", imageUrl: "https://cards.scryfall.io/normal/front/8/6/8644c60f-7d06-4026-bcf3-df054701ca0a.jpg?1748988399" },
      { name: "Domri Rade", imageUrl: "https://cards.scryfall.io/normal/front/2/1/21b48170-99dd-440f-9954-fc229d6094d3.jpg?1561819329" },
      { name: "Rhythm of the Wild", imageUrl: "https://cards.scryfall.io/normal/front/8/4/84062ce2-fea2-4e06-b83b-7cc597fb2a1b.jpg?1584831773" },
      { name: "Domri, Chaos Bringer", imageUrl: "https://cards.scryfall.io/normal/front/1/f/1f56bbf3-3884-495a-b9cd-6585d86f76f1.jpg?1584831466" },
      { name: "Nikya of the Old Ways", imageUrl: "https://cards.scryfall.io/normal/front/0/d/0dcdad71-323e-41e0-a1b3-9fd5b753e71c.jpg?1584831692" },
      { name: "Burning-Tree Emissary", imageUrl: "https://cards.scryfall.io/normal/front/8/9/899d5f35-3613-4c69-9176-13baf442fb50.jpg?1594656866" },
      { name: "Cindervines", imageUrl: "https://cards.scryfall.io/normal/front/9/f/9f970f79-3051-4ba1-badb-697ef321cbb3.jpg?1584831429" },
      { name: "Gruul Charm", imageUrl: "https://cards.scryfall.io/normal/front/9/2/9235afe5-0a6b-43c2-921c-18524cf032f1.jpg?1561836885" },
      { name: "Ulasht, the Hate Seed", imageUrl: "https://cards.scryfall.io/normal/front/a/0/a0ba043a-d508-49dd-9bf3-a7ae8d26ac9b.jpg?1593272829" },
      { name: "Clan Defiance", imageUrl: "https://cards.scryfall.io/normal/front/e/f/efa05298-9c94-4179-b75a-49ee2ca92920.jpg?1561851654" },
    ],
  },
  {
    id: "selesnya", name: "Selesnya", colors: ["G", "W"], tier: "guild", subgroup: "allied",
    cards: [
      { name: "Trostani, Selesnya's Voice", imageUrl: "https://cards.scryfall.io/normal/front/9/d/9d1d9d86-5666-4e59-9766-137657b4e040.jpg?1562790628" },
      { name: "March of the Multitudes", imageUrl: "https://cards.scryfall.io/normal/front/2/c/2cc2b646-0181-4f0a-a141-00ca56069a06.jpg?1572893740" },
      { name: "Emmara, Soul of the Accord", imageUrl: "https://cards.scryfall.io/normal/front/4/1/41b930ee-e16b-4612-87de-c03ecc6ff6db.jpg?1572893604" },
      { name: "Privileged Position", imageUrl: "https://cards.scryfall.io/normal/front/f/8/f8fa7566-6f7d-4c01-a442-ff7b38684de5.jpg?1598917825" },
      { name: "Knight of Autumn", imageUrl: "https://cards.scryfall.io/normal/front/3/0/3028075c-5fc5-4942-a984-1ffcf7a8933d.jpg?1572893707" },
      { name: "Trostani Discordant", imageUrl: "https://cards.scryfall.io/normal/front/f/a/fa1190a4-3d7e-4500-991f-e36ec3d1d9dc.jpg?1572893872" },
      { name: "Selesnya Charm", imageUrl: "https://cards.scryfall.io/normal/front/a/9/a9848eab-1d3a-4ab0-adf6-c20858aa3afb.jpg?1562791296" },
      { name: "Tolsimir Wolfblood", imageUrl: "https://cards.scryfall.io/normal/front/0/6/069ac859-e0ef-4685-bad3-5c741102b5b9.jpg?1598917578" },
      { name: "Watchwolf", imageUrl: "https://cards.scryfall.io/normal/front/9/5/95e5828a-3e54-4b9c-9e84-21880930f2d5.jpg?1598917628" },
      { name: "Armada Wurm", imageUrl: "https://cards.scryfall.io/normal/front/5/0/50cb4bf3-70d1-4acc-a1fb-49f4ea74ca16.jpg?1562786220" },
      { name: "Voice of Resurgence", imageUrl: "https://cards.scryfall.io/normal/front/9/9/99d1e843-71c9-4a65-bc36-d23858ef5ead.jpg?1599708569" },
    ],
  },

  // Enemy guilds
  {
    id: "orzhov", name: "Orzhov", colors: ["W", "B"], tier: "guild", subgroup: "enemy",
    cards: [
      { name: "Mortify", imageUrl: "https://cards.scryfall.io/normal/front/e/b/ebf6c0dc-5c7b-4170-99bc-2637ea44e716.jpg?1584831682" },
      { name: "Teysa Karlov", imageUrl: "https://cards.scryfall.io/normal/front/b/c/bcfaa19e-995e-447d-a0a2-46e5d117d5ec.jpg?1584831914" },
      { name: "Obzedat, Ghost Council", imageUrl: "https://cards.scryfall.io/normal/front/4/c/4cc198d8-1f27-482d-8f5d-21e02c59797a.jpg?1561826057" },
      { name: "Kaya's Wrath", imageUrl: "https://cards.scryfall.io/normal/front/5/e/5ed140c1-752b-4539-88f2-1fa354049b17.jpg?1584831638" },
      { name: "Merciless Eviction", imageUrl: "https://cards.scryfall.io/normal/front/d/9/d9876a4c-714b-47e5-9589-148a623af96a.jpg?1561848654" },
      { name: "Angel of Despair", imageUrl: "https://cards.scryfall.io/normal/front/9/a/9ae71424-df9c-481c-9305-a0c30adcfda2.jpg?1593272575" },
      { name: "Cartel Aristocrat", imageUrl: "https://cards.scryfall.io/normal/front/2/5/25bcfbc0-1401-4e5e-8145-c8936c4ff725.jpg?1561820231" },
      { name: "Teysa, Orzhov Scion", imageUrl: "https://cards.scryfall.io/normal/front/9/e/9eb856e6-8f63-4048-9818-cc3e65748855.jpg?1593272816" },
      { name: "Orzhov Charm", imageUrl: "https://cards.scryfall.io/normal/front/8/c/8ca44265-5e1b-4fbf-9002-52b2ce9b7448.jpg?1561835927" },
      { name: "Debtors' Knell", imageUrl: "https://cards.scryfall.io/normal/front/6/3/63a76c61-fd84-458d-9bc0-583768f4275a.jpg?1593272864" },
    ],
  },
  {
    id: "izzet", name: "Izzet", colors: ["U", "R"], tier: "guild", subgroup: "enemy",
    cards: [
      { name: "Niv-Mizzet, Parun", imageUrl: "https://cards.scryfall.io/normal/front/6/f/6f3d2dc5-7b9d-4af6-9f3b-4de90fbf63c9.jpg?1572893767" },
      { name: "Niv-Mizzet, the Firemind", imageUrl: "https://cards.scryfall.io/normal/front/5/9/5994d98a-090b-4203-b44f-b6517b6a83ea.jpg?1748270658" },
      { name: "Goblin Electromancer", imageUrl: "https://cards.scryfall.io/normal/front/0/a/0ae987da-e4b5-4b82-843c-6aaa87262fc8.jpg?1572893645" },
      { name: "Izzet Charm", imageUrl: "https://cards.scryfall.io/normal/front/1/e/1e3a5af6-5423-442b-a207-364e97a871d8.jpg?1562783481" },
      { name: "Thousand-Year Storm", imageUrl: "https://cards.scryfall.io/normal/front/2/7/270a0863-7d07-43f0-925d-a8ce0383a1cb.jpg?1572893865" },
      { name: "Electrolyze", imageUrl: "https://cards.scryfall.io/normal/front/e/f/ef42b5b2-6504-486c-aaa0-9d5e4769ba1d.jpg?1593272648" },
      { name: "Counterflux", imageUrl: "https://cards.scryfall.io/normal/front/9/4/94e4b773-40a4-4272-85dd-f728ada22748.jpg?1562790128" },
      { name: "Crackling Drake", imageUrl: "https://cards.scryfall.io/normal/front/f/0/f00fa3a7-e3e2-4b23-a126-a076e75b5dbd.jpg?1572893571" },
      { name: "Epic Experiment", imageUrl: "https://cards.scryfall.io/normal/front/4/2/42f0b68a-de4b-4c0c-98ac-a812017f88a7.jpg?1562785467" },
      { name: "Gelectrode", imageUrl: "https://cards.scryfall.io/normal/front/8/3/83fa9c4a-7027-4ddd-93e0-3c5dcaa8e48b.jpg?1593272662" },
    ],
  },
  {
    id: "golgari", name: "Golgari", colors: ["B", "G"], tier: "guild", subgroup: "enemy",
    cards: [
      { name: "Assassin's Trophy", imageUrl: "https://cards.scryfall.io/normal/front/e/d/ed6c7d29-71b4-4134-b591-5598f479d592.jpg?1706242115" },
      { name: "Abrupt Decay", imageUrl: "https://cards.scryfall.io/normal/front/3/b/3b1e92b4-6e53-4dba-a572-c67e01965ac5.jpg?1562785076" },
      { name: "Deathrite Shaman", imageUrl: "https://cards.scryfall.io/normal/front/7/0/70496f16-c4c0-4c03-beef-454eb4824cd1.jpg?1562788028" },
      { name: "Putrefy", imageUrl: "https://cards.scryfall.io/normal/front/0/a/0a16086c-5a74-45d0-8b38-e832cfbc80f7.jpg?1598917276" },
      { name: "Jarad, Golgari Lich Lord", imageUrl: "https://cards.scryfall.io/normal/front/0/2/02ef18d1-fd05-4dbc-9fa7-a383799b34e9.jpg?1562781886" },
      { name: "Vraska, Golgari Queen", imageUrl: "https://cards.scryfall.io/normal/front/a/3/a36d3ea7-0f18-4865-b47b-755673db065e.jpg?1572893904" },
      { name: "Underrealm Lich", imageUrl: "https://cards.scryfall.io/normal/front/0/7/0782e090-209c-428f-966a-17f3ceab2903.jpg?1572893891" },
      { name: "Corpsejack Menace", imageUrl: "https://cards.scryfall.io/normal/front/b/3/b35a8efe-2a3e-4060-9134-d4150e4bdf28.jpg?1562791837" },
      { name: "Jarad's Orders", imageUrl: "https://cards.scryfall.io/normal/front/c/5/c59171ce-7dc6-4dd9-a124-3c2c3028d93d.jpg?1562792935" },
      { name: "Glowspore Shaman", imageUrl: "https://cards.scryfall.io/normal/front/0/8/08fe260a-d204-4e75-b3e5-0cd9b4ca7084.jpg?1572893638" },
      { name: "Savra, Queen of the Golgari", imageUrl: "https://cards.scryfall.io/normal/front/e/1/e189f09e-d637-4631-bae3-a5a583ada429.jpg?1702429705" },
    ],
  },
  {
    id: "boros", name: "Boros", colors: ["R", "W"], tier: "guild", subgroup: "enemy",
    cards: [
      { name: "Boros Charm", imageUrl: "https://cards.scryfall.io/normal/front/d/4/d4ddf9cc-40a7-4b4f-bb51-b08171453c9a.jpg?1561848093" },
      { name: "Aurelia, the Warleader", imageUrl: "https://cards.scryfall.io/normal/front/4/e/4ec18e35-05e4-4bfc-b32b-c3e71c95a71d.jpg?1561826491" },
      { name: "Lightning Helix", imageUrl: "https://cards.scryfall.io/normal/front/4/1/4101e3fe-b0e7-4f0f-b9ac-9b61a4d628b3.jpg?1706242208" },
      { name: "Assemble the Legion", imageUrl: "https://cards.scryfall.io/normal/front/4/3/43675ed7-ece1-4414-965e-9ebadcbf3dfb.jpg?1561824560" },
      { name: "Boros Reckoner", imageUrl: "https://cards.scryfall.io/normal/front/8/2/82a18b07-38b8-4854-9735-3cfe83b11bf1.jpg?1561833775" },
      { name: "Aurelia's Fury", imageUrl: "https://cards.scryfall.io/normal/front/1/a/1a3465b6-ee7f-4553-bbf1-85fae9734b67.jpg?1561817922" },
      { name: "Tajic, Legion's Edge", imageUrl: "https://cards.scryfall.io/normal/front/5/e/5e669a01-84d3-4fcc-8396-9e987bd89b4f.jpg?1572893845" },
      { name: "Swiftblade Vindicator", imageUrl: "https://cards.scryfall.io/normal/front/2/8/285c4d9e-0f22-49a8-b68c-150fd0d4b617.jpg?1572893839" },
      { name: "Firemane Avenger", imageUrl: "https://cards.scryfall.io/normal/front/e/2/e244c198-efdc-492a-9c52-76aac006de9d.jpg?1561849759" },
      { name: "Justice Strike", imageUrl: "https://cards.scryfall.io/normal/front/2/7/27619ce9-59df-4f0e-a5db-2d32a530e547.jpg?1572893698" },
    ],
  },
  {
    id: "simic", name: "Simic", colors: ["G", "U"], tier: "guild", subgroup: "enemy",
    cards: [
      { name: "Growth Spiral", imageUrl: "https://cards.scryfall.io/normal/front/7/c/7c77a6b1-ef06-4da5-8e86-a5204216cb77.jpg?1584831556" },
      { name: "Hydroid Krasis", imageUrl: "https://cards.scryfall.io/normal/front/8/0/801dd9c6-b159-4e1c-af2c-214c1f573633.jpg?1584833616" },
      { name: "Coiling Oracle", imageUrl: "https://cards.scryfall.io/normal/front/5/5/55a6ba2a-b372-4b15-9a1e-09b41316eab7.jpg?1593273577" },
      { name: "Simic Ascendancy", imageUrl: "https://cards.scryfall.io/normal/front/f/f/ff824392-fb5c-496c-be2f-6dfa6e04e3a2.jpg?1584831850" },
      { name: "Simic Charm", imageUrl: "https://cards.scryfall.io/normal/front/9/7/97c27bdd-77f5-4e93-8f54-93a204fc980a.jpg?1701991207" },
      { name: "Prime Speaker Zegana", imageUrl: "https://cards.scryfall.io/normal/front/f/3/f30dfb8e-f540-45ab-a4e8-63425099646a.jpg?1561852170" },
      { name: "Master Biomancer", imageUrl: "https://cards.scryfall.io/normal/front/1/a/1a47da7c-80f3-4b98-aaac-778c34a35cb6.jpg?1561817948" },
      { name: "Fathom Mage", imageUrl: "https://cards.scryfall.io/normal/front/4/f/4fa311f1-f11e-492d-9f18-e7489f950be7.jpg?1561826540" },
      { name: "Trygon Predator", imageUrl: "https://cards.scryfall.io/normal/front/f/3/f31f54bf-7bf0-48f0-853d-1468713784eb.jpg?1593273791" },
      { name: "Zegana, Utopian Speaker", imageUrl: "https://cards.scryfall.io/normal/front/d/d/dd199a48-5ac8-4ab9-a33c-bbce6f7c9d1b.jpg?1584831935" },
    ],
  },
];

export const alliedGuilds = guilds.filter(g => g.subgroup === "allied");
export const enemyGuilds = guilds.filter(g => g.subgroup === "enemy");
