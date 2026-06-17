import { useEffect, useRef } from "react";

/**
 * Scan wave over the grid. A diagonal beam travels across the screen; the grid
 * lines it touches light up crisply and the intersections flash as bright
 * nodes — so it clearly reads as the grid being scanned, not a soft glow.
 * Canvas-based, matches the static `.grid-bg` spacing, purely decorative.
 * Runs regardless of prefers-reduced-motion so the wave is always visible.
 */
const SPACING = 160; // must match .grid-bg background-size
const BAND = 260; // half-width of the lit beam, in diagonal px
const SWEEP = 16; // seconds for one beam pass across the screen
const REST = 2; // seconds the beam waits off-screen between passes

// The beam alternates between these travel directions so each pass comes from a
// different corner — top-right→bottom-left, top-left→bottom-right and back.
const ANGLES = [125, 55, 235, 305].map((d) => (d * Math.PI) / 180);

// Smooth ease-in-out so the beam accelerates in and settles out, never a
// constant mechanical slide.
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function GridScan() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const context = cv.getContext("2d");
    if (!context) return;
    const canvas = cv;
    const ctx = context;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let projMin = 0;
    let projMax = 0;
    let raf = 0;
    const startedAt = performance.now();

    // Current diagonal direction the beam travels along. Updated each pass.
    let dirX = Math.cos(ANGLES[0]);
    let dirY = Math.sin(ANGLES[0]);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Projection range of the four corners for the current direction, so the
    // beam sweeps exactly the visible area with no long off-screen dead time.
    function updateProjection() {
      const corners = [0, dirX * w, dirY * h, dirX * w + dirY * h];
      projMin = Math.min(...corners);
      projMax = Math.max(...corners);
    }

    // Brightness for a point: peaks on the beam centre, falls to 0 at the band
    // edge, and fades toward the bottom of the screen.
    function intensity(px: number, py: number, pos: number) {
      const dist = Math.abs(px * dirX + py * dirY - pos);
      if (dist > BAND) return 0;
      const t = 1 - dist / BAND;
      const topFade = Math.max(0.15, 1 - py / (h * 0.95));
      return t * t * topFade;
    }

    function drawLine(x1: number, y1: number, x2: number, y2: number, pos: number) {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.max(1, Math.ceil(len / 16));
      for (let i = 0; i < steps; i++) {
        const a = i / steps;
        const b = (i + 1) / steps;
        const mx = x1 + (x2 - x1) * (a + b) * 0.5;
        const my = y1 + (y2 - y1) * (a + b) * 0.5;
        const k = intensity(mx, my, pos);
        if (k < 0.015) continue;
        ctx.strokeStyle = `rgba(170, 185, 255, ${Math.min(0.45, k * 0.6)})`;
        ctx.beginPath();
        ctx.moveTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a);
        ctx.lineTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
        ctx.stroke();
      }
    }

    function frame(now: number) {
      ctx.clearRect(0, 0, w, h);

      // Split time into passes of SWEEP + REST seconds. Each pass picks the next
      // angle, so the beam keeps arriving from a fresh corner.
      const elapsed = (now - startedAt) / 1000;
      const cycle = SWEEP + REST;
      const passIndex = Math.floor(elapsed / cycle);
      const localTime = elapsed - passIndex * cycle;

      const ang = ANGLES[passIndex % ANGLES.length];
      dirX = Math.cos(ang);
      dirY = Math.sin(ang);
      updateProjection();

      // Eased progress 0→1 during the sweep, parked off-screen during the rest.
      const progress = easeInOut(Math.min(1, localTime / SWEEP));
      const pos = projMin - BAND + progress * (projMax - projMin + BAND * 2);

      ctx.lineWidth = 1.3;
      for (let x = 0; x <= w; x += SPACING) drawLine(x, 0, x, h, pos);
      for (let y = 0; y <= h; y += SPACING) drawLine(0, y, w, y, pos);

      // Bright nodes at intersections the beam is crossing.
      for (let x = 0; x <= w; x += SPACING) {
        for (let y = 0; y <= h; y += SPACING) {
          const k = intensity(x, y, pos);
          if (k < 0.06) continue;
          // Soft glow halo around each lit node, then a subtle brighter core.
          ctx.beginPath();
          ctx.arc(x, y, 3 + k * 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150, 170, 255, ${Math.min(0.18, k * 0.2)})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 1.2 + k * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(206, 216, 255, ${Math.min(0.55, k * 0.65)})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="grid-scan-canvas" />;
}
