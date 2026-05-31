import React, { useState } from 'react';
import * as api from './utils/api';

const DEFAULT_TERMS = `Freight Forwarder: Will be confirmed at the time of Pickup.
1. Payment Terms: 100% Wire Transfer at the time of Availability.
2. Delivery: Immediate.
3. Warranty: Standard as per OEM.`;

function fmtAmt(n, currency = 'INR') {
  const sym = api.CURRENCY_SYMBOLS[currency] || currency + ' ';
  return sym + Math.abs(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

// ── MINI INVOICE CARD ─────────────────────────────────────────────────────────
function InvoiceCard({ doc, client, items, products, brand }) {
  const isIndia  = brand === 'india';
  const name     = isIndia ? 'BVM INDIA' : 'BVM WORLD PVT LTD';
  const gstin    = isIndia ? '06AGYPR1117M1ZT' : '06AAMCB5079P1ZX';
  const pan      = isIndia ? 'AGYPR1117M' : 'AAMCB5079P';
  const color    = isIndia ? '#166534' : '#1e3a5f';
  const accent   = isIndia ? '#16a34a' : '#1d4ed8';
  const lightBg  = isIndia ? '#f0fdf4' : '#eff6ff';
  const border   = isIndia ? '#bbf7d0' : '#bfdbfe';

  const currency = doc.currency || 'INR';
  const subtotal = items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0);
  const gst      = subtotal * 0.18;
  const total    = subtotal + gst;
  const isSameState = (client?.state || '').toLowerCase() === 'haryana';
  const typeLabel = api.FLOW_LABELS[doc.type] || doc.type;

  return (
    <div style={{ border: `2px solid ${color}`, borderRadius: 8, overflow: 'hidden', fontSize: 11 }}>
      {/* Header band */}
      <div style={{ background: '#ffffff', borderBottom: `3px solid ${color}`, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color, letterSpacing: -0.3 }}>{name}</div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
            #1, 2nd Floor, Kamla Palace, Gurugram, Haryana - 122001<br />
            GSTIN: {gstin} | PAN: {pan}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: color, color: '#fff', padding: '3px 10px', borderRadius: 3, fontSize: 9, fontWeight: 800, marginBottom: 5 }}>
            {typeLabel.toUpperCase()}
          </div>
          <table style={{ fontSize: 9 }}><tbody>
            <tr><td style={{ color: '#64748b', paddingRight: 6, fontWeight: 600 }}>No.</td><td style={{ fontWeight: 800, color }}>{doc.id}</td></tr>
            <tr><td style={{ color: '#64748b', paddingRight: 6, fontWeight: 600 }}>Date</td><td>{doc.date}</td></tr>
            {doc.due_date   && <tr><td style={{ color: '#64748b', paddingRight: 6, fontWeight: 600 }}>Due</td><td>{doc.due_date}</td></tr>}
            {doc.po_number  && <tr><td style={{ color: '#64748b', paddingRight: 6, fontWeight: 600 }}>PO</td><td>{doc.po_number}</td></tr>}
            {doc.so_number  && <tr><td style={{ color: '#64748b', paddingRight: 6, fontWeight: 600 }}>SO</td><td>{doc.so_number}</td></tr>}
            {currency !== 'INR' && <tr><td style={{ color: '#64748b', paddingRight: 6, fontWeight: 600 }}>Curr</td><td>{currency}@{doc.exchange_rate}</td></tr>}
          </tbody></table>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ background: lightBg, borderBottom: `1px solid ${border}`, padding: '6px 14px', fontSize: 10 }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Bill To</div>
        <strong style={{ color: '#0f172a' }}>{client?.name}</strong> &nbsp;·&nbsp;
        {client?.city}{client?.state ? `, ${client.state}` : ''} &nbsp;·&nbsp; GSTIN: {client?.gstin}
      </div>

      {/* Items table */}
      <div style={{ padding: '8px 14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ background: color }}>
              {['#', 'Description', 'HSN', 'Qty', 'Unit', `Rate(${currency})`, `Amt(${currency})`].map(h => (
                <th key={h} style={{ color: '#fff', padding: '4px 6px', fontSize: 9, textAlign: h === 'Description' ? 'left' : 'right', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const p = products.find(x => x.id === it.product_id);
              const amt = (it.qty || 0) * (it.rate || 0);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? lightBg : '#fff' }}>
                  <td style={{ padding: '3px 6px', textAlign: 'right', borderBottom: `1px solid ${border}` }}>{it.serial_no || i + 1}</td>
                  <td style={{ padding: '3px 6px', borderBottom: `1px solid ${border}` }}>{it.description || p?.name}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', borderBottom: `1px solid ${border}` }}>{it.hsn || p?.hsn}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', borderBottom: `1px solid ${border}` }}>{it.qty}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', borderBottom: `1px solid ${border}` }}>{it.unit || p?.unit}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', borderBottom: `1px solid ${border}` }}>{fmtAmt(it.rate, currency)}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 700, color, borderBottom: `1px solid ${border}` }}>{fmtAmt(amt, currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <table style={{ width: 200 }}>
            <tbody>
              <tr><td style={{ color: '#64748b', fontSize: 10 }}>Subtotal</td><td style={{ textAlign: 'right', fontSize: 10 }}>{fmtAmt(subtotal, currency)}</td></tr>
              {isSameState ? <>
                <tr><td style={{ color: '#64748b', fontSize: 10 }}>CGST (9%)</td><td style={{ textAlign: 'right', fontSize: 10 }}>{fmtAmt(gst / 2, currency)}</td></tr>
                <tr><td style={{ color: '#64748b', fontSize: 10 }}>SGST (9%)</td><td style={{ textAlign: 'right', fontSize: 10 }}>{fmtAmt(gst / 2, currency)}</td></tr>
              </> : <tr><td style={{ color: '#64748b', fontSize: 10 }}>IGST (18%)</td><td style={{ textAlign: 'right', fontSize: 10 }}>{fmtAmt(gst, currency)}</td></tr>}
              {doc.paid > 0 && <tr><td style={{ color: '#15803d', fontSize: 10 }}>Paid</td><td style={{ textAlign: 'right', color: '#15803d', fontSize: 10 }}>- {fmtAmt(doc.paid, currency)}</td></tr>}
              <tr style={{ borderTop: `2px solid ${color}` }}>
                <td style={{ fontWeight: 900, fontSize: 12, color, paddingTop: 4 }}>Total Due</td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 12, color, paddingTop: 4 }}>{fmtAmt(total - (doc.paid || 0), currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms */}
        <div style={{ marginTop: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '6px 10px', fontSize: 9, color: '#78350f', lineHeight: 1.8 }}>
          <strong>T&C:</strong> Freight Forwarder confirmed at Pickup · 100% Wire Transfer · Immediate Delivery · Standard OEM Warranty
        </div>

        {/* Footer */}
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 9, color: accent, fontStyle: 'italic', borderTop: `1px solid ${border}`, paddingTop: 6 }}>
          Electronic document — No sign or stamp needed · {name} · GSTIN: {gstin}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DUAL DOC VIEW (EDITABLE) ─────────────────────────────────────────────
export default function DualDocView({ doc: initialDoc, clients, products, onClose, onRefresh, brand }) {
  const [doc,     setDoc]     = useState({ ...initialDoc });
  const [items,   setItems]   = useState([...(initialDoc.items || [])]);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [editing, setEditing] = useState(false);

  const cl        = clients.find(c => c.id === doc.client_id) || {};
  const currency  = doc.currency || 'INR';
  const typeLabel = api.FLOW_LABELS[doc.type] || doc.type;
  const nextType  = api.FLOW_NEXT[doc.type];
  const nextLabel = api.FLOW_NEXT_LABELS[doc.type];

  const set = (k, v) => setDoc(d => ({ ...d, [k]: v }));

  const updateItem = (i, key, val) => {
    setItems(prev => {
      const u = [...prev];
      u[i] = { ...u[i], [key]: val };
      if (key === 'product_id') {
        const p = products.find(x => x.id === val);
        if (p) { u[i].description = p.name; u[i].rate = p.rate; u[i].unit = p.unit; u[i].hsn = p.hsn; }
      }
      return u;
    });
  };

  const addItem = () => setItems(prev => [...prev, {
    serial_no: prev.length + 1,
    product_id: products[0]?.id || '',
    description: products[0]?.name || '',
    hsn: products[0]?.hsn || '',
    qty: 1, unit: products[0]?.unit || 'Piece',
    rate: products[0]?.rate || 0, currency
  }]);

  const removeItem = (i) => setItems(prev =>
    prev.filter((_, j) => j !== i).map((x, idx) => ({ ...x, serial_no: idx + 1 }))
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateDocument(doc.id, {
        status:    doc.status,
        notes:     doc.notes,
        po_number: doc.po_number,
        so_number: doc.so_number,
        terms:     doc.terms,
        client_quotation_number: doc.client_quotation_number,
      });
      setSaved(true);
      setEditing(false);
      onRefresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
    setSaving(false);
  };

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0);
  const gstAmt   = subtotal * 0.18;

  // Flow bar
  const flowSteps = [
    { key: 'quotation', label: 'Quotation', short: 'BVM-QT' },
    { key: 'proforma',  label: 'Proforma',  short: 'BVM-PI' },
    { key: 'purchase_order', label: 'Purchase Order', short: 'BVM-PO' },
    { key: 'sales_order',    label: 'Sales Order',    short: 'BVM-SO' },
    { key: 'invoice',   label: 'Invoice',   short: 'BVM-INV' },
  ];
  const flowIdx = flowSteps.findIndex(s => s.key === doc.type);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-xwide" style={{ maxHeight: '93vh' }}>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            {typeLabel}: <code>{doc.id}</code>
            {saved && <span style={{ marginLeft: 10, color: '#15803d', fontSize: 13 }}>✅ Saved!</span>}
          </span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Flow bar */}
        <div className="flow-bar" style={{ marginBottom: 14 }}>
          {flowSteps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={`flow-step ${i < flowIdx ? 'done' : i === flowIdx ? 'active' : 'pending'}`}>
                <div className="flow-dot">{i < flowIdx ? '✓' : s.short}</div>
                <div className="flow-label">{s.label}</div>
              </div>
              {i < flowSteps.length - 1 && <div className={`flow-arrow ${i < flowIdx ? 'done' : ''}`}>›</div>}
            </React.Fragment>
          ))}
        </div>

        {/* PDF Download buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', alignSelf: 'center', marginRight: 4 }}>📄 Download PDF:</div>
          <button onClick={() => api.downloadPDF(doc.id, brand || 'india')}
            style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: brand === 'world' ? '#1e3a5f' : '#166534', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            ⬇ {brand === 'world' ? '🔵 BVM World PDF' : '🟢 BVM India PDF'}
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(e => !e)}
              style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #d1d5db', background: editing ? '#fef3c7' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              {editing ? '👁 Preview Mode' : '✏️ Edit Mode'}
            </button>
          </div>
        </div>

        {/* Edit fields (shown in edit mode) */}
        {editing && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✏️ Edit Document Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              <div className="form-row">
                <label>Client's Ref No.</label>
                <input value={doc.client_quotation_number || ''} onChange={e => set('client_quotation_number', e.target.value)} />
              </div>
              <div className="form-row">
                <label>PO Number</label>
                <input value={doc.po_number || ''} onChange={e => set('po_number', e.target.value)} />
              </div>
              <div className="form-row">
                <label>SO Number</label>
                <input value={doc.so_number || ''} onChange={e => set('so_number', e.target.value)} />
              </div>
              <div className="form-row">
                <label>Status</label>
                <select value={doc.status || 'Draft'} onChange={e => set('status', e.target.value)}>
                  {['Draft', 'Sent', 'Approved', 'Converted', 'Rejected', 'Closed', 'Paid', 'Partially Paid', 'Unpaid'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-row" style={{ gridColumn: 'span 2' }}>
                <label>Notes</label>
                <input value={doc.notes || ''} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>

            {/* Editable line items */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6, textTransform: 'uppercase' }}>Line Items</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="items-table">
                <thead><tr>
                  <th style={{ width: 38 }}>S.No</th>
                  <th style={{ width: 140 }}>Product</th>
                  <th style={{ width: 160 }}>Description</th>
                  <th style={{ width: 50 }}>HSN</th>
                  <th style={{ width: 55 }}>Qty</th>
                  <th style={{ width: 80 }}>Unit</th>
                  <th style={{ width: 90 }}>Rate ({currency})</th>
                  <th style={{ width: 100 }}>Amount</th>
                  <th style={{ width: 30 }}></th>
                </tr></thead>
                <tbody>{items.map((it, i) => {
                  const amt = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                  return (
                    <tr key={i}>
                      <td><input type="number" value={it.serial_no} style={{ width: 44 }} onChange={e => updateItem(i, 'serial_no', e.target.value)} /></td>
                      <td><select value={it.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select></td>
                      <td><input value={it.description || ''} onChange={e => updateItem(i, 'description', e.target.value)} /></td>
                      <td><input value={it.hsn || ''} onChange={e => updateItem(i, 'hsn', e.target.value)} /></td>
                      <td><input type="number" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} /></td>
                      <td><select value={it.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                        {['Piece','Pcs','Set','Kg','Gram','Metre','Box','Litre','Bag','Roll','Pair','Nos'].map(u => <option key={u}>{u}</option>)}
                      </select></td>
                      <td><input type="number" step="0.01" value={it.rate} onChange={e => updateItem(i, 'rate', e.target.value)} /></td>
                      <td className="bold">{fmtAmt(amt, currency)}</td>
                      <td><button className="btn-x" onClick={() => removeItem(i)}>×</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <button className="btn mt8" style={{ fontSize: 12 }} onClick={addItem}>+ Add Line</button>

            {/* Totals preview */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', minWidth: 240, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}><span>Subtotal</span><span>{fmtAmt(subtotal, currency)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}><span>GST (18%)</span><span>{fmtAmt(gstAmt, currency)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '2px solid #0f172a', paddingTop: 6, marginTop: 6 }}>
                  <span>Total</span><span>{fmtAmt(subtotal + gstAmt, currency)}</span>
                </div>
              </div>
            </div>

            {/* Editable Terms */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 4, textTransform: 'uppercase' }}>
                Terms & Conditions <span style={{ fontWeight: 400, fontSize: 10 }}>(one per line)</span>
              </div>
              <textarea rows={4} value={doc.terms || DEFAULT_TERMS}
                onChange={e => set('terms', e.target.value)}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 12, lineHeight: 1.8, padding: '8px 10px', border: '1px solid #fde68a', borderRadius: 6, color: '#78350f', background: '#fffbeb', resize: 'vertical' }} />
              <button className="btn" style={{ fontSize: 11, marginTop: 4 }} onClick={() => set('terms', DEFAULT_TERMS)}>↺ Reset to Default</button>
            </div>
          </div>
        )}

        {/* Preview — shows current brand */}
        <div style={{ marginBottom: 14 }}>
          <InvoiceCard doc={doc} client={cl} items={items} products={products} brand={brand || 'india'} />
        </div>

        {/* Footer buttons */}
        <div className="modal-footer">
          {editing && (
            <button className="btn btn-success" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          )}
          {nextType && doc.status !== 'Converted' && (
            <button className="btn btn-purple" onClick={async () => {
              await api.convertDocument(doc.id, nextType);
              onRefresh(); onClose();
            }}>→ Convert to {nextLabel}</button>
          )}
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
