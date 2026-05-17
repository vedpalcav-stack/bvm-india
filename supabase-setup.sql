-- ═══════════════════════════════════════════════════════════════════════════
--  BVM ERP — Supabase Database Setup (Fixed Version)
--  HOW TO USE:
--  1. Open your Supabase project → SQL Editor
--  2. Paste this entire file and click Run
--  3. You should see: "All BVM ERP tables created successfully!"
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing tables cleanly
DROP TABLE IF EXISTS reminders     CASCADE;
DROP TABLE IF EXISTS payments      CASCADE;
DROP TABLE IF EXISTS document_items CASCADE;
DROP TABLE IF EXISTS documents     CASCADE;
DROP TABLE IF EXISTS inventory     CASCADE;
DROP TABLE IF EXISTS products      CASCADE;
DROP TABLE IF EXISTS clients       CASCADE;

-- Clients (TEXT primary key — not UUID)
CREATE TABLE clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  gstin       TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  city        TEXT DEFAULT '',
  state       TEXT DEFAULT '',
  pincode     TEXT DEFAULT '',
  type        TEXT DEFAULT 'Regular',
  balance     NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Products (TEXT primary key)
CREATE TABLE products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sku         TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  hsn         TEXT DEFAULT '',
  unit        TEXT DEFAULT 'Piece',
  rate        NUMERIC DEFAULT 0,
  gst         INTEGER DEFAULT 18,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE inventory (
  id          BIGSERIAL PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock       NUMERIC DEFAULT 0,
  reorder     NUMERIC DEFAULT 10,
  warehouse   TEXT DEFAULT 'Main Godown',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id                      TEXT PRIMARY KEY,
  type                    TEXT NOT NULL,
  client_id               TEXT NOT NULL REFERENCES clients(id),
  date                    TEXT NOT NULL,
  due_date                TEXT,
  validity                INTEGER,
  status                  TEXT DEFAULT 'Draft',
  paid                    NUMERIC DEFAULT 0,
  currency                TEXT DEFAULT 'INR',
  exchange_rate           NUMERIC DEFAULT 1,
  ref_doc_id              TEXT,
  po_number               TEXT,
  so_number               TEXT,
  notes                   TEXT,
  client_quotation_number TEXT,
  terms                   TEXT,
  ship_to_name            TEXT,
  ship_to_address         TEXT,
  ship_to_city            TEXT,
  ship_to_state           TEXT,
  ship_to_pincode         TEXT,
  ship_to_gstin           TEXT,
  ship_to_phone           TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Document Line Items
CREATE TABLE document_items (
  id           BIGSERIAL PRIMARY KEY,
  document_id  TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  serial_no    INTEGER,
  product_id   TEXT NOT NULL REFERENCES products(id),
  description  TEXT DEFAULT '',
  hsn          TEXT DEFAULT '',
  qty          NUMERIC NOT NULL,
  unit         TEXT DEFAULT '',
  rate         NUMERIC NOT NULL,
  currency     TEXT DEFAULT 'INR',
  amount       NUMERIC DEFAULT 0
);

-- Payments
CREATE TABLE payments (
  id          TEXT PRIMARY KEY,
  invoice_id  TEXT REFERENCES documents(id),
  client_id   TEXT NOT NULL REFERENCES clients(id),
  amount      NUMERIC NOT NULL,
  currency    TEXT DEFAULT 'INR',
  mode        TEXT DEFAULT 'Wire Transfer',
  ref         TEXT DEFAULT '',
  note        TEXT DEFAULT '',
  date        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id           BIGSERIAL PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES clients(id),
  document_id  TEXT,
  type         TEXT DEFAULT 'quotation',
  channel      TEXT DEFAULT 'whatsapp',
  message      TEXT,
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT DEFAULT 'Sent'
);

-- Indexes for performance
CREATE INDEX idx_documents_type    ON documents(type);
CREATE INDEX idx_documents_client  ON documents(client_id);
CREATE INDEX idx_documents_status  ON documents(status);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
CREATE INDEX idx_items_document    ON document_items(document_id);
CREATE INDEX idx_payments_client   ON payments(client_id);
CREATE INDEX idx_payments_invoice  ON payments(invoice_id);
CREATE INDEX idx_reminders_client  ON reminders(client_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);

SELECT 'All BVM ERP tables created successfully!' AS status;
