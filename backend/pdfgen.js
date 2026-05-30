const PDFDocument = require('pdfkit');

const BRANDS = {
  india: {
    name: 'BVM India',
    tagline: 'Trading & Distribution',
    line1: '#1, 2nd Floor, Kamla Palace,',
    line2: 'Jail Road, Sohna Chowk',
    line3: 'Gurugram, Haryana - 122001',
    gstin: '06AGYPR1117M1ZT',
    pan: 'AGYPR1117M',
    primary: '#166534',
    accent: '#16a34a',
    rowBg: '#f0fdf4',
    rowBorder: '#d1fae5',
    totBg: '#f0fdf4',
    taglineColor: '#bbf7d0',
    subColor: '#86efac',
  },
  world: {
    name: 'BVM World',
    tagline: 'Global Trading & Distribution',
    line1: '#1, 2nd Floor, Kamla Palace,',
    line2: 'Jail Road, Sohna Chowk',
    line3: 'Gurugram, Haryana - 122001',
    gstin: '06AGYPR1117M1ZT',
    pan: 'AGYPR1117M',
    primary: '#1e3a5f',
    accent: '#1d4ed8',
    rowBg: '#eff6ff',
    rowBorder: '#bfdbfe',
    totBg: '#eff6ff',
    taglineColor: '#bfdbfe',
    subColor: '#93c5fd',
  }
};

const TYPE_LABELS = {
  quotation: 'QUOTATION',
  proforma: 'PROFORMA INVOICE',
  purchase_order: 'PURCHASE ORDER',
  sales_order: 'SALES ORDER',
  invoice: 'TAX INVOICE'
};

const DOC_PREFIX_LABELS = {
  quotation: 'Quotation No',
  proforma: 'Proforma No',
  purchase_order: 'Purchase Order No',
  sales_order: 'Sales Order No',
  invoice: 'Invoice No'
};

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ', SGD: 'S$', JPY: '¥' };

function fmtCurrency(n, currency = 'INR') {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return sym + Math.abs(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TERMS = [
  'Freight Forwarder: Will be confirmed at the time of Pickup.',
  '1. Payment Terms: 100% Wire Transfer at the time of Availability.',
  '2. Delivery: Immediate.',
  '3. Warranty: Standard as per OEM.',
];

function generateDocPDF(doc, client, items, products, res, brandKey = 'india') {
  const brand = BRANDS[brandKey] || BRANDS.india;
  const pdf = new PDFDocument({ margin: 45, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.id}-${brandKey}.pdf"`);
  pdf.pipe(res);

  const PW = pdf.page.width;
  const ML = 45, MR = PW - 45, CW = MR - ML;
  const currency = doc.currency || 'INR';
  const typeLabel = TYPE_LABELS[doc.type] || doc.type.toUpperCase();
  const docPrefixLabel = DOC_PREFIX_LABELS[doc.type] || 'Document No';

  // ── HEADER BAND ───────────────────────────────────────────────────────────
  pdf.fillColor(brand.primary).rect(0, 0, PW, 52).fill();
  pdf.fillColor('white').fontSize(20).font('Helvetica-Bold').text(brand.name, ML, 14);
  pdf.fillColor(brand.taglineColor).fontSize(8).font('Helvetica').text(brand.tagline, ML, 36);

  // Doc type badge
  const badgeW = 160;
  pdf.fillColor('white').rect(MR - badgeW, 10, badgeW, 30).fill();
  pdf.fillColor(brand.primary).fontSize(10).font('Helvetica-Bold')
    .text(typeLabel, MR - badgeW, 20, { width: badgeW, align: 'center' });

  // ── COMPANY ADDRESS ───────────────────────────────────────────────────────
  let y = 62;
  pdf.fillColor('#475569').fontSize(7.5).font('Helvetica')
    .text(brand.line1, ML, y)
    .text(brand.line2, ML, y + 10)
    .text(brand.line3, ML, y + 20)
    .text(`GSTIN: ${brand.gstin}   |   PAN: ${brand.pan}`, ML, y + 30);

  // ── DOC META ──────────────────────────────────────────────────────────────
  let metaY = 62;
  const metaItems = [
    [docPrefixLabel, doc.id],
    ['Date', doc.date],
    doc.due_date ? ['Due Date', doc.due_date] : null,
    doc.validity ? ['Valid For', `${doc.validity} days`] : null,
    doc.po_number ? ['PO Number', doc.po_number] : null,
    doc.so_number ? ['SO Number', doc.so_number] : null,
    doc.ref_doc_id ? ['Ref Doc', doc.ref_doc_id] : null,
    currency !== 'INR' ? ['Currency', `${currency} @ ${doc.exchange_rate || 1}`] : null,
  ].filter(Boolean);

  metaItems.forEach(([label, val]) => {
    pdf.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text(label + ':', MR - 160, metaY, { width: 80 });
    pdf.fillColor('#0f172a').font('Helvetica').text(String(val), MR - 80, metaY, { width: 80, align: 'right' });
    metaY += 11;
  });

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  const divY = Math.max(metaY + 4, y + 44);
  pdf.moveTo(ML, divY).lineTo(MR, divY).strokeColor(brand.accent).lineWidth(1).stroke();

  // ── BILL TO ───────────────────────────────────────────────────────────────
  const billY = divY + 8;
  pdf.fillColor(brand.primary).fontSize(7).font('Helvetica-Bold').text('BILL TO / SHIP TO:', ML, billY);
  pdf.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(client.name, ML, billY + 10);
  let cy = billY + 23;
  pdf.fontSize(7.5).font('Helvetica').fillColor('#475569');
  if (client.address) { pdf.text(client.address, ML, cy); cy += 10; }
  if (client.city || client.state) {
    pdf.text(`${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''} ${client.pincode || ''}`.trim(), ML, cy); cy += 10;
  }
  if (client.gstin) { pdf.text(`GSTIN: ${client.gstin}`, ML, cy); cy += 10; }
  if (client.phone) { pdf.text(`Ph: ${client.phone}`, ML, cy); cy += 10; }

  const tableY = Math.max(cy + 8, divY + 58);

  // ── ITEMS TABLE ───────────────────────────────────────────────────────────
  const cols = { sn: ML, desc: ML + 22, hsn: ML + 215, qty: ML + 260, unit: ML + 292, rate: ML + 332, amt: ML + 392 };

  pdf.fillColor(brand.primary).rect(ML, tableY, CW, 20).fill();
  pdf.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
  pdf.text('#', cols.sn, tableY + 6, { width: 20, align: 'center' });
  pdf.text('Description / Part No.', cols.desc, tableY + 6, { width: 170 });
  pdf.text('HSN', cols.hsn, tableY + 6, { width: 40, align: 'center' });
  pdf.text('Qty', cols.qty, tableY + 6, { width: 30, align: 'right' });
  pdf.text('Unit', cols.unit, tableY + 6, { width: 38, align: 'center' });
  pdf.text(`Rate (${currency})`, cols.rate, tableY + 6, { width: 58, align: 'right' });
  pdf.text(`Amount (${currency})`, cols.amt, tableY + 6, { width: MR - cols.amt, align: 'right' });

  let iy = tableY + 20;
  let subtotal = 0, totalGst = 0;
  const ROW_H = 20;

  items.forEach((item, i) => {
    const product = products.find(p => p.id === item.product_id);
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const amt = qty * rate;
    subtotal += amt;
    totalGst += amt * ((Number(product?.gst) || 18) / 100);

    pdf.fillColor(i % 2 === 0 ? brand.rowBg : '#ffffff').rect(ML, iy, CW, ROW_H).fill();
    pdf.strokeColor(brand.rowBorder).lineWidth(0.3).rect(ML, iy, CW, ROW_H).stroke();
    pdf.fillColor('#334155').fontSize(7.5).font('Helvetica');
    pdf.text(String(item.serial_no || i + 1), cols.sn, iy + 6, { width: 20, align: 'center' });
    pdf.text(item.description || product?.name || '—', cols.desc, iy + 4, { width: 170, lineBreak: false });
    pdf.text(product?.hsn || '—', cols.hsn, iy + 6, { width: 40, align: 'center' });
    pdf.text(String(qty), cols.qty, iy + 6, { width: 30, align: 'right' });
    pdf.text(item.unit || product?.unit || '—', cols.unit, iy + 6, { width: 38, align: 'center' });
    pdf.text(fmtCurrency(rate, currency), cols.rate, iy + 6, { width: 58, align: 'right' });
    pdf.text(fmtCurrency(amt, currency), cols.amt, iy + 6, { width: MR - cols.amt, align: 'right' });
    iy += ROW_H;
  });

  // ── TOTALS ────────────────────────────────────────────────────────────────
  const sameState = (client.state || '').toLowerCase() === 'haryana';
  iy += 8;
  const totX = ML + CW * 0.56, totW = MR - totX;

  function totRow(label, val, highlight = false) {
    const rowH = highlight ? 20 : 16, pad = highlight ? 6 : 4;
    if (highlight) {
      pdf.fillColor(brand.primary).rect(totX, iy, totW, rowH).fill();
      pdf.fillColor('white').fontSize(9).font('Helvetica-Bold');
    } else {
      pdf.fillColor(brand.totBg).rect(totX, iy, totW, rowH).fill();
      pdf.strokeColor(brand.rowBorder).lineWidth(0.3).rect(totX, iy, totW, rowH).stroke();
      pdf.fillColor('#334155').fontSize(7.5).font('Helvetica');
    }
    pdf.text(label, totX + 6, iy + pad, { width: totW * 0.55 });
    pdf.text(val, totX + totW * 0.55, iy + pad, { width: totW * 0.4, align: 'right' });
    iy += rowH;
  }

  totRow('Subtotal (excl. GST)', fmtCurrency(subtotal, currency));
  if (sameState) {
    totRow('CGST (9%)', fmtCurrency(totalGst / 2, currency));
    totRow('SGST (9%)', fmtCurrency(totalGst / 2, currency));
  } else {
    totRow('IGST (18%)', fmtCurrency(totalGst, currency));
  }
  if (doc.paid > 0) totRow('Amount Paid', `- ${fmtCurrency(doc.paid, currency)}`);
  totRow('TOTAL DUE', fmtCurrency(subtotal + totalGst - (doc.paid || 0), currency), true);

  if (currency !== 'INR' && doc.exchange_rate && doc.exchange_rate !== 1) {
    iy += 4;
    pdf.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text(`(INR equivalent: ${fmtCurrency((subtotal + totalGst - (doc.paid || 0)) * doc.exchange_rate, 'INR')} @ ${doc.exchange_rate})`, totX, iy, { width: totW, align: 'right' });
    iy += 12;
  }

  // ── TERMS ─────────────────────────────────────────────────────────────────
  iy += 12;
  if (iy > pdf.page.height - 130) { pdf.addPage(); iy = 45; }
  pdf.fillColor(brand.primary).rect(ML, iy, CW, 16).fill();
  pdf.fillColor('white').fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS', ML + 6, iy + 4);
  iy += 20;
  TERMS.forEach(t => {
    pdf.fillColor('#334155').fontSize(7.5).font('Helvetica').text(t, ML + 4, iy, { width: CW - 8 });
    iy += 11;
  });

  if (doc.notes) {
    iy += 6;
    pdf.fillColor(brand.primary).fontSize(7.5).font('Helvetica-Bold').text('Additional Notes:', ML, iy);
    iy += 10;
    pdf.font('Helvetica').fillColor('#475569').text(doc.notes, ML + 4, iy, { width: CW - 8 });
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = pdf.page.height - 45;
  pdf.fillColor(brand.primary).rect(0, footerY - 10, PW, 55).fill();
  pdf.fillColor('white').fontSize(7.5).font('Helvetica-Bold')
    .text('This is an Electronic generated document, No need for sign and stamp.', ML, footerY, { width: CW, align: 'center' });
  pdf.fillColor(brand.subColor).fontSize(7).font('Helvetica')
    .text(`${brand.name}   |   GSTIN: ${brand.gstin}   |   PAN: ${brand.pan}`, ML, footerY + 12, { width: CW, align: 'center' });

  pdf.end();
}

module.exports = { generateDocPDF };
