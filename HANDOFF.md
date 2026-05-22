# ICEVAULT — Handoff для нового чату

Diploma project. Hockey shop (static HTML/JS/CSS) + Node backend. Caveman mode active.

## Стан задач

Користувач дав 4 цілі. Виконано:

- ✅ **Backend** — Node/Express + SQLite + WebSocket. `server/` директорія.
- ✅ **Форма замовлень** — wired до backend через POST `/api/orders` з fallback Web3Forms → mailto.
- ✅ **13 wiki SVG** — перемальовано всі, додано background grid `#gridA..M`, badge-style labels, чіткіша типографія.
- ✅ **Cleanup** — видалено legacy `.cart-checkout` confirm-flow (lines 1026-1048 of old script.js), merged filter history-push, replaced welcome alert with toast, removed duplicate section 27 stub.

Все працює. Smoke test пройшов: orders POST → 200 з ID `IV-XXXXXXXX`, contact POST → 200, stats GET повертає revenue/topCities/last7.

## Architecture

```
/Users/sinielnikovruslan/Developer/Uni/Diploma/
├── index.html        — main shop page (checkout modal id=checkoutForm)
├── wiki.html         — 13 hockey technique cards, each with 320x320 SVG
├── contacts.html     — contact form (cName/cEmail/cSubject/cMsg/cAgree)
├── script.js         — 1597 lines, sections 1-33
├── style.css         — 1338 lines
├── three3d.js        — Three.js hero scene
├── server/
│   ├── server.js     — Express app, port 3000, ADMIN_TOKEN env
│   ├── db.js         — SQLite (better-sqlite3, WAL mode)
│   ├── package.json  — deps: express, cors, ws, nanoid, better-sqlite3, express-rate-limit
│   ├── public/
│   │   └── admin.html — Tailwind+Chart.js dashboard, WS live updates
│   ├── README.md
│   └── icevault.db   — auto-created (gitignored)
└── photo/, assets/, output/
```

## Backend API

| Метод | Шлях | Auth |
|-------|------|------|
| POST  | `/api/orders` | — |
| GET   | `/api/orders/:id` | — |
| POST  | `/api/contact` | — |
| POST  | `/api/pageview` | — |
| GET   | `/api/stats` | — |
| GET   | `/api/stock/:sku` | — |
| GET   | `/api/admin/orders` | token |
| PATCH | `/api/admin/orders/:id` | token |
| GET   | `/api/admin/contacts` | token |
| PUT   | `/api/admin/stock/:sku` | token |
| WS    | `/ws` | — (events: order:new, order:update, contact:new) |

Header `X-Admin-Token`. Default token: `icevault-admin-2026`.

Запуск:
```bash
cd server && npm install && npm start
# http://localhost:3000          → сайт
# http://localhost:3000/admin    → dashboard
```

## Frontend integration

`script.js` section 32 (CHECKOUT FORM): triple-fallback chain — `sendViaBackend` → `sendViaWeb3Forms` → `buildMailto`. Cart items mapped до `{sku,name,size,price,qty}[]`.

Section 33 (BACKEND EXTRAS):
- pageview ping on load
- `window.trackOrder(id)` — global fn
- `#trackOrderBtn` + `#trackOrderInput` + `#trackOrderResult` listener (опціонально в HTML, поки не доданий UI блок)

`WEB3FORMS_KEY = '9f196991-7ce7-49ea-a397-ad2eb9b111dd'` — поки sample, треба замінити на свій.

## Wiki SVG style guide

Всі 13 SVG follow єдиний паттерн:
- `viewBox="0 0 320 320"`
- `<defs><pattern id="grid[A-M]" 40x40>` — subtle grid
- Top label badge: `font-family="Unbounded" font-size="13" letter-spacing="3" font-weight="700"`
- Палітра: gold `#c9a84c`, red `#e62e2e`, off-white `#f0ede8`, dark `#1a1a1a`, mute `#666/#888`
- Pill badges: `rect rx="11"` з fill solid color, white/black text font-weight="800"

## Що можна додати далі (якщо користувач попросить)

1. Track-order UI block в `index.html` під hero — input + button + result div (логіка вже є в section 33).
2. Stock badges на product cards — fetch `/api/stock/:sku` на render.
3. Email-через-backend (зараз backend не шле email; може додати nodemailer + SMTP).
4. JWT instead of static admin token.
5. Docker compose для backend.
6. CSS cleanup (1338 lines не пройдено детально).
7. Migrate inline checkout-status colors до CSS vars.

## Git стан (на момент handoff)

Branch `main`. Uncommitted:
- M index.html (checkout form action знято, hidden inputs скорочено)
- M script.js (cleanup + backend wiring)
- M wiki.html (13 SVG replaced)
- A server/* (нова директорія)
- A HANDOFF.md (цей файл)

Recent commits:
```
44c4296 Remove stray icevault submodule that broke Pages build
8361440 chore: trigger Pages rebuild
ccf7315 Remove cart-empty guard so checkout modal always opens
ec1b8e7 Add Web3Forms as primary email channel with FormSubmit + mailto fallback
75fdf45 Add catalog expansion, AI assistant, email checkout, wiki diagram refresh
```

## Project conventions (з CLAUDE.md)

- Українська мова в відповідях
- Темна тема за замовчуванням
- Палітра: indigo #6366f1, purple #8b5cf6, pink #ec4899, green #10b981, amber #f59e0b
- Output files у `./output/`
- Plotly для interactive charts, Mermaid для diagrams, Tailwind для mockups

## Smoke test results (last verified)

```
$ curl /api/health           → {"ok":true,...}
$ POST /api/orders           → {"ok":true,"id":"IV-YAEEPDVM","total":18900,"status":"new"}
$ POST /api/contact          → {"ok":true}
$ GET /api/stats             → {"orders_total":2,"revenue_total":30900,...,"topCities":[...]}
$ node -e new Function(script.js) → syntax OK
$ wiki.html 13 SVGs, g-tags balanced
```

## Як продовжити в новому чаті

Дай моделі цей файл як перший меседж. Достатньо контексту щоб не reread'ити index.html / script.js / wiki.html повністю. Якщо потрібно щось специфічне — Read tool по конкретних рядках.

Caveman mode активний у проєкті по hook'у SessionStart. Українська мова. Не пере-стартовуй backend якщо не треба — `pkill -f "node server.js"` для killу.
