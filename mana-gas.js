// Mana Gas — floating mana symbols with encounter bubbles
// Attach to any <canvas id="gas"> element

(function () {
  const canvas = document.getElementById("gas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let stopped = false;

  // Expose a way to stop the animation and hide everything
  window.stopManaGas = function () {
    stopped = true;
    canvas.style.display = "none";
    if (stopBtn) stopBtn.style.display = "none";
    if (fanBtn) fanBtn.style.display = "none";
  };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const COLORS = ["W", "U", "B", "R", "G"];
  const SYMBOL_SIZE = 48;
  const SYMBOL_COUNT = 35;
  const MAX_SPEED = 0.6;
  const DAMPING = 0.999;
  const R = SYMBOL_SIZE / 2;
  const TRIGGER_DIST = R;
  const BUBBLE_RADIUS = R * 2;

  // Outline drawn behind each mana symbol — tweak color & width to taste
  const SYMBOL_OUTLINE_COLOR = "rgba(255, 220, 150, 0.55)";
  const SYMBOL_OUTLINE_WIDTH = 2.5;

  const GUILDS = {
    "U,W": "Azorius",
    "B,U": "Dimir",
    "B,R": "Rakdos",
    "G,R": "Gruul",
    "G,W": "Selesnya",
    "B,W": "Orzhov",
    "R,U": "Izzet",
    "B,G": "Golgari",
    "R,W": "Boros",
    "G,U": "Simic",
  };

  function guildName(c1, c2) {
    if (c1 === c2) return null;
    const key = [c1, c2].sort().join(",");
    return GUILDS[key] || null;
  }

  const encounters = [];
  const images = {};
  let loadedCount = 0;

  COLORS.forEach(c => {
    const img = new Image();
    img.src = `images/${c}.svg`;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === COLORS.length) init();
    };
    images[c] = img;
  });

  const particles = [];
  let paused = false;

  // Wire up stop/fan buttons if present
  const stopBtn = document.getElementById("gas-stop-btn") || document.getElementById("stop-btn");
  const fanBtn = document.getElementById("gas-fan-btn") || document.getElementById("fan-btn");

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      paused = !paused;
      stopBtn.classList.toggle("stopped", paused);
      if (paused) {
        stopBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)" stroke="none">
          <polygon points="7,4 20,12 7,20"/>
        </svg>`;
      } else {
        stopBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16" rx="1" fill="rgba(255,255,255,0.6)"/>
          <rect x="14" y="4" width="4" height="16" rx="1" fill="rgba(255,255,255,0.6)"/>
        </svg>`;
      }
    });
  }

  if (fanBtn) {
    fanBtn.addEventListener("click", () => {
      const svg = fanBtn.querySelector("svg");
      svg.classList.remove("spinning");
      void svg.offsetWidth;
      svg.classList.add("spinning");
      for (const p of particles) {
        p.vx += (Math.random() - 0.5) * 3;
        p.vy += (Math.random() - 0.5) * 3;
        p.rotationSpeed = (Math.random() - 0.5) * 0.02;
      }
    });
  }

  function init() {
    for (let i = 0; i < SYMBOL_COUNT; i++) {
      particles.push({
        x: R + Math.random() * (canvas.width - SYMBOL_SIZE),
        y: R + Math.random() * (canvas.height - SYMBOL_SIZE),
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
        r: R,
        color: COLORS[i % COLORS.length],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
      });
    }
    requestAnimationFrame(loop);
  }

  function loop() {
    if (stopped) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!paused) {
    // Update positions
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      if (p.x - p.r < 0) { p.x = p.r; p.vx = Math.abs(p.vx); }
      if (p.x + p.r > canvas.width) { p.x = canvas.width - p.r; p.vx = -Math.abs(p.vx); }
      if (p.y - p.r < 0) { p.y = p.r; p.vy = Math.abs(p.vy); }
      if (p.y + p.r > canvas.height) { p.y = canvas.height - p.r; p.vy = -Math.abs(p.vy); }
    }

    // Particle-particle collisions
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvn = dvx * nx + dvy * ny;

          if (dvn > 0) {
            a.vx -= dvn * nx;
            a.vy -= dvn * ny;
            b.vx += dvn * nx;
            b.vy += dvn * ny;
          }

          const overlap = (minDist - dist) / 2;
          a.x -= overlap * nx;
          a.y -= overlap * ny;
          b.x += overlap * nx;
          b.y += overlap * ny;
        }
      }
    }

    // Detect close pairs and create encounters
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.r + b.r + TRIGGER_DIST) {
          const name = guildName(a.color, b.color);
          if (name) {
            const alreadyIn = encounters.some(e => e.a === a || e.b === a || e.a === b || e.b === b);
            if (!alreadyIn) {
              encounters.push({
                a, b, name,
                cx: (a.x + b.x) / 2,
                cy: (a.y + b.y) / 2,
              });
            }
          }
        }
      }
    }

    // Update encounter centers, remove if particle left or third color intruded
    for (let i = encounters.length - 1; i >= 0; i--) {
      const e = encounters[i];
      e.cx = (e.a.x + e.b.x) / 2;
      e.cy = (e.a.y + e.b.y) / 2;
      const dxA = e.a.x - e.cx;
      const dyA = e.a.y - e.cy;
      const dxB = e.b.x - e.cx;
      const dyB = e.b.y - e.cy;
      const distA = Math.sqrt(dxA * dxA + dyA * dyA);
      const distB = Math.sqrt(dxB * dxB + dyB * dyB);
      if (distA > BUBBLE_RADIUS || distB > BUBBLE_RADIUS) {
        encounters.splice(i, 1);
        continue;
      }
      const intruder = particles.some(p => {
        if (p === e.a || p === e.b) return false;
        if (p.color === e.a.color || p.color === e.b.color) return false;
        const dx = p.x - e.cx;
        const dy = p.y - e.cy;
        return Math.sqrt(dx * dx + dy * dy) < BUBBLE_RADIUS;
      });
      if (intruder) {
        encounters.splice(i, 1);
      }
    }

    } // end if (!paused)

    // Draw encounter bubbles and labels
    for (const e of encounters) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(e.cx, e.cy, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = "bold 18px 'GoudyMediaeval', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(e.name, e.cx, e.cy - BUBBLE_RADIUS - 8);
      ctx.restore();
    }

    // Draw particles
    for (const p of particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = 0.75;

      // Outline ring behind the symbol for separation from the background
      ctx.beginPath();
      ctx.arc(0, 0, p.r + SYMBOL_OUTLINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.strokeStyle = SYMBOL_OUTLINE_COLOR;
      ctx.lineWidth = SYMBOL_OUTLINE_WIDTH;
      ctx.stroke();

      ctx.drawImage(images[p.color], -p.r, -p.r, SYMBOL_SIZE, SYMBOL_SIZE);
      ctx.restore();
    }

    requestAnimationFrame(loop);
  }
})();
