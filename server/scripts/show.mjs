// ============================================================================
//  show.mjs — ШВИДКИЙ ОГЛЯД БАЗИ ОДНІЄЮ КОМАНДОЮ (нічого не змінює, лише читає)
// ============================================================================
//  ЗАПУСК:  cd server && node scripts/show.mjs
//  Показує: скільки чого в базі, приклади товарів, останні замовлення,
//  товари яких мало/немає на складі, підписників. Зручно для перевірки.
// ============================================================================
import db from '../db.js';

const count = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;

console.log('\n=== ПІДСУМОК БАЗИ icevault.db ===');
for (const t of ['brands','categories','products','product_variants','orders','order_items','contacts','subscribers','pageviews','admins'])
  console.log(`  ${t.padEnd(18)} ${count(t)}`);

console.log('\n=== 5 ТОВАРІВ (з брендом, категорією, ціною, залишком) ===');
const sample = db.prepare(`
  SELECT p.id, p.name, b.name brand, c.name_uk category, p.price,
         COALESCE(SUM(v.stock_qty),0) stock
  FROM products p
  JOIN brands b ON b.id=p.brand_id
  JOIN categories c ON c.id=p.category_id
  LEFT JOIN product_variants v ON v.product_id=p.id
  GROUP BY p.id ORDER BY p.price DESC LIMIT 5`).all();
sample.forEach(r => console.log(`  ${r.brand} ${r.name} (${r.category}) — ${r.price} грн, на складі: ${r.stock}`));

console.log('\n=== ТОВАРИ, ЯКИХ ЗОВСІМ НЕМАЄ НА СКЛАДІ (топ-10) ===');
const oos = db.prepare(`
  SELECT p.name, b.name brand
  FROM products p JOIN brands b ON b.id=p.brand_id
  WHERE (SELECT COALESCE(SUM(stock_qty),0) FROM product_variants WHERE product_id=p.id)=0
  LIMIT 10`).all();
oos.length ? oos.forEach(r => console.log(`  ${r.brand} ${r.name}`)) : console.log('  (усі товари мають залишок)');

console.log('\n=== ОСТАННІ 5 ЗАМОВЛЕНЬ ===');
const orders = db.prepare('SELECT id,name,city,total,status,created_at FROM orders ORDER BY created_at DESC LIMIT 5').all();
orders.length ? orders.forEach(o => console.log(`  ${o.id} | ${o.name} (${o.city}) — ${o.total} грн — ${o.status} — ${o.created_at}`))
              : console.log('  (замовлень ще немає)');

console.log('\n=== ПІДПИСНИКИ НА ЗНИЖКУ ===');
const subs = db.prepare('SELECT email FROM subscribers ORDER BY created_at DESC LIMIT 10').all();
subs.length ? subs.forEach(s => console.log('  ' + s.email)) : console.log('  (немає)');
console.log('');
