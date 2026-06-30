const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/by-quote/:quoteId', (req, res) => {
  const db = req.app.get('db');
  const receipts = db.prepare('SELECT * FROM receipts WHERE quote_id = ? ORDER BY payment_date').all(req.params.quoteId);
  res.json(receipts);
});

router.post('/', (req, res) => {
  const db = req.app.get('db');
  const { quote_id, payment_date, amount_paid, payment_method } = req.body;
  if (!quote_id || !amount_paid) return res.status(400).json({ error: 'quote_id and amount_paid required' });
  const result = db.prepare('INSERT INTO receipts (quote_id, payment_date, amount_paid, payment_method) VALUES (?, ?, ?, ?)')
    .run(quote_id, payment_date || new Date().toISOString().split('T')[0], amount_paid, payment_method || 'Cash');
  updateQuoteBalance(db, quote_id);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  const db = req.app.get('db');
  const receipt = db.prepare('SELECT quote_id FROM receipts WHERE id=?').get(req.params.id);
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM receipts WHERE id=?').run(req.params.id);
  updateQuoteBalance(db, receipt.quote_id);
  res.json({ success: true });
});

function updateQuoteBalance(db, quoteId) {
  const items = db.prepare('SELECT COALESCE(SUM(calculated_price),0) as total FROM quote_items WHERE quote_id=?').get(quoteId);
  const total = items.total || 0;
  const quote = db.prepare('SELECT discount FROM quotes WHERE id=?').get(quoteId);
  const discount = quote?.discount || 0;
  const depositPaid = db.prepare('SELECT COALESCE(SUM(amount_paid),0) as total FROM receipts WHERE quote_id=?').get(quoteId)?.total || 0;
  const grandTotal = total - discount;
  const balanceDue = grandTotal - depositPaid;
  db.prepare('UPDATE quotes SET total_amount=?, grand_total=?, deposit_paid=?, balance_due=? WHERE id=?')
    .run(total, grandTotal, depositPaid, balanceDue, quoteId);
}
