const MANA_COLORS = ["W", "U", "B", "R", "G"];

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

  for (const color of colors) {
    container.appendChild(renderPip(color));
  }
  return container;
}
