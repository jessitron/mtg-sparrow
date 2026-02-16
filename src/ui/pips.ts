const MANA_COLORS = ["W", "U", "B", "R", "G"];

/**
 * Shuffle an array in place using Fisher-Yates.
 * Mutates the input array.
 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function renderPip(color: string): HTMLElement {
  if (!MANA_COLORS.includes(color)) {
    throw new Error(`Unknown mana color: ${color}`);
  }

  const img = document.createElement("img");
  img.src = `images/${color}.svg`;
  img.alt = color;
  img.width = 60;
  img.height = 60;
  img.classList.add("mana-pip");

  return img;
}

export function renderPips(colors: string[]): HTMLElement {
  const container = document.createElement("div");
  container.classList.add("card-pips");

  // Shuffle a copy of colors so each render shows pips in random order
  const shuffledColors = [...colors];
  shuffle(shuffledColors);

  for (const color of shuffledColors) {
    container.appendChild(renderPip(color));
  }
  return container;
}
