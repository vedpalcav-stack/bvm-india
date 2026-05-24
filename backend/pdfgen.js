const PDFDocument = require('pdfkit');
const archiver    = require('archiver');
const path        = require('path');
const fs          = require('fs');

const LOGO_INDIA = path.join(__dirname, 'logos', 'bvm-india.png');
const LOGO_WORLD = path.join(__dirname, 'logos', 'bvm-world.jpg');

// ── CHANGE YOUR GSTIN / PAN / EMAIL HERE ─────────────────────────────────────
const COMPANY = {
  name_india:  'BVM India',
  name_world:  'BVM World',
  tagline:     'Private Limited',
  line1:       '#1, 2nd Floor, Kamla Palace, Jail Road, Sohna Chowk',
  line2:       'Gurugram, Haryana - 122001',
  gstin_india: '06AGYPR1117M1ZT',   // <-- BVM India GSTIN
  pan_india:   'AGYPR1117M',         // <-- BVM India PAN
  email_india: 'accounts@bvmindia.com',
  gstin_world: '06AAMCB5079P1ZX',   // <-- BVM World GSTIN
  pan_world:   'AAMCB5079P',         // <-- BVM World PAN
  email_world: 'accounts@bvmworld.com',
};
// ─────────────────────────────────────────────────────────────────────────────

// Helper to get brand-specific company info
function getBrandInfo(brandKey) {
  return {
    gstin: brandKey === 'india' ? COMPANY.gstin_india : COMPANY.gstin_world,
    pan:   brandKey === 'india' ? COMPANY.pan_india   : COMPANY.pan_world,
    email: brandKey === 'india' ? COMPANY.email_india : COMPANY.email_world,
  };
}

const DEFAULT_TERMS = [
  'Freight Forwarder: Will be confirmed at the time of Pickup.',
  '1. Payment Terms: As per BVM Conditions.',
  '2. Delivery: Immediate.',
  '3. Warranty: Standard as per OEM.',
];

const BRANDS = {
  india: {
    primary:     '#166534',
    accent:      '#16a34a',
    rowAlt:      '#f0fdf4',
    rowNormal:   '#ffffff',
    totBg:       '#f0fdf4',
    borderColor: '#bbf7d0',
    textDark:    '#14532d',
    logo:        LOGO_INDIA,
  },
  world: {
    primary:     '#1e3a5f',
    accent:      '#1d4ed8',
    rowAlt:      '#eff6ff',
    rowNormal:   '#ffffff',
    totBg:       '#eff6ff',
    borderColor: '#bfdbfe',
    textDark:    '#1e3a5f',
    logo:        LOGO_WORLD,
  }
};

const TYPE_LABELS = {
  quotation:      'QUOTATION',
  proforma:       'PROFORMA INVOICE',
  purchase_order: 'PURCHASE ORDER',
  sales_order:    'SALES ORDER',
  invoice:        'TAX INVOICE',
};

const DOC_PREFIX_LABELS = {
  quotation:      'Quotation No',
  proforma:       'Proforma No',
  purchase_order: 'Purchase Order No',
  sales_order:    'Sales Order No',
  invoice:        'Invoice No',
};

// Use text symbol — PDFKit Helvetica can't render ₹ glyph
function fmtC(n, currency = 'INR') {
  const syms = { INR:'INR ', USD:'USD ', EUR:'EUR ', GBP:'GBP ', AED:'AED ', SGD:'SGD ', JPY:'JPY ' };
  const sym  = syms[currency] || currency + ' ';
  return sym + Math.abs(n || 0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

// ─────────────────────────────────────────────────────────────────────────────
function buildPDFBuffer(doc, client, items, products, brandKey) {
  return new Promise((resolve, reject) => {
    const brand     = BRANDS[brandKey];
    const brandName = brandKey === 'india' ? COMPANY.name_india : COMPANY.name_world;
    const hasLogo   = fs.existsSync(brand.logo);

    // ── Single A4 page, tight margins ────────────────────────────────────────
    const pdf = new PDFDocument({ margin: 0, size: 'A4', bufferPages: false });
    const chunks = [];
    pdf.on('data',  c  => chunks.push(c));
    pdf.on('end',   () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    const PW  = pdf.page.width;   // 595
    const PH  = pdf.page.height;  // 842
    const ML  = 22;
    const MR  = PW - 22;
    const CW  = MR - ML;
    const currency  = doc.currency || 'INR';
    const isSO      = doc.type === 'sales_order';
    const typeLabel = TYPE_LABELS[doc.type] || doc.type.toUpperCase();

    // ── WHITE BG ─────────────────────────────────────────────────────────────
    pdf.fillColor('#ffffff').rect(0, 0, PW, PH).fill();

    // ── TOP STRIP ────────────────────────────────────────────────────────────
    pdf.fillColor(brand.primary).rect(0, 0, PW, 4).fill();

    // ── HEADER (logo + company info + doc badge) ──────────────────────────────
    let headerY = 8;

    // Logo
    const logoW = 48, logoH = 36;
    if (hasLogo) {
      try { pdf.image(brand.logo, ML, headerY, { fit:[logoW, logoH] }); } catch(e) {}
    }

    // Company name + info
    const infoX = ML + (hasLogo ? logoW + 6 : 0);
    pdf.fillColor(brand.primary).fontSize(13).font('Helvetica-Bold')
      .text(brandName, infoX, headerY + 2);
    pdf.fillColor(brand.accent).fontSize(7).font('Helvetica')
      .text(COMPANY.tagline, infoX, headerY + 17);
    pdf.fillColor('#64748b').fontSize(6).font('Helvetica')
      .text(COMPANY.line1 + ', ' + COMPANY.line2, infoX, headerY + 26)
      .text('GSTIN: ' + getBrandInfo(brandKey).gstin + '   PAN: ' + getBrandInfo(brandKey).pan, infoX, headerY + 34);

    // Doc type badge (right side)
    const badgeW = 140, badgeH = 20;
    const badgeX = MR - badgeW;
    pdf.strokeColor(brand.primary).lineWidth(1)
      .rect(badgeX, headerY + 2, badgeW, badgeH).stroke();
    pdf.fillColor(brand.primary).fontSize(9).font('Helvetica-Bold')
      .text(typeLabel, badgeX, headerY + 8, { width: badgeW, align: 'center' });

    // Doc meta (right side below badge)
    let metaY = headerY + 26;
    const metaItems = [
      [DOC_PREFIX_LABELS[doc.type] || 'Doc No', doc.id],
      doc.client_quotation_number ? ["Client Ref", doc.client_quotation_number] : null,
      ['Date', doc.date],
      doc.due_date   ? ['Due',       doc.due_date]              : null,
      doc.validity   ? ['Valid',     doc.validity + ' days']    : null,
      doc.po_number  ? ['PO No',     doc.po_number]             : null,
      doc.so_number  ? ['SO No',     doc.so_number]             : null,
      currency !== 'INR' ? ['Curr', currency + ' @ ' + (doc.exchange_rate||1)] : null,
    ].filter(Boolean);

    metaItems.forEach(([label, val]) => {
      pdf.fillColor('#64748b').fontSize(6).font('Helvetica-Bold')
        .text(label + ':', badgeX, metaY, { width: 52 });
      pdf.fillColor(brand.textDark).font('Helvetica')
        .text(String(val), badgeX + 52, metaY, { width: badgeW - 52, align: 'right' });
      metaY += 9;
    });

    // ── DIVIDER ───────────────────────────────────────────────────────────────
    const divY = Math.max(metaY + 2, headerY + 46);
    pdf.moveTo(ML, divY).lineTo(MR, divY)
      .strokeColor(brand.accent).lineWidth(0.6).stroke();

    // ── BILL TO / SHIP TO (side by side, compact) ─────────────────────────────
    const halfW  = (CW - 10) / 2;
    const addrY  = divY + 5;
    const addrFS = 7;

    function drawAddr(x, w, heading, name, lines) {
      pdf.fillColor(brand.accent).fontSize(6).font('Helvetica-Bold')
        .text(heading, x, addrY, { width: w });
      pdf.fillColor(brand.textDark).fontSize(8).font('Helvetica-Bold')
        .text(name, x, addrY + 8, { width: w });
      let ay = addrY + 17;
      pdf.fontSize(addrFS).font('Helvetica').fillColor('#475569');
      lines.filter(Boolean).forEach(line => {
        pdf.text(line, x, ay, { width: w }); ay += 9;
      });
      return ay;
    }

    let billLines, shipLines, billName, shipName, billH, shipH;

    if (isSO) {
      billH = 'FROM (VENDOR):'; billName = client.name;
      billLines = [
        client.address,
        [client.city, client.state, client.pincode].filter(Boolean).join(', '),
        client.gstin ? 'GSTIN: ' + client.gstin : null,
        client.phone ? 'Ph: ' + client.phone : null,
      ];
      shipH = 'BILL TO (BUYER):'; shipName = brandName;
      shipLines = [
        COMPANY.line1, COMPANY.line2,
        'GSTIN: ' + getBrandInfo(brandKey).gstin, 'PAN: ' + getBrandInfo(brandKey).pan,
      ];
    } else {
      billH = 'BILL TO:'; billName = client.name;
      billLines = [
        client.address,
        [client.city, client.state, client.pincode].filter(Boolean).join(', '),
        client.gstin ? 'GSTIN: ' + client.gstin : null,
        client.phone ? 'Ph: ' + client.phone : null,
        client.email || null,
      ];
      shipH = 'SHIP TO:';
      shipName = doc.ship_to_name || client.name;
      shipLines = [
        doc.ship_to_address || client.address,
        doc.ship_to_city
          ? [doc.ship_to_city, doc.ship_to_state, doc.ship_to_pincode].filter(Boolean).join(', ')
          : [client.city, client.state, client.pincode].filter(Boolean).join(', '),
        (doc.ship_to_gstin || client.gstin) ? 'GSTIN: ' + (doc.ship_to_gstin || client.gstin) : null,
        (doc.ship_to_phone || client.phone) ? 'Ph: ' + (doc.ship_to_phone || client.phone) : null,
      ];
    }

    const endBill = drawAddr(ML, halfW, billH, billName, billLines);
    const endShip = drawAddr(ML + halfW + 10, halfW, shipH, shipName, shipLines);

    // separator line
    pdf.moveTo(ML + halfW + 5, addrY)
      .lineTo(ML + halfW + 5, Math.max(endBill, endShip))
      .strokeColor(brand.borderColor).lineWidth(0.4).stroke();

    const tableY = Math.max(endBill, endShip) + 6;

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    // Tight column widths
    const SN_W   = 18;
    const DESC_W = 148;
    const HSN_W  = 38;
    const QTY_W  = 26;
    const UNIT_W = 28;
    const RATE_W = 58;
    const GST_W  = 24;
    const AMT_W  = CW - SN_W - DESC_W - HSN_W - QTY_W - UNIT_W - RATE_W - GST_W;

    const C = {
      SN:   ML,
      DESC: ML + SN_W,
      HSN:  ML + SN_W + DESC_W,
      QTY:  ML + SN_W + DESC_W + HSN_W,
      UNIT: ML + SN_W + DESC_W + HSN_W + QTY_W,
      RATE: ML + SN_W + DESC_W + HSN_W + QTY_W + UNIT_W,
      GST:  ML + SN_W + DESC_W + HSN_W + QTY_W + UNIT_W + RATE_W,
      AMT:  ML + SN_W + DESC_W + HSN_W + QTY_W + UNIT_W + RATE_W + GST_W,
    };

    const HDR_H = 14;
    // Dynamic row height — shrinks if many items to fit on one page
    const availableH = PH - tableY - HDR_H - 120; // 120 for totals+terms+footer
    const ROW_H = Math.min(13, Math.max(9, Math.floor(availableH / Math.max(items.length, 1))));

    // Header
    pdf.fillColor(brand.primary).rect(ML, tableY, CW, HDR_H).fill();
    pdf.fillColor('#ffffff').fontSize(6.5).font('Helvetica-Bold');
    pdf.text('#',                C.SN,   tableY + 4, { width: SN_W,   align: 'center' });
    pdf.text('Description',      C.DESC, tableY + 4, { width: DESC_W });
    pdf.text('HSN',              C.HSN,  tableY + 4, { width: HSN_W,  align: 'center' });
    pdf.text('Qty',              C.QTY,  tableY + 4, { width: QTY_W,  align: 'right' });
    pdf.text('Unit',             C.UNIT, tableY + 4, { width: UNIT_W, align: 'center' });
    pdf.text('Rate(' + currency + ')', C.RATE, tableY + 4, { width: RATE_W, align: 'right' });
    pdf.text('GST%',             C.GST,  tableY + 4, { width: GST_W,  align: 'center' });
    pdf.text('Amt(' + currency + ')',  C.AMT,  tableY + 4, { width: AMT_W,  align: 'right' });

    let iy = tableY + HDR_H;
    let subtotal = 0, totalGst = 0;

    items.forEach((item, i) => {
      const product = products.find(p => p.id === item.product_id);
      const qty     = Number(item.qty)  || 0;
      const rate    = Number(item.rate) || 0;
      const amt     = qty * rate;
      const gstPct  = Number(product?.gst) || 18;
      subtotal  += amt;
      totalGst  += amt * gstPct / 100;

      // Skip rows that would go off page — single page only
      if (iy + ROW_H > PH - 25) return;
      pdf.fillColor(i % 2 === 0 ? brand.rowAlt : brand.rowNormal)
        .rect(ML, iy, CW, ROW_H).fill();
      pdf.strokeColor(brand.borderColor).lineWidth(0.2)
        .rect(ML, iy, CW, ROW_H).stroke();

      // Column separators
      [C.DESC, C.HSN, C.QTY, C.UNIT, C.RATE, C.GST, C.AMT].forEach(cx => {
        pdf.moveTo(cx, iy).lineTo(cx, iy + ROW_H)
          .strokeColor(brand.borderColor).lineWidth(0.15).stroke();
      });

      const desc = item.description || product?.name || '—';
      const hsn  = item.hsn || product?.hsn || '—';
      const unit = item.unit || product?.unit || '—';

      pdf.fillColor(brand.textDark).fontSize(6.5).font('Helvetica');
      pdf.text(String(item.serial_no || i + 1), C.SN,   iy + 3, { width: SN_W,   align: 'center' });
      pdf.text(desc,                              C.DESC + 2, iy + 3, { width: DESC_W - 4, lineBreak: false });
      pdf.text(hsn,                               C.HSN,  iy + 3, { width: HSN_W,  align: 'center' });
      pdf.text(String(qty),                       C.QTY,  iy + 3, { width: QTY_W,  align: 'right' });
      pdf.text(unit,                              C.UNIT, iy + 3, { width: UNIT_W, align: 'center' });
      pdf.text(fmtC(rate, currency),              C.RATE, iy + 3, { width: RATE_W, align: 'right' });
      pdf.text(gstPct + '%',                      C.GST,  iy + 3, { width: GST_W,  align: 'center' });
      pdf.fillColor(brand.primary).font('Helvetica-Bold')
        .text(fmtC(amt, currency),                C.AMT,  iy + 3, { width: AMT_W,  align: 'right' });
      iy += ROW_H;
    });

    // Table bottom border
    pdf.moveTo(ML, iy).lineTo(MR, iy)
      .strokeColor(brand.accent).lineWidth(0.6).stroke();

    // ── TOTALS + TERMS side by side ───────────────────────────────────────────
    iy += 6;
    const sameState = (client.state || '').toLowerCase() === 'haryana' || isSO;
    const totX = ML + CW * 0.56, totW = MR - totX;
    const termsW = totX - ML - 6;

    // Terms (left side)
    pdf.fillColor(brand.primary).rect(ML, iy, termsW, 12).fill();
    pdf.fillColor('#ffffff').fontSize(6.5).font('Helvetica-Bold')
      .text('TERMS & CONDITIONS', ML + 4, iy + 3);

    let ty = iy + 15;
    const terms = doc.terms
      ? doc.terms.split('\n').filter(t => t.trim())
      : DEFAULT_TERMS;
    pdf.fillColor(brand.textDark).fontSize(6).font('Helvetica');
    terms.forEach(t => {
      pdf.text(t.trim(), ML + 2, ty, { width: termsW - 4 }); ty += 9;
    });

    if (doc.notes) {
      pdf.fillColor(brand.accent).fontSize(6).font('Helvetica-Bold')
        .text('Notes:', ML + 2, ty); ty += 8;
      pdf.fillColor('#475569').font('Helvetica')
        .text(doc.notes, ML + 2, ty, { width: termsW - 4 });
    }

    // Totals (right side)
    let toty = iy;

    function totRow(label, val, isGrand = false) {
      const rH = isGrand ? 16 : 12, pad = isGrand ? 4 : 2;
      if (isGrand) {
        pdf.fillColor(brand.primary).rect(totX, toty, totW, rH).fill();
        pdf.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      } else {
        pdf.fillColor(brand.totBg).rect(totX, toty, totW, rH).fill();
        pdf.strokeColor(brand.borderColor).lineWidth(0.2).rect(totX, toty, totW, rH).stroke();
        pdf.fillColor(brand.textDark).fontSize(6.5).font('Helvetica');
      }
      pdf.text(label, totX + 4, toty + pad, { width: totW * 0.55 });
      pdf.text(val,   totX + totW * 0.55, toty + pad, { width: totW * 0.42, align: 'right' });
      toty += rH;
    }

    totRow('Subtotal (excl. GST)', fmtC(subtotal, currency));
    if (sameState) {
      totRow('CGST (9%)', fmtC(totalGst / 2, currency));
      totRow('SGST (9%)', fmtC(totalGst / 2, currency));
    } else {
      totRow('IGST (18%)', fmtC(totalGst, currency));
    }
    if (Number(doc.paid) > 0) {
      totRow('Amount Paid', '- ' + fmtC(doc.paid, currency));
    }
    totRow('TOTAL DUE', fmtC(subtotal + totalGst - (Number(doc.paid) || 0), currency), true);

    if (currency !== 'INR' && doc.exchange_rate && doc.exchange_rate !== 1) {
      const inrEq = (subtotal + totalGst - (Number(doc.paid)||0)) * doc.exchange_rate;
      pdf.fillColor('#94a3b8').fontSize(6).font('Helvetica')
        .text('(INR ' + fmtC(inrEq, 'INR') + ' @ ' + doc.exchange_rate + ')',
          totX, toty, { width: totW, align: 'right' });
      toty += 9;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = PH - 20;
    pdf.moveTo(ML, footerY - 4).lineTo(MR, footerY - 4)
      .strokeColor(brand.accent).lineWidth(0.5).stroke();
    pdf.fillColor(brand.textDark).fontSize(6).font('Helvetica-Bold')
      .text('This is an Electronic generated document, No need for sign and stamp.',
        ML, footerY, { width: CW, align: 'center' });
    pdf.fillColor(brand.accent).fontSize(5.5).font('Helvetica')
      .text(brandName + '  |  GSTIN: ' + getBrandInfo(brandKey).gstin + '  |  PAN: ' + getBrandInfo(brandKey).pan + '  |  ' + getBrandInfo(brandKey).email,
        ML, footerY + 8, { width: CW, align: 'center' });

    // Bottom strip
    pdf.fillColor(brand.primary).rect(0, PH - 4, PW, 4).fill();

    pdf.end();
  });
}

// ── Single brand ──────────────────────────────────────────────────────────────
async function generateDocPDF(doc, client, items, products, res, brandKey = 'india') {
  try {
    const buf = await buildPDFBuffer(doc, client, items, products, brandKey);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.id}-${brandKey}.pdf"`);
    res.end(buf);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
}

// ── Both brands as ZIP ────────────────────────────────────────────────────────
async function generateBothPDFs(doc, client, items, products, res) {
  try {
    const [indiaBuf, worldBuf] = await Promise.all([
      buildPDFBuffer(doc, client, items, products, 'india'),
      buildPDFBuffer(doc, client, items, products, 'world'),
    ]);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.id}-both.zip"`);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    archive.append(indiaBuf, { name: `${doc.id}-BVM-India.pdf` });
    archive.append(worldBuf, { name: `${doc.id}-BVM-World.pdf` });
    await archive.finalize();
  } catch (err) {
    console.error('ZIP error:', err);
    res.status(500).json({ error: 'ZIP generation failed' });
  }
}

module.exports = { generateDocPDF, generateBothPDFs };
