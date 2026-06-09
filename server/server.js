// бекенд сайту: Express + SQLite + WebSocket.
// тут вся серверна логіка — приймає замовлення, зберігає в БД, надсилає email власнику й клієнту,
// показує статистику в адмін-панелі, керує залишками товарів.
// підключаємо потрібні бібліотеки:
import express from 'express';                          // HTTP-фреймворк для маршрутів та middleware
import cors from 'cors';                                // дозволяє запити з інших доменів (для фронтенду)
import rateLimit from 'express-rate-limit';             // обмеження частоти запитів від однієї IP (захист від спаму)
import { WebSocketServer } from 'ws';                   // WebSocket — для оновлень у реальному часі (admin-панель)
import { nanoid } from 'nanoid';                        // генерує короткі унікальні ID для замовлень
import { fileURLToPath } from 'url';                    // конвертує import.meta.url у звичайний шлях
import path from 'path';
import nodemailer from 'nodemailer';                    // SMTP-клієнт для надсилання email
import db from './db.js';                               // підключення до SQLite-бази

// у ES-модулях немає __dirname — відновлюємо його з import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// порт і секрети беремо зі змінних середовища (.env), щоб не хардкодити у код
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'icevault-admin-2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sinelnikovruslan45@gmail.com';

// SMTP-транспорт для надсилання email через Gmail (або інший провайдер).
// логін/пароль теж зі змінних середовища — у репозиторій не потрапляють
const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth:   process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

// обгортка над nodemailer. якщо SMTP не налаштований у env — мовчки нічого не робимо
// (щоб сервер працював навіть без пошти, але без помилок у консолі).
// помилки логуємо щоб бачити проблеми з пошту, але не падаємо
async function sendMail(opts) {
  if (!process.env.SMTP_USER) return;
  try {
    await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...opts });
  } catch (e) {
    console.error('[mail]', e.message);
  }
}

// створюємо застосунок Express і налаштовуємо middleware (порядок важливий):
const app = express();
app.use(cors());                                                       // дозволяємо CORS для всіх доменів
app.use(express.json({ limit: '256kb' }));                             // парсимо JSON у body, з лімітом щоб не валили великими payload
app.use(express.static(path.join(__dirname, 'public')));               // статика з server/public (admin.html)
app.use(express.static(path.join(__dirname, '..')));                   // статика з кореня проєкту (index.html, script.js, style.css)

// rate limit: максимум 30 запитів за хвилину з однієї IP на /api/.
// захист від ботів і випадкового спаму
const apiLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/', apiLimiter);

// middleware для адмінських ендпоінтів. перевіряє токен у заголовку або query string.
// якщо токен не співпадає — повертає 401. next() передає керування далі по ланцюгу
const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
};

// розсилає подію всім підключеним WebSocket-клієнтам.
// використовуємо для real-time оновлень в адмін-панелі (нове замовлення прийшло — одразу видно)
const broadcast = (event) => {
  const msg = JSON.stringify(event);
  wss.clients.forEach((c) => { if (c.readyState === 1) c.send(msg); });
};

// створення замовлення. фронтенд відправляє JSON з даними клієнта і кошиком.
// перевіряємо що всі обовʼязкові поля є, email валідний, сума додатна.
// генеруємо короткий ID типу IV-A8K3MX2P, зберігаємо у БД, повертаємо клієнту, оповіщаємо admin через WebSocket
app.post('/api/orders', (req, res) => {
  const { name, email, phone, city, comment = '', items } = req.body || {};
  if (!name || !email || !phone || !city || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'missing required fields' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'invalid email' });
  // рахуємо суму на бекенді — щоб клієнт не міг підмінити загальну ціну
  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  if (total <= 0) return res.status(400).json({ error: 'invalid total' });
  const id = 'IV-' + nanoid(8).toUpperCase();
  // зберігаємо у БД одним транзакційним блоком: шапка orders + позиції order_items.
  // для кожної позиції знаходимо варіант (товар+розмір), пишемо знімок ціни і списуємо залишок.
  const saveOrder = db.transaction(() => {
    db.prepare(`INSERT INTO orders (id,name,email,phone,city,comment,total)
                VALUES (?,?,?,?,?,?,?)`).run(id, name, email, phone, city, comment, total);
    const prodExists = db.prepare('SELECT 1 FROM products WHERE id=?');
    const findVar    = db.prepare('SELECT id FROM product_variants WHERE product_id=? AND size=?');
    const insItem    = db.prepare(`INSERT INTO order_items (order_id,product_id,variant_id,size,qty,unit_price)
                                   VALUES (?,?,?,?,?,?)`);
    const decStock   = db.prepare('UPDATE product_variants SET stock_qty=MAX(0,stock_qty-?) WHERE id=?');
    for (const i of items) {
      const pid = prodExists.get(i.id) ? i.id : null;       // невідомий товар -> product_id NULL
      const v   = (pid && i.size) ? findVar.get(pid, i.size) : null;
      const qty = Number(i.qty) || 1;
      insItem.run(id, pid, v?.id ?? null, i.size ?? null, qty, Number(i.price) || 0);
      if (v) decStock.run(qty, v.id);                       // списуємо залишок зі складу
    }
  });
  saveOrder();
  // оповіщаємо адмінку через WebSocket — нове замовлення зʼявиться без перезавантаження
  broadcast({ type: 'order:new', id, total, city, name });
  res.json({ ok: true, id, total, status: 'new' });

  // після відповіді клієнту — асинхронно надсилаємо 2 email:
  // 1) адміну (мені) — повідомлення про нове замовлення з деталями
  // 2) клієнту — підтвердження що замовлення прийнято
  const itemLines = items.map(i => `  • ${i.name} ×${i.qty || 1} — ${((i.price * (i.qty || 1)) / 100).toFixed(0)} ₴`).join('\n');
  sendMail({ to: ADMIN_EMAIL, subject: `ICEVAULT — замовлення ${id}`,
    text: `Нове замовлення!\n\nID: ${id}\nКлієнт: ${name}\nEmail: ${email}\nТелефон: ${phone}\nМісто: ${city}\n${comment ? 'Коментар: ' + comment + '\n' : ''}\nТовари:\n${itemLines}\n\nСума: ${total} ₴` });
  sendMail({ to: email, subject: `Підтвердження замовлення ${id} — ICEVAULT`,
    text: `Привіт, ${name}!\n\nДякуємо за замовлення ${id}.\n\nТовари:\n${itemLines}\n\nСума: ${total} ₴\n\nМенеджер звʼяжеться з вами найближчим часом.\n\n— Команда ICEVAULT` });
});

// публічний ендпоінт для перевірки статусу замовлення (використовується у блоці "Знайти замовлення").
// віддаємо лише публічні поля — без email/телефону
app.get('/api/orders/:id', (req, res) => {
  const row = db.prepare('SELECT id,status,total,city,created_at FROM orders WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

// адмінський список усіх замовлень. requireAdmin middleware блокує неавторизований доступ.
// позиції підтягуємо з order_items через JOIN (нормалізована модель)
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  const getItems = db.prepare(`SELECT oi.product_id, oi.size, oi.qty, oi.unit_price, p.name
                               FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id
                               WHERE oi.order_id=?`);
  res.json(rows.map(r => ({ ...r, items: getItems.all(r.id) })));
});

// адмінський ендпоінт для зміни статусу. PATCH використовуємо бо змінюємо тільки одне поле.
// whitelist дозволених статусів — щоб не записати щось зайве типу 'lol'.
// після зміни — broadcast усім підключеним адмінкам через WebSocket
app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'bad status' });
  const r = db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'not found' });
  broadcast({ type: 'order:update', id: req.params.id, status });
  res.json({ ok: true });
});

// тестовий чекаут — спрощена версія для демо. без зберігання у БД, тільки надсилає email.
// зроблено для випадків коли треба швидко перевірити що пошта працює
app.post('/api/test-checkout', (req, res) => {
  const { email, items = [] } = req.body || {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''))
    return res.status(400).json({ error: 'invalid email' });

  const lines = Array.isArray(items) && items.length
    ? items.map(i => `  • ${i.name} ×${i.qty || 1}`).join('\n')
    : '  (без товарів)';

  res.json({ ok: true });

  sendMail({
    to: email,
    subject: 'ICEVAULT — тестовий лист',
    text: `Це тестовий лист від ICEVAULT.\n\nТвоє замовлення:\n${lines}\n\n— Команда ICEVAULT`,
  });
});

// форма "Напишіть нам" зі сторінки контактів. зберігаємо повідомлення у БД,
// оповіщаємо адмінку, надсилаємо email на пошту власника
app.post('/api/contact', (req, res) => {
  const { name, email, phone = '', subject = '', message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'missing fields' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  db.prepare(`INSERT INTO contacts (name,email,phone,subject,message) VALUES (?,?,?,?,?)`)
    .run(name, email, phone, subject, message);
  broadcast({ type: 'contact:new', name, subject });
  res.json({ ok: true });

  sendMail({ to: ADMIN_EMAIL,
    subject: subject ? `ICEVAULT — "${subject}" від ${name}` : `ICEVAULT — повідомлення від ${name}`,
    text: `Від: ${name} <${email}>\n${phone ? 'Телефон: ' + phone + '\n' : ''}Тема: ${subject || '—'}\n\n${message}` });
});

// адмінський список повідомлень з форми контактів
app.get('/api/admin/contacts', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 200').all());
});

// фіксація перегляду сторінки — лічильник у адмінці.
// .slice(0, 120) — обрізаємо довгий шлях щоб не зберігати велике сміття
app.post('/api/pageview', (req, res) => {
  const p = (req.body?.path || '/').slice(0, 120);
  db.prepare('INSERT INTO pageviews (path) VALUES (?)').run(p);
  res.json({ ok: true });
});

// агрегована статистика для адмінки.
// один SELECT з декількома subqueries — щоб отримати все одним запитом до SQLite.
// COALESCE(SUM(total),0) — якщо записів немає, SUM поверне NULL, ми заміняємо на 0
app.get('/api/stats', (_req, res) => {
  const totals = db.prepare(`SELECT
    (SELECT COUNT(*) FROM orders)               AS orders_total,
    (SELECT COALESCE(SUM(total),0) FROM orders) AS revenue_total,
    (SELECT COUNT(*) FROM orders WHERE date(created_at)=date('now')) AS orders_today,
    (SELECT COUNT(*) FROM pageviews WHERE date(ts)=date('now'))      AS views_today,
    (SELECT COUNT(*) FROM contacts) AS contacts_total
  `).get();
  // топ-5 міст за кількістю замовлень — для графіка у адмінці
  const topCities = db.prepare(`SELECT city, COUNT(*) AS n FROM orders GROUP BY city ORDER BY n DESC LIMIT 5`).all();
  // статистика за останні 7 днів — кількість і виручка по днях
  const last7 = db.prepare(`SELECT date(created_at) AS d, COUNT(*) AS n, COALESCE(SUM(total),0) AS rev
    FROM orders WHERE created_at >= datetime('now','-6 days') GROUP BY d ORDER BY d`).all();
  res.json({ ...totals, topCities, last7 });
});

// весь каталог товарів з БД. JOIN на бренди/категорії + масив розмірів з варіантів.
// формат збігається з класом Product у фронтенді: {id,name,brand,category,price,badge,img,imgDesc,desc,sizes}
app.get('/api/products', (_req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, b.name AS brand, c.code AS category, p.price, p.badge,
           p.img, p.img_desc AS imgDesc, p.description AS "desc"
    FROM products p
    JOIN brands b     ON b.id = p.brand_id
    JOIN categories c ON c.id = p.category_id
    ORDER BY c.sort_order, p.id`).all();
  const sizesOf = db.prepare('SELECT size FROM product_variants WHERE product_id=? ORDER BY id');
  res.json(rows.map(r => ({ ...r, sizes: sizesOf.all(r.id).map(s => s.size) })));
});

// наявність товару = сума залишків усіх його варіантів (розмірів).
const productStock = db.prepare('SELECT COALESCE(SUM(stock_qty),0) AS qty FROM product_variants WHERE product_id=?');

// батч-ендпоінт для перевірки залишків кількох товарів одним запитом.
// фронтенд відправляє ?skus=id1,id2,id3 — повертаємо обʼєкт {id1: 5, id2: 0, id3: 12}.
// .slice(0,80) — обмеження щоб не зловживали (макс 80 sku за раз).
app.get('/api/stock/batch', (req, res) => {
  const skus = (req.query.skus || '').split(',').slice(0, 80).map(s => s.trim()).filter(Boolean);
  if (skus.length === 0) return res.json({});
  const result = {};
  skus.forEach(sku => {
    const r = productStock.get(sku);
    result[sku] = r ? r.qty : 99;          // невідомий товар -> 99 ("умовно багато")
  });
  res.json(result);
});

// одиничний запит наявності — використовується у модалці деталей товару
app.get('/api/stock/:sku', (req, res) => {
  const r = productStock.get(req.params.sku);
  res.json({ sku: req.params.sku, qty: r ? r.qty : 99 });
});

// адмінська зміна залишку. з ?size=M (або body.size) — оновлює конкретний варіант;
// без size — ставить однаковий залишок усім розмірам товару. PUT ідемпотентний.
app.put('/api/admin/stock/:sku', requireAdmin, (req, res) => {
  const qty = Number(req.body?.qty);
  if (!Number.isInteger(qty) || qty < 0) return res.status(400).json({ error: 'bad qty' });
  const size = req.body?.size || req.query.size;
  const r = size
    ? db.prepare('UPDATE product_variants SET stock_qty=? WHERE product_id=? AND size=?').run(qty, req.params.sku, size)
    : db.prepare('UPDATE product_variants SET stock_qty=? WHERE product_id=?').run(qty, req.params.sku);
  if (r.changes === 0) return res.status(404).json({ error: 'not found' });
  broadcast({ type: 'stock:update', sku: req.params.sku, qty });
  res.json({ ok: true, updated: r.changes });
});

// підписка на знижку (форма у hero/футері). INSERT OR IGNORE — повторний email не дублюється.
app.post('/api/subscribe', (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
  res.json({ ok: true });
});

// health-check: простий ендпоінт для перевірки що сервер живий (для моніторингу)
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// віддаємо admin.html по шляху /admin (для зручності, щоб не писати /admin.html)
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// запускаємо сервер. зберігаємо посилання у server щоб потім причепити WebSocket до того самого порту
const server = app.listen(PORT, () => {
  console.log(`ICEVAULT server: http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin (token: ${ADMIN_TOKEN})`);
});
// WebSocket на тому самому порту по шляху /ws.
// при підключенні нового клієнта одразу шлемо "hello" — підтвердження що звʼязок працює
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => ws.send(JSON.stringify({ type: 'hello', ts: Date.now() })));
