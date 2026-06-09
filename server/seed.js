// ============================================================================
//  seed.js — НАПОВНЕННЯ БАЗИ ДАНИМИ ("посадка" даних, англ. seed = насіння)
// ============================================================================
//
//  ПРОСТИМИ СЛОВАМИ:
//  db.js створює ПОРОЖНІ таблиці. Цей файл бере список товарів із
//  data/products.json і РОЗКЛАДАЄ його по таблицях:
//    1) додає бренди (Bauer, CCM...),
//    2) додає категорії (ковзани, ключки...),
//    3) додає самі товари (з посиланням на бренд і категорію),
//    4) для кожного товару створює рядки-розміри з кількістю на складі,
//    5) створює одного адміністратора.
//
//  ЗАПУСК У ТЕРМІНАЛІ:   cd server && node seed.js
//
//  Скрипт ІДЕМПОТЕНТНИЙ — це означає "повторний запуск не дублює дані":
//  бренди/категорії вставляються через INSERT OR IGNORE (є — пропускаємо),
//  товари — через "upsert" (є — оновлюємо, нема — створюємо).
//  Тобто можна запускати скільки завгодно разів безпечно.
// ============================================================================

import fs from 'fs';                 // читання файлів (products.json)
import crypto from 'crypto';         // для безпечного хешування пароля адміна
import { fileURLToPath } from 'url';
import path from 'path';
import db from './db.js';            // підключення до бази (таблиці вже створені в db.js)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// читаємо список товарів із JSON-файлу й перетворюємо текст у масив об'єктів
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));

// Довідник категорій: технічний код -> [назва українською, порядок у меню].
const CATS = {
  skates:      ['Ковзани', 1],
  sticks:      ['Ключки', 2],
  helmets:     ['Шоломи', 3],
  pads:        ['Захист', 4],
  gloves:      ['Рукавиці', 5],
  bags:        ['Сумки', 6],
  accessories: ['Аксесуари', 7],
};
// Країна кожного бренду (приблизно; якщо нема — буде порожньо).
const COUNTRY = {
  'Bauer': 'Канада', 'CCM': 'Канада', 'Reebok': 'Канада', 'Graf': 'Швейцарія',
  'True Hockey': 'США', 'Sher-Wood': 'Канада', 'Warrior': 'США', 'Fischer': 'Австрія',
  'Vaughn': 'США', 'Byte': 'Канада', 'Shock Doctor': 'США',
};
// робить з назви "зручний для URL" рядок: "True Hockey" -> "true-hockey"
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Скільки штук покласти на склад для кожного розміру.
// Число рахуємо з артикулу (sku) спеціальною формулою, щоб воно було
// СТАБІЛЬНИМ (однаковим між запусками), а ~13% розмірів були з 0 ("немає в наявності")
// — щоб на сайті було видно і "є", і "немає".
function stockFor(sku) {
  let h = 2166136261;
  for (const ch of sku) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const v = h % 45;
  return v < 6 ? 0 : v - 5;          // дає число від 0 до 39
}
// Перетворює пароль на безпечний хеш (scrypt). У базу пишемо "сіль:хеш",
// з цього відновити пароль неможливо, але можна перевірити введений.
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// "Заготовки" SQL-запитів (prepared statements). Готуємо один раз — виконуємо
// багато разів із різними даними. Так швидше й безпечніше (захист від SQL-ін'єкцій).
const insBrand = db.prepare('INSERT OR IGNORE INTO brands (name, slug, country) VALUES (?,?,?)');
const getBrand = db.prepare('SELECT id FROM brands WHERE name = ?');           // дізнатись номер бренду за назвою
const insCat   = db.prepare('INSERT OR IGNORE INTO categories (code, name_uk, sort_order) VALUES (?,?,?)');
const getCat   = db.prepare('SELECT id FROM categories WHERE code = ?');       // дізнатись номер категорії
const upProduct = db.prepare(`
  INSERT INTO products (id, name, brand_id, category_id, price, badge, img, img_desc, description)
  VALUES (@id, @name, @brand_id, @category_id, @price, @badge, @img, @img_desc, @description)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, brand_id=excluded.brand_id, category_id=excluded.category_id,
    price=excluded.price, badge=excluded.badge, img=excluded.img,
    img_desc=excluded.img_desc, description=excluded.description`);  // "upsert": є — оновити, нема — створити
const upVariant = db.prepare(`
  INSERT INTO product_variants (product_id, size, sku, stock_qty)
  VALUES (@product_id, @size, @sku, @stock_qty)
  ON CONFLICT(product_id, size) DO UPDATE SET stock_qty=excluded.stock_qty`);
const insAdmin = db.prepare('INSERT OR IGNORE INTO admins (username, password_hash, role) VALUES (?,?,?)');

// db.transaction = "все або нічого": якщо станеться помилка посеред наповнення,
// база відкотиться до початкового стану (не залишиться "напівзаповненою").
const seed = db.transaction(() => {
  // 1) категорії
  for (const [code, [name_uk, sort]] of Object.entries(CATS)) insCat.run(code, name_uk, sort);
  // 2) бренди (беремо унікальні назви зі списку товарів)
  const brands = [...new Set(products.map(p => p.brand))];
  for (const b of brands) insBrand.run(b, slugify(b), COUNTRY[b] ?? null);
  // 3) товари + їхні розміри
  let nVariants = 0;
  for (const p of products) {
    const brand_id = getBrand.get(p.brand).id;        // міняємо назву бренду на його номер
    const category_id = getCat.get(p.category).id;    // міняємо код категорії на її номер
    upProduct.run({
      id: p.id, name: p.name, brand_id, category_id, price: p.price,
      badge: p.badge ?? null, img: p.img ?? null, img_desc: p.imgDesc ?? null,
      description: p.desc ?? null,
    });
    for (const size of p.sizes) {                     // для кожного розміру товару — окремий рядок
      const sku = `${p.id}-${size}`;
      upVariant.run({ product_id: p.id, size, sku, stock_qty: stockFor(sku) });
      nVariants++;
    }
  }
  // 4) адміністратор за замовчуванням (логін admin, пароль = ADMIN_TOKEN або стандартний)
  insAdmin.run('admin', hashPassword(process.env.ADMIN_TOKEN || 'icevault-admin-2026'), 'admin');
  return { brands: brands.length, products: products.length, nVariants };
});

// Запускаємо наповнення й друкуємо підсумок у термінал.
const r = seed();
console.log(`✓ seeded: ${r.brands} brands, ${Object.keys(CATS).length} categories, ${r.products} products, ${r.nVariants} variants, 1 admin`);
const out = db.prepare('SELECT COUNT(*) c FROM product_variants WHERE stock_qty=0').get();
console.log(`  variants out of stock: ${out.c}`);
