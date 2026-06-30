const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/weekly', (req, res) => {
  const db = req.app.get('db');
  const { start_date, end_date, payment_status } = req.query;

  const start = start_date || getWeekStart();
  const end = end_date || getWeekEnd();
  const statusFilter = payment_status || 'Unpaid';

  const logs = db.prepare(`
    SELECT pl.*, qi.product_type, qi.size_tier,
      q.id as quote_id, c.name as customer_name,
      qi.id as job_display_id
    FROM production_logs pl
    JOIN quote_items qi ON pl.job_id = qi.id
    JOIN quotes q ON qi.quote_id = q.id
    JOIN customers c ON q.customer_id = c.id
    WHERE pl.date_completed >= ? AND pl.date_completed <= ?
      AND pl.payment_status = ?
    ORDER BY pl.date_completed, pl.id
  `).all(start, end, statusFilter);

  const byArtisan = {};
  for (const log of logs) {
    const artisans = JSON.parse(log.artisans || '[]');
    for (const artisan of artisans) {
      if (!byArtisan[artisan]) byArtisan[artisan] = { stages: [], total: 0, count: 0 };
      byArtisan[artisan].stages.push(log);
      byArtisan[artisan].total += log.split_commission;
      byArtisan[artisan].count += 1;
    }
  }

  res.json({ start_date: start, end_date: end, logs, by_artisan: byArtisan });
});

router.get('/history', (req, res) => {
  const db = req.app.get('db');
  const { artisan, month, year } = req.query;
  let query = `
    SELECT pl.*, qi.product_type, qi.size_tier
    FROM production_logs pl
    JOIN quote_items qi ON pl.job_id = qi.id
    WHERE pl.payment_status = 'Paid'
  `;
  const params = [];
  if (artisan) { query += ' AND pl.artisans LIKE ?'; params.push(`%"${artisan}"%`); }
  if (month && year) {
    const m = String(month).padStart(2, '0');
    query += ' AND pl.date_completed >= ? AND pl.date_completed <= ?';
    params.push(`${year}-${m}-01`, `${year}-${m}-31`);
  }
  query += ' ORDER BY pl.date_completed DESC';
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? 0 : 7);
  const sunday = new Date(now.setDate(diff));
  return sunday.toISOString().split('T')[0];
}
