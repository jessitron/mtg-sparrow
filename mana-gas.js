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

  // Outline drawn behind each mana symbol — set color in :root in style.css
  const SYMBOL_OUTLINE_COLOR = getComputedStyle(document.documentElement)
    .getPropertyValue("--symbol-outline-color").trim();
  const SYMBOL_OUTLINE_WIDTH = 1.5;

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

  const TRIPLES = {
    "B,G,W": "Abzan",
    "R,U,W": "Jeskai",
    "B,G,U": "Sultai",
    "B,R,W": "Mardu",
    "G,R,U": "Temur",
    "G,U,W": "Bant",
    "B,U,W": "Esper",
    "B,R,U": "Grixis",
    "B,G,R": "Jund",
    "G,R,W": "Naya",
  };

  const TRIPLE_BUBBLE_RADIUS = R * 2.8;

  function tripleName(c1, c2, c3) {
    const key = [c1, c2, c3].sort().join(",");
    return TRIPLES[key] || null;
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

  // Drag state
  let dragParticle = null;
  let dragStartTime = 0;
  // Track recent positions for release velocity
  const dragHistory = []; // { x, y, t }
  const DRAG_HISTORY_MAX = 5;
  const DRAG_SCALE = 1.2;

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

  // --- Drag interaction ---

  function canvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function findParticleAt(x, y) {
    let closest = null;
    let closestDist = Infinity;
    for (const p of particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.r && dist < closestDist) {
        closest = p;
        closestDist = dist;
      }
    }
    return closest;
  }

  function grabParticle(x, y) {
    const p = findParticleAt(x, y);
    if (!p) return;
    dragParticle = p;
    dragStartTime = performance.now();
    dragHistory.length = 0;
    dragHistory.push({ x, y, t: dragStartTime });
  }

  function moveParticle(x, y) {
    if (!dragParticle) return;
    dragParticle.x = x;
    dragParticle.y = y;
    const now = performance.now();
    dragHistory.push({ x, y, t: now });
    if (dragHistory.length > DRAG_HISTORY_MAX) {
      dragHistory.shift();
    }
  }

  function releaseParticle() {
    if (!dragParticle) return;
    const now = performance.now();
    const duration_ms = Math.round(now - dragStartTime);

    // Compute release velocity from drag history
    let release_vx = 0;
    let release_vy = 0;
    if (dragHistory.length >= 2) {
      const recent = dragHistory[dragHistory.length - 1];
      const older = dragHistory[0];
      const dt = recent.t - older.t;
      if (dt > 0) {
        // Scale down to match the simulation's per-frame velocity units
        // At 60fps, one frame ~16.7ms
        const frameMs = 16.7;
        release_vx = ((recent.x - older.x) / dt) * frameMs;
        release_vy = ((recent.y - older.y) / dt) * frameMs;
      }
    }

    dragParticle.vx = release_vx;
    dragParticle.vy = release_vy;

    // Dispatch telemetry event
    window.dispatchEvent(new CustomEvent("mana-gas-drag", {
      detail: {
        color: dragParticle.color,
        duration_ms,
        release_vx: Math.round(release_vx * 100) / 100,
        release_vy: Math.round(release_vy * 100) / 100,
      },
    }));

    dragParticle = null;
    dragHistory.length = 0;
  }

  // Mouse events — listen on document because #app overlays the canvas
  document.addEventListener("mousedown", (e) => {
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    grabParticle(x, y);
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragParticle) return;
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    moveParticle(x, y);
  });
  document.addEventListener("mouseup", () => {
    releaseParticle();
  });

  // Touch events — only preventDefault when we're actually dragging,
  // so normal taps on buttons still work
  document.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const { x, y } = canvasCoords(touch.clientX, touch.clientY);
    const p = findParticleAt(x, y);
    if (p) {
      e.preventDefault();
      grabParticle(x, y);
    }
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (!dragParticle) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = canvasCoords(touch.clientX, touch.clientY);
    moveParticle(x, y);
  }, { passive: false });
  document.addEventListener("touchend", () => {
    releaseParticle();
  });
  document.addEventListener("touchcancel", () => {
    releaseParticle();
  });

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
    // Update positions (skip dragged particle — cursor controls it)
    for (const p of particles) {
      if (p === dragParticle) {
        p.rotation += p.rotationSpeed;
        continue;
      }
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
          const aIsDragged = a === dragParticle;
          const bIsDragged = b === dragParticle;

          if (aIsDragged || bIsDragged) {
            // Dragged particle acts as immovable: push the other one away
            const other = aIsDragged ? b : a;
            const sign = aIsDragged ? 1 : -1;
            // Give the other particle a kick away from the dragged one
            const pushStrength = 2;
            other.vx += sign * nx * pushStrength;
            other.vy += sign * ny * pushStrength;
            // Separate fully by moving only the other particle
            const overlap = minDist - dist;
            other.x += sign * nx * overlap;
            other.y += sign * ny * overlap;
          } else {
            // Normal elastic collision
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
            const alreadyIn = encounters.some(e => e.a === a || e.b === a || e.c === a || e.a === b || e.b === b || e.c === b);
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

    // Update encounter centers, handle intruders and triple upgrades/downgrades
    for (let i = encounters.length - 1; i >= 0; i--) {
      const e = encounters[i];

      if (e.isTriple) {
        // Three-color encounter: update centroid
        e.cx = (e.a.x + e.b.x + e.c.x) / 3;
        e.cy = (e.a.y + e.b.y + e.c.y) / 3;

        // Check if any particle has left the triple bubble
        const members = [e.a, e.b, e.c];
        let departed = null;
        for (const m of members) {
          const dx = m.x - e.cx;
          const dy = m.y - e.cy;
          if (Math.sqrt(dx * dx + dy * dy) > TRIPLE_BUBBLE_RADIUS) {
            departed = m;
            break;
          }
        }

        if (departed) {
          // Find the two that remain
          const remaining = members.filter(m => m !== departed);
          const ra = remaining[0];
          const rb = remaining[1];
          const rdx = rb.x - ra.x;
          const rdy = rb.y - ra.y;
          const rDist = Math.sqrt(rdx * rdx + rdy * rdy);

          const pairName = guildName(ra.color, rb.color);
          if (pairName && rDist < BUBBLE_RADIUS * 2) {
            // Downgrade to two-color encounter
            e.a = ra;
            e.b = rb;
            e.c = undefined;
            e.name = pairName;
            e.isTriple = false;
            e.cx = (ra.x + rb.x) / 2;
            e.cy = (ra.y + rb.y) / 2;
          } else {
            encounters.splice(i, 1);
          }
        }
      } else {
        // Two-color encounter: update center
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

        // Check for intruders (different color entering the bubble)
        let intruderParticle = null;
        for (const p of particles) {
          if (p === e.a || p === e.b) continue;
          if (p.color === e.a.color || p.color === e.b.color) continue;
          const dx = p.x - e.cx;
          const dy = p.y - e.cy;
          if (Math.sqrt(dx * dx + dy * dy) - p.r < BUBBLE_RADIUS) {
            intruderParticle = p;
            break;
          }
        }

        if (intruderParticle) {
          const tName = tripleName(e.a.color, e.b.color, intruderParticle.color);
          if (tName) {
            // Upgrade to three-color encounter
            e.c = intruderParticle;
            e.name = tName;
            e.isTriple = true;
            e.cx = (e.a.x + e.b.x + e.c.x) / 3;
            e.cy = (e.a.y + e.b.y + e.c.y) / 3;

            // Dispatch telemetry event
            window.dispatchEvent(new CustomEvent("mana-gas-encounter", {
              detail: {
                type: "triple",
                name: tName,
                colors: [e.a.color, e.b.color, e.c.color].sort(),
              },
            }));
          } else {
            // Non-matching intruder: pop the encounter
            encounters.splice(i, 1);
          }
        }
      }
    }

    } // end if (!paused)

    // Draw encounter bubbles and labels
    for (const e of encounters) {
      const bubbleR = e.isTriple ? TRIPLE_BUBBLE_RADIUS : BUBBLE_RADIUS;
      ctx.save();
      ctx.beginPath();
      ctx.arc(e.cx, e.cy, bubbleR, 0, Math.PI * 2);
      ctx.strokeStyle = e.isTriple ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = e.isTriple ? 2 : 1.5;
      ctx.stroke();
      ctx.font = e.isTriple
        ? "bold 22px 'GoudyMediaeval', Georgia, serif"
        : "bold 18px 'GoudyMediaeval', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = e.isTriple ? "#ffd700" : "#fff";
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(e.name, e.cx, e.cy - bubbleR - 8);
      ctx.restore();
    }

    // Draw particles (dragged particle last so it renders on top)
    const drawOrder = dragParticle
      ? particles.filter(p => p !== dragParticle).concat([dragParticle])
      : particles;
    for (const p of drawOrder) {
      const isDragged = p === dragParticle;
      const scale = isDragged ? DRAG_SCALE : 1;
      const drawR = p.r * scale;
      const drawSize = SYMBOL_SIZE * scale;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = isDragged ? 0.95 : 0.75;

      // Drop shadow for dragged symbol
      if (isDragged) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
      }

      // Outline ring behind the symbol for separation from the background
      ctx.beginPath();
      ctx.arc(0, 0, drawR + SYMBOL_OUTLINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.strokeStyle = SYMBOL_OUTLINE_COLOR;
      ctx.lineWidth = SYMBOL_OUTLINE_WIDTH;
      ctx.stroke();

      ctx.drawImage(images[p.color], -drawR, -drawR, drawSize, drawSize);
      ctx.restore();
    }

    requestAnimationFrame(loop);
  }
})();
