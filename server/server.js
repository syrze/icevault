import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import path from 'path';
import nodemailer from 'nodemailer';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'icevault-admin-2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sinelnikovruslan45@gmail.com';

const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth:   process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

async function sendMail(opts) {
  if (!process.env.SMTP_USER) return;
  try {
    await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...opts });
  } catch (e) {
    console.error('[mail]', e.message);
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..')));

const apiLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/', apiLimiter);

const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
};

const broadcast = (event) => {
  const msg = JSON.stringify(event);
  wss.clients.forEach((c) => { if (c.readyState === 1) c.send(msg); });
};

/* ─── ORDERS ─── */
app.post('/api/orders', (req, res) => {
  const { name, email, phone, city, comment = '', items } = req.body || {};
  if (!name || !email || !phone || !city || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'missing required fields' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'invalid email' });
  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  if (total <= 0) return res.status(400).json({ error: 'invalid total' });
  const id = 'IV-' + nanoid(8).toUpperCase();
  db.prepare(`INSERT INTO orders (id,name,email,phone,city,comment,items_json,total)
              VALUES (?,?,?,?,?,?,?,?)`).run(id, name, email, phone, city, comment, JSON.stringify(items), total);
  broadcast({ type: 'order:new', id, total, city, name });
  res.json({ ok: true, id, total, status: 'new' });

  const itemLines = items.map(i => `  • ${i.name} ×${i.qty || 1} — ${((i.price * (i.qty || 1)) / 100).toFixed(0)} ₴`).join('\n');
  sendMail({ to: ADMIN_EMAIL, subject: `ICEVAULT — замовлення ${id}`,
    text: `Нове замовлення!\n\nID: ${id}\nКлієнт: ${name}\nEmail: ${email}\nТелефон: ${phone}\nМісто: ${city}\n${comment ? 'Коментар: ' + comment + '\n' : ''}\nТовари:\n${itemLines}\n\nСума: ${total} ₴` });
  sendMail({ to: email, subject: `✓ Підтвердження замовлення ${id} — ICEVAULT`,
    text: `Привіт, ${name}!\n\nДякуємо за замовлення ${id}.\n\nТовари:\n${itemLines}\n\nСума: ${total} ₴\n\nМенеджер звʼяжеться з вами найближчим часом.\n\n— Команда ICEVAULT` });
});

app.get('/api/orders/:id', (req, res) => {
  const row = db.prepare('SELECT id,status,total,city,created_at FROM orders WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json) })));
});

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'bad status' });
  const r = db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'not found' });
  broadcast({ type: 'order:update', id: req.params.id, status });
  res.json({ ok: true });
});

/* ─── CONTACT ─── */
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

app.get('/api/admin/contacts', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 200').all());
});

/* ─── STATS ─── */
app.post('/api/pageview', (req, res) => {
  const p = (req.body?.path || '/').slice(0, 120);
  db.prepare('INSERT INTO pageviews (path) VALUES (?)').run(p);
  res.json({ ok: true });
});

app.get('/api/stats', (_req, res) => {
  const totals = db.prepare(`SELECT
    (SELECT COUNT(*) FROM orders)               AS orders_total,
    (SELECT COALESCE(SUM(total),0) FROM orders) AS revenue_total,
    (SELECT COUNT(*) FROM orders WHERE date(created_at)=date('now')) AS orders_today,
    (SELECT COUNT(*) FROM pageviews WHERE date(ts)=date('now'))      AS views_today,
    (SELECT COUNT(*) FROM contacts) AS contacts_total
  `).get();
  const topCities = db.prepare(`SELECT city, COUNT(*) AS n FROM orders GROUP BY city ORDER BY n DESC LIMIT 5`).all();
  const last7 = db.prepare(`SELECT date(created_at) AS d, COUNT(*) AS n, COALESCE(SUM(total),0) AS rev
    FROM orders WHERE created_at >= datetime('now','-6 days') GROUP BY d ORDER BY d`).all();
  res.json({ ...totals, topCities, last7 });
});

/* ─── STOCK ─── */
app.get('/api/stock/batch', (req, res) => {
  const skus = (req.query.skus || '').split(',').slice(0, 80).map(s => s.trim()).filter(Boolean);
  if (skus.length === 0) return res.json({});
  const result = {};
  skus.forEach(sku => {
    const r = db.prepare('SELECT qty FROM stock WHERE sku=?').get(sku);
    result[sku] = r?.qty ?? 99;
  });
  res.json(result);
});

app.get('/api/stock/:sku', (req, res) => {
  const r = db.prepare('SELECT qty FROM stock WHERE sku=?').get(req.params.sku);
  res.json({ sku: req.params.sku, qty: r?.qty ?? 99 });
});

app.put('/api/admin/stock/:sku', requireAdmin, (req, res) => {
  const qty = Number(req.body?.qty);
  if (!Number.isInteger(qty) || qty < 0) return res.status(400).json({ error: 'bad qty' });
  db.prepare(`INSERT INTO stock (sku,qty) VALUES (?,?)
              ON CONFLICT(sku) DO UPDATE SET qty=excluded.qty`).run(req.params.sku, qty);
  broadcast({ type: 'stock:update', sku: req.params.sku, qty });
  res.json({ ok: true });
});

/* ─── HEALTH ─── */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

/* ─── ADMIN page route (served from public/admin.html) ─── */
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

/* ─── HTTP + WebSocket ─── */
const server = app.listen(PORT, () => {
  console.log(`ICEVAULT server: http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin (token: ${ADMIN_TOKEN})`);
});
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => ws.send(JSON.stringify({ type: 'hello', ts: Date.now() })));
