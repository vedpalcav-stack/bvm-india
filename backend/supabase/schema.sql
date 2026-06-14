```sql
-- =====================================================
-- BVM ERP DATABASE SCHEMA
-- Multi Company ERP
-- BVM INDIA + BVM WORLD PVT. LTD.
-- =====================================================

DROP TABLE IF EXISTS due_reminders CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS document_items CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- =====================================================
-- COMPANIES
-- =====================================================

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    address TEXT,
    gstin TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO companies
(name)
VALUES
('BVM INDIA'),
('BVM WORLD PVT. LTD.');

-- =====================================================
-- CUSTOMERS
-- =====================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    gstin TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',

    balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    model_no TEXT,
    hsn TEXT,

    unit TEXT DEFAULT 'Piece',

    rate NUMERIC(12,2) DEFAULT 0,
    gst NUMERIC(5,2) DEFAULT 18,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    stock NUMERIC(12,2) DEFAULT 0,
    reorder_level NUMERIC(12,2) DEFAULT 10,

    warehouse TEXT DEFAULT 'Main Warehouse',

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTS
-- quotation
-- proforma
-- purchase_order
-- sales_order
-- invoice
-- dispatch
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    customer_id UUID NOT NULL
        REFERENCES customers(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL,

    document_no TEXT UNIQUE NOT NULL,

    document_date DATE NOT NULL,

    due_date DATE,

    currency TEXT DEFAULT 'INR',
    exchange_rate NUMERIC(12,4) DEFAULT 1,

    status TEXT DEFAULT 'Draft',

    po_number TEXT,
    so_number TEXT,

    notes TEXT,
    terms TEXT,

    ship_to_name TEXT,
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gstin TEXT,
    ship_to_phone TEXT,

    subtotal NUMERIC(12,2) DEFAULT 0,
    gst_amount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    paid NUMERIC(12,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT ITEMS
-- =====================================================

CREATE TABLE document_items (
    id BIGSERIAL PRIMARY KEY,

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    product_id UUID
        REFERENCES products(id),

    serial_no INTEGER,

    description TEXT,

    qty NUMERIC(12,2) DEFAULT 0,

    unit TEXT,

    rate NUMERIC(12,2) DEFAULT 0,

    gst NUMERIC(5,2) DEFAULT 18,

    amount NUMERIC(12,2) DEFAULT 0
);

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    customer_id UUID NOT NULL
        REFERENCES customers(id),

    invoice_id UUID
        REFERENCES documents(id),

    amount NUMERIC(12,2) NOT NULL,

    payment_mode TEXT DEFAULT 'Bank Transfer',

    reference_no TEXT,

    note TEXT,

    payment_date DATE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WHATSAPP / EMAIL REMINDERS
-- =====================================================

CREATE TABLE reminders (
    id BIGSERIAL PRIMARY KEY,

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    customer_id UUID NOT NULL
        REFERENCES customers(id),

    document_id UUID
        REFERENCES documents(id),

    channel TEXT DEFAULT 'whatsapp',

    message TEXT,

    sent_at TIMESTAMPTZ DEFAULT NOW(),

    status TEXT DEFAULT 'Sent'
);

-- =====================================================
-- DUE PAYMENT REMINDERS
-- =====================================================

CREATE TABLE due_reminders (
    id BIGSERIAL PRIMARY KEY,

    company_id INTEGER NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    invoice_id UUID
        REFERENCES documents(id),

    customer_id UUID
        REFERENCES customers(id),

    due_date DATE,

    reminder1_sent BOOLEAN DEFAULT FALSE,
    reminder2_sent BOOLEAN DEFAULT FALSE,

    channel TEXT DEFAULT 'whatsapp',

    status TEXT DEFAULT 'Pending',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_products_company
ON products(company_id);

CREATE INDEX idx_customers_company
ON customers(company_id);

CREATE INDEX idx_documents_company
ON documents(company_id);

CREATE INDEX idx_documents_type
ON documents(type);

CREATE INDEX idx_inventory_product
ON inventory(product_id);

CREATE INDEX idx_document_items_document
ON document_items(document_id);

CREATE INDEX idx_payments_invoice
ON payments(invoice_id);

CREATE INDEX idx_reminders_document
ON reminders(document_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT
'BVM ERP Database Created Successfully'
AS status;
```
