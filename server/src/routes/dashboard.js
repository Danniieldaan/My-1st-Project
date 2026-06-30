const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/', (req, res) => {
  const db = req.app.get('db');

  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount_paid),0) as total FROM receipts").get().total;
  const outstandingPayroll = db.prepare("SELECT COALESCE(SUM(split_commission),0) as total FROM production_logs WHERE payment_status='Unpaid'").get().total;
  const totalQuotes = db.prepare("SELECT COUNT(*) as c FROM quotes").get().c;
  const approvedQuotes = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status IN ('Deposit Paid','Send to Production')").get().c;
  const totalJobs = db.prepare("SELECT COUNT(*) as c FROM quote_items").get().c;
  const activeJobs = db.prepare(`
    SELECT COUNT(*) as c FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    WHERE q.status = 'Send to Production' AND qi.production_status IN ('Pending','In Production')
  `).get().c;

  const productionStages = db.prepare(`
    SELECT stage_completed, COUNT(*) as count
    FROM production_logs
    WHERE payment_status='Unpaid'
    GROUP BY stage_completed ORDER BY count DESC
  `).all();

  const recentQuotes = db.prepare(`
    SELECT q.*, c.name as customer_name
    FROM quotes q JOIN customers c ON q.customer_id = c.id
    ORDER BY q.id DESC LIMIT 5
  `).all();

  const weeklyPayroll = db.prepare(`
    SELECT COALESCE(SUM(split_commission),0) as total
    FROM production_logs
    WHERE payment_status='Unpaid'
      AND date_completed >= date('now', 'weekday 0', '-7 days')
      AND date_completed < date('now', 'weekday 0')
  `).get().total;

  res.json({
    total_revenue: totalRevenue,
    outstanding_payroll: outstandingPayroll,
    total_quotes: totalQuotes,
    approved_quotes: approvedQuotes,
    total_jobs: totalJobs,
    active_jobs: activeJobs,
    production_stages: productionStages,
    recent_quotes: recentQuotes,
    weekly_payroll_due: weeklyPayroll
  });
});
