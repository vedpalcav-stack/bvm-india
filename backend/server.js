const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { generateDocPDF } = require('./pdfgen');

const app = express();
app.use(cors());
app.use(express.json());

const DOC_PREFIXES = { quotation: 'QT', proforma: 'PI', purchase_order: 'PO', sales_order: 'SO', invoice: 'INV' };

initDb().then(db => {

  function nextId(type) {
    const prefix = DOC_PREFIXES[type] || 'DOC';
    const row = db.prepare(`SELECT COUNT(*) as c FROM documents WHERE type = ?`).get(type);
    return `${prefix}-${String(Number(row.c) + 1).padStart(4, '0')}`;
  }
  function nextClientId() {
    const row = db.prepare(`SELECT COUNT(*) as c FROM clients`).get();
    return `C${String(Number(row.c) + 1).padStart(3, '0')}`;
  }
  function nextProductId() {
    const row = db.prepare(`SELECT COUNT(*) as c FROM products`).get();
    return `P${String(Number(row.c) + 1).padStart(3, '0')}`;
  }
  function nextPaymentId() {
    const row = db.prepare(`SELECT COUNT(*) as c FROM payments`).get();
    return `PMT-${String(Number(row.c) + 1).padStart(4, '0')}`;
  }
  function getDocWithItems(id) {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) return null;
    doc.items = db.prepare('SELECT * FROM document_items WHERE document_id = ? ORDER BY serial_no, id').all(id);
    return doc;
  }
  function calcDocTotal(items) {
    const sub = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.rate || 0), 0);
    return { subtotal: sub, gst: sub * 0.18, total: sub * 1.18 };
  }

  // ── CLIENTS ────────────────────────────────────────────────────────────────
  app.get('/api/clients', (req, res) => res.json(db.prepare('SELECT * FROM clients ORDER BY name').all()));
  app.post('/api/clients', (req, res) => {
    const { name, contact, phone, email, gstin, address, city, state, pincode, type } = req.body;
    const id = nextClientId();
    db.prepare(`INSERT INTO clients (id,name,contact,phone,email,gstin,address,city,state,pincode,type,balance,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)`)
      .run(id, name, contact||'', phone||'', email||'', gstin||'', address||'', city||'', state||'', pincode||'', type||'Regular', new Date().toISOString());
    res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
  });
  app.put('/api/clients/:id', (req, res) => {
    const { name, contact, phone, email, gstin, address, city, state, pincode, type } = req.body;
    db.prepare(`UPDATE clients SET name=?,contact=?,phone=?,email=?,gstin=?,address=?,city=?,state=?,pincode=?,type=? WHERE id=?`)
      .run(name, contact||'', phone||'', email||'', gstin||'', address||'', city||'', state||'', pincode||'', type||'Regular', req.params.id);
    res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
  });

  // ── PRODUCTS ───────────────────────────────────────────────────────────────
  app.get('/api/products', (req, res) => res.json(db.prepare('SELECT * FROM products ORDER BY name').all()));
  app.post('/api/products', (req, res) => {
    const { name, sku, category, hsn, unit, rate, gst, opening_stock } = req.body;
    const id = nextProductId();
    db.prepare(`INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(id, name, sku||'', category||'', hsn||'', unit||'Piece', parseFloat(rate)||0, parseInt(gst)||18, new Date().toISOString());
    db.prepare(`INSERT INTO inventory (product_id,stock,reorder,warehouse,updated_at) VALUES (?,?,10,'Main Godown',?)`)
      .run(id, parseFloat(opening_stock)||0, new Date().toISOString());
    res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
  });
  app.put('/api/products/:id', (req, res) => {
    const { name, sku, category, hsn, unit, rate, gst } = req.body;
    db.prepare(`UPDATE products SET name=?,sku=?,category=?,hsn=?,unit=?,rate=?,gst=? WHERE id=?`)
      .run(name, sku||'', category||'', hsn||'', unit||'Piece', parseFloat(rate), parseInt(gst), req.params.id);
    res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
  });

  // ── INVENTORY ──────────────────────────────────────────────────────────────
  app.get('/api/inventory', (req, res) => {
    res.json(db.prepare(`SELECT i.*, p.name as product_name, p.sku, p.unit, p.rate, p.gst FROM inventory i JOIN products p ON i.product_id = p.id ORDER BY p.name`).all());
  });
  app.post('/api/inventory/update', (req, res) => {
    const { product_id, qty, type, reorder } = req.body;
    const inv = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(product_id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    const newStock = type === 'add' ? Number(inv.stock) + parseFloat(qty) : Math.max(0, Number(inv.stock) - parseFloat(qty));
    db.prepare('UPDATE inventory SET stock=?, updated_at=? WHERE product_id=?').run(newStock, new Date().toISOString(), product_id);
    if (reorder) db.prepare('UPDATE inventory SET reorder=? WHERE product_id=?').run(reorder, product_id);
    res.json({ product_id, stock: newStock });
  });

  // ── DOCUMENTS ──────────────────────────────────────────────────────────────
  app.get('/api/documents', (req, res) => {
    const { type } = req.query;
    const docs = type
      ? db.prepare('SELECT * FROM documents WHERE type = ? ORDER BY created_at DESC').all(type)
      : db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    docs.forEach(d => { d.items = db.prepare('SELECT * FROM document_items WHERE document_id = ? ORDER BY serial_no, id').all(d.id); });
    res.json(docs);
  });
  app.get('/api/documents/:id', (req, res) => {
    const doc = getDocWithItems(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  });
  app.post('/api/documents', (req, res) => {
    const { type, client_id, date, due_date, validity, notes, items, currency, exchange_rate, ref_doc_id, po_number, so_number } = req.body;
    const id = nextId(type);
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO documents (id,type,client_id,date,due_date,validity,status,paid,currency,exchange_rate,ref_doc_id,po_number,so_number,notes,created_at) VALUES (?,?,?,?,?,?,?,0,?,?,?,?,?,?,?)`)
      .run(id, type, client_id, date, due_date||null, validity||null, 'Draft', currency||'INR', parseFloat(exchange_rate)||1, ref_doc_id||null, po_number||null, so_number||null, notes||'', now);
    const ins = db.prepare('INSERT INTO document_items (document_id,serial_no,product_id,description,qty,unit,rate,currency,amount) VALUES (?,?,?,?,?,?,?,?,?)');
    (items||[]).forEach((it, idx) => {
      const amt = (parseFloat(it.qty)||0) * (parseFloat(it.rate)||0);
      ins.run(id, it.serial_no||(idx+1), it.product_id, it.description||'', parseFloat(it.qty)||0, it.unit||'', parseFloat(it.rate)||0, it.currency||currency||'INR', amt);
    });
    res.json(getDocWithItems(id));
  });
  app.put('/api/documents/:id', (req, res) => {
    const { status, notes, po_number, so_number } = req.body;
    const doc = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE documents SET status=?,notes=?,po_number=?,so_number=? WHERE id=?')
      .run(status||doc.status, notes||doc.notes, po_number||doc.po_number, so_number||doc.so_number, req.params.id);
    res.json(getDocWithItems(req.params.id));
  });
  app.post('/api/documents/:id/convert', (req, res) => {
    const { target_type } = req.body;
    const src = getDocWithItems(req.params.id);
    if (!src) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE documents SET status='Converted' WHERE id=?").run(src.id);
    const newId = nextId(target_type);
    const due = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO documents (id,type,client_id,date,due_date,status,currency,exchange_rate,ref_doc_id,po_number,so_number,notes,created_at) VALUES (?,?,?,?,?,'Draft',?,?,?,?,?,?,?)`)
      .run(newId, target_type, src.client_id, new Date().toISOString().split('T')[0], due, src.currency, src.exchange_rate, src.id, src.po_number, src.so_number, `Converted from ${src.id}`, now);
    const ins = db.prepare('INSERT INTO document_items (document_id,serial_no,product_id,description,qty,unit,rate,currency,amount) VALUES (?,?,?,?,?,?,?,?,?)');
    src.items.forEach((it, idx) => { ins.run(newId, it.serial_no||(idx+1), it.product_id, it.description, it.qty, it.unit, it.rate, it.currency, it.amount); });
    res.json(getDocWithItems(newId));
  });

  // ── PDF — dual brand endpoints ─────────────────────────────────────────────
  // /api/documents/:id/pdf/india  → BVM India green PDF
  // /api/documents/:id/pdf/world  → BVM World navy PDF
  app.get('/api/documents/:id/pdf/:brand', (req, res) => {
    const doc = getDocWithItems(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const brand = req.params.brand === 'world' ? 'world' : 'india';
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(doc.client_id);
    const products = db.prepare('SELECT * FROM products').all();
    generateDocPDF(doc, client, doc.items, products, res, brand);
  });

  // ── PAYMENTS ───────────────────────────────────────────────────────────────
  app.get('/api/payments', (req, res) => res.json(db.prepare('SELECT * FROM payments ORDER BY date DESC, created_at DESC').all()));
  app.post('/api/payments', (req, res) => {
    const { invoice_id, client_id, amount, currency, mode, ref, note, date } = req.body;
    const id = nextPaymentId();
    db.prepare(`INSERT INTO payments (id,invoice_id,client_id,amount,currency,mode,ref,note,date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, invoice_id||null, client_id, parseFloat(amount), currency||'INR', mode||'Wire Transfer', ref||'', note||'', date, new Date().toISOString());
    if (invoice_id) {
      const inv = db.prepare('SELECT * FROM documents WHERE id=?').get(invoice_id);
      if (inv) {
        const items = db.prepare('SELECT * FROM document_items WHERE document_id=?').all(invoice_id);
        const { total } = calcDocTotal(items);
        const newPaid = Number(inv.paid||0) + parseFloat(amount);
        const status = newPaid >= total - 0.01 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';
        db.prepare('UPDATE documents SET paid=?,status=? WHERE id=?').run(newPaid, status, invoice_id);
      }
    }
    res.json(db.prepare('SELECT * FROM payments WHERE id=?').get(id));
  });

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  app.get('/api/dashboard', (req, res) => {
    const totalClients = Number(db.prepare('SELECT COUNT(*) as c FROM clients').get().c);
    const totalProducts = Number(db.prepare('SELECT COUNT(*) as c FROM products').get().c);
    const invoices = db.prepare("SELECT * FROM documents WHERE type='invoice'").all();
    invoices.forEach(inv => { inv.items = db.prepare('SELECT * FROM document_items WHERE document_id=?').all(inv.id); });
    const totalInvoiced = invoices.reduce((s, inv) => s + calcDocTotal(inv.items).total, 0);
    const totalPaid = Number(db.prepare('SELECT SUM(amount) as s FROM payments').get().s || 0);
    const lowStock = Number(db.prepare('SELECT COUNT(*) as c FROM inventory WHERE stock <= reorder').get().c);
    const openQuotes = Number(db.prepare("SELECT COUNT(*) as c FROM documents WHERE type='quotation' AND status NOT IN ('Converted','Rejected')").get().c);
    const openPO = Number(db.prepare("SELECT COUNT(*) as c FROM documents WHERE type='purchase_order' AND status NOT IN ('Converted','Closed')").get().c);
    const openSO = Number(db.prepare("SELECT COUNT(*) as c FROM documents WHERE type='sales_order' AND status NOT IN ('Converted','Closed')").get().c);
    const recentActivity = db.prepare("SELECT id,type,client_id,date,status FROM documents ORDER BY created_at DESC LIMIT 8").all();
    res.json({ totalClients, totalProducts, totalInvoiced, totalPaid, outstanding: totalInvoiced - totalPaid, lowStock, openQuotes, openPO, openSO, recentActivity });
  });


  // ── SEARCH ─────────────────────────────────────────────────────────────────
  app.get('/api/search/documents', (req, res) => {
    const q = '%' + (req.query.q || '').toLowerCase() + '%';
    const type = req.query.type || null;
    let docs;
    if (type) {
      docs = db.prepare(`SELECT d.* FROM documents d LEFT JOIN clients c ON d.client_id=c.id WHERE d.type=? AND (LOWER(d.id) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(d.po_number) LIKE ? OR LOWER(d.so_number) LIKE ? OR d.date LIKE ? OR LOWER(d.notes) LIKE ?) ORDER BY d.created_at DESC LIMIT 100`).all(type,q,q,q,q,q,q);
    } else {
      docs = db.prepare(`SELECT d.* FROM documents d LEFT JOIN clients c ON d.client_id=c.id WHERE (LOWER(d.id) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(d.po_number) LIKE ? OR LOWER(d.so_number) LIKE ? OR d.date LIKE ? OR LOWER(d.notes) LIKE ?) ORDER BY d.created_at DESC LIMIT 100`).all(q,q,q,q,q,q);
    }
    docs.forEach(d => { d.items = db.prepare('SELECT * FROM document_items WHERE document_id=?').all(d.id); });
    res.json(docs);
  });

  app.get('/api/search/clients', (req, res) => {
    const q = '%' + (req.query.q || '').toLowerCase() + '%';
    res.json(db.prepare(`SELECT * FROM clients WHERE LOWER(name) LIKE ? OR LOWER(gstin) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(email) LIKE ? OR LOWER(city) LIKE ? ORDER BY name LIMIT 20`).all(q,q,q,q,q));
  });


  // ── REMINDERS ──────────────────────────────────────────────────────────────
  app.get('/api/reminders', (req, res) => {
    const rows = db.prepare('SELECT r.*, c.name as client_name, c.phone, c.email FROM reminders r LEFT JOIN clients c ON r.client_id = c.id ORDER BY r.sent_at DESC').all();
    res.json(rows);
  });

  app.post('/api/reminders', (req, res) => {
    const { client_id, document_id, type, channel, message } = req.body;
    db.prepare('INSERT INTO reminders (client_id, document_id, type, channel, message, sent_at, status) VALUES (?,?,?,?,?,?,?)')
      .run(client_id, document_id||null, type||'quotation', channel||'whatsapp', message||'', new Date().toISOString(), 'Sent');
    const row = db.prepare('SELECT r.*, c.name as client_name, c.phone, c.email FROM reminders r LEFT JOIN clients c ON r.client_id = c.id ORDER BY r.id DESC LIMIT 1').get();
    res.json(row);
  });

  app.delete('/api/reminders/:id', (req, res) => {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
  });

  // ── LEDGER (paid / due per client) ────────────────────────────────────────
  app.get('/api/ledger', (req, res) => {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
    const result = clients.map(cl => {
      const invoices = db.prepare("SELECT * FROM documents WHERE client_id = ? AND type = 'invoice'").all(cl.id);
      let totalInvoiced = 0;
      invoices.forEach(inv => {
        const items = db.prepare('SELECT * FROM document_items WHERE document_id = ?').all(inv.id);
        const sub = items.reduce((s, it) => s + Number(it.qty||0) * Number(it.rate||0), 0);
        totalInvoiced += sub * 1.18;
      });
      const totalPaid = Number(db.prepare('SELECT SUM(amount) as s FROM payments WHERE client_id = ?').get(cl.id)?.s || 0);
      const openDocs = db.prepare("SELECT COUNT(*) as c FROM documents WHERE client_id = ? AND type NOT IN ('invoice') AND status NOT IN ('Converted','Closed','Rejected')").get(cl.id);
      const overdueInvoices = invoices.filter(inv => inv.status !== 'Paid' && inv.due_date && new Date(inv.due_date) < new Date());
      return {
        ...cl,
        totalInvoiced,
        totalPaid,
        due: totalInvoiced - totalPaid,
        openDocs: Number(openDocs.c),
        overdueCount: overdueInvoices.length,
        invoiceCount: invoices.length,
      };
    });
    res.json(result);
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`\n✅ BVM ERP (India + World) running → http://localhost:${PORT}\n`));

}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
