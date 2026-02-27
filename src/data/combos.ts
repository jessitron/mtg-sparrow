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
    ],
  },

  // Enemy guilds
  { id: "orzhov", name: "Orzhov", colors: ["W", "B"], tier: "guild", subgroup: "enemy" },
  { id: "izzet", name: "Izzet", colors: ["U", "R"], tier: "guild", subgroup: "enemy" },
  { id: "golgari", name: "Golgari", colors: ["B", "G"], tier: "guild", subgroup: "enemy" },
  { id: "boros", name: "Boros", colors: ["R", "W"], tier: "guild", subgroup: "enemy" },
  { id: "simic", name: "Simic", colors: ["G", "U"], tier: "guild", subgroup: "enemy" },
];

export const alliedGuilds = guilds.filter(g => g.subgroup === "allied");
export const enemyGuilds = guilds.filter(g => g.subgroup === "enemy");
