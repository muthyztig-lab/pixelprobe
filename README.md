<div align="center">

# 🎨 PixelProbe

**Paste any URL → get back real design tokens + an A→Z recreation prompt.**

PixelProbe opens a site in a real headless browser, scrolls it, takes **2–3 screenshots**, and — most importantly — **extracts the actual computed styles straight from the DOM** (exact hex colors, fonts, CSS variables, spacing, radii, shadows, button styles). These real values, together with the screenshots, are sent to an AI that returns clean **design tokens + a large A→Z prompt** for recreating the design.

Works with any **OpenAI-compatible** API (Groq · OpenRouter · OpenAI · …) or Google Gemini. The simplest **free, no-billing** option is **Groq**.

<sub>React 19 · Tailwind v4 · TypeScript · Playwright · Express</sub>

</div>

---

## ✨ Highlights

- **Accuracy from the DOM, not guesswork.** Colors and fonts are pulled from the page's real computed styles — the model only organizes them by role, it doesn't invent them.
- **A big A→Z prompt.** A full Markdown design spec (brand, colors, typography, spacing, components, voice, accessibility + a ready-to-paste *recreation prompt*). You can **copy** it or **download** it as `Shopify.md`.
- **One folder, one command.** Frontend and backend run on a single port — no two terminals.
- **Modern UI** — React 19 + Tailwind v4, non-default fonts, light/dark theme.
- **Pages:** Home, Showcase, Components, Pricing, Changelog.
- **Works even without a key** — returns a clearly labeled demo result instead of crashing.

---

## 🚀 Quick start

Requires **Node.js 18+** ([nodejs.org](https://nodejs.org), LTS version).

```bash
# 1. install dependencies (also auto-downloads the headless browser)
npm install

# 2. (optional) add an AI key for real analysis
cp .env.example .env        # Windows: copy .env.example .env
#   → set AI_API_KEY. Free Groq key: https://console.groq.com/keys

# 3. run — site + API in one command, one terminal
npm run dev
```

Open **http://localhost:5173**, paste a site URL, and hit **“Run scan”**.

> Without a key everything still works, just in demo mode (shows example tokens).

### 🔑 Which key to grab (free, no card)

1. **Groq** (recommended) — [console.groq.com/keys](https://console.groq.com/keys) → `Create API Key`.
   In `.env`, keep the default `AI_BASE_URL` / `AI_MODEL` and set `AI_API_KEY=gsk_...`.
2. **OpenRouter** — [openrouter.ai/keys](https://openrouter.ai/keys), then set:
   ```env
   AI_BASE_URL=https://openrouter.ai/api/v1
   AI_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
   ```
3. **Gemini** — if `AI_API_KEY` is empty, `GEMINI_API_KEY` is used instead.

> If the provider returns `429 / quota`, that's your key's rate limit, not a bug. Wait a minute, switch `AI_MODEL`, or grab a Groq key (no billing there).

---

## 📦 Production build

```bash
npm run build      # builds the site into /dist
npm start          # serves the site + API from /dist
```

---

## ⚙️ Environment variables (`.env`)

| Variable | Description |
| --- | --- |
| `AI_API_KEY` | Key for an OpenAI-compatible API (Groq/OpenRouter/OpenAI). The primary option. |
| `AI_BASE_URL` | Provider base URL. Defaults to Groq. |
| `AI_MODEL` | Vision model. Defaults to `meta-llama/llama-4-scout-17b-16e-instruct` (Groq). |
| `GEMINI_API_KEY` | Alternative — Gemini. Used only if `AI_API_KEY` is empty. |
| `GEMINI_MODEL` | Gemini model. Defaults to `gemini-2.0-flash`. |
| `PORT` | Port for site + API. Defaults to `5173`. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | (Optional) Enables accounts + credits. Empty → “open mode”, no login. |
| `SUPABASE_SERVICE_ROLE_KEY` | (Optional, SECRET) Server-side key — safely deducts credits. Never expose to the browser. |
| `SIGNUP_CREDITS` / `SCAN_COST` / `FREE_ANON_SCANS` | Credit economy (25 / 5 / 1 by default). |
| `AUTH_COOKIE_SECRET` | Secret for signing the free-scan cookie. |

---

## 👤 Accounts + credits (optional)

By default PixelProbe runs in **open mode**: no login, unlimited scans. To enable
sign-in (email + Google) and credits, connect a free **Supabase** project —
step-by-step guide in **[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)**.

Model: 1 free anonymous scan → sign up for 25 credits (5 per scan). Credits are
deducted **server-side only** via a protected RPC function — they can't be
changed from the browser (RLS, no write policies).

---

## 🗂 Structure

```
pixelprobe/
├── server.ts              # single entry point: Express + Vite (site + API together)
├── index.html
├── vite.config.ts
├── package.json
├── .env.example
└── src/
    ├── main.tsx           # frontend bootstrap
    ├── App.tsx            # router (Home / Showcase / Components / Pricing / Changelog)
    ├── components/        # ui/ · layout/ · scan/
    ├── pages/             # pages
    ├── hooks/             # useScan, useTheme
    ├── data/              # page content
    ├── lib/               # api, types, utils
    ├── icons/  · styles/
    └── server/            # backend
        ├── config.ts              # provider selection (OpenAI-compatible / Gemini)
        ├── types.ts
        ├── routes/scan.ts         # POST /api/scan
        └── services/
            ├── capture.ts         # Playwright: screenshots + real DOM styles
            └── analyze.ts         # AI: tokens + A→Z prompt
```

---

## 🔌 API

- `GET /api/health` → `{ ok, ai, provider, model }`
- `POST /api/scan` `{ "url": "stripe.com" }` → JSON with tokens (`colors`, `fonts`,
  `spacing`, `radii`, `shadows`, `components`, `cssVariables`).

---

## 📄 License

Released under the **MIT License** — see [`LICENSE.md`](./LICENSE.md).
