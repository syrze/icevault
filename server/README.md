# ICEVAULT Backend

Node.js + Express + SQLite + WebSocket. Замовлення, звернення з форми, статистика, admin dashboard з live-оновленнями.

## Запуск

```bash
cd server
npm install
npm start            # http://localhost:3000
# або
npm run dev          # auto-restart on change
```

Сервер віддає статику з `../` (корінь сайту) — `http://localhost:3000` відкриває `index.html`, працює форма й AI-помічник.

## Admin Dashboard

```
http://localhost:3000/admin
```

Token за замовчуванням: `icevault-admin-2026`. Зміни через env:

```bash
ADMIN_TOKEN=mySecret PORT=4000 npm start
```

## API

| Метод | Шлях                       | Призначення                          | Auth |
|-------|----------------------------|--------------------------------------|------|
| POST  | `/api/orders`              | Створити замовлення                  | —    |
| GET   | `/api/orders/:id`          | Статус замовлення за ID              | —    |
| POST  | `/api/contact`             | Контактна форма                      | —    |
| POST  | `/api/pageview`            | Лічильник переглядів                 | —    |
| GET   | `/api/stats`               | KPI (orders, revenue, top cities)    | —    |
| GET   | `/api/stock/:sku`          | Залишок товару                       | —    |
| GET   | `/api/admin/orders`        | Список замовлень                     | token |
| PATCH | `/api/admin/orders/:id`    | Змінити статус (new/processing/shipped/delivered/cancelled) | token |
| GET   | `/api/admin/contacts`      | Список звернень                      | token |
| PUT   | `/api/admin/stock/:sku`    | Оновити залишок                      | token |
| GET   | `/api/health`              | Healthcheck                          | —    |
| WS    | `/ws`                      | Live events (order:new, order:update, contact:new) | — |

Header `X-Admin-Token: <ADMIN_TOKEN>` для admin-роутів.

## БД

SQLite файл `server/icevault.db` (WAL). Таблиці:
- `orders` — id, name, email, phone, city, comment, items_json, total, status, created_at
- `contacts` — name, email, phone, subject, message, created_at
- `stock` — sku, qty
- `pageviews` — path, ts

## Live Demo Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"name":"Тест","email":"a@b.com","phone":"+380","city":"Київ",
       "items":[{"sku":"x","name":"Bauer","price":1000,"qty":2}]}'
```
