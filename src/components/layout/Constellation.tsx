import { useEffect, useRef } from "react";

/**
 * Animated particle backdrop — a field of soft drifting, twinkling stars.
 * Canvas-based, sits behind all content, ignores pointer events, purely
 * decorative. (No connecting lines — just the particles.)
 */
export function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const context = cv.getContext("2d");
    if (!context) return;
    // Capture as non-null consts so the narrowing survives inside the closures.
    const canvas = cv;
    const ctx = context;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      tw: number; // twinkle phase
    }
    let nodes: Node[] = [];

    function seed() {
      // Density scales with screen area, capped for performance.
      const count = Math.min(120, Math.max(40, Math.floor((w * h) / 14000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 0.7 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      // Move stars; wrap softly around the edges.
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = w + 10;
        else if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10;
        else if (n.y > h + 10) n.y = -10;
        n.tw += 0.02;
      }

      // Stars — soft twinkle on the brightness.
      for (const n of nodes) {
        const glow = 0.28 + Math.sin(n.tw) * 0.16;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,190,255,${glow})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="constellation" />;
}
