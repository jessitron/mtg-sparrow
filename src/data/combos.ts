export type ColorCombo = {
  id: string;
  name: string;
  colors: string[];
  tier: "guild" | "shard" | "wedge";
};

export const guilds: ColorCombo[] = [
  // Allied guilds
  { id: "azorius", name: "Azorius", colors: ["W", "U"], tier: "guild" },
  { id: "dimir", name: "Dimir", colors: ["U", "B"], tier: "guild" },
  { id: "rakdos", name: "Rakdos", colors: ["B", "R"], tier: "guild" },
  { id: "gruul", name: "Gruul", colors: ["R", "G"], tier: "guild" },
  { id: "selesnya", name: "Selesnya", colors: ["G", "W"], tier: "guild" },

  // Enemy guilds
  { id: "orzhov", name: "Orzhov", colors: ["W", "B"], tier: "guild" },
  { id: "izzet", name: "Izzet", colors: ["U", "R"], tier: "guild" },
  { id: "golgari", name: "Golgari", colors: ["B", "G"], tier: "guild" },
  { id: "boros", name: "Boros", colors: ["R", "W"], tier: "guild" },
  { id: "simic", name: "Simic", colors: ["G", "U"], tier: "guild" },
];
