═══════════════════════════════════════════════════════════
  BVM ERP — Complete Setup Guide
═══════════════════════════════════════════════════════════

FEATURES:
- BVM INDIA + BVM WORLD separate brands
- Brand selection screen on startup
- Quotations → Proforma → PO → SO → Tax Invoice flow
- PDF generation per brand (with logos)
- Due date reminders with credit period
- Payments tracker with paid/due balance
- Inventory with In Stock / Low Stock
- Per-item GST rates (0%, 5%, 12%, 18%, 28%)
- Model No. and Make fields for products

═══════════════════════════════════════════════════════════
CLOUD SETUP (Supabase + Render + Vercel)
═══════════════════════════════════════════════════════════

Step 1 - Supabase:
  - Create project at supabase.com
  - Run supabase-setup.sql in SQL Editor
  - Copy Session pooler connection string

Step 2 - Create backend/.env:
  DATABASE_URL=postgresql://postgres.XXX:PASSWORD@aws-0-XXX.pooler.supabase.com:6543/postgres?sslmode=disable
  PORT=3001
  NODE_TLS_REJECT_UNAUTHORIZED=0

Step 3 - Render (backend):
  Root Directory: backend
  Build Command: npm install
  Start Command: node server.js
  Env vars: DATABASE_URL, NODE_TLS_REJECT_UNAUTHORIZED=0

Step 4 - Vercel (frontend):
  Root Directory: frontend
  Env var: REACT_APP_API_URL=https://your-render-url.onrender.com

═══════════════════════════════════════════════════════════
LOCAL SETUP
═══════════════════════════════════════════════════════════

1. Install Node.js from nodejs.org
2. Create backend/.env with DATABASE_URL
3. Run: npm run install:all
4. Terminal 1: npm run dev:backend
5. Terminal 2: npm run dev:frontend
6. Open: http://localhost:3000

═══════════════════════════════════════════════════════════
