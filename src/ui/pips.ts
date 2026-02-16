const pipConfig: Record<string, { bg: string; symbol: string }> = {
  W: {
    bg: "#f9e076",
    symbol: `<circle cx="30" cy="30" r="8" fill="none" stroke="#6b5c00" stroke-width="2"/>
      <line x1="30" y1="16" x2="30" y2="22" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="30" y1="38" x2="30" y2="44" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="16" y1="30" x2="22" y2="30" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="38" y1="30" x2="44" y2="30" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="20" x2="24" y2="24" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="36" y1="36" x2="40" y2="40" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="36" y2="24" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>
      <line x1="24" y1="36" x2="20" y2="40" stroke="#6b5c00" stroke-width="2" stroke-linecap="round"/>`,
  },
  U: {
    bg: "#0e68ab",
    symbol: `<path d="M30 18 C30 18 24 28 24 34 C24 37.3 26.7 40 30 40 C33.3 40 36 37.3 36 34 C36 28 30 18 30 18Z" fill="#c4e4f7" stroke="#063a5e" stroke-width="1.5"/>`,
  },
  B: {
    bg: "#3d3d3d",
    symbol: `<circle cx="30" cy="24" r="8" fill="#c8c8c8"/>
      <path d="M22 34 L30 44 L38 34 Z" fill="#c8c8c8"/>
      <circle cx="26" cy="22" r="2" fill="#3d3d3d"/>
      <circle cx="34" cy="22" r="2" fill="#3d3d3d"/>`,
  },
  R: {
    bg: "#d32029",
    symbol: `<path d="M30 18 C28 22 22 26 22 32 C22 36.4 25.6 40 30 40 C34.4 40 38 36.4 38 32 C38 26 32 22 30 18Z" fill="#ff9944" stroke="#ff6600" stroke-width="1"/>
      <path d="M30 26 C29 28 26 30 26 33 C26 35.2 27.8 37 30 37 C32.2 37 34 35.2 34 33 C34 30 31 28 30 26Z" fill="#ffdd44"/>`,
  },
  G: {
    bg: "#00733e",
    symbol: `<path d="M30 18 L30 40" stroke="#8fce6a" stroke-width="3" stroke-linecap="round"/>
      <path d="M30 22 L22 28" stroke="#8fce6a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M30 22 L38 28" stroke="#8fce6a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M30 28 L24 33" stroke="#8fce6a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M30 28 L36 33" stroke="#8fce6a" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="30" cy="16" r="3" fill="#8fce6a"/>`,
  },
};

export function renderPip(color: string): SVGElement {
  const config = pipConfig[color];
  if (!config) {
    throw new Error(`Unknown mana color: ${color}`);
  }

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 60 60");
  svg.setAttribute("width", "60");
  svg.setAttribute("height", "60");
  svg.classList.add("mana-pip");

  svg.innerHTML = `
    <circle cx="30" cy="30" r="28" fill="${config.bg}" stroke="#222" stroke-width="2"/>
    ${config.symbol}
  `;

  return svg;
}

export function renderPips(colors: string[]): HTMLElement {
  const container = document.createElement("div");
  container.classList.add("card-pips");
  for (const color of colors) {
    container.appendChild(renderPip(color));
  }
  return container;
}
