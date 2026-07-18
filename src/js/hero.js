/**
 * Animated hero background: a field of stochastic price paths (random walks) flowing left→right.
 *
 * It's the visual thesis of the site — "systems that make decisions under uncertainty" — rendered
 * as the exact object a quant stares at all day: simulated price trajectories. No libraries; a
 * few hundred bytes of canvas.
 *
 * Guarantees:
 *  - Respects prefers-reduced-motion: renders ONE static frame, no animation loop.
 *  - Pauses when the tab is hidden (no wasted CPU/battery in a background tab).
 *  - Caps devicePixelRatio at 2 so retina screens don't quadruple the fill cost.
 *  - Reads the theme accent from CSS, so it recolors with light/dark automatically.
 *  - Purely decorative: aria-hidden, and the hero text is fully readable without it.
 */

const STEP = 8; // px between sample points along a path — larger = fewer segments, cheaper
const VOL = 0.016; // per-step volatility of each walk (fraction of canvas height)
const DRIFT = 0.0; // 0 = pure random walk; the honest default (no free lunch)

function accentColor() {
  const c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return c || "#7fbfa8";
}

/** One random walk across the canvas, stored as a ring of y-values in [0,1]. */
function makePath(nPoints, rng) {
  const ys = new Float64Array(nPoints);
  let y = 0.5 + (rng() - 0.5) * 0.4;
  for (let i = 0; i < nPoints; i++) {
    y += DRIFT + (rng() - 0.5) * 2 * VOL;
    if (y < 0.04 || y > 0.96) y -= (y - 0.5) * 0.5; // soft reflect at the edges
    ys[i] = y;
  }
  return ys;
}

/** Tiny deterministic PRNG so the paths look the same each load (no Math.random dependency). */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initHero(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0;
  let height = 0;
  let nPoints = 0;
  let paths = [];
  let accent = accentColor();
  const rng = mulberry32(42);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    nPoints = Math.ceil(width / STEP) + 2;
    // Path count scales gently with width so a phone isn't drawing desktop density.
    const count = Math.round(Math.min(18, Math.max(6, width / 90)));
    paths = Array.from({ length: count }, () => makePath(nPoints, rng));
    accent = accentColor();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const n = paths.length;
    for (let p = 0; p < n; p++) {
      const ys = paths[p];
      // Front paths brighter, back paths faint — depth without another color. The frontmost
      // couple of paths read as "lead" trajectories; the rest recede into a soft field.
      const depth = p / n;
      const alpha = 0.1 + 0.4 * depth * depth;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.1 + 0.9 * depth;
      ctx.beginPath();
      for (let i = 0; i < ys.length; i++) {
        const x = i * STEP;
        const y = ys[i] * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function advance() {
    // Scroll every path one step left and append a fresh step on the right, so the field flows.
    for (const ys of paths) {
      ys.copyWithin(0, 1); // shift left
      let y = ys[ys.length - 2] + DRIFT + (rng() - 0.5) * 2 * VOL;
      if (y < 0.04 || y > 0.96) y -= (y - 0.5) * 0.5;
      ys[ys.length - 1] = y;
    }
  }

  let running = false;
  let frame = 0;
  function loop() {
    if (!running) return;
    // ~30fps is plenty for slow-drifting lines and halves the battery cost of 60.
    if ((frame++ & 1) === 0) {
      advance();
      draw();
    }
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
  }

  resize();
  draw(); // always render at least one frame — the static fallback for reduced-motion

  window.addEventListener("resize", () => {
    resize();
    draw();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}
