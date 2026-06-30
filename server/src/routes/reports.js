const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/sales', (req, res) => {
  const db = req.app.get('db');
  const { month, year } = req.query;
  const m = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const y = year || String(new Date().getFullYear());
  const startDate = `${y}-${m}-01`;
  const endDate = `${y}-${m}-31`;

  const quotesSent = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE date_created >= ? AND date_created <= ?").get(startDate, endDate).c;
  const quotesApproved = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status IN ('Deposit Paid','Send to Production') AND date_created >= ? AND date_created <= ?").get(startDate, endDate).c;
  const revenueCollected = db.prepare("SELECT COALESCE(SUM(amount_paid),0) as total FROM receipts WHERE payment_date >= ? AND payment_date <= ?").get(startDate, endDate).total;

  const dailyRevenue = db.prepare(`
    SELECT payment_date, SUM(amount_paid) as total
    FROM receipts WHERE payment_date >= ? AND payment_date <= ?
    GROUP BY payment_date ORDER BY payment_date
  `).all(startDate, endDate);

  res.json({ month: parseInt(m), year: parseInt(y), quotes_sent: quotesSent, quotes_approved: quotesApproved, revenue_collected: revenueCollected, daily_revenue: dailyRevenue });
});

router.get('/production', (req, res) => {
  const db = req.app.get('db');
  const { month, year } = req.query;
  const m = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const y = year || String(new Date().getFullYear());
  const startDate = `${y}-${m}-01`;
  const endDate = `${y}-${m}-31`;

  const totalFrames = db.prepare(`
    SELECT COUNT(*) as c FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    WHERE qi.product_type IN ('Base Print','Stretch Canvas','Floating Frame','Glass Frame')
      AND q.date_created >= ? AND q.date_created <= ?
  `).get(startDate, endDate).c;

  const totalFloor = db.prepare(`
    SELECT COALESCE(SUM(qi.square_meters),0) as total FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    WHERE qi.product_type = 'Hardwood Floor' AND q.date_created >= ? AND q.date_created <= ?
  `).get(startDate, endDate).total;

  const byProductType = db.prepare(`
    SELECT qi.product_type, COUNT(*) as count
    FROM quote_items qi JOIN quotes q ON qi.quote_id = q.id
    WHERE q.date_created >= ? AND q.date_created <= ?
    GROUP BY qi.product_type
  `).all(startDate, endDate);

  res.json({ month: parseInt(m), year: parseInt(y), total_frames: totalFrames, total_floor_sqm: totalFloor, by_product_type: byProductType });
});

router.get('/artisans', (req, res) => {
  const db = req.app.get('db');
  const { month, year } = req.query;
  const m = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const y = year || String(new Date().getFullYear());
  const startDate = `${y}-${m}-01`;
  const endDate = `${y}-${m}-31`;

  const allLogs = db.prepare(`
    SELECT * FROM production_logs
    WHERE payment_status = 'Paid' AND date_completed >= ? AND date_completed <= ?
  `).all(startDate, endDate);

  const byArtisan = {};
  for (const log of allLogs) {
    const artisans = JSON.parse(log.artisans || '[]');
    for (const a of artisans) {
      if (!byArtisan[a]) byArtisan[a] = { artisan: a, stages_completed: 0, total_earned: 0 };
      byArtisan[a].stages_completed += 1;
      byArtisan[a].total_earned += log.split_commission || 0;
    }
  }

  const leaderboard = Object.values(byArtisan).sort((a, b) => b.total_earned - a.total_earned);
  const totalPayroll = leaderboard.reduce((s, a) => s + a.total_earned, 0);

  res.json({ month: parseInt(m), year: parseInt(y), total_payroll: totalPayroll, leaderboard });
});
