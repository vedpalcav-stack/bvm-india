const express = require('express');
const cors    = require('cors');
const { initDb }                        = require('./db');
const { generateDocPDF, generateBothPDFs } = require('./pdfgen');

const app = express();
app.use(cors());// open cors for local // app.use(cors());
app.use(express.json({ limit: '10mb' }));

// BVM series document prefixes
const DOC_PREFIXES = {
  quotation:      'BVM-QT',
  proforma:       'BVM-PI',
  purchase_order: 'BVM-PO',
  sales_order:    'BVM-SO',
  invoice:        'BVM-INV'
};

const wrap = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

initDb().then(db => {

  // ── HELPERS ──────────────────────────────────────────────────────────────────
  async function nextId(type) {
    const prefix = DOC_PREFIXES[type] || 'BVM-DOC';
    const row = await db.prepare(`SELECT COUNT(*) as c FROM documents WHERE type = $1`).get(type);
    return `${prefix}-${String(Number(row.c) + 1).padStart(4, '0')}`;
  }
  async function nextClientId() {
    const row = await db.prepare(`SELECT COUNT(*) as c FROM clients`).get();
    return `C${String(Number(row.c) + 1).padStart(3, '0')}`;
  }
  async function nextProductId() {
    const row = await db.prepare(`SELECT COUNT(*) as c FROM products`).get();
    return `P${String(Number(row.c) + 1).padStart(3, '0')}`;
  }
  async function nextPaymentId() {
    const row = await db.prepare(`SELECT COUNT(*) as c FROM payments`).get();
    return `PMT-${String(Number(row.c) + 1).padStart(4, '0')}`;
  }
  async function getDocWithItems(id) {
    const doc = await db.prepare('SELECT * FROM documents WHERE id = $1').get(id);
    if (!doc) return null;
    doc.items = await db.prepare('SELECT * FROM document_items WHERE document_id = $1 ORDER BY serial_no, id').all(id);
    return doc;
  }
  function calcDocTotal(items) {
    const sub = items.reduce((s, it) => s + Number(it.qty||0) * Number(it.rate||0), 0);
    return { subtotal: sub, gst: sub * 0.18, total: sub * 1.18 };
  }

  // ── CLIENTS ──────────────────────────────────────────────────────────────────
  app.get('/api/clients', wrap(async (req, res) => {
    res.json(await db.prepare('SELECT * FROM clients ORDER BY name').all());
  }));
  app.post('/api/clients', wrap(async (req, res) => {
    const { name, contact, phone, email, gstin, address, city, state, pincode, type } = req.body;
    const id = await nextClientId();
    await db.prepare(`INSERT INTO clients (id,name,contact,phone,email,gstin,address,city,state,pincode,type,balance) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0)`)
      .run(id, name, contact||'', phone||'', email||'', gstin||'', address||'', city||'', state||'', pincode||'', type||'Regular');
    res.json(await db.prepare('SELECT * FROM clients WHERE id = $1').get(id));
  }));
  app.put('/api/clients/:id', wrap(async (req, res) => {
    const { name, contact, phone, email, gstin, address, city, state, pincode, type } = req.body;
    await db.prepare(`UPDATE clients SET name=$1,contact=$2,phone=$3,email=$4,gstin=$5,address=$6,city=$7,state=$8,pincode=$9,type=$10 WHERE id=$11`)
      .run(name, contact||'', phone||'', email||'', gstin||'', address||'', city||'', state||'', pincode||'', type||'Regular', req.params.id);
    res.json(await db.prepare('SELECT * FROM clients WHERE id = $1').get(req.params.id));
  }));

  // ── PRODUCTS ─────────────────────────────────────────────────────────────────
  app.get('/api/products', wrap(async (req, res) => {
    res.json(await db.prepare('SELECT * FROM products ORDER BY name').all());
  }));
  app.post('/api/products', wrap(async (req, res) => {
    const { name, sku, category, hsn, unit, rate, gst, opening_stock } = req.body;
    const id = await nextProductId();
    await db.prepare(`INSERT INTO products (id,name,sku,category,hsn,unit,rate,gst) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`)
      .run(id, name, sku||'', category||'', hsn||'', unit||'Piece', parseFloat(rate)||0, parseInt(gst)||18);
    await db.prepare(`INSERT INTO inventory (product_id,stock,reorder,warehouse) VALUES ($1,$2,10,'Main Godown')`)
      .run(id, parseFloat(opening_stock)||0);
    res.json(await db.prepare('SELECT * FROM products WHERE id = $1').get(id));
  }));
  app.put('/api/products/:id', wrap(async (req, res) => {
    const { name, sku, category, hsn, unit, rate, gst } = req.body;
    await db.prepare(`UPDATE products SET name=$1,sku=$2,category=$3,hsn=$4,unit=$5,rate=$6,gst=$7 WHERE id=$8`)
      .run(name, sku||'', category||'', hsn||'', unit||'Piece', parseFloat(rate), parseInt(gst), req.params.id);
    res.json(await db.prepare('SELECT * FROM products WHERE id = $1').get(req.params.id));
  }));

  // ── INVENTORY ─────────────────────────────────────────────────────────────────
  app.get('/api/inventory', wrap(async (req, res) => {
    res.json(await db.prepare(`SELECT i.*, p.name as product_name, p.sku, p.unit, p.rate, p.gst FROM inventory i JOIN products p ON i.product_id = p.id ORDER BY p.name`).all());
  }));
  app.post('/api/inventory/update', wrap(async (req, res) => {
    const { product_id, qty, type, reorder } = req.body;
    const inv = await db.prepare('SELECT * FROM inventory WHERE product_id = $1').get(product_id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    const newStock = type === 'add' ? Number(inv.stock) + parseFloat(qty) : Math.max(0, Number(inv.stock) - parseFloat(qty));
    await db.prepare('UPDATE inventory SET stock=$1, updated_at=NOW() WHERE product_id=$2').run(newStock, product_id);
    if (reorder) await db.prepare('UPDATE inventory SET reorder=$1 WHERE product_id=$2').run(reorder, product_id);
    res.json({ product_id, stock: newStock });
  }));

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────────
  app.get('/api/documents', wrap(async (req, res) => {
    const { type } = req.query;
    const docs = type
      ? await db.prepare('SELECT * FROM documents WHERE type = $1 ORDER BY created_at DESC').all(type)
      : await db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    await Promise.all(docs.map(async d => {
      d.items = await db.prepare('SELECT * FROM document_items WHERE document_id = $1 ORDER BY serial_no, id').all(d.id);
    }));
    res.json(docs);
  }));
  app.get('/api/documents/:id', wrap(async (req, res) => {
    const doc = await getDocWithItems(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  }));
  app.post('/api/documents', wrap(async (req, res) => {
    const {
      type, client_id, date, due_date, validity, notes, items,
      currency, exchange_rate, ref_doc_id, po_number, so_number,
      client_quotation_number, terms,
      ship_to_name, ship_to_address, ship_to_city, ship_to_state,
      ship_to_pincode, ship_to_gstin, ship_to_phone
    } = req.body;
    const id = await nextId(type);
    await db.prepare(`
      INSERT INTO documents
        (id,type,client_id,date,due_date,validity,status,paid,currency,exchange_rate,
         ref_doc_id,po_number,so_number,notes,client_quotation_number,terms,
         ship_to_name,ship_to_address,ship_to_city,ship_to_state,
         ship_to_pincode,ship_to_gstin,ship_to_phone)
      VALUES ($1,$2,$3,$4,$5,$6,'Draft',0,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    `).run(id, type, client_id, date, due_date||null, validity||null,
      currency||'INR', parseFloat(exchange_rate)||1,
      ref_doc_id||null, po_number||null, so_number||null, notes||'',
      client_quotation_number||null, terms||null,
      ship_to_name||null, ship_to_address||null, ship_to_city||null,
      ship_to_state||null, ship_to_pincode||null, ship_to_gstin||null, ship_to_phone||null);

    for (let idx = 0; idx < (items||[]).length; idx++) {
      const it = items[idx];
      const amt = (parseFloat(it.qty)||0) * (parseFloat(it.rate)||0);
      const prod = await db.prepare('SELECT hsn FROM products WHERE id=$1').get(it.product_id);
      await db.prepare(`
        INSERT INTO document_items (document_id,serial_no,product_id,description,hsn,qty,unit,rate,currency,amount)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `).run(id, it.serial_no||(idx+1), it.product_id, it.description||'',
             it.hsn||prod?.hsn||'', parseFloat(it.qty)||0, it.unit||'',
             parseFloat(it.rate)||0, it.currency||currency||'INR', amt);
    }
    res.json(await getDocWithItems(id));
  }));

  app.put('/api/documents/:id', wrap(async (req, res) => {
    const { status, notes, po_number, so_number, terms, client_quotation_number } = req.body;
    const doc = await db.prepare('SELECT * FROM documents WHERE id=$1').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await db.prepare('UPDATE documents SET status=$1,notes=$2,po_number=$3,so_number=$4,terms=$5,client_quotation_number=$6 WHERE id=$7')
      .run(status||doc.status, notes||doc.notes, po_number||doc.po_number,
           so_number||doc.so_number, terms||doc.terms,
           client_quotation_number||doc.client_quotation_number, req.params.id);
    res.json(await getDocWithItems(req.params.id));
  }));

  app.post('/api/documents/:id/convert', wrap(async (req, res) => {
    const { target_type } = req.body;
    const src = await getDocWithItems(req.params.id);
    if (!src) return res.status(404).json({ error: 'Not found' });
    await db.prepare("UPDATE documents SET status='Converted' WHERE id=$1").run(src.id);
    const newId = await nextId(target_type);
    const due = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    await db.prepare(`
      INSERT INTO documents (id,type,client_id,date,due_date,status,currency,exchange_rate,ref_doc_id,po_number,so_number,notes)
      VALUES ($1,$2,$3,$4,$5,'Draft',$6,$7,$8,$9,$10,$11)
    `).run(newId, target_type, src.client_id,
           new Date().toISOString().split('T')[0], due,
           src.currency, src.exchange_rate, src.id,
           src.po_number, src.so_number, `Converted from ${src.id}`);
    for (let idx = 0; idx < src.items.length; idx++) {
      const it = src.items[idx];
      await db.prepare(`
        INSERT INTO document_items (document_id,serial_no,product_id,description,hsn,qty,unit,rate,currency,amount)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `).run(newId, it.serial_no||(idx+1), it.product_id, it.description,
             it.hsn, it.qty, it.unit, it.rate, it.currency, it.amount);
    }
    res.json(await getDocWithItems(newId));
  }));

  // ── PDF ───────────────────────────────────────────────────────────────────────
  app.get('/api/documents/:id/pdf/both', wrap(async (req, res) => {
    const doc = await getDocWithItems(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const client   = await db.prepare('SELECT * FROM clients WHERE id = $1').get(doc.client_id);
    const products = await db.prepare('SELECT * FROM products').all();
    await generateBothPDFs(doc, client, doc.items, products, res);
  }));
  app.get('/api/documents/:id/pdf/:brand', wrap(async (req, res) => {
    const doc = await getDocWithItems(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const brand    = req.params.brand === 'world' ? 'world' : 'india';
    const client   = await db.prepare('SELECT * FROM clients WHERE id = $1').get(doc.client_id);
    const products = await db.prepare('SELECT * FROM products').all();
    await generateDocPDF(doc, client, doc.items, products, res, brand);
  }));

  // ── PAYMENTS ─────────────────────────────────────────────────────────────────
  app.get('/api/payments', wrap(async (req, res) => {
    res.json(await db.prepare('SELECT * FROM payments ORDER BY date DESC, created_at DESC').all());
  }));
  app.post('/api/payments', wrap(async (req, res) => {
    const { invoice_id, client_id, amount, currency, mode, ref, note, date } = req.body;
    const id = await nextPaymentId();
    await db.prepare(`INSERT INTO payments (id,invoice_id,client_id,amount,currency,mode,ref,note,date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`)
      .run(id, invoice_id||null, client_id, parseFloat(amount), currency||'INR', mode||'Wire Transfer', ref||'', note||'', date);
    if (invoice_id) {
      const inv = await db.prepare('SELECT * FROM documents WHERE id=$1').get(invoice_id);
      if (inv) {
        const items = await db.prepare('SELECT * FROM document_items WHERE document_id=$1').all(invoice_id);
        const { total } = calcDocTotal(items);
        const newPaid = Number(inv.paid||0) + parseFloat(amount);
        const status = newPaid >= total - 0.01 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';
        await db.prepare('UPDATE documents SET paid=$1,status=$2 WHERE id=$3').run(newPaid, status, invoice_id);
      }
    }
    res.json(await db.prepare('SELECT * FROM payments WHERE id=$1').get(id));
  }));

  // ── DASHBOARD ─────────────────────────────────────────────────────────────────
  app.get('/api/dashboard', wrap(async (req, res) => {
    const [cRow, pRow, invoices, payRow, stockRow, qRow, poRow, soRow, recent] = await Promise.all([
      db.prepare('SELECT COUNT(*) as c FROM clients').get(),
      db.prepare('SELECT COUNT(*) as c FROM products').get(),
      db.prepare("SELECT * FROM documents WHERE type='invoice'").all(),
      db.prepare('SELECT SUM(amount) as s FROM payments').get(),
      db.prepare('SELECT COUNT(*) as c FROM inventory WHERE stock <= reorder').get(),
      db.prepare("SELECT COUNT(*) as c FROM documents WHERE type='quotation' AND status NOT IN ('Converted','Rejected')").get(),
      db.prepare("SELECT COUNT(*) as c FROM documents WHERE type='purchase_order' AND status NOT IN ('Converted','Closed')").get(),
      db.prepare("SELECT COUNT(*) as c FROM documents WHERE type='sales_order' AND status NOT IN ('Converted','Closed')").get(),
      db.prepare('SELECT id,type,client_id,date,status FROM documents ORDER BY created_at DESC LIMIT 8').all(),
    ]);
    await Promise.all(invoices.map(async inv => {
      inv.items = await db.prepare('SELECT * FROM document_items WHERE document_id=$1').all(inv.id);
    }));
    const totalInvoiced = invoices.reduce((s, inv) => s + calcDocTotal(inv.items).total, 0);
    res.json({
      totalClients: Number(cRow.c), totalProducts: Number(pRow.c),
      totalInvoiced, totalPaid: Number(payRow?.s || 0),
      outstanding: totalInvoiced - Number(payRow?.s || 0),
      lowStock: Number(stockRow.c), openQuotes: Number(qRow.c),
      openPO: Number(poRow.c), openSO: Number(soRow.c),
      recentActivity: recent,
    });
  }));

  // ── SEARCH ─────────────────────────────────────────────────────────────────────
  app.get('/api/search/documents', wrap(async (req, res) => {
    const q = `%${(req.query.q || '').toLowerCase()}%`;
    const type = req.query.type || null;
    let docs;
    if (type) {
      docs = await db.prepare(
        `SELECT d.*, c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id=c.id
         WHERE d.type=$1 AND (LOWER(d.id) LIKE $2 OR LOWER(c.name) LIKE $3
           OR LOWER(COALESCE(d.po_number,'')) LIKE $4 OR LOWER(COALESCE(d.so_number,'')) LIKE $5
           OR d.date LIKE $6 OR LOWER(COALESCE(d.notes,'')) LIKE $7)
         ORDER BY d.created_at DESC LIMIT 100`
      ).all(type, q, q, q, q, q, q);
    } else {
      docs = await db.prepare(
        `SELECT d.*, c.name as client_name FROM documents d LEFT JOIN clients c ON d.client_id=c.id
         WHERE LOWER(d.id) LIKE $1 OR LOWER(c.name) LIKE $2
           OR LOWER(COALESCE(d.po_number,'')) LIKE $3 OR LOWER(COALESCE(d.so_number,'')) LIKE $4
           OR d.date LIKE $5 OR LOWER(COALESCE(d.notes,'')) LIKE $6
         ORDER BY d.created_at DESC LIMIT 100`
      ).all(q, q, q, q, q, q);
    }
    await Promise.all(docs.map(async d => {
      d.items = await db.prepare('SELECT * FROM document_items WHERE document_id=$1').all(d.id);
    }));
    res.json(docs);
  }));
  app.get('/api/search/clients', wrap(async (req, res) => {
    const q = `%${(req.query.q || '').toLowerCase()}%`;
    res.json(await db.prepare(
      `SELECT * FROM clients WHERE LOWER(name) LIKE $1 OR LOWER(gstin) LIKE $2
       OR LOWER(phone) LIKE $3 OR LOWER(email) LIKE $4 OR LOWER(city) LIKE $5 ORDER BY name LIMIT 20`
    ).all(q, q, q, q, q));
  }));

  // ── REMINDERS ─────────────────────────────────────────────────────────────────
  app.get('/api/reminders', wrap(async (req, res) => {
    res.json(await db.prepare(
      `SELECT r.*, c.name as client_name, c.phone, c.email FROM reminders r
       LEFT JOIN clients c ON r.client_id = c.id ORDER BY r.sent_at DESC`
    ).all());
  }));
  app.post('/api/reminders', wrap(async (req, res) => {
    const { client_id, document_id, type, channel, message } = req.body;
    const { rows } = await db.query(
      `INSERT INTO reminders (client_id,document_id,type,channel,message,status)
       VALUES ($1,$2,$3,$4,$5,'Sent') RETURNING id`,
      [client_id, document_id||null, type||'quotation', channel||'whatsapp', message||'']
    );
    res.json(await db.prepare(
      `SELECT r.*, c.name as client_name, c.phone, c.email FROM reminders r
       LEFT JOIN clients c ON r.client_id=c.id WHERE r.id=$1`
    ).get(rows[0].id));
  }));
  app.delete('/api/reminders/:id', wrap(async (req, res) => {
    await db.prepare('DELETE FROM reminders WHERE id=$1').run(req.params.id);
    res.json({ deleted: true });
  }));

  // ── LEDGER ─────────────────────────────────────────────────────────────────────
  app.get('/api/ledger', wrap(async (req, res) => {
    const clients = await db.prepare('SELECT * FROM clients ORDER BY name').all();
    const result = await Promise.all(clients.map(async cl => {
      const invoices = await db.prepare("SELECT * FROM documents WHERE client_id=$1 AND type='invoice'").all(cl.id);
      let totalInvoiced = 0;
      await Promise.all(invoices.map(async inv => {
        const items = await db.prepare('SELECT * FROM document_items WHERE document_id=$1').all(inv.id);
        totalInvoiced += items.reduce((s, it) => s + Number(it.qty||0)*Number(it.rate||0), 0) * 1.18;
      }));
      const paidRow = await db.prepare('SELECT SUM(amount) as s FROM payments WHERE client_id=$1').get(cl.id);
      const totalPaid = Number(paidRow?.s || 0);
      const openRow = await db.prepare(
        `SELECT COUNT(*) as c FROM documents WHERE client_id=$1 AND type NOT IN ('invoice') AND status NOT IN ('Converted','Closed','Rejected')`
      ).get(cl.id);
      const overdueInvoices = invoices.filter(inv => inv.status !== 'Paid' && inv.due_date && new Date(inv.due_date) < new Date());
      return { ...cl, totalInvoiced, totalPaid, due: totalInvoiced - totalPaid, openDocs: Number(openRow.c), overdueCount: overdueInvoices.length, invoiceCount: invoices.length };
    }));
    res.json(result);
  }));

  // ── ERROR HANDLER ──────────────────────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('API Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`\n✅ BVM ERP running → http://localhost:${PORT}\n`));

}).catch(err => { console.error('❌ Failed to start:', err); process.exit(1); });
