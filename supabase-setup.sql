-- ═══════════════════════════════════════════════════════════════
--  BVM ERP — Complete Supabase Setup
--  Run this in Supabase SQL Editor for a fresh install
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS due_reminders CASCADE;
DROP TABLE IF EXISTS credit_settings CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS document_items CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT DEFAULT '',
  phone TEXT DEFAULT '', email TEXT DEFAULT '', gstin TEXT DEFAULT '',
  address TEXT DEFAULT '', city TEXT DEFAULT '', state TEXT DEFAULT '',
  pincode TEXT DEFAULT '', type TEXT DEFAULT 'Regular',
  balance NUMERIC DEFAULT 0, brand TEXT DEFAULT 'india',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT DEFAULT '',
  category TEXT DEFAULT '', hsn TEXT DEFAULT '', unit TEXT DEFAULT 'Piece',
  rate NUMERIC DEFAULT 0, gst INTEGER DEFAULT 18,
  brand TEXT DEFAULT 'india', model_no TEXT DEFAULT '',
  description TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock NUMERIC DEFAULT 0, reorder NUMERIC DEFAULT 10,
  warehouse TEXT DEFAULT 'Main Godown', updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY, type TEXT NOT NULL, client_id TEXT NOT NULL REFERENCES clients(id),
  date TEXT NOT NULL, due_date TEXT, validity INTEGER, status TEXT DEFAULT 'Draft',
  paid NUMERIC DEFAULT 0, currency TEXT DEFAULT 'INR', exchange_rate NUMERIC DEFAULT 1,
  ref_doc_id TEXT, po_number TEXT, so_number TEXT, notes TEXT,
  client_quotation_number TEXT, terms TEXT,
  ship_to_name TEXT, ship_to_address TEXT, ship_to_city TEXT,
  ship_to_state TEXT, ship_to_pincode TEXT, ship_to_gstin TEXT, ship_to_phone TEXT,
  brand TEXT DEFAULT 'india', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_items (
  id BIGSERIAL PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  serial_no INTEGER, product_id TEXT NOT NULL REFERENCES products(id),
  description TEXT DEFAULT '', hsn TEXT DEFAULT '', qty NUMERIC NOT NULL,
  unit TEXT DEFAULT '', rate NUMERIC NOT NULL, gst NUMERIC DEFAULT 18,
  currency TEXT DEFAULT 'INR', amount NUMERIC DEFAULT 0
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES documents(id),
  client_id TEXT NOT NULL REFERENCES clients(id), amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR', mode TEXT DEFAULT 'Wire Transfer',
  ref TEXT DEFAULT '', note TEXT DEFAULT '', date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reminders (
  id BIGSERIAL PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id),
  document_id TEXT, type TEXT DEFAULT 'quotation',
  channel TEXT DEFAULT 'whatsapp', message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(), status TEXT DEFAULT 'Sent'
);

CREATE TABLE credit_settings (
  id BIGSERIAL PRIMARY KEY, brand TEXT DEFAULT 'india', credit_days INTEGER DEFAULT 30
);

CREATE TABLE due_reminders (
  id BIGSERIAL PRIMARY KEY, invoice_id TEXT NOT NULL, client_id TEXT NOT NULL,
  invoice_date TEXT NOT NULL, due_date TEXT NOT NULL,
  credit_days INTEGER DEFAULT 30, reminder1_sent INTEGER DEFAULT 0,
  reminder1_date TEXT, reminder2_sent INTEGER DEFAULT 0, reminder2_date TEXT,
  channel TEXT DEFAULT 'whatsapp', status TEXT DEFAULT 'Pending',
  brand TEXT DEFAULT 'india', created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_type    ON documents(type);
CREATE INDEX idx_documents_client  ON documents(client_id);
CREATE INDEX idx_documents_brand   ON documents(brand);
CREATE INDEX idx_items_document    ON document_items(document_id);
CREATE INDEX idx_payments_client   ON payments(client_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);

-- Default credit settings
INSERT INTO credit_settings (brand, credit_days) VALUES ('india', 30), ('world', 30);

SELECT 'BVM ERP tables created successfully!' AS status;
