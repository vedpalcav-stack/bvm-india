const PDFDocument = require('pdfkit');
const archiver    = require('archiver');
const path        = require('path');
const fs          = require('fs');

const LOGO_INDIA = path.join(__dirname, 'logos', 'bvm-india.png');
const LOGO_WORLD = path.join(__dirname, 'logos', 'bvm-world.jpg');

const COMPANY = {
  name_india:    'BVM India',
  name_world:    'BVM World',
  tagline_india: 'Trading & Distribution',
  tagline_world: 'Global Trading & Distribution',
  line1: '#1, 2nd Floor, Kamla Palace,',
  line2: 'Jail Road, Sohna Chowk',
  line3: 'Gurugram, Haryana - 122001',
  gstin: '06AGYPR1117M1ZT',
  pan:   'AGYPR1117M',
  email: 'accounts@bvmindia.com',
};

const DEFAULT_TERMS = [
  'Freight Forwarder: Will be confirmed at the time of Pickup.',
  '1. Payment Terms: As per BVM Conditions.',
  '2. Delivery: Immediate.',
  '3. Warranty: Standard as per OEM.',
];

const BRANDS = {
  india: {
    primary:    '#166534',
    accent:     '#16a34a',
    rowAlt:     '#f0fdf4',
    rowNormal:  '#ffffff',
    totBg:      '#f0fdf4',
    borderColor:'#bbf7d0',
    textDark:   '#14532d',
    logo:       LOGO_INDIA,
  },
  world: {
    primary:    '#1e3a5f',
    accent:     '#1d4ed8',
    rowAlt:     '#eff6ff',
    rowNormal:  '#ffffff',
    totBg:      '#eff6ff',
    borderColor:'#bfdbfe',
    textDark:   '#1e3a5f',
    logo:       LOGO_WORLD,
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

// Fixed currency formatter — uses text symbol, not Unicode char that PDFKit renders as number
function fmtC(n, currency = 'INR') {
  const abs = Math.abs(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  // Use text abbreviations inside PDFKit (Helvetica doesn't support ₹ glyph)
  const sym = {
    INR: 'INR ', USD: 'USD ', EUR: 'EUR ',
    GBP: 'GBP ', AED: 'AED ', SGD: 'SGD ', JPY: 'JPY '
  }[currency] || (currency + ' ');
  return sym + abs;
}

// ─────────────────────────────────────────────────────────────────────────────
function buildPDFBuffer(doc, client, items, products, brandKey) {
  return new Promise((resolve, reject) => {
    const brand     = BRANDS[brandKey];
    const brandName = brandKey === 'india' ? COMPANY.name_india : COMPANY.name_world;
    const tagline   = brandKey === 'india' ? COMPANY.tagline_india : COMPANY.tagline_world;
    const logoPath  = brand.logo;
    const hasLogo   = fs.existsSync(logoPath);

    const pdf = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks = [];
    pdf.on('data',  c  => chunks.push(c));
    pdf.on('end',   () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    const PW = pdf.page.width;
    const PH = pdf.page.height;
    const ML = 40, MR = PW - 40, CW = MR - ML;
    const currency  = doc.currency || 'INR';
    const isSO      = doc.type === 'sales_order';
    const typeLabel = TYPE_LABELS[doc.type] || doc.type.toUpperCase();

    // ── WHITE BACKGROUND ─────────────────────────────────────────────────────
    pdf.fillColor('#ffffff').rect(0, 0, PW, PH).fill();

    // ── TOP COLOR STRIP ───────────────────────────────────────────────────────
    pdf.fillColor(brand.primary).rect(0, 0, PW, 5).fill();

    // ── LOGO (left side) ──────────────────────────────────────────────────────
    const logoH = 50, logoW = 80;
    if (hasLogo) {
      try {
        pdf.image(logoPath, ML, 12, { fit: [logoW, logoH], align: 'left' });
      } catch (e) {
        console.warn('Logo load failed:', e.message);
      }
    }

    // ── COMPANY INFO (next to logo) ───────────────────────────────────────────
    const infoX = hasLogo ? ML + logoW + 10 : ML;
    pdf.fillColor(brand.primary).fontSize(16).font('Helvetica-Bold')
      .text(brandName, infoX, 14);
    pdf.fillColor(brand.accent).fontSize(8).font('Helvetica')
      .text(tagline, infoX, 32);
    pdf.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text(`${COMPANY.line1} ${COMPANY.line2}, ${COMPANY.line3}`, infoX, 42)
      .text(`GSTIN: ${COMPANY.gstin}   |   PAN: ${COMPANY.pan}   |   ${COMPANY.email}`, infoX, 52);

    // ── DOC TYPE BADGE (right) ────────────────────────────────────────────────
    const badgeW = 155, badgeH = 26, badgeX = MR - badgeW;
    pdf.strokeColor(brand.primary).lineWidth(1.5)
      .rect(badgeX, 12, badgeW, badgeH).stroke();
    pdf.fillColor(brand.primary).fontSize(10).font('Helvetica-Bold')
      .text(typeLabel, badgeX, 19, { width: badgeW, align: 'center' });

    // ── DOC META ──────────────────────────────────────────────────────────────
    let metaY = 46;
    const metaItems = [
      [DOC_PREFIX_LABELS[doc.type] || 'Document No', doc.id],
      doc.client_quotation_number ? ["Client's Ref", doc.client_quotation_number] : null,
      ['Date', doc.date],
      doc.due_date   ? ['Due Date',  doc.due_date]           : null,
      doc.validity   ? ['Valid For', `${doc.validity} days`] : null,
      doc.po_number  ? ['PO Number', doc.po_number]          : null,
      doc.so_number  ? ['SO Number', doc.so_number]          : null,
      doc.ref_doc_id ? ['Ref Doc',   doc.ref_doc_id]         : null,
      currency !== 'INR' ? ['Currency', `${currency} @ ${doc.exchange_rate || 1}`] : null,
    ].filter(Boolean);

    metaItems.forEach(([label, val]) => {
      pdf.fillColor('#64748b').fontSize(7).font('Helvetica-Bold')
        .text(label + ':', badgeX, metaY, { width: 72 });
      pdf.fillColor(brand.textDark).font('Helvetica')
        .text(String(val), badgeX + 72, metaY, { width: badgeW - 72, align: 'right' });
      metaY += 11;
    });

    // ── DIVIDER ───────────────────────────────────────────────────────────────
    const divY = Math.max(metaY + 4, 72);
    pdf.moveTo(ML, divY).lineTo(MR, divY)
      .strokeColor(brand.accent).lineWidth(0.8).stroke();

    // ── BILL TO / SHIP TO ─────────────────────────────────────────────────────
    const halfW = (CW - 14) / 2;
    const addrY = divY + 10;

    function drawAddr(x, w, heading, name, lines, color) {
      pdf.fillColor(color).fontSize(7).font('Helvetica-Bold')
        .text(heading, x, addrY, { width: w });
      pdf.fillColor(brand.textDark).fontSize(10).font('Helvetica-Bold')
        .text(name, x, addrY + 10, { width: w });
      let ay = addrY + 22;
      pdf.fontSize(7.5).font('Helvetica').fillColor('#475569');
      lines.filter(Boolean).forEach(line => {
        pdf.text(line, x, ay, { width: w }); ay += 11;
      });
      return ay;
    }

    let billH, shipH, billName, shipName, billLines, shipLines;

    if (isSO) {
      billH    = 'FROM (VENDOR / SUPPLIER):';
      billName = client.name;
      billLines = [
        client.address,
        [client.city, client.state, client.pincode].filter(Boolean).join(', '),
        client.gstin ? `GSTIN: ${client.gstin}` : null,
        client.phone ? `Ph: ${client.phone}` : null,
      ];
      shipH    = 'BILL TO / SHIP TO (BUYER):';
      shipName = brandName;
      shipLines = [
        COMPANY.line1, COMPANY.line2, COMPANY.line3,
        `GSTIN: ${COMPANY.gstin}`, `PAN: ${COMPANY.pan}`,
      ];
    } else {
      billH    = 'BILL TO:';
      billName = client.name;
      billLines = [
        client.address,
        [client.city, client.state, client.pincode].filter(Boolean).join(', '),
        client.gstin ? `GSTIN: ${client.gstin}` : null,
        client.phone ? `Ph: ${client.phone}` : null,
        client.email || null,
      ];
      shipH    = 'SHIP TO:';
      shipName = doc.ship_to_name || client.name;
      shipLines = [
        doc.ship_to_address || client.address,
        doc.ship_to_city
          ? [doc.ship_to_city, doc.ship_to_state, doc.ship_to_pincode].filter(Boolean).join(', ')
          : [client.city, client.state, client.pincode].filter(Boolean).join(', '),
        (doc.ship_to_gstin || client.gstin) ? `GSTIN: ${doc.ship_to_gstin || client.gstin}` : null,
        (doc.ship_to_phone || client.phone) ? `Ph: ${doc.ship_to_phone || client.phone}` : null,
      ];
    }

    const endBill = drawAddr(ML, halfW, billH, billName, billLines, brand.accent);
    const endShip = drawAddr(ML + halfW + 14, halfW, shipH, shipName, shipLines, brand.accent);

    // vertical separator
    pdf.moveTo(ML + halfW + 7, addrY)
      .lineTo(ML + halfW + 7, Math.max(endBill, endShip))
      .strokeColor(brand.borderColor).lineWidth(0.5).stroke();

    const tableY = Math.max(endBill, endShip) + 12;

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    // Fixed widths summing to CW
    const SN_W   = 22;
    const DESC_W = 150;
    const HSN_W  = 40;
    const QTY_W  = 30;
    const UNIT_W = 32;
    const RATE_W = 66;
    const GST_W  = 28;
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

    const HDR_H = 18;

    function drawTableHeader(y) {
      pdf.fillColor(brand.primary).rect(ML, y, CW, HDR_H).fill();
      pdf.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
      pdf.text('#',                 C.SN,   y + 5, { width: SN_W,   align: 'center' });
      pdf.text('Description',       C.DESC, y + 5, { width: DESC_W });
      pdf.text('HSN',               C.HSN,  y + 5, { width: HSN_W,  align: 'center' });
      pdf.text('Qty',               C.QTY,  y + 5, { width: QTY_W,  align: 'right' });
      pdf.text('Unit',              C.UNIT, y + 5, { width: UNIT_W, align: 'center' });
      pdf.text(`Rate(${currency})`, C.RATE, y + 5, { width: RATE_W, align: 'right' });
      pdf.text('GST%',              C.GST,  y + 5, { width: GST_W,  align: 'center' });
      pdf.text(`Amt(${currency})`,  C.AMT,  y + 5, { width: AMT_W,  align: 'right' });
    }

    drawTableHeader(tableY);

    let iy = tableY + HDR_H;
    let subtotal = 0, totalGst = 0;
    const ROW_H = 18;

    items.forEach((item, i) => {
      const product = products.find(p => p.id === item.product_id);
      const qty     = Number(item.qty)  || 0;
      const rate    = Number(item.rate) || 0;
      const amt     = qty * rate;
      const gstPct  = Number(product?.gst) || 18;
      subtotal  += amt;
      totalGst  += amt * gstPct / 100;

      // Page break
      if (iy + ROW_H > PH - 130) {
        pdf.addPage();
        pdf.fillColor('#ffffff').rect(0, 0, PW, PH).fill();
        pdf.fillColor(brand.primary).rect(0, 0, PW, 4).fill();
        iy = 20;
        drawTableHeader(iy);
        iy += HDR_H;
      }

      // Row background
      pdf.fillColor(i % 2 === 0 ? brand.rowAlt : brand.rowNormal)
        .rect(ML, iy, CW, ROW_H).fill();

      // Row border
      pdf.strokeColor(brand.borderColor).lineWidth(0.25)
        .rect(ML, iy, CW, ROW_H).stroke();

      // Column dividers
      [C.DESC, C.HSN, C.QTY, C.UNIT, C.RATE, C.GST, C.AMT].forEach(cx => {
        pdf.moveTo(cx, iy).lineTo(cx, iy + ROW_H)
          .strokeColor(brand.borderColor).lineWidth(0.2).stroke();
      });

      const sn   = String(item.serial_no || i + 1);
      const desc = item.description || product?.name || '—';
      const hsn  = item.hsn || product?.hsn || '—';
      const unit = item.unit || product?.unit || '—';

      pdf.fillColor(brand.textDark).fontSize(7.5).font('Helvetica');
      pdf.text(sn,                    C.SN,     iy + 5, { width: SN_W,        align: 'center' });
      pdf.text(desc,                  C.DESC+2, iy + 5, { width: DESC_W - 4,  lineBreak: false });
      pdf.text(hsn,                   C.HSN,    iy + 5, { width: HSN_W,       align: 'center' });
      pdf.text(String(qty),           C.QTY,    iy + 5, { width: QTY_W,       align: 'right' });
      pdf.text(unit,                  C.UNIT,   iy + 5, { width: UNIT_W,      align: 'center' });
      pdf.text(fmtC(rate, currency),  C.RATE,   iy + 5, { width: RATE_W,      align: 'right' });
      pdf.text(`${gstPct}%`,          C.GST,    iy + 5, { width: GST_W,       align: 'center' });
      pdf.fillColor(brand.primary).font('Helvetica-Bold')
        .text(fmtC(amt, currency),    C.AMT,    iy + 5, { width: AMT_W,       align: 'right' });
      iy += ROW_H;
    });

    // Bottom table border
    pdf.moveTo(ML, iy).lineTo(MR, iy)
      .strokeColor(brand.accent).lineWidth(0.8).stroke();

    // ── TOTALS ────────────────────────────────────────────────────────────────
    iy += 10;
    const sameState = (client.state || '').toLowerCase() === 'haryana' || isSO;
    const totX = ML + CW * 0.55, totW = MR - totX;

    function totRow(label, val, isGrand = false) {
      const rH = isGrand ? 20 : 15, pad = isGrand ? 5 : 3;
      if (isGrand) {
        pdf.fillColor(brand.primary).rect(totX, iy, totW, rH).fill();
        pdf.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      } else {
        pdf.fillColor(brand.totBg).rect(totX, iy, totW, rH).fill();
        pdf.strokeColor(brand.borderColor).lineWidth(0.25)
          .rect(totX, iy, totW, rH).stroke();
        pdf.fillColor(brand.textDark).fontSize(7.5).font('Helvetica');
      }
      pdf.text(label, totX + 6, iy + pad, { width: totW * 0.54 });
      pdf.text(val,   totX + totW * 0.54, iy + pad, { width: totW * 0.42, align: 'right' });
      iy += rH;
    }

    totRow('Subtotal (excl. GST)', fmtC(subtotal, currency));
    if (sameState) {
      totRow('CGST (9%)',  fmtC(totalGst / 2, currency));
      totRow('SGST (9%)',  fmtC(totalGst / 2, currency));
    } else {
      totRow('IGST (18%)', fmtC(totalGst, currency));
    }
    if (Number(doc.paid) > 0) {
      totRow('Amount Paid', `- ${fmtC(doc.paid, currency)}`);
    }
    totRow('TOTAL DUE',
      fmtC(subtotal + totalGst - (Number(doc.paid) || 0), currency), true);

    if (currency !== 'INR' && doc.exchange_rate && doc.exchange_rate !== 1) {
      iy += 3;
      const inrEq = (subtotal + totalGst - (Number(doc.paid) || 0)) * doc.exchange_rate;
      pdf.fillColor('#64748b').fontSize(7).font('Helvetica')
        .text(`(INR equivalent: ${fmtC(inrEq, 'INR')} @ ${doc.exchange_rate})`,
          totX, iy, { width: totW, align: 'right' });
      iy += 12;
    }

    // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
    iy += 12;
    if (iy > PH - 100) { pdf.addPage(); iy = 30; }

    pdf.fillColor(brand.primary).rect(ML, iy, CW, 15).fill();
    pdf.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
      .text('TERMS & CONDITIONS', ML + 6, iy + 4);
    iy += 18;

    const terms = doc.terms
      ? doc.terms.split('\n').filter(t => t.trim())
      : DEFAULT_TERMS;

    pdf.fillColor(brand.textDark).fontSize(7.5).font('Helvetica');
    terms.forEach(t => {
      pdf.text(t.trim(), ML + 4, iy, { width: CW - 8 });
      iy += 11;
    });

    if (doc.notes) {
      iy += 4;
      pdf.fillColor(brand.accent).fontSize(7.5).font('Helvetica-Bold')
        .text('Notes:', ML, iy);
      iy += 10;
      pdf.fillColor('#475569').font('Helvetica')
        .text(doc.notes, ML + 4, iy, { width: CW - 8 });
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const fY = PH - 35;
    pdf.moveTo(ML, fY - 6).lineTo(MR, fY - 6)
      .strokeColor(brand.accent).lineWidth(0.8).stroke();
    pdf.fillColor(brand.textDark).fontSize(7).font('Helvetica-Bold')
      .text('This is an Electronic generated document, No need for sign and stamp.',
        ML, fY, { width: CW, align: 'center' });
    pdf.fillColor(brand.accent).fontSize(6.5).font('Helvetica')
      .text(`${brandName}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}  |  ${COMPANY.email}`,
        ML, fY + 11, { width: CW, align: 'center' });

    // Bottom strip + logo watermark in footer
    pdf.fillColor(brand.primary).rect(0, PH - 6, PW, 6).fill();

    pdf.end();
  });
}

// ── SINGLE BRAND PDF ──────────────────────────────────────────────────────────
async function generateDocPDF(doc, client, items, products, res, brandKey = 'india') {
  try {
    const buf = await buildPDFBuffer(doc, client, items, products, brandKey);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="${doc.id}-${brandKey}.pdf"`);
    res.end(buf);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
}

// ── BOTH PDFs IN ONE ZIP ──────────────────────────────────────────────────────
async function generateBothPDFs(doc, client, items, products, res) {
  try {
    const [indiaBuf, worldBuf] = await Promise.all([
      buildPDFBuffer(doc, client, items, products, 'india'),
      buildPDFBuffer(doc, client, items, products, 'world'),
    ]);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition',
      `attachment; filename="${doc.id}-both.zip"`);
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
