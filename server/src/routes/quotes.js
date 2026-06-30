const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/', (req, res) => {
  const db = req.app.get('db');
  const quotes = db.prepare(`
    SELECT q.*, c.name as customer_name
    FROM quotes q JOIN customers c ON q.customer_id = c.id
    ORDER BY q.id DESC
  `).all();
  res.json(quotes);
});

router.get('/:id', (req, res) => {
  const db = req.app.get('db');
  const quote = db.prepare(`
    SELECT q.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
    FROM quotes q JOIN customers c ON q.customer_id = c.id WHERE q.id = ?
  `).get(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
  const receipts = db.prepare('SELECT * FROM receipts WHERE quote_id = ? ORDER BY payment_date').all(req.params.id);
  res.json({ ...quote, items, receipts });
});

router.post('/', (req, res) => {
  const db = req.app.get('db');
  const { customer_id, date_created, discount } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
  const result = db.prepare('INSERT INTO quotes (customer_id, date_created, discount) VALUES (?, ?, ?)')
    .run(customer_id, date_created || new Date().toISOString().split('T')[0], discount || 0);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = req.app.get('db');
  const { customer_id, date_created, discount, status } = req.body;
  const updates = [];
  const params = [];
  if (customer_id !== undefined) { updates.push('customer_id=?'); params.push(customer_id); }
  if (date_created !== undefined) { updates.push('date_created=?'); params.push(date_created); }
  if (discount !== undefined) { updates.push('discount=?'); params.push(discount); }
  if (status !== undefined) { updates.push('status=?'); params.push(status); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  db.prepare(`UPDATE quotes SET ${updates.join(',')} WHERE id=?`).run(...params);

  recalcQuote(db, req.params.id);
  res.json({ success: true });
});

router.put('/:id/status', (req, res) => {
  const db = req.app.get('db');
  const { status } = req.body;
  const valid = ['Draft', 'Sent', 'Deposit Paid', 'Send to Production'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.prepare('UPDATE quotes SET status=? WHERE id=?').run(status, req.params.id);

  if (status === 'Send to Production') {
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
    for (const item of items) {
      if (item.product_type !== 'Base Print' && item.product_type !== 'Hardwood Floor') {
        db.prepare("UPDATE quote_items SET production_status='Pending' WHERE id=?").run(item.id);
      }
    }
  }

  recalcQuote(db, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const db = req.app.get('db');
  db.prepare('DELETE FROM quotes WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

function recalcQuote(db, quoteId) {
  const items = db.prepare('SELECT calculated_price FROM quote_items WHERE quote_id = ?').all(quoteId);
  const total = items.reduce((s, i) => s + (i.calculated_price || 0), 0);
  const quote = db.prepare('SELECT discount, deposit_paid FROM quotes WHERE id=?').get(quoteId);
  const discount = quote?.discount || 0;
  const depositPaid = db.prepare('SELECT COALESCE(SUM(amount_paid),0) as total FROM receipts WHERE quote_id=?').get(quoteId)?.total || 0;
  const grandTotal = total - discount;
  const balanceDue = grandTotal - depositPaid;
  db.prepare('UPDATE quotes SET total_amount=?, grand_total=?, deposit_paid=?, balance_due=? WHERE id=?')
    .run(total, grandTotal, depositPaid, balanceDue, quoteId);
}
