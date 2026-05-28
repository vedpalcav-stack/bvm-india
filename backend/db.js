// ═══════════════════════════════════════════════════════════════════════════
//  BVM ERP — Supabase Database Driver
//  HOW TO USE:
//  1. Run: npm install pg dotenv --prefix backend
//  2. Create backend/.env with your DATABASE_URL
//  3. Rename this file to db.js (replace the existing one)
//  4. Run npm run dev:backend
// ═══════════════════════════════════════════════════════════════════════════

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('DB: Connecting to Supabase...');
console.log('DB: URL =', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) + '...' : 'NOT FOUND');

let pool;

function makeDb(pgPool) {
  return {
    prepare: (sql) => {
      let i = 0;
      const pgSql = sql.replace(/\?/g, () => '$' + (++i));
      return {
        get:  async (...args) => { const { rows } = await pgPool.query(pgSql, args.flat()); return rows[0] || null; },
        all:  async (...args) => { const { rows } = await pgPool.query(pgSql, args.flat()); return rows; },
        run:  async (...args) => { const r = await pgPool.query(pgSql, args.flat()); return { changes: r.rowCount }; },
      };
    },
    exec:   async (sql)        => { await pgPool.query(sql); },
    pragma: ()                 => Promise.resolve(),
    query:  (sql, params = []) => pgPool.query(sql, params),
  };
}

async function initDb() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('');
    console.error('ERROR: DATABASE_URL not found!');
    console.error('Create a file called .env inside the backend folder with:');
    console.error('DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=disable');
    console.error('NODE_TLS_REJECT_UNAUTHORIZED=0');
    console.error('PORT=3001');
    console.error('');
    throw new Error('DATABASE_URL is not set');
  }

  pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to Supabase PostgreSQL');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('');
    console.error('Common fixes:');
    console.error('1. Check your DATABASE_URL in backend/.env');
    console.error('2. Make sure your Supabase password is correct');
    console.error('3. Use the Session pooler URL (port 6543) not Direct connection (port 5432)');
    console.error('4. Add ?sslmode=disable at the end of the URL');
    throw err;
  }

  const db = makeDb(pool);

  // Create all tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT DEFAULT '',
      phone TEXT DEFAULT '', email TEXT DEFAULT '', gstin TEXT DEFAULT '',
      address TEXT DEFAULT '', city TEXT DEFAULT '', state TEXT DEFAULT '',
      pincode TEXT DEFAULT '', type TEXT DEFAULT 'Regular',
      balance NUMERIC DEFAULT 0, brand TEXT DEFAULT 'india',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT DEFAULT '',
      category TEXT DEFAULT '', hsn TEXT DEFAULT '', unit TEXT DEFAULT 'Piece',
      rate NUMERIC DEFAULT 0, gst INTEGER DEFAULT 18, brand TEXT DEFAULT 'india', model_no TEXT DEFAULT '', description TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      stock NUMERIC DEFAULT 0, reorder NUMERIC DEFAULT 10,
      warehouse TEXT DEFAULT 'Main Godown', updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, client_id TEXT NOT NULL REFERENCES clients(id),
      date TEXT NOT NULL, due_date TEXT, validity INTEGER, status TEXT DEFAULT 'Draft',
      paid NUMERIC DEFAULT 0, currency TEXT DEFAULT 'INR', exchange_rate NUMERIC DEFAULT 1,
      ref_doc_id TEXT, po_number TEXT, so_number TEXT, notes TEXT,
      client_quotation_number TEXT, terms TEXT, ship_to_name TEXT, ship_to_address TEXT,
      ship_to_city TEXT, ship_to_state TEXT, ship_to_pincode TEXT, ship_to_gstin TEXT,
      ship_to_phone TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS document_items (
      id SERIAL PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      serial_no INTEGER, product_id TEXT NOT NULL REFERENCES products(id),
      description TEXT DEFAULT '', hsn TEXT DEFAULT '', qty NUMERIC NOT NULL,
      unit TEXT DEFAULT '', rate NUMERIC NOT NULL, currency TEXT DEFAULT 'INR', amount NUMERIC DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES documents(id),
      client_id TEXT NOT NULL REFERENCES clients(id), amount NUMERIC NOT NULL,
      currency TEXT DEFAULT 'INR', mode TEXT DEFAULT 'Wire Transfer',
      ref TEXT DEFAULT '', note TEXT DEFAULT '', date TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id),
      document_id TEXT, type TEXT DEFAULT 'quotation', channel TEXT DEFAULT 'whatsapp',
      message TEXT, sent_at TIMESTAMPTZ DEFAULT NOW(), status TEXT DEFAULT 'Sent'
    );
  `);

  // Add new tables for due reminders and credit settings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS credit_settings (
      id BIGSERIAL PRIMARY KEY,
      brand TEXT DEFAULT 'india',
      credit_days INTEGER DEFAULT 30
    );
    CREATE TABLE IF NOT EXISTS due_reminders (
      id BIGSERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(e => console.log('Tables may already exist:', e.message));

  // Add brand column to existing tables if missing
  for (const q of [
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'india'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'india'",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'india'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS model_no TEXT DEFAULT ''",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
  ]) { try { await pool.query(q); } catch(e) {} }

  // Seed default credit settings
  await pool.query(`
    INSERT INTO credit_settings (brand, credit_days) SELECT 'india', 30 WHERE NOT EXISTS (SELECT 1 FROM credit_settings WHERE brand = 'india');
    INSERT INTO credit_settings (brand, credit_days) SELECT 'world', 30 WHERE NOT EXISTS (SELECT 1 FROM credit_settings WHERE brand = 'world');
  `).catch(() => {});

  console.log('✅ All tables ready');

  // Seed sample data if empty
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM clients');
  if (Number(rows[0].c) === 0) {
    console.log('📦 Seeding sample data...');
    await pool.query(`
      INSERT INTO clients (id,name,contact,phone,email,gstin,address,city,state,pincode,type,balance,brand) VALUES
        ('C001','Rajesh Traders Pvt Ltd','Rajesh Kumar','9876543210','rajesh@traders.in','27AABCT1332L1ZA','Shop 12, Trade Centre','Mumbai','Maharashtra','400069','Regular',45000,'india'),
        ('C002','Sharma Enterprises','Amit Sharma','9812345678','amit@sharma.in','07AAFCS2597P1Z6','B-42, Industrial Area','Delhi','Delhi','110020','Wholesale',-12000,'india'),
        ('C003','South Goods Co.','Priya Nair','9944332211','priya@southgoods.in','32AADCS1234K1ZB','MG Road, Fort Kochi','Kochi','Kerala','682001','Retail',0,'india')
      ON CONFLICT (id) DO NOTHING;
    `);
    await pool.query(`
      INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst,brand) VALUES
        ('P001','Steel Pipe 1 inch','SP001','Steel','7304','Piece',850,18,'india'),
        ('P002','PVC Conduit 25mm','PC025','PVC','3917','Metre',45,18,'india'),
        ('P003','Cable 4mm 3Core','CB403','Cable','8544','Metre',120,18,'india'),
        ('P004','GI Wire 8 SWG','GW008','Steel','7217','Kg',75,18,'india')
      ON CONFLICT (id) DO NOTHING;
    `);
    await pool.query(`
      INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES
        ('P001',240,50,'Main Godown'),('P002',15,100,'Main Godown'),
        ('P003',680,200,'Main Godown'),('P004',320,100,'Main Godown')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Sample data seeded');
  }

  return db;
}

module.exports = { initDb };
