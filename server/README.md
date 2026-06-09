# ICEVAULT Backend

Node.js + Express + SQLite + WebSocket. Замовлення, звернення з форми, статистика, admin dashboard з live-оновленнями.

## Запуск

```bash
cd server
npm install
node scripts/extract.mjs   # (одноразово) script.js -> data/products.json
node seed.js               # заповнити БД каталогом (ідемпотентно)
npm start                  # http://localhost:3000
# або
npm run dev                # auto-restart on change
```

Сервер віддає статику з `../` (корінь сайту) — `http://localhost:3000` відкриває `index.html`, працює форма й AI-помічник.

Каталог тягнеться з БД через `GET /api/products`. Якщо сервер недоступний (статичний хостинг GitHub Pages), фронтенд відкочується на `../products.json`.

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
| GET   | `/api/products`           | Весь каталог (JOIN brands/categories/variants) | — |
| POST  | `/api/orders`              | Створити замовлення (+ order_items, списання залишку) | — |
| GET   | `/api/orders/:id`          | Статус замовлення за ID              | —    |
| POST  | `/api/contact`             | Контактна форма                      | —    |
| POST  | `/api/subscribe`           | Підписка на знижку                   | —    |
| POST  | `/api/pageview`            | Лічильник переглядів                 | —    |
| GET   | `/api/stats`               | KPI (orders, revenue, top cities)    | —    |
| GET   | `/api/stock/:sku`          | Залишок товару (SUM по варіантах)    | —    |
| GET   | `/api/stock/batch?skus=`   | Залишки кількох товарів              | —    |
| GET   | `/api/admin/orders`        | Список замовлень (+ позиції)         | token |
| PATCH | `/api/admin/orders/:id`    | Змінити статус (new/processing/shipped/delivered/cancelled) | token |
| GET   | `/api/admin/contacts`      | Список звернень                      | token |
| PUT   | `/api/admin/stock/:sku`    | Залишок (body `qty`, опц. `size` для варіанта) | token |
| GET   | `/api/health`              | Healthcheck                          | —    |
| WS    | `/ws`                      | Live events (order:new, order:update, contact:new, stock:update) | — |

Header `X-Admin-Token: <ADMIN_TOKEN>` для admin-роутів.

## БД

SQLite файл `server/icevault.db` (WAL, `foreign_keys=ON`), нормалізація 3NF. ER-діаграма: `output/db_schema.md` / `.svg`. Таблиці:
- `brands` — id, name, slug, country
- `categories` — id, code, name_uk, sort_order
- `products` — id, name, brand_id→brands, category_id→categories, price, badge, img, img_desc, description, created_at
- `product_variants` — id, product_id→products, size, sku, stock_qty (залишок по розміру)
- `orders` — id, name, email, phone, city, comment, total, status, created_at
- `order_items` — id, order_id→orders, product_id→products, variant_id→product_variants, size, qty, unit_price
- `contacts` — name, email, phone, subject, message, created_at
- `subscribers` — email
- `pageviews` — path, ts
- `admins` — username, password_hash (scrypt), role

Схема створюється у `db.js`, наповнення — `seed.js` (з `data/products.json`).

## Live Demo Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"name":"Тест","email":"a@b.com","phone":"+380","city":"Київ",
       "items":[{"id":"bauer-supreme-mach","name":"Supreme MACH","price":48000,"qty":1,"size":"9"}]}'
```
