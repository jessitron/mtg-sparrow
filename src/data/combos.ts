export type ColorCombo = {
  id: string;
  name: string;
  colors: string[];
  tier: "guild" | "shard" | "wedge";
  subgroup?: "allied" | "enemy";
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
  { id: "azorius", name: "Azorius", colors: ["W", "U"], tier: "guild", subgroup: "allied" },
  { id: "dimir", name: "Dimir", colors: ["U", "B"], tier: "guild", subgroup: "allied" },
  { id: "rakdos", name: "Rakdos", colors: ["B", "R"], tier: "guild", subgroup: "allied" },
  { id: "gruul", name: "Gruul", colors: ["R", "G"], tier: "guild", subgroup: "allied" },
  { id: "selesnya", name: "Selesnya", colors: ["G", "W"], tier: "guild", subgroup: "allied" },

  // Enemy guilds
  { id: "orzhov", name: "Orzhov", colors: ["W", "B"], tier: "guild", subgroup: "enemy" },
  { id: "izzet", name: "Izzet", colors: ["U", "R"], tier: "guild", subgroup: "enemy" },
  { id: "golgari", name: "Golgari", colors: ["B", "G"], tier: "guild", subgroup: "enemy" },
  { id: "boros", name: "Boros", colors: ["R", "W"], tier: "guild", subgroup: "enemy" },
  { id: "simic", name: "Simic", colors: ["G", "U"], tier: "guild", subgroup: "enemy" },
];

export const alliedGuilds = guilds.filter(g => g.subgroup === "allied");
export const enemyGuilds = guilds.filter(g => g.subgroup === "enemy");
