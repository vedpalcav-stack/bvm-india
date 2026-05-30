const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_PATH = path.join(__dirname, 'erp.db.json');
let _db = null;

function saveDb() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, JSON.stringify({ data: Buffer.from(data).toString('base64') }));
}

function getRow(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
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

// Synchronous-style wrapper that returns Promises (compatible with async server.js)
const db = {
  prepare: (sql) => {
    // Convert $1,$2 PostgreSQL style back to ? for sql.js
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return {
      get:  async (...args) => getRow(sqliteSql, args.flat()),
      all:  async (...args) => getAll(sqliteSql, args.flat()),
      run:  async (...args) => { _db.run(sqliteSql, args.flat()); saveDb(); return { changes: 1 }; },
    };
  },
  exec:   async (sql)        => { _db.run(sql); saveDb(); },
  pragma: ()                 => Promise.resolve(),
  query:  async (sql, params = []) => {
    // For INSERT ... RETURNING used in reminders
    const sqliteSql = sql.replace(/\$\d+/g, '?').replace(/ RETURNING id/i, '');
    _db.run(sqliteSql, params);
    saveDb();
    // Get last inserted row id
    const idRow = getRow('SELECT last_insert_rowid() as id');
    return { rows: [{ id: idRow?.id || 1 }] };
  },
};

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const json = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      _db = new SQL.Database(Buffer.from(json.data, 'base64'));
      console.log('Loaded existing database');
    } catch (e) {
      console.log('Creating fresh database...');
      _db = new SQL.Database();
    }
  } else {
    _db = new SQL.Database();
  }

  // Create tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT DEFAULT '',
      phone TEXT DEFAULT '', email TEXT DEFAULT '', gstin TEXT DEFAULT '',
      address TEXT DEFAULT '', city TEXT DEFAULT '', state TEXT DEFAULT '',
      pincode TEXT DEFAULT '', type TEXT DEFAULT 'Regular',
      balance REAL DEFAULT 0, brand TEXT DEFAULT 'india', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT DEFAULT '',
      category TEXT DEFAULT '', hsn TEXT DEFAULT '', unit TEXT DEFAULT 'Piece',
      rate REAL DEFAULT 0, gst INTEGER DEFAULT 18, brand TEXT DEFAULT 'india',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL,
      stock REAL DEFAULT 0, reorder REAL DEFAULT 10,
      warehouse TEXT DEFAULT 'Main Godown',
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, client_id TEXT NOT NULL,
      date TEXT NOT NULL, due_date TEXT, validity INTEGER,
      status TEXT DEFAULT 'Draft', paid REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR', exchange_rate REAL DEFAULT 1,
      ref_doc_id TEXT, po_number TEXT, so_number TEXT, notes TEXT,
      client_quotation_number TEXT, terms TEXT,
      ship_to_name TEXT, ship_to_address TEXT, ship_to_city TEXT,
      ship_to_state TEXT, ship_to_pincode TEXT, ship_to_gstin TEXT, ship_to_phone TEXT,
      brand TEXT DEFAULT 'india',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, document_id TEXT NOT NULL,
      serial_no INTEGER, product_id TEXT NOT NULL,
      description TEXT DEFAULT '', hsn TEXT DEFAULT '',
      qty REAL NOT NULL, unit TEXT DEFAULT '', rate REAL NOT NULL,
      currency TEXT DEFAULT 'INR', amount REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, invoice_id TEXT, client_id TEXT NOT NULL,
      amount REAL NOT NULL, currency TEXT DEFAULT 'INR',
      mode TEXT DEFAULT 'Wire Transfer', ref TEXT DEFAULT '',
      note TEXT DEFAULT '', date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, client_id TEXT NOT NULL,
      document_id TEXT, type TEXT DEFAULT 'quotation',
      channel TEXT DEFAULT 'whatsapp', message TEXT,
      sent_at TEXT DEFAULT (datetime('now')), status TEXT DEFAULT 'Sent'
    );
    CREATE TABLE IF NOT EXISTS due_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      credit_days INTEGER DEFAULT 30,
      reminder1_sent INTEGER DEFAULT 0,
      reminder1_date TEXT,
      reminder2_sent INTEGER DEFAULT 0,
      reminder2_date TEXT,
      channel TEXT DEFAULT 'whatsapp',
      status TEXT DEFAULT 'Pending',
      brand TEXT DEFAULT 'india',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS credit_settings (
      id INTEGER PRIMARY KEY,
      brand TEXT DEFAULT 'india',
      credit_days INTEGER DEFAULT 30
    );
  `);
  saveDb();

  // Add brand column if it doesn't exist (for existing databases)
  try { _db.run("ALTER TABLE clients ADD COLUMN brand TEXT DEFAULT 'india'"); saveDb(); } catch(e) {}
  try { _db.run("ALTER TABLE products ADD COLUMN brand TEXT DEFAULT 'india'"); saveDb(); } catch(e) {}
  try { _db.run("ALTER TABLE documents ADD COLUMN brand TEXT DEFAULT 'india'"); saveDb(); } catch(e) {}
  // Create due_reminders if not exists (for existing databases)
  try {
    _db.run(`CREATE TABLE IF NOT EXISTS due_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id TEXT NOT NULL,
      client_id TEXT NOT NULL, invoice_date TEXT NOT NULL, due_date TEXT NOT NULL,
      credit_days INTEGER DEFAULT 30, reminder1_sent INTEGER DEFAULT 0,
      reminder1_date TEXT, reminder2_sent INTEGER DEFAULT 0, reminder2_date TEXT,
      channel TEXT DEFAULT 'whatsapp', status TEXT DEFAULT 'Pending',
      brand TEXT DEFAULT 'india', created_at TEXT DEFAULT (datetime('now'))
    )`);
    _db.run(`CREATE TABLE IF NOT EXISTS credit_settings (id INTEGER PRIMARY KEY, brand TEXT DEFAULT 'india', credit_days INTEGER DEFAULT 30)`);
    saveDb();
  } catch(e) {}

  // Seed if empty
  const row = getRow('SELECT COUNT(*) as c FROM clients');
  if (!row || Number(row.c) === 0) {
    console.log('Seeding sample data...');
    _db.run(`INSERT INTO clients (id,name,contact,phone,email,gstin,address,city,state,pincode,type,balance,brand,created_at) VALUES ('C001','Rajesh Traders Pvt Ltd','Rajesh Kumar','9876543210','rajesh@traders.in','27AABCT1332L1ZA','Shop 12, Trade Centre','Mumbai','Maharashtra','400069','Regular',45000,'india',datetime('now'))`);
    _db.run(`INSERT INTO clients (id,name,contact,phone,email,gstin,address,city,state,pincode,type,balance,brand,created_at) VALUES ('C002','Sharma Enterprises','Amit Sharma','9812345678','amit@sharma.in','07AAFCS2597P1Z6','B-42, Industrial Area','Delhi','Delhi','110020','Wholesale',-12000,'india',datetime('now'))`);
    _db.run(`INSERT INTO clients (id,name,contact,phone,email,gstin,address,city,state,pincode,type,balance,brand,created_at) VALUES ('C003','South Goods Co.','Priya Nair','9944332211','priya@southgoods.in','32AADCS1234K1ZB','MG Road, Fort Kochi','Kochi','Kerala','682001','Retail',0,'india',datetime('now'))`);
    _db.run(`INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst,brand,created_at) VALUES ('P001','Steel Pipe 1 inch','SP001','Steel','7304','Piece',850,18,'india',datetime('now'))`);
    _db.run(`INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst,brand,created_at) VALUES ('P002','PVC Conduit 25mm','PC025','PVC','3917','Metre',45,18,'india',datetime('now'))`);
    _db.run(`INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst,brand,created_at) VALUES ('P003','Cable 4mm 3Core','CB403','Cable','8544','Metre',120,18,'india',datetime('now'))`);
    _db.run(`INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst,brand,created_at) VALUES ('P004','GI Wire 8 SWG','GW008','Steel','7217','Kg',75,18,'india',datetime('now'))`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P001',240,50,'Main Godown')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P002',15,100,'Main Godown')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P003',680,200,'Main Godown')`);
    _db.run(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ('P004',320,100,'Main Godown')`);
    saveDb();
    console.log('Sample data seeded');
  }

  console.log('✅ Local database ready');
  return db;
}

module.exports = { initDb };
