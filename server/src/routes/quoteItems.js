const express = require('express');
const router = express.Router();
const { calculatePrice, getSizeTier } = require('../pricing');

module.exports = router;

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

router.get('/by-quote/:quoteId', (req, res) => {
  const db = req.app.get('db');
  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id').all(req.params.quoteId);
  res.json(items);
});

router.post('/', (req, res) => {
  const db = req.app.get('db');
  const { quote_id, product_type, quantity, measurement_unit, width, height, square_meters } = req.body;
  if (!quote_id || !product_type) return res.status(400).json({ error: 'quote_id and product_type required' });

  const settings = getSettings(db);
  const sizeTier = getSizeTier(width || 0, height || 0, measurement_unit || 'cm');
  const price = calculatePrice(width || 0, height || 0, measurement_unit || 'cm', product_type, quantity || 1, square_meters || 0, settings);

  const result = db.prepare(`INSERT INTO quote_items (quote_id, product_type, quantity, measurement_unit, width, height, square_meters, size_tier, calculated_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(quote_id, product_type, quantity || 1, measurement_unit || 'cm', width || null, height || null, square_meters || null, sizeTier, price);

  recalcQuote(db, quote_id);
  res.json({ id: result.lastInsertRowid, size_tier: sizeTier, calculated_price: price });
});

router.put('/:id', (req, res) => {
  const db = req.app.get('db');
  const { product_type, quantity, measurement_unit, width, height, square_meters } = req.body;

  const item = db.prepare('SELECT * FROM quote_items WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const settings = getSettings(db);
  const w = width !== undefined ? width : item.width;
  const h = height !== undefined ? height : item.height;
  const mu = measurement_unit || item.measurement_unit;
  const pt = product_type || item.product_type;
  const qty = quantity !== undefined ? quantity : item.quantity;
  const sm = square_meters !== undefined ? square_meters : item.square_meters;

  const sizeTier = getSizeTier(w || 0, h || 0, mu);
  const price = calculatePrice(w || 0, h || 0, mu, pt, qty || 1, sm || 0, settings);

  db.prepare(`UPDATE quote_items SET product_type=?, quantity=?, measurement_unit=?, width=?, height=?, square_meters=?, size_tier=?, calculated_price=? WHERE id=?`)
    .run(pt, qty, mu, w, h, sm, sizeTier, price, req.params.id);

  recalcQuote(db, item.quote_id);
  res.json({ size_tier: sizeTier, calculated_price: price });
});

router.delete('/:id', (req, res) => {
  const db = req.app.get('db');
  const item = db.prepare('SELECT quote_id FROM quote_items WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM quote_items WHERE id=?').run(req.params.id);
  recalcQuote(db, item.quote_id);
  res.json({ success: true });
});

function recalcQuote(db, quoteId) {
  const items = db.prepare('SELECT calculated_price FROM quote_items WHERE quote_id = ?').all(quoteId);
  const total = items.reduce((s, i) => s + (i.calculated_price || 0), 0);
  const quote = db.prepare('SELECT discount FROM quotes WHERE id=?').get(quoteId);
  const discount = quote?.discount || 0;
  const depositPaid = db.prepare('SELECT COALESCE(SUM(amount_paid),0) as total FROM receipts WHERE quote_id=?').get(quoteId)?.total || 0;
  const grandTotal = total - discount;
  const balanceDue = grandTotal - depositPaid;
  db.prepare('UPDATE quotes SET total_amount=?, grand_total=?, deposit_paid=?, balance_due=? WHERE id=?')
    .run(total, grandTotal, depositPaid, balanceDue, quoteId);
}
