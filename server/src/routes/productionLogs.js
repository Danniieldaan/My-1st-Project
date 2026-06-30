const express = require('express');
const router = express.Router();
const { getCommission, getRequiredStages } = require('../pricing');

module.exports = router;

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

router.get('/', (req, res) => {
  const db = req.app.get('db');
  const logs = db.prepare(`
    SELECT pl.*, qi.product_type, qi.size_tier,
      q.id as quote_id, c.name as customer_name
    FROM production_logs pl
    JOIN quote_items qi ON pl.job_id = qi.id
    JOIN quotes q ON qi.quote_id = q.id
    JOIN customers c ON q.customer_id = c.id
    ORDER BY pl.date_completed DESC, pl.id DESC
  `).all();
  res.json(logs);
});

router.get('/by-job/:jobId', (req, res) => {
  const db = req.app.get('db');
  const logs = db.prepare('SELECT * FROM production_logs WHERE job_id = ? ORDER BY date_completed').all(req.params.jobId);
  res.json(logs);
});

router.get('/production-jobs', (req, res) => {
  const db = req.app.get('db');
  const jobs = db.prepare(`
    SELECT qi.*, q.id as quote_id, c.name as customer_name,
      (SELECT COUNT(*) FROM production_logs pl WHERE pl.job_id = qi.id) as logged_stages
    FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    JOIN customers c ON q.customer_id = c.id
    WHERE q.status = 'Send to Production'
    ORDER BY qi.id DESC
  `).all();
  const settings = getSettings(db);
  const result = jobs.map(j => {
    const required = getRequiredStages(j.product_type, settings);
    const logged = j.logged_stages || 0;
    let prodStatus = 'Pending';
    if (logged > 0 && logged < required.length) prodStatus = 'In Production';
    else if (logged >= required.length && required.length > 0) prodStatus = 'Complete';
    return { ...j, required_stages: required.length, logged_stages: logged, production_status: prodStatus };
  });
  res.json(result);
});

router.post('/', (req, res) => {
  const db = req.app.get('db');
  const { job_id, stage_completed, artisans, date_completed } = req.body;
  if (!job_id || !stage_completed || !artisans || !date_completed) {
    return res.status(400).json({ error: 'job_id, stage_completed, artisans, date_completed required' });
  }

  const job = db.prepare('SELECT size_tier, product_type FROM quote_items WHERE id=?').get(job_id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const artisanArr = Array.isArray(artisans) ? artisans : [artisans];
  const settings = getSettings(db);
  const sizeTier = job.size_tier || 'Medium';
  const comm = getCommission(artisanArr, stage_completed, sizeTier, settings);

  const result = db.prepare(`INSERT INTO production_logs (job_id, stage_completed, artisans, worker_count, total_stage_commission, split_commission, date_completed, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Unpaid')`)
    .run(job_id, stage_completed, JSON.stringify(artisanArr), comm.workerCount, comm.total, comm.split, date_completed);

  updateJobProductionStatus(db, job_id);
  res.json({ id: result.lastInsertRowid, ...comm });
});

router.put('/:id/pay', (req, res) => {
  const db = req.app.get('db');
  const { payment_status } = req.body;
  db.prepare("UPDATE production_logs SET payment_status=? WHERE id=?").run(payment_status || 'Paid', req.params.id);
  res.json({ success: true });
});

router.put('/pay-all', (req, res) => {
  const db = req.app.get('db');
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE production_logs SET payment_status='Paid' WHERE id IN (${placeholders})`).run(...ids);
  res.json({ success: true, count: ids.length });
});

function updateJobProductionStatus(db, jobId) {
  const job = db.prepare('SELECT product_type FROM quote_items WHERE id=?').get(jobId);
  if (!job) return;
  const settings = getSettings(db);
  const required = getRequiredStages(job.product_type, settings);
  const logged = db.prepare('SELECT COUNT(*) as c FROM production_logs WHERE job_id=?').get(jobId).c;

  let status = 'Pending';
  if (logged > 0 && logged < required.length) status = 'In Production';
  else if (logged >= required.length && required.length > 0) status = 'Complete';

  db.prepare('UPDATE quote_items SET production_status=? WHERE id=?').run(status, jobId);
}
