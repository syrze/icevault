// ============================================================================
//  extract.mjs — РАЗОВИЙ скрипт: дістає товари зі script.js у products.json
// ============================================================================
//
//  ПРОСТИМИ СЛОВАМИ:
//  Раніше всі 93 товари були "вшиті" прямо в код сайту (script.js), у масиві.
//  Цей скрипт читає той масив і зберігає його як звичайний файл-список
//  data/products.json. Потім seed.js бере цей файл і кладе товари в базу.
//
//  Запускати треба лише ОДИН раз (або якщо вручну дописав товари у script.js
//  і хочеш перенести їх у базу). Звичайна робота з базою його не потребує.
//
//  ЗАПУСК:  cd server && node scripts/extract.mjs
// ============================================================================

import fs from 'fs';
import path from 'path';
const ROOT = '/Users/sinielnikovruslan/Developer/Uni/Diploma';

// читаємо весь текст файлу script.js як рядок
const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

// шукаємо клас Product і колишній масив товарів усередині script.js.
// УВАГА: після переходу на БД масив зі script.js прибрано, тож якщо його нема —
// просто нічого не робимо (поточний products.json лишається без змін).
const start = src.indexOf('class Product');
const arrStart = src.indexOf('const products');
const arrEnd = src.indexOf('\n];', arrStart);
if (arrStart === -1 || arrEnd === -1) {
  console.log('Масив товарів у script.js не знайдено (нормально після переходу на БД).');
  console.log('Список лишається у server/data/products.json без змін.');
  process.exit(0);
}

// "вирізаємо" шматок коду з класом Product і масивом, виконуємо його (eval),
// і отримуємо готовий масив об'єктів products просто в пам'яті.
const code = src.slice(start, arrEnd) + '\n];\nproducts;';
const products = eval(code);

// лишаємо тільки потрібні поля й зберігаємо у JSON (зручний текстовий формат).
const clean = products.map(p => ({
  id: p.id, name: p.name, brand: p.brand, category: p.category,
  price: p.price, badge: p.badge ?? null, img: p.img ?? null,
  imgDesc: p.imgDesc ?? null, sizes: p.sizes, desc: p.desc ?? null,
}));
fs.writeFileSync(path.join(ROOT, 'server/data/products.json'), JSON.stringify(clean, null, 2));
console.log('extracted', clean.length, 'products -> server/data/products.json');
