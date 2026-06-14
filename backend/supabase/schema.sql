DROP TABLE IF EXISTS companies CASCADE;

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

INSERT INTO companies (name)
VALUES
('BVM INDIA'),
('BVM WORLD PVT. LTD.');
