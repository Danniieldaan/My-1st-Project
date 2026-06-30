const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/', (req, res) => {
  const db = req.app.get('db');
  const customers = db.prepare(`
    SELECT c.*,
      COALESCE((SELECT SUM(r.amount_paid) FROM receipts r JOIN quotes q ON r.quote_id = q.id WHERE q.customer_id = c.id), 0) as total_lifetime_spend,
      COALESCE((SELECT COUNT(qi.id) FROM quote_items qi JOIN quotes q ON qi.quote_id = q.id WHERE q.customer_id = c.id), 0) as total_frames_ordered,
      COALESCE((SELECT SUM(q.balance_due) FROM quotes q WHERE q.customer_id = c.id AND q.balance_due > 0), 0) as outstanding_balance
    FROM customers c ORDER BY c.name
  `).all();
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const db = req.app.get('db');
  const customer = db.prepare(`
    SELECT c.*,
      COALESCE((SELECT SUM(r.amount_paid) FROM receipts r JOIN quotes q ON r.quote_id = q.id WHERE q.customer_id = c.id), 0) as total_lifetime_spend,
      COALESCE((SELECT COUNT(qi.id) FROM quote_items qi JOIN quotes q ON qi.quote_id = q.id WHERE q.customer_id = c.id), 0) as total_frames_ordered,
      COALESCE((SELECT SUM(q.balance_due) FROM quotes q WHERE q.customer_id = c.id AND q.balance_due > 0), 0) as outstanding_balance
    FROM customers c WHERE c.id = ?
  `).get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const db = req.app.get('db');
  const { name, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = db.prepare('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)').run(name, phone || '', email || '', address || '');
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = req.app.get('db');
  const { name, phone, email, address } = req.body;
  db.prepare('UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?')
    .run(name, phone || '', email || '', address || '', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const db = req.app.get('db');
  db.prepare('DELETE FROM customers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});
