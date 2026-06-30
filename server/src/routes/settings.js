const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/', (req, res) => {
  const db = req.app.get('db');
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) {
    try { obj[r.key] = JSON.parse(r.value); }
    catch { obj[r.key] = r.value; }
  }
  res.json(obj);
});

router.put('/', (req, res) => {
  const db = req.app.get('db');
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, val);
  res.json({ success: true });
});
