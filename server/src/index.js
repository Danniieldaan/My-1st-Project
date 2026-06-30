const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

async function main() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());

  const { wrapper, save } = await initDatabase();
  app.set('db', wrapper);
  app.set('dbSave', save);
  setInterval(() => save(), 10000);

  app.use('/api/customers', require('./routes/customers'));
  app.use('/api/quotes', require('./routes/quotes'));
  app.use('/api/quote-items', require('./routes/quoteItems'));
  app.use('/api/production-logs', require('./routes/productionLogs'));
  app.use('/api/receipts', require('./routes/receipts'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/payroll', require('./routes/payroll'));
  app.use('/api/reports', require('./routes/reports'));

  app.listen(PORT, () => {
    console.log(`ERP Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
