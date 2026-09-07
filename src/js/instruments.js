/**
 * Instruments.
 *
 * Each project on this page gets a small live diagram of the one idea it is actually about,
 * drawn to canvas. They are not decoration standing in for a screenshot: the causality panel
 * really does freeze the past and scramble the future, the ledger panel really does show the
 * ordering that turns a retry into a second charge. A reader who watches for ten seconds should
 * come away understanding the mechanism, not just that a diagram existed.
 *
 * Rules every instrument obeys:
 *   - It draws a single static frame when the visitor asks for reduced motion.
 *   - It only animates while it is on screen. Off-screen panels cost nothing.
 *   - It reads colour from CSS custom properties, so both themes stay correct in one place.
 */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Deterministic noise, so a "random" walk is identical on every reload and every device. */
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function palette(el) {
  const s = getComputedStyle(el);
  const v = (name, fallback) => (s.getPropertyValue(name) || fallback).trim();
  return {
    text: v("--text", "#f4eee4"),
    muted: v("--muted", "#a1968a"),
    faint: v("--faint", "#6a6058"),
    line: v("--line", "#2a2320"),
    lineBright: v("--line-bright", "#3b322c"),
    accent: v("--accent", "#e3a24c"),
    accentDim: v("--accent-dim", "#8a6329"),
    verify: v("--verify", "#74c79b"),
    fail: v("--fail", "#e2704f"),
    surface: v("--surface", "#15110e"),
  };
}

/* ---------------------------------------------------------------------------
   1. Walk-forward — the curve that betrays itself.

   Confident in-sample, then the boundary, then the same rule losing money on data it has not
   seen. Apex's own demo produces this shape, and the framework exists to make it visible
   rather than to hide it.
   ------------------------------------------------------------------------ */
function walkForward(ctx, w, h, t, c, opts = {}) {
  const padX = w * 0.06;
  const padY = h * 0.16;
  const cutAt = 0.62;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  // Equity path: a drifting walk that turns over at the boundary. Two octaves of noise —
  // a fast tick and a slow swing — so it reads as a real equity curve rather than a ramp.
  const N = 260;
  const pts = [];
  let equity = 0;
  for (let i = 0; i < N; i++) {
    const p = i / (N - 1);
    const tick = (hash(i * 3.7) - 0.5) * 3.4;
    const swing = Math.sin(i * 0.11) * 1.5 + Math.sin(i * 0.037) * 2.6;
    const drift = p < cutAt ? 1.25 : -2.9;
    equity += drift + tick + swing * 0.35;
    pts.push(equity);
  }
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const X = (i) => padX + (i / (N - 1)) * innerW;
  const Y = (val) => padY + innerH - ((val - lo) / span) * innerH;

  // Baseline grid: quiet, so the curve is the only thing with weight.
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = padY + (innerH / 4) * g;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
  }

  // How much of the curve has been drawn: sweeps, holds, resets.
  const cycle = 7.2;
  const phase = (t % cycle) / cycle;
  const progress = REDUCED.matches ? 1 : Math.min(1, phase / 0.72);
  const drawn = Math.max(2, Math.floor(progress * N));

  const cutIndex = Math.floor(cutAt * N);
  const cutX = X(cutIndex);

  // The boundary. Everything right of it is data the strategy was never fitted on.
  ctx.save();
  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = c.lineBright;
  ctx.beginPath();
  ctx.moveTo(cutX, padY * 0.45);
  ctx.lineTo(cutX, h - padY * 0.5);
  ctx.stroke();
  ctx.restore();

  // Labels are sized from the panel's width, not its height: a short wide band and a tall
  // narrow card have very different room for text at the same height.
  const fs = Math.max(9, Math.min(13, Math.round(w * 0.028)));
  ctx.font = `500 ${fs}px ${opts.mono}`;
  ctx.fillStyle = c.faint;
  ctx.textAlign = "right";
  ctx.fillText("in-sample", cutX - 8, padY * 0.72);
  ctx.textAlign = "left";
  // Abbreviate rather than let the label run past the right edge on a narrow panel.
  const outLabel =
    cutX + 8 + ctx.measureText("out-of-sample").width > w - padX * 0.4 ? "OOS" : "out-of-sample";
  ctx.fillText(outLabel, cutX + 8, padY * 0.72);

  // The curve itself, in two colours: what it promised, then what it delivered.
  const stroke = (from, to, color, width) => {
    if (to <= from) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(X(from), Y(pts[from]));
    for (let i = from + 1; i <= to; i++) ctx.lineTo(X(i), Y(pts[i]));
    ctx.stroke();
  };

  stroke(0, Math.min(drawn, cutIndex), c.accent, 2.4);
  if (drawn > cutIndex) stroke(cutIndex, drawn, c.fail, 2.4);

  // Head marker, so the eye has something to follow while it draws.
  if (!REDUCED.matches && progress < 1) {
    const i = drawn - 1;
    ctx.fillStyle = i >= cutIndex ? c.fail : c.accent;
    ctx.beginPath();
    ctx.arc(X(i), Y(pts[i]), 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Peak-to-final drop, stated once the fall has been drawn.
  if (drawn > N - 4) {
    const peak = Math.max(...pts.slice(0, cutIndex));
    const end = pts[N - 1];
    ctx.fillStyle = c.fail;
    ctx.textAlign = "right";
    const drop = `${(((end - peak) / Math.abs(peak || 1)) * 100).toFixed(0)}% from peak`;
    ctx.fillText(drop, w - padX, h - padY * 0.35);
  }
}

/* ---------------------------------------------------------------------------
   2. Causality — perturb the future, watch the past hold still.

   Time runs left to right, one row per asset. Everything after the cut is re-randomised every
   frame; everything before it is frozen. If a value on the left ever moved, the signal was
   reading data it could not have had.
   ------------------------------------------------------------------------ */
function causality(ctx, w, h, t, c, opts) {
  const cols = 34;
  const rows = 12;
  const padX = w * 0.05;
  const padY = h * 0.12;
  const cw = (w - padX * 2) / cols;
  const ch = (h - padY * 2) / rows;

  const cut = REDUCED.matches ? 0.55 : 0.42 + Math.sin(t * 0.35) * 0.16;
  const cutCol = Math.floor(cut * cols);

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const frozen = col < cutCol;
      // Frozen cells depend only on their coordinates. Scrambled cells also depend on time.
      const seed = frozen ? r * 53 + col * 17 : r * 53 + col * 17 + Math.floor(t * 12) * 991;
      const v = hash(seed);
      const x = padX + col * cw;
      const y = padY + r * ch;

      if (frozen) {
        ctx.fillStyle = c.accent;
        ctx.globalAlpha = 0.14 + v * 0.5;
      } else {
        ctx.fillStyle = c.muted;
        ctx.globalAlpha = 0.08 + v * 0.42;
      }
      ctx.fillRect(x + 0.6, y + 0.6, cw - 1.4, ch - 1.4);
    }
  }
  ctx.globalAlpha = 1;

  const cutX = padX + cutCol * cw;
  ctx.strokeStyle = c.verify;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cutX, padY * 0.35);
  ctx.lineTo(cutX, h - padY * 0.35);
  ctx.stroke();

  ctx.fillStyle = c.verify;
  ctx.beginPath();
  ctx.moveTo(cutX, padY * 0.35);
  ctx.lineTo(cutX - 4, padY * 0.05);
  ctx.lineTo(cutX + 4, padY * 0.05);
  ctx.closePath();
  ctx.fill();

  const fs = Math.max(8, Math.min(12, Math.round(w * 0.026)));
  ctx.font = `500 ${fs}px ${opts.mono}`;
  ctx.textAlign = "left";
  ctx.fillStyle = c.accent;
  ctx.fillText("frozen", padX, h - padY * 0.18);
  ctx.textAlign = "right";
  ctx.fillStyle = c.muted;
  ctx.fillText("perturbed every frame", w - padX, h - padY * 0.18);
}

/* ---------------------------------------------------------------------------
   3. The absent edge.

   propose -> confirm -> fill exists. propose -> fill does not, and cannot be added without a
   test going red. The token tries the shortcut, finds nothing there, and goes the long way.
   ------------------------------------------------------------------------ */
function absentEdge(ctx, w, h, t, c, opts) {
  const y = h * 0.56;
  const nodes = [
    { x: w * 0.16, label: "propose" },
    { x: w * 0.5, label: "confirm" },
    { x: w * 0.84, label: "fill" },
  ];
  const r = Math.max(16, Math.min(26, w * 0.045));

  // The two edges that exist.
  ctx.strokeStyle = c.lineBright;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(nodes[i].x + r, y);
    ctx.lineTo(nodes[i + 1].x - r, y);
    ctx.stroke();
    const hx = nodes[i + 1].x - r;
    ctx.fillStyle = c.lineBright;
    ctx.beginPath();
    ctx.moveTo(hx, y);
    ctx.lineTo(hx - 6, y - 3.5);
    ctx.lineTo(hx - 6, y + 3.5);
    ctx.closePath();
    ctx.fill();
  }

  // The edge that does not. Drawn as an absence: dashed, arcing over, struck through.
  const arcTop = y - h * 0.3;
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = c.fail;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, y - r);
  ctx.quadraticCurveTo(w * 0.5, arcTop, nodes[2].x, y - r);
  ctx.stroke();
  ctx.restore();

  const mx = w * 0.5;
  const my = (y - r + arcTop) / 2;
  ctx.strokeStyle = c.fail;
  ctx.lineWidth = 2;
  const s = 7;
  ctx.beginPath();
  ctx.moveTo(mx - s, my - s);
  ctx.lineTo(mx + s, my + s);
  ctx.moveTo(mx + s, my - s);
  ctx.lineTo(mx - s, my + s);
  ctx.stroke();

  // A request walking the graph. It never appears on the arc, because the arc is not there.
  const cycle = 4.6;
  const p = REDUCED.matches ? 0.5 : (t % cycle) / cycle;
  const seg = p < 0.5 ? 0 : 1;
  const local = (p < 0.5 ? p : p - 0.5) / 0.5;
  const tx = nodes[seg].x + (nodes[seg + 1].x - nodes[seg].x) * local;
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(tx, y, 3.6, 0, Math.PI * 2);
  ctx.fill();

  // Nodes on top of the wiring.
  nodes.forEach((n, i) => {
    ctx.fillStyle = c.surface;
    ctx.strokeStyle = i === 1 ? c.verify : c.lineBright;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(n.x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = i === 1 ? c.verify : c.muted;
    ctx.font = `500 ${Math.max(9, Math.round(h * 0.062))}px ${opts.mono}`;
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x, y + r + Math.max(13, h * 0.1));
  });

  ctx.fillStyle = c.fail;
  ctx.font = `500 ${Math.max(9, Math.round(h * 0.058))}px ${opts.mono}`;
  ctx.textAlign = "center";
  ctx.fillText("no such edge", mx, my - 14);
}

/* ---------------------------------------------------------------------------
   4. Journal before call.

   Top lane is our ledger, bottom lane is the provider. The safe ordering writes the intent
   first. The unsafe ordering — call, then record — is the one where a retry after Stripe has
   pruned the idempotency key becomes a second real charge. Both are shown, in turn.
   ------------------------------------------------------------------------ */
function journalOrder(ctx, w, h, t, c, opts) {
  const cycle = 8;
  const p = REDUCED.matches ? 0.35 : (t % cycle) / cycle;
  const safe = p < 0.5;
  const local = (safe ? p : p - 0.5) / 0.5;
  const step = (n) => Math.max(0, Math.min(1, local * 3 - n));

  const fs = Math.max(9, Math.round(h * 0.062));
  ctx.font = `500 ${fs}px ${opts.mono}`;

  // Left gutter is measured from the widest lane label rather than guessed as a percentage,
  // so the labels cannot collide with the boxes on a narrow panel.
  const gutter = Math.max(ctx.measureText("ledger").width, ctx.measureText("stripe").width) + 18;
  const right = w - 14;
  const laneA = h * 0.42;
  const laneB = h * 0.78;
  // Box width follows the text it has to hold, so a label can never spill past its own border.
  const labelW = Math.max(ctx.measureText("journal").width, ctx.measureText("charge").width);
  const bw = Math.min(labelW + 14, (right - gutter) * 0.44);
  const bh = Math.max(15, h * 0.13);
  const col1 = gutter + 6;
  const col2 = Math.min(col1 + bw + (right - gutter) * 0.3, right - bw);

  [[laneA, "ledger"], [laneB, "stripe"]].forEach(([ly, label]) => {
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gutter, ly);
    ctx.lineTo(right, ly);
    ctx.stroke();
    ctx.fillStyle = c.faint;
    ctx.textAlign = "right";
    ctx.fillText(label, gutter - 8, ly + fs * 0.35);
  });

  const tint = safe ? c.verify : c.fail;

  const box = (x, y, label) => {
    ctx.fillStyle = tint;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(x, y - bh / 2, bw, bh);
    ctx.fill();
    ctx.fillStyle = c.surface;
    ctx.textAlign = "center";
    ctx.fillText(label, x + bw / 2, y + fs * 0.35);
  };

  // Caption sits on its own line at the top and is shrunk to fit rather than clipped.
  // Shrinking alone cannot always win: on a very narrow panel even 7px is too wide, and the
  // caption used to be clipped mid-word. Fall back through shorter wordings first, then shrink.
  const options = safe
    ? ["journal, then charge", "journal first", "journal->charge"]
    : ["charge, then a pruned key", "pruned key: 2nd charge", "retry = 2 charges"];
  const room = right - gutter;
  ctx.font = `500 ${fs}px ${opts.mono}`;
  let caption = options[options.length - 1];
  for (const candidate of options) {
    if (ctx.measureText(candidate).width <= room) {
      caption = candidate;
      break;
    }
  }
  let capFs = fs;
  while (ctx.measureText(caption).width > room && capFs > 7) {
    capFs -= 1;
    ctx.font = `500 ${capFs}px ${opts.mono}`;
  }
  ctx.fillStyle = tint;
  ctx.textAlign = "left";
  ctx.fillText(caption, gutter, h * 0.14);
  ctx.font = `500 ${fs}px ${opts.mono}`;

  if (safe) {
    // Intent is recorded first, so a retry can always be recognised as a retry.
    if (step(0) > 0) box(col1, laneA, "journal");
    if (step(1) > 0) {
      const fx = col1 + bw / 2;
      ctx.strokeStyle = c.verify;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(fx, laneA + bh / 2 + 2);
      ctx.lineTo(fx, laneA + bh / 2 + 2 + (laneB - laneA - bh - 4) * step(1));
      ctx.stroke();
    }
    if (step(2) > 0) box(col1, laneB, "charge");
  } else {
    // The money moved with nothing written down. Past the 24-hour key window the retry is
    // not recognised as one, and the customer is charged a second time.
    if (step(0) > 0) box(col1, laneB, "charge");
    if (step(1) > 0) {
      const y = laneB;
      const x0 = col1 + bw + 4;
      const x1 = col2 - 4;
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = c.fail;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + (x1 - x0) * step(1), y);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = c.fail;
      ctx.textAlign = "center";
      ctx.fillText("retry +24h", (x0 + x1) / 2, y - bh * 0.85);
    }
    if (step(2) > 0) {
      box(col2, laneB, "charge");
      ctx.fillStyle = c.fail;
      ctx.textAlign = "center";
      ctx.fillText("x2", col2 + bw / 2, laneB + bh * 1.5);
    }
  }
}

/* ---------------------------------------------------------------------------
   5. Session leakage.

   Each colour is one capture session — the same dish, photographed from several angles. Split
   by image and the same session lands on both sides of the boundary, so the model is scored on
   pictures it effectively trained on. Split by session and the sides stay clean.
   ------------------------------------------------------------------------ */
function leakage(ctx, w, h, t, c, opts) {
  const mid = w * 0.52;
  const cycle = 7;
  const p = REDUCED.matches ? 0.75 : (t % cycle) / cycle;
  const leaking = p < 0.5;

  const fs = Math.max(8, Math.min(12, Math.round(w * 0.026)));
  ctx.font = `500 ${fs}px ${opts.mono}`;

  const top = h * 0.2;
  const bottom = h * 0.82;
  const sessions = 8;
  const perSession = 6;
  const rowH = (bottom - top) / sessions;

  // The boundary between the two halves of the split.
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = c.lineBright;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mid, h * 0.14);
  ctx.lineTo(mid, bottom + rowH * 0.4);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = c.faint;
  ctx.textAlign = "right";
  ctx.fillText("train", mid - 8, h * 0.1);
  ctx.textAlign = "left";
  ctx.fillText("test", mid + 8, h * 0.1);

  // One row per capture session — the same dish, photographed several times. Grouping by row
  // is what makes a straddle visible: a leaked session has dots on both sides of the line.
  const leftMin = w * 0.06;
  const leftMax = mid - 14;
  const rightMin = mid + 14;
  const rightMax = w * 0.94;

  for (let sIdx = 0; sIdx < sessions; sIdx++) {
    const y = top + rowH * (sIdx + 0.5);
    const straddles = leaking && sIdx < 5;
    const onTestSide = !leaking && sIdx >= sessions - 2;
    const color = straddles ? c.fail : c.accent;

    // A hairline joining a straddling session's dots: the contamination, drawn as a link.
    if (straddles) {
      ctx.strokeStyle = c.fail;
      ctx.globalAlpha = 0.28 + 0.22 * Math.abs(Math.sin(t * 1.6 + sIdx));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftMin, y);
      ctx.lineTo(rightMax, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < perSession; i++) {
      const jitter = hash(sIdx * 41 + i * 7);
      let x;
      if (straddles) {
        // Split by image: half this session's photos land in test.
        x =
          i % 2 === 0
            ? rightMin + jitter * (rightMax - rightMin)
            : leftMin + jitter * (leftMax - leftMin);
      } else if (onTestSide) {
        x = rightMin + jitter * (rightMax - rightMin);
      } else {
        x = leftMin + jitter * (leftMax - leftMin);
      }

      ctx.beginPath();
      ctx.arc(x, y, straddles ? 3.4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = straddles ? 0.75 + 0.25 * Math.abs(Math.sin(t * 2 + sIdx)) : 0.5;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const caption = leaking ? "split by image - sessions straddle" : "split by session - sides clean";
  let capFs = fs;
  ctx.font = `500 ${capFs}px ${opts.mono}`;
  while (ctx.measureText(caption).width > w - leftMin * 2 && capFs > 7) {
    capFs -= 1;
    ctx.font = `500 ${capFs}px ${opts.mono}`;
  }
  ctx.textAlign = "left";
  ctx.fillStyle = leaking ? c.fail : c.verify;
  ctx.fillText(caption, leftMin, h * 0.96);
}

const RENDERERS = {
  apex: walkForward,
  crucible: causality,
  tradedesk: absentEdge,
  toolbelt: journalOrder,
  nutrition: leakage,
  hero: walkForward,
};

/**
 * Mount one instrument on a canvas. Returns a teardown function.
 */
export function mountInstrument(canvas, kind) {
  const draw = RENDERERS[kind];
  if (!canvas || !draw) return () => {};

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  const mono = getComputedStyle(canvas).getPropertyValue("--font-mono") || "monospace";
  const opts = { mono: mono.trim() || "monospace" };
  let w = 0;
  let h = 0;
  let raf = 0;
  let visible = false;
  const start = performance.now();

  function size() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function frame(now) {
    raf = 0;
    if (!w && !size()) return;
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h, t, palette(canvas), opts);
    if (visible && !REDUCED.matches) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) kick();
    },
    { rootMargin: "80px" },
  );
  io.observe(canvas);

  const ro = new ResizeObserver(() => {
    size();
    kick();
  });
  ro.observe(canvas);

  // Both themes and the motion preference can change while the page is open.
  const onScheme = () => kick();
  const mqDark = window.matchMedia("(prefers-color-scheme: dark)");
  mqDark.addEventListener?.("change", onScheme);
  REDUCED.addEventListener?.("change", onScheme);

  size();
  kick();

  return () => {
    io.disconnect();
    ro.disconnect();
    mqDark.removeEventListener?.("change", onScheme);
    REDUCED.removeEventListener?.("change", onScheme);
    if (raf) cancelAnimationFrame(raf);
  };
}
