const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'framing_erp.db');

function createWrapper(db) {
  return {
    prepare(sql) {
      let stmt = null;
      return {
        get(...params) {
          try { stmt?.free(); } catch {}
          stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) return stmt.getAsObject();
          return undefined;
        },
        all(...params) {
          try { stmt?.free(); } catch {}
          stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          return rows;
        },
        run(...params) {
          try { stmt?.free(); } catch {}
          stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          stmt.step();
          const lastId = db.exec("SELECT last_insert_rowid() as id");
          const id = lastId.length > 0 ? lastId[0].values[0][0] : 0;
          return { lastInsertRowid: id, changes: db.getRowsModified() };
        }
      };
    },
    run(sql, params = []) {
      db.run(sql, params);
      return { lastInsertRowid: 0, changes: db.getRowsModified() };
    },
    exec(sql) { return db.exec(sql); }
  };
}

async function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      date_created DATE DEFAULT (date('now')),
      discount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      deposit_paid REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft','Sent','Deposit Paid','Send to Production')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      product_type TEXT NOT NULL CHECK(product_type IN ('Base Print','Stretch Canvas','Floating Frame','Glass Frame','Hardwood Floor')),
      quantity INTEGER DEFAULT 1,
      measurement_unit TEXT DEFAULT 'cm' CHECK(measurement_unit IN ('cm','inches')),
      width REAL,
      height REAL,
      square_meters REAL,
      size_tier TEXT,
      calculated_price REAL DEFAULT 0,
      production_status TEXT DEFAULT 'Pending' CHECK(production_status IN ('Pending','In Production','Complete')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS production_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      stage_completed TEXT NOT NULL CHECK(stage_completed IN ('Wood Cut','Wood Join','Stretch','Frame Cut','Frame Join','Glass Cut','Assembly')),
      artisans TEXT NOT NULL DEFAULT '[]',
      worker_count INTEGER DEFAULT 1,
      total_stage_commission REAL DEFAULT 0,
      split_commission REAL DEFAULT 0,
      date_completed DATE NOT NULL,
      payment_status TEXT DEFAULT 'Unpaid' CHECK(payment_status IN ('Unpaid','Paid')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES quote_items(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      amount_paid REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash','Transfer','POS')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const wrapper = createWrapper(db);

  const count = wrapper.prepare('SELECT COUNT(*) as c FROM settings').get();
  if (count.c === 0) {
    const defaults = [
      ['pricing_base_rates', JSON.stringify({ 'Small': 6, 'Medium': 3.5, 'Large': 2.2, 'Extra Large': 1.8 })],
      ['pricing_framing_multipliers', JSON.stringify({ 'Small': 2.0, 'Medium': 1.6, 'Large': 1.5, 'Extra Large': 1.4 })],
      ['pricing_glass_multipliers', JSON.stringify({ 'Small': 1.3, 'Medium': 1.4, 'Large': 1.5, 'Extra Large': 1.6 })],
      ['pricing_floor_rate', '15000'],
      ['commission_matrix', JSON.stringify({
        'Wood Cut': { 'Small': 100, 'Medium': 125, 'Large': 150 },
        'Wood Join': { 'Small': 100, 'Medium': 125, 'Large': 150 },
        'Stretch': { 'Small': 100, 'Medium': 150, 'Large': 200 },
        'Frame Cut': { 'Small': 100, 'Medium': 125, 'Large': 150 },
        'Frame Join': { 'Small': 100, 'Medium': 125, 'Large': 150 },
        'Glass Cut': { 'Small': 100, 'Medium': 125, 'Large': 150 },
        'Assembly': { 'Small': 100, 'Medium': 100, 'Large': 100 }
      })],
      ['production_routing', JSON.stringify({
        'Base Print': [],
        'Stretch Canvas': ['Wood Cut', 'Wood Join', 'Stretch'],
        'Floating Frame': ['Wood Cut', 'Wood Join', 'Stretch', 'Frame Cut', 'Frame Join', 'Assembly'],
        'Glass Frame': ['Wood Cut', 'Wood Join', 'Stretch', 'Frame Cut', 'Frame Join', 'Glass Cut', 'Assembly'],
        'Hardwood Floor': []
      })]
    ];
    for (const [key, value] of defaults) {
      db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }

  saveDb(db);
  return { db, wrapper, save: () => saveDb(db) };
}

function saveDb(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { initDatabase, DB_PATH };
