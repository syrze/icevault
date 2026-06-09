// ============================================================================
//  db.js — СТВОРЕННЯ БАЗИ ДАНИХ (схема = опис усіх таблиць)
// ============================================================================
//
//  ПРОСТИМИ СЛОВАМИ:
//  База даних — це як набір Excel-таблиць, які лежать в одному файлі
//  (server/icevault.db). Кожна таблиця = окремий аркуш зі стовпцями й рядками.
//  Цей файл НЕ зберігає самі дані — він лише ОПИСУЄ, які таблиці існують і
//  які в них стовпці (це називається "схема"). Дані додає seed.js та сайт.
//
//  СЛОВНИК (щоб пояснити на захисті):
//   • Таблиця (TABLE) — аркуш даних (напр. "товари", "замовлення").
//   • Рядок (row)      — один запис (один товар, одне замовлення).
//   • Стовпець/поле    — характеристика (назва, ціна, email...).
//   • PRIMARY KEY (PK) — унікальний номер рядка, "паспорт". Двох однакових нема.
//   • FOREIGN KEY (FK) — посилання на рядок іншої таблиці ("цей товар —
//                        бренду №3"). Так таблиці зв'язуються між собою.
//   • UNIQUE (UK)      — значення не може повторюватись (напр. email підписника).
//   • INDEX            — "алфавітний покажчик": прискорює пошук по стовпцю.
//   • Нормалізація (3NF) — кожен факт зберігаємо в ОДНОМУ місці, без дублів
//                        (бренд "Bauer" записаний раз у таблиці brands, а товари
//                        лише посилаються на нього номером). Менше помилок.
//
//  Бібліотека better-sqlite3 — це "перекладач" між JavaScript і файлом бази.
//  Вона синхронна (працює крок за кроком), тому код простий, без async/await.
// ============================================================================

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

// __dirname — папка, де лежить цей файл (server/). У сучасному JS її треба
// "відновити" вручну з import.meta.url — ці два рядки саме це й роблять.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Відкриваємо (або створюємо, якщо ще нема) файл бази даних icevault.db.
// Уся база — це ОДИН файл на диску. Його можна копіювати = резервна копія.
const db = new Database(path.join(__dirname, 'icevault.db'));

db.pragma('journal_mode = WAL');   // дозволяє читати й писати одночасно (швидше для веб-сервера)
db.pragma('foreign_keys = ON');    // вмикає перевірку зв'язків між таблицями (за замовч. SQLite вимикає)

// db.exec(...) виконує SQL-команди створення таблиць.
// "CREATE TABLE IF NOT EXISTS" = "створи таблицю, якщо її ще немає" —
// тому повторний запуск сервера нічого не ламає й не стирає.
db.exec(`
  -- ========================= ДОВІДНИКИ =========================
  -- Невеликі таблиці-списки, на які посилаються товари.

  -- БРЕНДИ виробників (Bauer, CCM, Warrior...). Зберігаються один раз тут.
  CREATE TABLE IF NOT EXISTS brands (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,  -- авто-номер 1,2,3... (паспорт бренду)
    name        TEXT NOT NULL UNIQUE,               -- назва; UNIQUE = двох "Bauer" не буде
    slug        TEXT NOT NULL UNIQUE,               -- назва для URL (bauer, ccm)
    country     TEXT                                 -- країна (може бути порожньою)
  );

  -- КАТЕГОРІЇ товарів (ковзани, ключки, шоломи...).
  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,   -- технічний ключ як на сайті: skates, sticks...
    name_uk     TEXT NOT NULL,          -- назва українською для людей: "Ковзани"
    sort_order  INTEGER NOT NULL DEFAULT 0  -- порядок показу в меню
  );

  -- ========================= ТОВАРИ =========================

  -- ТОВАР = одна картка каталогу. Замість тексту "Bauter" зберігаємо НОМЕР бренду
  -- (brand_id) і НОМЕР категорії (category_id) — це і є зв'язок (FOREIGN KEY).
  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,                          -- текстовий код товару (bauer-supreme-mach)
    name        TEXT NOT NULL,                             -- назва моделі
    brand_id    INTEGER NOT NULL REFERENCES brands(id),    -- ↔ який бренд (номер з таблиці brands)
    category_id INTEGER NOT NULL REFERENCES categories(id),-- ↔ яка категорія (номер з categories)
    price       INTEGER NOT NULL,                          -- ціна у гривнях
    badge       TEXT,                                      -- наліпка NEW/PRO/GOALIE (може не бути)
    img         TEXT,                                      -- шлях до фото
    img_desc    TEXT,                                      -- текстовий опис фото (alt)
    description TEXT,                                       -- докладний опис (може бути порожнім)
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))    -- коли додано (ставиться автоматично)
  );

  -- ВАРІАНТ товару = конкретний РОЗМІР + скільки його на складі.
  -- Наявність залежить від розміру (42-го може не бути, 44-го — є), тому
  -- залишок (stock_qty) логічно тримати саме тут, а не в товарі.
  CREATE TABLE IF NOT EXISTS product_variants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,  -- ↔ якого товару розмір
    size        TEXT NOT NULL,                              -- сам розмір (9, M, SR...)
    sku         TEXT NOT NULL UNIQUE,                       -- артикул = id товару + розмір
    stock_qty   INTEGER NOT NULL DEFAULT 0,                 -- скільки штук на складі
    UNIQUE (product_id, size)                               -- один розмір товару — один рядок
  );
  -- ON DELETE CASCADE: якщо видалити товар — його розміри зникнуть автоматично.

  -- ========================= ЗАМОВЛЕННЯ =========================

  -- ЗАМОВЛЕННЯ (шапка): дані клієнта + загальна сума + статус. Самі товари —
  -- окремо в order_items (бо в одному замовленні їх може бути багато).
  CREATE TABLE IF NOT EXISTS orders (
    id          TEXT PRIMARY KEY,        -- код замовлення IV-XXXXXXXX
    name        TEXT NOT NULL,           -- ім'я клієнта
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL,
    city        TEXT NOT NULL,
    comment     TEXT,                    -- коментар клієнта (необов'язково)
    total       INTEGER NOT NULL,        -- сума замовлення (рахує сервер, не клієнт)
    status      TEXT NOT NULL DEFAULT 'new',           -- new/processing/shipped/delivered/cancelled
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ПОЗИЦІЇ замовлення: один рядок = один товар у замовленні.
  -- order_id каже, до якого замовлення належить рядок (FK на orders).
  -- unit_price — "знімок" ціни на момент покупки: навіть якщо ціну в каталозі
  -- потім змінять, у старому замовленні залишиться та, за якою купили.
  CREATE TABLE IF NOT EXISTS order_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,  -- ↔ до якого замовлення
    product_id  TEXT REFERENCES products(id),                  -- ↔ який товар
    variant_id  INTEGER REFERENCES product_variants(id),       -- ↔ який саме розмір
    size        TEXT,
    qty         INTEGER NOT NULL,        -- кількість
    unit_price  INTEGER NOT NULL         -- ціна за штуку (знімок)
  );

  -- ========================= ІНШЕ =========================

  -- Повідомлення з форми "Контакти".
  CREATE TABLE IF NOT EXISTS contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    subject     TEXT,
    message     TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Підписники на знижку (форма email). UNIQUE — один email не запишеться двічі.
  CREATE TABLE IF NOT EXISTS subscribers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Лічильник переглядів сторінок (проста аналітика: який розділ популярний).
  CREATE TABLE IF NOT EXISTS pageviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT NOT NULL,           -- яку сторінку відкрили
    ts          TEXT NOT NULL DEFAULT (datetime('now'))  -- коли
  );

  -- Адміністратори. password_hash — пароль зберігаємо НЕ відкрито, а у вигляді
  -- "хешу" (scrypt): з нього не можна відновити пароль, але можна перевірити.
  -- role — роль (admin тощо), задум на майбутнє розмежування прав (RBAC).
  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ========================= ІНДЕКСИ =========================
  -- Прискорюють пошук/сортування по цих стовпцях (як покажчик у книзі).
  CREATE INDEX IF NOT EXISTS idx_products_brand     ON products(brand_id);
  CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_variants_product   ON product_variants(product_id);
  CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_pageviews_path     ON pageviews(path);
`);

// Віддаємо готове підключення до бази іншим файлам (server.js, seed.js),
// щоб вони писали "import db from './db.js'" і одразу працювали з таблицями.
export default db;
