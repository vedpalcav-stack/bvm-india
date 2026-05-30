const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'erp.db.json');
let _db = null;

function saveDb() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, JSON.stringify({ data: Buffer.from(data).toString('base64') }));
}

function getRow(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

function getAll(sql, params = []) {
  const results = [];
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

const db = {
  prepare: (sql) => ({
    run: (...params) => { _db.run(sql, params); saveDb(); return { changes: 1 }; },
    get: (...params) => getRow(sql, params),
    all: (...params) => getAll(sql, params),
  }),
  exec: (sql) => { _db.run(sql); saveDb(); },
  pragma: () => {},
};

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    try {
      const json = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      _db = new SQL.Database(Buffer.from(json.data, 'base64'));
    } catch (e) { _db = new SQL.Database(); }
  } else {
    _db = new SQL.Database();
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT, phone TEXT,
      email TEXT, gstin TEXT, address TEXT, city TEXT, state TEXT, pincode TEXT,
      type TEXT DEFAULT 'Regular', balance REAL DEFAULT 0, created_at TEXT DEFAULT 'now'
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT, category TEXT,
      hsn TEXT, unit TEXT DEFAULT 'Piece', rate REAL DEFAULT 0, gst INTEGER DEFAULT 18,
      created_at TEXT DEFAULT 'now'
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL,
      stock REAL DEFAULT 0, reorder REAL DEFAULT 10,
      warehouse TEXT DEFAULT 'Main Godown', updated_at TEXT DEFAULT 'now'
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, client_id TEXT NOT NULL,
      date TEXT NOT NULL, due_date TEXT, validity INTEGER,
      status TEXT DEFAULT 'Draft', paid REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR', exchange_rate REAL DEFAULT 1,
      ref_doc_id TEXT, po_number TEXT, so_number TEXT, notes TEXT,
      created_at TEXT DEFAULT 'now'
    );
    CREATE TABLE IF NOT EXISTS document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, document_id TEXT NOT NULL,
      serial_no INTEGER, product_id TEXT NOT NULL, description TEXT,
      qty REAL NOT NULL, unit TEXT, rate REAL NOT NULL,
      currency TEXT DEFAULT 'INR', amount REAL
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      document_id TEXT,
      type TEXT DEFAULT 'quotation',
      channel TEXT DEFAULT 'whatsapp',
      message TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'Sent'
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, invoice_id TEXT, client_id TEXT NOT NULL,
      amount REAL NOT NULL, currency TEXT DEFAULT 'INR',
      mode TEXT DEFAULT 'Wire Transfer', ref TEXT, note TEXT,
      date TEXT NOT NULL, created_at TEXT DEFAULT 'now'
    );
  `);
  saveDb();

  const row = getRow('SELECT COUNT(*) as c FROM clients');
  if (!row || Number(row.c) === 0) {
    const now = new Date().toISOString();
    _db.run(`INSERT INTO clients VALUES ('C001','Rajesh Traders Pvt Ltd','Rajesh Kumar','9876543210','rajesh@traders.in','27AABCT1332L1ZA','Shop 12, Trade Centre, Andheri','Mumbai','Maharashtra','400069','Regular',45000,'${now}')`);
    _db.run(`INSERT INTO clients VALUES ('C002','Sharma Enterprises','Amit Sharma','9812345678','amit@sharma.in','07AAFCS2597P1Z6','B-42, Industrial Area','Delhi','Delhi','110020','Wholesale',-12000,'${now}')`);
    _db.run(`INSERT INTO clients VALUES ('C003','South Goods Co.','Priya Nair','9944332211','priya@southgoods.in','32AADCS1234K1ZB','MG Road, Fort Kochi','Kochi','Kerala','682001','Retail',0,'${now}')`);
    _db.run(`INSERT INTO products VALUES ('P001','Steel Pipe 1 inch','SP001','Steel','7304','Piece',850,18,'${now}')`);
    _db.run(`INSERT INTO products VALUES ('P002','PVC Conduit 25mm','PC025','PVC','3917','Metre',45,18,'${now}')`);
    _db.run(`INSERT INTO products VALUES ('P003','Cable 4mm 3Core','CB403','Cable','8544','Metre',120,18,'${now}')`);
    _db.run(`INSERT INTO products VALUES ('P004','GI Wire 8 SWG','GW008','Steel','7217','Kg',75,18,'${now}')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P001',240,50,'Main Godown')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P002',15,100,'Main Godown')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P003',680,200,'Main Godown')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P004',320,100,'Main Godown')`);
    saveDb();
  }
  return db;
}

module.exports = { initDb };
