/**
 * Single entry point for the whole app.
 *
 *  - `npm run dev`  → starts Express + Vite (with hot reload) on ONE port.
 *                     The same server handles the website AND the /api routes,
 *                     so you only need one terminal and one command.
 *  - `npm run build` → builds the static site into /dist.
 *  - `npm start`     → serves the built site + API in production.
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import helmet from "helmet";
import { config, hasAI, provider, activeModel } from "./src/server/config.js";
import { scanRouter } from "./src/server/routes/scan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";

async function start() {
  const app = express();
  // Security headers (anti-clickjacking, no-sniff, HSTS, removes X-Powered-By…).
  // CSP and COEP are left off so the Vite dev client and external preview images
  // (screenshots, favicons, data: URIs) keep working.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // ── API ──────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ai: hasAI, provider, model: activeModel });
  });
  app.use("/api", scanRouter);

  // ── Frontend ─────────────────────────────────────────────────────────
  if (isProd) {
    // Serve the production build from /dist.
    const dist = path.resolve(__dirname, "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  } else {
    // Run Vite in middleware mode → website + hot reload on the same server.
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(config.port, () => {
    console.log(`\n  PixelProbe → http://localhost:${config.port}`);
    console.log(
      `  AI: ${hasAI ? `${provider} (${activeModel})` : "demo mode — add AI_API_KEY to .env for real analysis"}\n`,
    );
  });
}

start().catch((err) => {
  console.error("Failed to start PixelProbe:", err);
  process.exit(1);
});
