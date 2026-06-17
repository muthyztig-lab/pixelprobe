# PixelProbe

Встав посилання на будь-який сайт → PixelProbe відкриває його у справжньому
headless-браузері, прокручує, робить **2–3 скріншоти** і — головне —
**витягує справжні computed-стилі прямо з DOM** (точні hex-кольори, шрифти,
CSS-змінні, відступи, радіуси, тіні, стилі кнопок). Ці реальні дані разом зі
скріншотами йдуть у AI, яка повертає design-токени **+ великий промт A→Z** для
відтворення дизайну.

Працює з будь-яким **OpenAI-сумісним** API (Groq · OpenRouter · OpenAI · …) або
з Google Gemini. Найпростіший **безкоштовний** варіант без білінгу — **Groq**.

## ✨ Головне
- **Точність із DOM, а не «на око».** Кольори/шрифти беруться з реальних
  computed-стилів сторінки — модель їх лише організовує за ролями, а не вгадує.
- **Великий промт A→Z.** Повна Markdown-специфікація дизайну (бренд, кольори,
  типографіка, відступи, компоненти, голос, доступність + готовий «recreation
  prompt»). Можна **скопіювати** або **завантажити** як `Shopify.md`.
- **Одна папка, одна команда.** Сайт і бекенд на одному порту — без двох терміналів.
- Сучасний UI (React 19 + Tailwind v4), не дефолтні шрифти, світла/темна тема.
- Сторінки: Home, Showcase, Components, Pricing, Changelog.
- **Працює навіть без ключа** — повертає позначений демо-результат (не падає).

## 🚀 Запуск

Потрібен **Node.js 18+** (https://nodejs.org, версія LTS).

```bash
# 1. встанови залежності (також автоматично завантажить headless-браузер)
npm install

# 2. (опціонально) додай ключ AI для реального аналізу
cp .env.example .env        # Windows: copy .env.example .env
#   → впиши AI_API_KEY. Безкоштовний ключ Groq: https://console.groq.com/keys

# 3. запусти — сайт + API однією командою, один термінал
npm run dev
```

Відкрий **http://localhost:5173**, встав URL сайту і натисни «Run scan».

> Без ключа усе працює, але в демо-режимі (показує приклад токенів).

### 🔑 Який ключ узяти (безкоштовно, без картки)
1. **Groq** (рекомендовано) — https://console.groq.com/keys → `Create API Key`.
   У `.env` лиши дефолтні `AI_BASE_URL` / `AI_MODEL` і встав `AI_API_KEY=gsk_...`.
2. **OpenRouter** — https://openrouter.ai/keys, постав:
   ```
   AI_BASE_URL=https://openrouter.ai/api/v1
   AI_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
   ```
3. **Gemini** — якщо `AI_API_KEY` порожній, використається `GEMINI_API_KEY`.

> Якщо провайдер віддає `429 / quota` — це ліміт твого ключа, не баг. Зачекай
> хвилину, зміни `AI_MODEL` або візьми ключ Groq (там немає білінгу).

## 📦 Прод-збірка

```bash
npm run build      # збирає сайт у /dist
npm start          # запускає сайт + API з /dist
```

## ⚙️ Змінні оточення (`.env`)

| Змінна | Опис |
| --- | --- |
| `AI_API_KEY` | Ключ OpenAI-сумісного API (Groq/OpenRouter/OpenAI). Головний варіант. |
| `AI_BASE_URL` | Базовий URL провайдера. За замовч. Groq. |
| `AI_MODEL` | Vision-модель. За замовч. `meta-llama/llama-4-scout-17b-16e-instruct` (Groq). |
| `GEMINI_API_KEY` | Альтернатива — Gemini. Використається лише якщо `AI_API_KEY` порожній. |
| `GEMINI_MODEL` | Модель Gemini. За замовч. `gemini-2.0-flash`. |
| `PORT` | Порт сайту + API. За замовч. `5173`. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | (Опц.) Вмикає акаунти + кредити. Порожні → «open mode» без логіну. |
| `SUPABASE_SERVICE_ROLE_KEY` | (Опц., СЕКРЕТ) Серверний ключ — безпечно списує кредити. Ніколи не в браузер. |
| `SIGNUP_CREDITS` / `SCAN_COST` / `FREE_ANON_SCANS` | Економіка кредитів (25 / 5 / 1 за замовч.). |
| `AUTH_COOKIE_SECRET` | Секрет для підпису cookie безкоштовного скану. |

## 👤 Акаунти + кредити (опціонально)

За замовчуванням — **open mode**: без логіну, безліч сканів. Щоб увімкнути
вхід (email + Google) і кредити, підключи безкоштовний проєкт **Supabase**:
покрокова інструкція у **[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)**.
Модель: 1 безкоштовний скан анонімно → реєстрація дає 25 кредитів (5 за скан).
Кредити списуються **тільки на сервері** через захищену RPC-функцію — з браузера
їх змінити неможливо (RLS, без write-політик).

## 🗂 Структура

```
pixelprobe/
├── server.ts              # єдина точка входу: Express + Vite (сайт + API разом)
├── index.html
├── vite.config.ts
├── package.json
├── .env.example
└── src/
    ├── main.tsx           # старт фронтенду
    ├── App.tsx            # роутер (Home / Showcase / Components / Pricing / Changelog)
    ├── components/        # ui/ · layout/ · scan/
    ├── pages/             # сторінки
    ├── hooks/             # useScan, useTheme
    ├── data/              # контент сторінок
    ├── lib/               # api, типи, утиліти
    ├── icons/  · styles/
    └── server/            # бекенд
        ├── config.ts              # вибір провайдера (OpenAI-сумісний / Gemini)
        ├── types.ts
        ├── routes/scan.ts         # POST /api/scan
        └── services/
            ├── capture.ts         # Playwright: скріншоти + реальні DOM-стилі
            └── analyze.ts         # AI: токени + промт A→Z
```

## 🔌 API
- `GET /api/health` → `{ ok, ai, provider, model }`
- `POST /api/scan` `{ "url": "stripe.com" }` → JSON з токенами (`colors`, `fonts`,
  `spacing`, `radii`, `shadows`, `components`, `cssVariables`).
