/** Renders the MTG Colors spiral logo into a container element. */
export function renderLogo(container: HTMLElement): void {
  // Logo parameters
  const bgRadius = 120;
  const symbolSize = 60;
  const orbitRadius = 115;
  const outlineWidth = 2;
  const outlineColor = '#ffffff';
  const style = getComputedStyle(document.documentElement);
  const manaColor = (name: string): string => {
    const value = style.getPropertyValue(name).trim();
    if (!value) throw new Error(`CSS variable ${name} is not defined`);
    return value;
  };
  const colors = {
    W: manaColor('--mana-W'),
    U: manaColor('--mana-U'),
    B: manaColor('--mana-B'),
    R: manaColor('--mana-R'),
    G: manaColor('--mana-G'),
  };
  const spiral = {
    startDeg: 35,
    turns: 3,
    outerPct: 0.85,
    innerPct: 0.08,
    strokeWidth: 15,
  };

  const size = bgRadius * 2;

  // Build spiral path
  const startAngle = -Math.PI / 2 - (spiral.startDeg * Math.PI / 180);
  const totalAngle = spiral.turns * 2 * Math.PI;
  const outerR = bgRadius * spiral.outerPct;
  const innerR = bgRadius * spiral.innerPct;
  const steps = Math.round(spiral.turns * 120);
  const points: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = outerR - (outerR - innerR) * t;
    const angle = startAngle - t * totalAngle;
    const x = bgRadius + r * Math.cos(angle);
    const y = bgRadius + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  const d = 'M ' + points[0] + ' L ' + points.slice(1).join(' ');
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><path d="${d}" fill="none" stroke="white" stroke-width="${spiral.strokeWidth}" stroke-linecap="round"/></svg>`;
  const maskUrl = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`;

  // Container needs relative positioning for absolute children
  // (size and margin are in about.css on .about-logo)
  container.style.position = 'relative';

  // Background gradient circle with spiral mask
  const bgCircle = document.createElement('div');
  bgCircle.style.cssText = `
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: ${size}px; height: ${size}px;
    border-radius: 50%;
    background: conic-gradient(from 0deg,
      ${colors.W} 0deg, ${colors.U} 72deg, ${colors.B} 144deg,
      ${colors.R} 216deg, ${colors.G} 288deg, ${colors.W} 360deg);
    -webkit-mask-image: ${maskUrl};
    mask-image: ${maskUrl};
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  `;
  bgCircle.classList.add('logo-spiral');

  container.appendChild(bgCircle);

  // Mana symbols in pentagon arrangement
  const cossin: Record<string, [number, number]> = {
    W: [0, -1],
    U: [0.9511, -0.309],
    B: [0.5878, 0.809],
    R: [-0.5878, 0.809],
    G: [-0.9511, -0.309],
  };

  for (const color of ['W', 'U', 'B', 'R', 'G'] as const) {
    const [cosA, sinA] = cossin[color];
    const cx = bgRadius + orbitRadius * cosA - symbolSize / 2;
    const cy = bgRadius + orbitRadius * sinA - symbolSize / 2;

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute;
      width: ${symbolSize}px; height: ${symbolSize}px;
      left: ${cx}px; top: ${cy}px;
    `;

    const img = document.createElement('img');
    img.src = `images/logo/${color}.svg`;
    img.alt = '';
    img.style.cssText = `
      position: relative;
      width: 100%; height: 100%;
      display: block;
    `;
    wrap.appendChild(img);

    container.appendChild(wrap);
  }
}
