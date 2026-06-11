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
async function nextId(type, brand) {

  const prefix =
    DOC_PREFIXES[type] || 'DOC';

  const rows = await db.prepare(
    "SELECT id FROM documents"
  ).all();

  let maxN = 0;

  rows.forEach(r => {

    const match =
      String(r.id).match(/(\d+)$/);

    if (match) {
      const num = parseInt(match[1]);

      if (num > maxN) {
        maxN = num;
      }
    }

  });

  return (
    prefix +
    "-" +
    String(maxN + 1).padStart(4, "0")
  );

}
  async function nextClientId(brand) {
    const prefix = brand === 'world' ? 'W' : 'C';
    const rows = await db.prepare("SELECT id FROM clients WHERE id LIKE $1").all(prefix + '%');
    let maxN = 0;
    rows.forEach(r => {
      const num = parseInt(r.id.slice(prefix.length)) || 0;
      if (num > maxN) maxN = num;
    });
    const candidate = prefix + String(maxN + 1).padStart(3, '0');
    const exists = await db.prepare("SELECT id FROM clients WHERE id = $1").get(candidate);
    if (exists) return prefix + String(Date.now()).slice(-5);
    return candidate;
  }
  async function nextId(brand) {
    const prefix = brand === 'world' ? 'WP' : 'P';
    const rows = await db.prepare("SELECT id FROM s WHERE id LIKE $1").all(prefix + '%');
    let maxN = 0;
    rows.forEach(r => {
      const num = parseInt(r.id.slice(prefix.length)) || 0;
      if (num > maxN) maxN = num;
    });
    const candidate = prefix + String(maxN + 1).padStart(3, '0');
    const exists = await db.prepare("SELECT id FROM s WHERE id = $1").get(candidate);
    if (exists) return prefix + String(Date.now()).slice(-5);
    return candidate;
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
    const brand = req.query.brand || null;
    if (brand) {
      res.json(await db.prepare('SELECT * FROM clients WHERE brand=$1 ORDER BY name').all(brand));
    } else {
      res.json(await db.prepare('SELECT * FROM clients ORDER BY name').all());
    }
  }));
  app.post('/api/clients', wrap(async (req, res) => {

  const {
    name,
    contact,
    phone,
    email,
    gstin,
    address,
    city,
    state,
    pincode,
    type,
    brand
  } = req.body;

  // CHECK DUPLICATE CLIENT
  const duplicate = await db.prepare(`
    SELECT *
    FROM clients
    WHERE
      LOWER(name) = LOWER($1)
      OR phone = $2
      OR gstin = $3
  `).get(
    name || '',
    phone || '',
    gstin || ''
  );

  if (duplicate) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry'
    });
  }

  const id = await nextClientId(
    brand || 'india'
  );

  await db.prepare(`
    INSERT INTO clients
    (
      id,
      name,
      contact,
      phone,
      email,
      gstin,
      address,
      city,
      state,
      pincode,
      type,
      balance,
      brand
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,
      0,$12
    )
  `).run(
    id,
    name || '',
    contact || '',
    phone || '',
    email || '',
    gstin || '',
    address || '',
    city || '',
    state || '',
    pincode || '',
    type || 'Regular',
    brand || 'india'
  );

  res.json(
    await db.prepare(
      'SELECT * FROM clients WHERE id = $1'
    ).get(id)
  );

}));


  // ───────────────── PRODUCTS ─────────────────

// GET PRODUCTS
app.get('/api/products', wrap(async (req, res) => {

  const rows = await db.prepare(
    "SELECT * FROM products ORDER BY make, model"
  ).all();

  res.json(rows);

}));


// ADD PRODUCT
app.post('/api/products', wrap(async (req, res) => {

  const {
    make,
    model,
    sku,
    category,
    hsn,
    unit,
    rate,
    gst,
    brand
  } = req.body;

  const id = await nextProductId(
    brand || 'india'
  );

  const name =
    `${make || ''} ${model || ''}`.trim();

  await db.prepare(`
    INSERT INTO products
    (
      id,
      name,
      make,
      model,
      sku,
      category,
      hsn,
      unit,
      rate,
      gst,
      brand
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11
    )
  `).run(
    id,
    name,
    make || '',
    model || '',
    sku || '',
    category || '',
    hsn || '',
    unit || 'Piece',
    parseFloat(rate) || 0,
    parseFloat(gst) || 0,
    brand || 'india'
  );

  res.json(
    await db.prepare(
      'SELECT * FROM products WHERE id=$1'
    ).get(id)
  );

}));


// DELETE PRODUCT
app.delete('/api/products/:id', wrap(async (req, res) => {

  await db.prepare(`
    DELETE FROM inventory
    WHERE product_id = $1
  `).run(req.params.id);

  await db.prepare(`
    DELETE FROM products
    WHERE id = $1
  `).run(req.params.id);

  res.json({
    success: true
  });

}));


// ── DOCUMENTS ─────────────────────────────────────────────────────────────
  app.get('/api/documents', wrap(async (req, res) => {
    const { type, brand } = req.query;
    let docs;
    if (type && brand) {
      docs = await db.prepare('SELECT * FROM documents WHERE type=$1 AND brand=$2 ORDER BY created_at DESC').all(type, brand);
    } else if (type) {
      docs = await db.prepare('SELECT * FROM documents WHERE type=$1 ORDER BY created_at DESC').all(type);
    } else if (brand) {
      docs = await db.prepare('SELECT * FROM documents WHERE brand=$1 ORDER BY created_at DESC').all(brand);
    } else {
      docs = await db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    }
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
      client_quotation_number, terms, brand,
      ship_to_name, ship_to_address, ship_to_city, ship_to_state,
      ship_to_pincode, ship_to_gstin, ship_to_phone
    } = req.body;
    const id = await nextId(type, brand);
    await db.prepare(`
      INSERT INTO documents
        (id,type,client_id,date,due_date,validity,status,paid,currency,exchange_rate,
         ref_doc_id,po_number,so_number,notes,client_quotation_number,terms,
         ship_to_name,ship_to_address,ship_to_city,ship_to_state,
         ship_to_pincode,ship_to_gstin,ship_to_phone,brand)
      VALUES ($1,$2,$3,$4,$5,$6,'Draft',0,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    `).run(id, type, client_id, date, due_date||null, validity||null,
      currency||'INR', parseFloat(exchange_rate)||1,
      ref_doc_id||null, po_number||null, so_number||null, notes||'',
      client_quotation_number||null, terms||null,
      ship_to_name||null, ship_to_address||null, ship_to_city||null,
      ship_to_state||null, ship_to_pincode||null, ship_to_gstin||null, ship_to_phone||null,
      brand||'india');

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

  // ── DELETE DOCUMENT ──────────────────────────────────────────────────────
  app.delete('/api/documents/:id', wrap(async (req, res) => {
    const doc = await db.prepare('SELECT * FROM documents WHERE id=$1').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await db.prepare('DELETE FROM document_items WHERE document_id=$1').run(req.params.id);
    await db.prepare('DELETE FROM documents WHERE id=$1').run(req.params.id);
    res.json({ deleted: true, id: req.params.id });
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
    const brand = req.query.brand || null;
    const brandFilter = brand ? ` AND brand='${brand}'` : '';
    const [cRow, pRow, invoices, payRow, stockRow, qRow, poRow, soRow, recent] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as c FROM clients WHERE 1=1${brandFilter}`).get(),
      db.prepare(`SELECT COUNT(*) as c FROM products WHERE 1=1${brandFilter}`).get(),
      db.prepare(`SELECT * FROM documents WHERE type='invoice'${brandFilter}`).all(),
      db.prepare('SELECT SUM(amount) as s FROM payments').get(),
      db.prepare('SELECT COUNT(*) as c FROM inventory WHERE stock <= reorder').get(),
      db.prepare(`SELECT COUNT(*) as c FROM documents WHERE type='quotation' AND status NOT IN ('Converted','Rejected')${brandFilter}`).get(),
      db.prepare(`SELECT COUNT(*) as c FROM documents WHERE type='purchase_order' AND status NOT IN ('Converted','Closed')${brandFilter}`).get(),
      db.prepare(`SELECT COUNT(*) as c FROM documents WHERE type='sales_order' AND status NOT IN ('Converted','Closed')${brandFilter}`).get(),
      db.prepare(`SELECT id,type,client_id,date,status FROM documents WHERE 1=1${brandFilter} ORDER BY created_at DESC LIMIT 8`).all(),
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
    const brand = req.query.brand || null;
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

  // ── CREDIT SETTINGS ─────────────────────────────────────────────────────────────
  app.get('/api/credit-settings', wrap(async (req, res) => {
    const brand = req.query.brand || 'india';
    let row = await db.prepare('SELECT * FROM credit_settings WHERE brand=$1').get(brand);
    if (!row) {
      await db.prepare('INSERT INTO credit_settings (brand, credit_days) VALUES ($1, 30)').run(brand);
      row = { brand, credit_days: 30 };
    }
    res.json(row);
  }));

  app.put('/api/credit-settings', wrap(async (req, res) => {
    const { brand, credit_days } = req.body;
    const existing = await db.prepare('SELECT * FROM credit_settings WHERE brand=$1').get(brand||'india');
    if (existing) {
      await db.prepare('UPDATE credit_settings SET credit_days=$1 WHERE brand=$2').run(parseInt(credit_days)||30, brand||'india');
    } else {
      await db.prepare('INSERT INTO credit_settings (brand, credit_days) VALUES ($1, $2)').run(brand||'india', parseInt(credit_days)||30);
    }
    res.json({ brand: brand||'india', credit_days: parseInt(credit_days)||30 });
  }));

  // ── DUE DATE REMINDERS ───────────────────────────────────────────────────────────
  app.get('/api/due-reminders', wrap(async (req, res) => {
    const brand = req.query.brand || null;
    let rows;
    if (brand) {
      rows = await db.prepare(
        `SELECT dr.*, c.name as client_name, c.phone, c.email, d.paid, d.currency
         FROM due_reminders dr
         LEFT JOIN clients c ON dr.client_id = c.id
         LEFT JOIN documents d ON dr.invoice_id = d.id
         WHERE dr.brand=$1
         ORDER BY dr.due_date ASC`
      ).all(brand);
    } else {
      rows = await db.prepare(
        `SELECT dr.*, c.name as client_name, c.phone, c.email, d.paid, d.currency
         FROM due_reminders dr
         LEFT JOIN clients c ON dr.client_id = c.id
         LEFT JOIN documents d ON dr.invoice_id = d.id
         ORDER BY dr.due_date ASC`
      ).all();
    }
    // Calculate total amount for each due reminder
    for (const row of rows) {
      const items = await db.prepare('SELECT * FROM document_items WHERE document_id=$1').all(row.invoice_id);
      const sub = items.reduce((s,it) => s + (it.qty||0)*(it.rate||0), 0);
      row.total_amount = sub * 1.18;
      row.balance = row.total_amount - (row.paid || 0);
      // Calculate status
      const today = new Date().toISOString().split('T')[0];
      if (row.balance <= 0) row.computed_status = 'Paid';
      else if (row.reminder2_sent) row.computed_status = 'Reminder 2 Sent';
      else if (row.reminder1_sent) row.computed_status = 'Reminder 1 Sent';
      else if (today > row.due_date) row.computed_status = 'Overdue';
      else row.computed_status = 'Pending';
    }
    res.json(rows);
  }));

  app.post('/api/due-reminders', wrap(async (req, res) => {
    const { invoice_id, client_id, invoice_date, due_date, credit_days, channel, brand } = req.body;
    // Check if already exists
    const existing = await db.prepare('SELECT * FROM due_reminders WHERE invoice_id=$1').get(invoice_id);
    if (existing) return res.json(existing);
    await db.prepare(
      `INSERT INTO due_reminders (invoice_id,client_id,invoice_date,due_date,credit_days,channel,brand)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`
    ).run(invoice_id, client_id, invoice_date, due_date, parseInt(credit_days)||30, channel||'whatsapp', brand||'india');
    res.json({ success: true });
  }));

  app.put('/api/due-reminders/:id/reminder1', wrap(async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    await db.prepare('UPDATE due_reminders SET reminder1_sent=1, reminder1_date=$1 WHERE id=$2').run(today, req.params.id);
    res.json({ success: true, date: today });
  }));

  app.put('/api/due-reminders/:id/reminder2', wrap(async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    await db.prepare('UPDATE due_reminders SET reminder2_sent=1, reminder2_date=$1 WHERE id=$2').run(today, req.params.id);
    res.json({ success: true, date: today });
  }));

  app.delete('/api/due-reminders/:id', wrap(async (req, res) => {
    await db.prepare('DELETE FROM due_reminders WHERE id=$1').run(req.params.id);
    res.json({ deleted: true });
  }));

  app.delete('/api/payments/:id', wrap(async (req, res) => {
    await db.prepare('DELETE FROM payments WHERE id=$1').run(req.params.id);
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
