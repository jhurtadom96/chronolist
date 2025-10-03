/* chronolist/server.js */
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'queue.db');

// Init db
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at);
`);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
function getList() {
  const rows = db.prepare('SELECT id, name, created_at FROM entries ORDER BY created_at ASC').all();
  return rows.map((r, i) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    position: i + 1
  }));
}
function countList() {
  return db.prepare('SELECT COUNT(*) AS c FROM entries').get().c;
}
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.adminToken;
  if (token === ADMIN_TOKEN) return next();
  return res.status(401).json({ error: 'Admin token missing or invalid' });
}

// Routes
app.get('/api/list', (req, res) => {
  res.json({ items: getList(), max: 20, total: countList() });
});

app.post('/api/join', (req, res) => {
  const nameRaw = (req.body?.name ?? '').toString().trim();
  if (!nameRaw) return res.status(400).json({ error: 'Name is required' });
  const name = nameRaw.slice(0, 60); // limit length
  const total = countList();
  if (total >= 20) return res.status(409).json({ error: 'List is full (max 20)' });
  try {
    const now = Date.now();
    db.prepare('INSERT INTO entries (name, created_at) VALUES (?, ?)').run(name, now);
    const list = getList();
    const me = list.find(i => i.name === name);
    return res.status(201).json({ ok: true, position: me?.position ?? null, item: me, items: list });
  } catch (e) {
    if (String(e).includes('UNIQUE')) {
      const list = getList();
      const me = list.find(i => i.name === name);
      return res.status(200).json({ ok: true, message: 'Already in list', position: me?.position ?? null, item: me, items: list });
    }
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/leave', (req, res) => {
  const nameRaw = (req.body?.name ?? '').toString().trim();
  if (!nameRaw) return res.status(400).json({ error: 'Name is required' });
  const name = nameRaw.slice(0, 60);
  const info = db.prepare('DELETE FROM entries WHERE name = ?').run(name);
  const list = getList();
  return res.json({ ok: true, deleted: info.changes, items: list });
});

app.post('/api/next', requireAdmin, (req, res) => {
  const first = db.prepare('SELECT id, name FROM entries ORDER BY created_at ASC LIMIT 1').get();
  if (!first) return res.json({ ok: true, message: 'List empty', items: [] });
  db.prepare('DELETE FROM entries WHERE id = ?').run(first.id);
  const list = getList();
  return res.json({ ok: true, removed: first, items: list });
});

app.post('/api/reset', requireAdmin, (req, res) => {
  db.exec('DELETE FROM entries');
  res.json({ ok: true, items: getList() });
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Fallback to SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ChronoList listening on http://localhost:${PORT}`);
});
