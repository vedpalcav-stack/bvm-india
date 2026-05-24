import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import * as api from './utils/api';
import DualDocView from './DualDocView';
import bvmIndiaLogo from './assets/bvm-india.png';
import bvmWorldLogo from './assets/bvm-world.jpg';

const today = () => new Date().toISOString().split('T')[0];
const futureDate = (d) => new Date(Date.now() + d * 86400000).toISOString().split('T')[0];

const DEFAULT_TERMS = `Freight Forwarder: Will be confirmed at the time of Pickup.
1. Payment Terms: As per BVM Conditions.
2. Delivery: Immediate.
3. Warranty: Standard as per OEM.`;

const BRAND_CONFIG = {
  india: {
    name: 'BVM INDIA',
    fullName: 'BVM India Pvt Ltd',
    gstin: '06AGYPR1117M1ZT',
    pan: 'AGYPR1117M',
    email: 'accounts@bvmindia.com',
    logo: bvmIndiaLogo,
    primary: '#166534',
    accent: '#16a34a',
    gradient: 'linear-gradient(135deg, #166534, #15803d)',
    light: '#f0fdf4',
    border: '#bbf7d0',
    navActive: '#4ade80',
    tabClass: 'brand-tab-india',
  },
  world: {
    name: 'BVM WORLD',
    fullName: 'BVM World Pvt Ltd',
    gstin: '06AAMCB5079P1ZX',
    pan: 'AAMCB5079P',
    email: 'accounts@bvmworld.com',
    logo: bvmWorldLogo,
    primary: '#1e3a5f',
    accent: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)',
    light: '#eff6ff',
    border: '#bfdbfe',
    navActive: '#60a5fa',
    tabClass: 'brand-tab-world',
  }
};

function fmtAmt(n, currency = 'INR') {
  const sym = api.CURRENCY_SYMBOLS[currency] || currency + ' ';
  return sym + Math.abs(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── BRAND SELECTION SCREEN ────────────────────────────────────────────────────
function BrandSelect({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0c1220',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
          UNIFIED ERP SYSTEM
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>
          Welcome to BVM ERP
        </div>
        <div style={{ fontSize: 15, color: '#64748b' }}>
          Select your brand to continue
        </div>
      </div>

      {/* Brand Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 680, width: '100%' }}>
        {/* BVM India */}
        <button onClick={() => onSelect('india')} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: 16, padding: '32px 24px',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          fontFamily: 'inherit',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(74,222,128,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ width: 80, height: 80, background: '#fff', borderRadius: 16, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={bvmIndiaLogo} alt="BVM India" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', letterSpacing: -0.5 }}>BVM INDIA</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Private Limited</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 8, fontFamily: 'monospace' }}>
              GSTIN: 06AGYPR1117M1ZT
            </div>
          </div>
          <div style={{ background: '#166534', color: '#fff', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
            Enter BVM India →
          </div>
        </button>

        {/* BVM World */}
        <button onClick={() => onSelect('world')} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(96,165,250,0.3)',
          borderRadius: 16, padding: '32px 24px',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          fontFamily: 'inherit',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(96,165,250,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ width: 80, height: 80, background: '#fff', borderRadius: 16, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={bvmWorldLogo} alt="BVM World" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa', letterSpacing: -0.5 }}>BVM WORLD</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Private Limited</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 8, fontFamily: 'monospace' }}>
              GSTIN: 06AAMCB5079P1ZX
            </div>
          </div>
          <div style={{ background: '#1e3a5f', color: '#fff', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
            Enter BVM World →
          </div>
        </button>
      </div>

      <div style={{ marginTop: 40, fontSize: 12, color: '#334155', textAlign: 'center' }}>
        Each brand has its own separate clients, products and documents
      </div>
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide, extraWide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''} ${extraWide ? 'modal-xwide' : ''}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ status }) {
  const map = { Paid:'success','Partially Paid':'warning',Unpaid:'danger',Converted:'purple',Sent:'info',Draft:'gray',Closed:'gray',Regular:'green',Wholesale:'warning',Retail:'gray',Export:'info' };
  return <span className={`badge badge-${map[status]||'gray'}`}>{status}</span>;
}

function FlowBar({ current }) {
  const steps = [
    { key:'quotation', label:'Quotation', short:'BVM-QT' },
    { key:'proforma',  label:'Proforma',  short:'BVM-PI' },
    { key:'purchase_order', label:'Purchase Order', short:'BVM-PO' },
    { key:'sales_order',    label:'Sales Order',    short:'BVM-SO' },
    { key:'invoice',   label:'Invoice',   short:'BVM-INV' },
  ];
  const idx = steps.findIndex(s => s.key === current);
  return (
    <div className="flow-bar">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`flow-step ${i < idx ? 'done' : i === idx ? 'active' : 'pending'}`}>
            <div className="flow-dot">{i < idx ? '✓' : s.short}</div>
            <div className="flow-label">{s.label}</div>
          </div>
          {i < steps.length - 1 && <div className={`flow-arrow ${i < idx ? 'done' : ''}`}>›</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

// PDF button — single brand only
function PDFButton({ docId, brand }) {
  const cfg = BRAND_CONFIG[brand];
  return (
    <button
      style={{ background: cfg.primary, color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
      onClick={() => api.downloadPDF(docId, brand)}
      title={`Download ${cfg.name} PDF`}>
      ⬇ PDF
    </button>
  );
}

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
function GlobalSearch({ onNav, brand }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const PAGE_FOR_TYPE = { quotation:'quotations', proforma:'proforma', purchase_order:'purchase_orders', sales_order:'sales_orders', invoice:'invoices' };

  useEffect(() => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const t = setTimeout(() => {
      api.searchDocuments(q, null, brand).then(docs => { setResults(docs); setOpen(true); }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q, brand]);

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative', width:280 }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14, pointerEvents:'none' }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search documents, clients..."
          style={{ paddingLeft:32, width:'100%', height:34, borderRadius:8, border:'1px solid #e2e8f0', fontSize:12, background:'#f8fafc' }} />
        {q && <button onClick={() => {setQ('');setResults([]);setOpen(false);}} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>×</button>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 10px 40px rgba(0,0,0,0.15)', zIndex:9999, maxHeight:320, overflowY:'auto' }}>
          {results.map(doc => {
            const sub = (doc.items||[]).reduce((s,it)=>s+(it.qty||0)*(it.rate||0),0);
            return (
              <div key={doc.id} onClick={() => { onNav(PAGE_FOR_TYPE[doc.type]||'dashboard'); setQ(''); setOpen(false); }}
                style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f8fafc', display:'flex', justifyContent:'space-between' }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                <div>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700 }}>{doc.id}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{api.FLOW_LABELS[doc.type]||doc.type} · {doc.client_name||'—'} · {doc.date}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#166534' }}>{fmtAmt(sub*1.18, doc.currency)}</div>
                  <span style={{ padding:'1px 6px', borderRadius:10, background:'#f1f5f9', color:'#475569', fontSize:10 }}>{doc.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ onNav, brand }) {
  const [data, setData] = useState(null);
  const cfg = BRAND_CONFIG[brand];
  useEffect(() => { api.getDashboard(brand).then(setData).catch(()=>{}); }, [brand]);
  if (!data) return <div className="loading">Loading…</div>;
  return (
    <div>
      {/* Brand banner */}
      <div style={{ background: cfg.gradient, borderRadius: 12, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <img src={cfg.logo} alt={cfg.name} style={{ width: 64, height: 64, objectFit:'contain', borderRadius: 10, background:'#fff', padding: 4 }} />
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>{cfg.name}</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Private Limited</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontFamily:'monospace' }}>
            GSTIN: {cfg.gstin} · PAN: {cfg.pan}
          </div>
        </div>
      </div>

      <div className="grid4 mb16">
        <div className="metric"><div className="metric-label">Clients</div><div className="metric-val blue">{data.totalClients}</div></div>
        <div className="metric"><div className="metric-label">Products</div><div className="metric-val">{data.totalProducts}</div></div>
        <div className="metric"><div className="metric-label">Outstanding</div><div className="metric-val amber">{fmtAmt(data.outstanding)}</div></div>
        <div className="metric"><div className="metric-label">Low Stock</div><div className="metric-val red">{data.lowStock}</div></div>
      </div>
      <div className="grid4 mb16">
        <div className="metric"><div className="metric-label">Open Quotes</div><div className="metric-val green">{data.openQuotes}</div></div>
        <div className="metric"><div className="metric-label">Purchase Orders</div><div className="metric-val blue">{data.openPO}</div></div>
        <div className="metric"><div className="metric-label">Sales Orders</div><div className="metric-val purple">{data.openSO}</div></div>
        <div className="metric"><div className="metric-label">Total Received</div><div className="metric-val green">{fmtAmt(data.totalPaid)}</div></div>
      </div>
      <div className="grid2">
        <div className="card">
          <div className="section-title">Billing Flow</div>
          <FlowBar current="quotation" />
          <div style={{ marginTop: 14 }}>
            {[['+ New Quotation','quotations'],['+ New Purchase Order','purchase_orders'],['+ New Sales Order','sales_orders'],['+ New Invoice','invoices']].map(([label,page]) => (
              <button key={page} className="btn btn-block" onClick={() => onNav(page)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-title">Recent Activity</div>
          <table><thead><tr><th>ID</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{(data.recentActivity||[]).map(doc => (
            <tr key={doc.id}>
              <td><code>{doc.id}</code></td>
              <td style={{fontSize:12}}>{api.FLOW_LABELS[doc.type]||doc.type}</td>
              <td style={{fontSize:12}}>{doc.date}</td>
              <td><Badge status={doc.status}/></td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  );
}

// ── CLIENTS ───────────────────────────────────────────────────────────────────
function Clients({ onDataChange, brand }) {
  const [clients, setClients] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const load = useCallback(() => api.getClients(brand).then(setClients), [brand]);
  useEffect(() => { load(); }, [load]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const save = async () => {
    if (modal==='add') await api.createClient({...form, brand});
    else await api.updateClient(form.id, form);
    setModal(null); load(); onDataChange && onDataChange();
  };
  return (
    <div>
      <div className="topbar-actions"><button className="btn btn-primary" onClick={() => {setForm({});setModal('add');}}>+ Add Client</button></div>
      <div className="card">
        <table><thead><tr><th>ID</th><th>Company</th><th>GSTIN</th><th>City / State</th><th>Type</th><th>Balance</th><th></th></tr></thead>
        <tbody>{clients.map(cl => (
          <tr key={cl.id}>
            <td><code>{cl.id}</code></td>
            <td><strong>{cl.name}</strong><br/><small className="muted">{cl.contact} · {cl.phone}</small></td>
            <td><code className="small">{cl.gstin}</code></td>
            <td>{cl.city}{cl.state?`, ${cl.state}`:''}{cl.pincode?` - ${cl.pincode}`:''}</td>
            <td><Badge status={cl.type}/></td>
            <td className={cl.balance>0?'danger bold':cl.balance<0?'success bold':'muted'}>
              {cl.balance>0?fmtAmt(cl.balance)+' DR':cl.balance<0?fmtAmt(-cl.balance)+' CR':'Nil'}
            </td>
            <td><button className="btn btn-sm" onClick={() => {setForm(cl);setModal('edit');}}>Edit</button></td>
          </tr>
        ))}</tbody></table>
      </div>
      {modal && (
        <Modal title={modal==='add'?'Add Client':'Edit Client'} onClose={() => setModal(null)}>
          <div className="form-grid2">
            {[['Company Name','name'],['Contact Person','contact'],['Phone','phone'],['Email','email'],['GSTIN','gstin'],['City','city'],['State','state'],['Pincode','pincode']].map(([label,key]) => (
              <div className="form-row" key={key}><label>{label}</label><input value={form[key]||''} onChange={e => set(key,e.target.value)}/></div>
            ))}
            <div className="form-row col-span2"><label>Address</label><input value={form.address||''} onChange={e => set('address',e.target.value)}/></div>
            <div className="form-row"><label>Type</label>
              <select value={form.type||'Regular'} onChange={e => set('type',e.target.value)}>
                {['Regular','Wholesale','Retail','Export'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Client</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
function Products({ onDataChange, brand }) {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({gst:18,unit:'Piece'});
  const load = useCallback(() => api.getProducts(brand).then(setProducts), [brand]);
  useEffect(() => { load(); }, [load]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const save = async () => {
    if (modal==='add') await api.createProduct({...form, brand});
    else await api.updateProduct(form.id,form);
    setModal(null); load(); onDataChange && onDataChange();
  };
  return (
    <div>
      <div className="topbar-actions"><button className="btn btn-primary" onClick={() => {setForm({gst:18,unit:'Piece'});setModal('add');}}>+ Add Product</button></div>
      <div className="card">
        <table><thead><tr><th>SKU</th><th>Product Name</th><th>Category</th><th>HSN</th><th>Unit</th><th>Rate</th><th>GST</th><th></th></tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.id}>
            <td><code>{p.sku}</code></td><td><strong>{p.name}</strong></td><td>{p.category}</td>
            <td>{p.hsn}</td><td>{p.unit}</td><td className="bold">{fmtAmt(p.rate)}</td>
            <td><Badge status={`${p.gst}%`}/></td>
            <td><button className="btn btn-sm" onClick={() => {setForm(p);setModal('edit');}}>Edit</button></td>
          </tr>
        ))}</tbody></table>
      </div>
      {modal && (
        <Modal title={modal==='add'?'Add Product':'Edit Product'} onClose={() => setModal(null)}>
          <div className="form-grid2">
            {[['Product Name','name','text'],['SKU / Part No.','sku','text'],['Category','category','text'],['HSN Code','hsn','text'],['Rate (excl. GST)','rate','number']].map(([label,key,type]) => (
              <div className="form-row" key={key}><label>{label}</label><input type={type} value={form[key]||''} onChange={e => set(key,e.target.value)}/></div>
            ))}
            <div className="form-row"><label>Unit</label>
              <select value={form.unit||'Piece'} onChange={e => set('unit',e.target.value)}>
                {['Piece','Pcs','Set','Kg','Gram','Metre','Box','Litre','Bag','Roll','Pair','Nos'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-row"><label>GST %</label>
              <select value={form.gst||18} onChange={e => set('gst',+e.target.value)}>
                {[0,5,12,18,28].map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </div>
            {modal==='add' && <div className="form-row"><label>Opening Stock</label><input type="number" value={form.opening_stock||''} onChange={e => set('opening_stock',e.target.value)}/></div>}
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Product</button></div>
        </Modal>
      )}
    </div>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
function Inventory({ brand }) {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({type:'add',qty:''});
  const load = useCallback(() => Promise.all([api.getInventory(),api.getProducts(brand)]).then(([inv,prods]) => {setInventory(inv);setProducts(prods);}), [brand]);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <div className="topbar-actions"><button className="btn btn-primary" onClick={() => {setForm({product_id:products[0]?.id,type:'add',qty:''});setModal(true);}}>Update Stock</button></div>
      <div className="card">
        <table><thead><tr><th>Product</th><th>SKU</th><th>Warehouse</th><th>Unit</th><th>Stock</th><th>Reorder</th><th>Status</th></tr></thead>
        <tbody>{inventory.filter(inv => products.some(p => p.id === inv.product_id)).map(inv => {
          const low = inv.stock <= inv.reorder;
          return (<tr key={inv.id}><td><strong>{inv.product_name}</strong></td><td><code>{inv.sku}</code></td><td>{inv.warehouse}</td><td>{inv.unit}</td><td className={`bold ${low?'danger':'success'}`}>{inv.stock}</td><td className="muted">{inv.reorder}</td><td><Badge status={low?'Unpaid':'Paid'}/></td></tr>);
        })}</tbody></table>
      </div>
      {modal && (
        <Modal title="Update Stock" onClose={() => setModal(false)}>
          <div className="form-grid2">
            <div className="form-row col-span2"><label>Product</label>
              <select value={form.product_id} onChange={e => setForm(f => ({...f,product_id:e.target.value}))}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-row"><label>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value}))}>
                <option value="add">Add (Purchase / Received)</option>
                <option value="sub">Subtract (Sale / Damage)</option>
              </select>
            </div>
            <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e => setForm(f => ({...f,qty:e.target.value}))}/></div>
          </div>
          <div className="modal-footer"><button className="btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={async () => {await api.updateStock({product_id:form.product_id,qty:+form.qty,type:form.type});setModal(false);load();}}>Update</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── DOC FORM ──────────────────────────────────────────────────────────────────
function DocForm({ type, clients, products, onClose, onSaved, brand }) {
  const label = api.FLOW_LABELS[type]||type;
  const isSO = type === 'sales_order';
  const cfg = BRAND_CONFIG[brand];
  const [form, setForm] = useState({
    client_id:clients[0]?.id||'', date:today(), due_date:futureDate(30),
    validity:15, currency:'INR', exchange_rate:1,
    po_number:'', so_number:'', notes:'',
    client_quotation_number:'', terms:DEFAULT_TERMS,
    ship_to_name:'', ship_to_address:'', ship_to_city:'',
    ship_to_state:'', ship_to_pincode:'', ship_to_gstin:'', ship_to_phone:'',
  });
  const [items, setItems] = useState([{serial_no:1,product_id:products[0]?.id||'',description:products[0]?.name||'',hsn:products[0]?.hsn||'',qty:1,unit:products[0]?.unit||'Piece',rate:products[0]?.rate||0,currency:'INR'}]);
  const [showShipTo, setShowShipTo] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const updateItem = (i, key, val) => {
    setItems(prev => {
      const u=[...prev]; u[i]={...u[i],[key]:val};
      if(key==='product_id'){const p=products.find(x=>x.id===val);if(p){u[i].description=p.name;u[i].rate=p.rate;u[i].unit=p.unit;u[i].hsn=p.hsn;}}
      return u;
    });
  };

  const subtotal = items.reduce((s,it) => s+(parseFloat(it.qty)||0)*(parseFloat(it.rate)||0),0);
  const gstAmt = subtotal*0.18;
  const showPO = type==='purchase_order'||type==='sales_order'||type==='invoice';
  const showSO = type==='sales_order'||type==='invoice';
  const selectedClient = clients.find(c => c.id === form.client_id);

  const save = async () => {
    const saved = await api.createDocument({...form, type, brand, items: items.map(it=>({...it,qty:parseFloat(it.qty),rate:parseFloat(it.rate)}))});
    onSaved(); onClose();
    setTimeout(() => onSaved(saved), 100);
  };

  return (
    <Modal title={`New ${label}`} onClose={onClose} extraWide>
      <FlowBar current={type}/>
      <div style={{background:cfg.light,border:`1px solid ${cfg.border}`,borderRadius:8,padding:'8px 14px',marginBottom:12,fontSize:12,color:cfg.primary,display:'flex',alignItems:'center',gap:8}}>
        <img src={cfg.logo} alt={cfg.name} style={{width:20,height:20,objectFit:'contain'}}/>
        <strong>{cfg.name}</strong> — GSTIN: {cfg.gstin}
      </div>

      {isSO && (
        <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#1e3a5f'}}>
          <strong>ℹ Sales Order:</strong> {cfg.name} is the BUYER. Client appears as Vendor/Supplier.
        </div>
      )}

      <div className="section-title" style={{marginTop:8}}>Document Details</div>
      <div className="form-grid3 mb12">
        <div className="form-row">
          <label>{isSO?'Vendor / Supplier *':'Client *'}</label>
          <select value={form.client_id} onChange={e => set('client_id',e.target.value)}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-row"><label>Date *</label><input type="date" value={form.date} onChange={e => set('date',e.target.value)}/></div>
        {(type==='invoice'||type==='purchase_order'||type==='sales_order') && <div className="form-row"><label>Due Date</label><input type="date" value={form.due_date} onChange={e => set('due_date',e.target.value)}/></div>}
        {(type==='quotation'||type==='proforma') && <div className="form-row"><label>Validity (days)</label><input type="number" value={form.validity} onChange={e => set('validity',e.target.value)}/></div>}
        <div className="form-row"><label>Client's Ref No.</label><input value={form.client_quotation_number} onChange={e => set('client_quotation_number',e.target.value)} placeholder="Client's own reference"/></div>
        {showPO && <div className="form-row"><label>Purchase Order No.</label><input value={form.po_number} onChange={e => set('po_number',e.target.value)}/></div>}
        {showSO && <div className="form-row"><label>Sales Order No.</label><input value={form.so_number} onChange={e => set('so_number',e.target.value)}/></div>}
        <div className="form-row"><label>Currency</label>
          <select value={form.currency} onChange={e => {set('currency',e.target.value);setItems(prev=>prev.map(it=>({...it,currency:e.target.value})));}}> 
            {api.CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {form.currency!=='INR' && <div className="form-row"><label>Exchange Rate</label><input type="number" step="0.01" value={form.exchange_rate} onChange={e => set('exchange_rate',e.target.value)}/></div>}
      </div>

      {!isSO && (
        <div style={{marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div className="section-title" style={{margin:0}}>Bill To / Ship To</div>
            <button className="btn btn-sm" onClick={() => setShowShipTo(v=>!v)}>{showShipTo?'▲ Hide':'▼ Different Ship To'}</button>
          </div>
          {selectedClient && (
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#475569'}}>
              <strong style={{color:'#0f172a'}}>{selectedClient.name}</strong> · {selectedClient.address} · {selectedClient.city}, {selectedClient.state} · GSTIN: {selectedClient.gstin}
            </div>
          )}
          {showShipTo && (
            <div style={{marginTop:10}}>
              <div className="form-grid3">
                <div className="form-row"><label>Ship To Name</label><input value={form.ship_to_name} onChange={e=>set('ship_to_name',e.target.value)}/></div>
                <div className="form-row"><label>Phone</label><input value={form.ship_to_phone} onChange={e=>set('ship_to_phone',e.target.value)}/></div>
                <div className="form-row"><label>GSTIN</label><input value={form.ship_to_gstin} onChange={e=>set('ship_to_gstin',e.target.value)}/></div>
                <div className="form-row col-span2"><label>Address</label><input value={form.ship_to_address} onChange={e=>set('ship_to_address',e.target.value)}/></div>
                <div className="form-row"><label>City</label><input value={form.ship_to_city} onChange={e=>set('ship_to_city',e.target.value)}/></div>
                <div className="form-row"><label>State</label><input value={form.ship_to_state} onChange={e=>set('ship_to_state',e.target.value)}/></div>
                <div className="form-row"><label>Pincode</label><input value={form.ship_to_pincode} onChange={e=>set('ship_to_pincode',e.target.value)}/></div>
              </div>
            </div>
          )}
        </div>
      )}

      {isSO && (
        <div style={{marginBottom:14}}>
          <div className="section-title">Bill To ({cfg.name} — Buyer)</div>
          <div style={{background:cfg.light,border:`1px solid ${cfg.border}`,borderRadius:8,padding:'10px 14px',fontSize:12,color:cfg.primary}}>
            <strong>{cfg.name}</strong> · #1, 2nd Floor, Kamla Palace, Gurugram, Haryana - 122001 · GSTIN: {cfg.gstin}
          </div>
        </div>
      )}

      <div className="section-title">Line Items</div>
      <div style={{overflowX:'auto'}}>
        <table className="items-table">
          <thead><tr>
            <th style={{width:38}}>S.No</th><th style={{width:145}}>Product</th><th style={{width:165}}>Description</th>
            <th style={{width:50}}>HSN</th><th style={{width:55}}>Qty</th><th style={{width:80}}>Unit</th>
            <th style={{width:90}}>Rate ({form.currency})</th><th style={{width:100}}>Amount</th><th style={{width:32}}></th>
          </tr></thead>
          <tbody>{items.map((it,i) => {
            const p = products.find(x=>x.id===it.product_id);
            const amt=(parseFloat(it.qty)||0)*(parseFloat(it.rate)||0);
            return (<tr key={i}>
              <td><input type="number" value={it.serial_no} style={{width:44}} onChange={e => updateItem(i,'serial_no',e.target.value)}/></td>
              <td><select value={it.product_id} onChange={e => updateItem(i,'product_id',e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
              <td><input value={it.description||''} onChange={e => updateItem(i,'description',e.target.value)} placeholder="Part no. / details"/></td>
              <td><input value={it.hsn||p?.hsn||''} onChange={e => updateItem(i,'hsn',e.target.value)} placeholder={p?.hsn||'HSN'}/></td>
              <td><input type="number" value={it.qty} onChange={e => updateItem(i,'qty',e.target.value)}/></td>
              <td><select value={it.unit} onChange={e => updateItem(i,'unit',e.target.value)}>{['Piece','Pcs','Set','Kg','Gram','Metre','Box','Litre','Bag','Roll','Pair','Nos'].map(u=><option key={u}>{u}</option>)}</select></td>
              <td><input type="number" step="0.01" value={it.rate} onChange={e => updateItem(i,'rate',e.target.value)}/></td>
              <td className="bold">{fmtAmt(amt,form.currency)}</td>
              <td><button className="btn-x" onClick={() => setItems(items.filter((_,j)=>j!==i).map((x,idx)=>({...x,serial_no:idx+1})))}>×</button></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
      <button className="btn mt8 mb8" onClick={() => setItems([...items,{serial_no:items.length+1,product_id:products[0]?.id||'',description:products[0]?.name||'',hsn:products[0]?.hsn||'',qty:1,unit:products[0]?.unit||'Piece',rate:products[0]?.rate||0,currency:form.currency}])}>+ Add Line</button>

      <div className="totals-block">
        <div className="tot-row"><span>Subtotal (excl. GST)</span><span>{fmtAmt(subtotal,form.currency)}</span></div>
        <div className="tot-row"><span>GST (18%)</span><span>{fmtAmt(gstAmt,form.currency)}</span></div>
        <div className="tot-row grand"><span>Total</span><span>{fmtAmt(subtotal+gstAmt,form.currency)}</span></div>
      </div>

      <div className="section-title" style={{marginTop:14}}>Terms &amp; Conditions</div>
      <textarea rows={5} value={form.terms} onChange={e => set('terms',e.target.value)}
        style={{width:'100%',fontFamily:'inherit',fontSize:12,lineHeight:1.8,padding:'8px 10px',border:'1px solid #d1d5db',borderRadius:6,color:'#78350f',background:'#fffbeb'}}/>
      <button className="btn" style={{fontSize:11,marginTop:4}} onClick={() => set('terms',DEFAULT_TERMS)}>↺ Reset to Default</button>

      <div className="form-row mt8"><label>Additional Notes</label><textarea rows={2} value={form.notes} onChange={e => set('notes',e.target.value)}/></div>
      <div className="modal-footer">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Save {label}</button>
      </div>
    </Modal>
  );
}

// ── PAY FORM ──────────────────────────────────────────────────────────────────
function PayForm({ doc, clients, onClose }) {
  const items = doc?.items||[];
  const subtotal = items.reduce((s,it) => s+it.qty*it.rate,0);
  const balance = Math.round((subtotal*1.18-(doc?.paid||0))*100)/100;
  const [form, setForm] = useState({invoice_id:doc?.id||'',client_id:doc?.client_id||clients[0]?.id,amount:balance||'',currency:doc?.currency||'INR',mode:'Wire Transfer',date:today(),ref:'',note:''});
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  return (
    <Modal title="Record Payment" onClose={onClose}>
      <div className="form-grid2">
        <div className="form-row col-span2"><label>Client</label><select value={form.client_id} onChange={e => set('client_id',e.target.value)}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="form-row"><label>Amount</label><input type="number" step="0.01" value={form.amount} onChange={e => set('amount',e.target.value)}/></div>
        <div className="form-row"><label>Currency</label><select value={form.currency} onChange={e => set('currency',e.target.value)}>{api.CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="form-row"><label>Payment Mode</label>
          <select value={form.mode} onChange={e => set('mode',e.target.value)}>
            {['Wire Transfer','NEFT','RTGS','UPI','Cheque','Cash','IMPS','LC'].map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e => set('date',e.target.value)}/></div>
        <div className="form-row col-span2"><label>Reference / UTR</label><input value={form.ref} onChange={e => set('ref',e.target.value)} placeholder="NEFT20240320001"/></div>
        <div className="form-row col-span2"><label>Note</label><input value={form.note} onChange={e => set('note',e.target.value)}/></div>
      </div>
      <div className="modal-footer"><button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-success" onClick={async () => {await api.createPayment(form);onClose();}}>Record Payment</button>
      </div>
    </Modal>
  );
}

// ── DOC LIST ──────────────────────────────────────────────────────────────────
function DocList({ type, clients, products, showNew, onClearNew, brand }) {
  const [docs, setDocs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const load = useCallback(() => api.getDocuments(type, brand).then(setDocs).catch(()=>{}), [type, brand]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if(showNew){setShowForm(true);onClearNew&&onClearNew();} }, [showNew,onClearNew]);

  const label = api.FLOW_LABELS[type]||type;
  const nextType = api.FLOW_NEXT[type];
  const nextLabel = api.FLOW_NEXT_LABELS[type];
  const calcTotals = (items=[]) => { const sub=items.reduce((s,it)=>s+(it.qty||0)*(it.rate||0),0); return{total:sub*1.18}; };

  const q = search.toLowerCase().trim();
  const filtered = docs.filter(doc => {
    const cl = clients.find(c => c.id === doc.client_id);
    const matchSearch = !q || doc.id.toLowerCase().includes(q) || (cl?.name||'').toLowerCase().includes(q) || (doc.po_number||'').toLowerCase().includes(q) || (doc.so_number||'').toLowerCase().includes(q) || (doc.date||'').includes(q);
    const matchStatus = statusFilter==='All' || doc.status===statusFilter;
    const matchClient = clientFilter==='All' || doc.client_id===clientFilter;
    return matchSearch && matchStatus && matchClient;
  });
  const allStatuses = ['All',...new Set(docs.map(d=>d.status).filter(Boolean))];

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New {label}</button>
        <div style={{position:'relative',flex:1,minWidth:200,maxWidth:360}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none'}}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ID, client, PO/SO…`}
            style={{paddingLeft:34,width:'100%',height:36,borderRadius:8,border:'1px solid #d1d5db',fontSize:13}}/>
          {search && <button onClick={() => setSearch('')} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:18}}>×</button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,background:'#fff'}}>
          {allStatuses.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,background:'#fff',maxWidth:180}}>
          <option value="All">All Clients</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{fontSize:12,color:'#94a3b8'}}>{filtered.length} of {docs.length}</span>
      </div>

      <FlowBar current={type}/>
      <div style={{marginBottom:14}}/>

      <div className="card">
        {filtered.length===0 ? (
          <div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>
            <div style={{fontSize:32,marginBottom:8}}>{q?'🔍':'📋'}</div>
            <div style={{fontSize:14,fontWeight:600}}>{q?'No results found':`No ${label}s yet`}</div>
            <div style={{fontSize:12,marginTop:4}}>{q?'Try a different search term':`Click "+ New ${label}" to create your first one`}</div>
          </div>
        ) : (
          <table><thead><tr>
            <th>ID</th><th>Client</th><th>Date</th>
            {type==='invoice'&&<th>Due</th>}
            {(type==='purchase_order'||type==='sales_order'||type==='invoice')&&<th>PO/SO</th>}
            <th>Currency</th><th>Amount</th>
            {type==='invoice'&&<th>Paid</th>}
            <th>Status</th><th>PDF</th><th></th>
          </tr></thead>
          <tbody>{filtered.map(doc => {
            const cl=clients.find(c=>c.id===doc.client_id);
            const {total}=calcTotals(doc.items||[]);
            const currency=doc.currency||'INR';
            const idHighlight=q&&doc.id.toLowerCase().includes(q);
            return (<tr key={doc.id}>
              <td><code style={idHighlight?{background:'#fef3c7',borderColor:'#f59e0b',color:'#92400e'}:{}}>{doc.id}</code></td>
              <td><strong>{cl?.name||'—'}</strong></td>
              <td>{doc.date}</td>
              {type==='invoice'&&<td>{doc.due_date||'—'}</td>}
              {(type==='purchase_order'||type==='sales_order'||type==='invoice')&&<td><small className="muted">{[doc.po_number,doc.so_number].filter(Boolean).join('/')||'—'}</small></td>}
              <td><span className="badge badge-gray">{currency}</span></td>
              <td className="bold">{fmtAmt(total,currency)}</td>
              {type==='invoice'&&<td className="success">{fmtAmt(doc.paid||0,currency)}</td>}
              <td><Badge status={doc.status}/></td>
              <td><PDFButton docId={doc.id} brand={brand}/></td>
              <td>
                <div className="actions">
                  <button className="btn btn-sm" onClick={() => setViewDoc(doc)}>View</button>
                  {nextType&&doc.status!=='Converted'&&<button className="btn btn-sm btn-purple" onClick={async()=>{await api.convertDocument(doc.id,nextType);load();}}>→ {nextLabel}</button>}
                  {type==='invoice'&&doc.status!=='Paid'&&<button className="btn btn-sm btn-success" onClick={() => setPayModal(doc)}>Pay</button>}
                  {doc.status!=='Converted'&&<button className="btn btn-sm" style={{background:'#fee2e2',color:'#dc2626',border:'1px solid #fecaca'}} onClick={async()=>{if(window.confirm('Delete '+doc.id+'? This cannot be undone.')){{await api.deleteDocument(doc.id);load();}}}}>🗑</button>}
                </div>
              </td>
            </tr>);
          })}</tbody></table>
        )}
      </div>

      {showForm&&<DocForm type={type} clients={clients} products={products} brand={brand} onClose={() => setShowForm(false)} onSaved={(savedDoc) => {load();if(savedDoc&&savedDoc.id)setViewDoc(savedDoc);}}/>}
      {viewDoc&&<DualDocView doc={viewDoc} clients={clients} products={products} onClose={() => setViewDoc(null)} onRefresh={load} brand={brand}/>}
      {payModal&&<PayForm doc={payModal} clients={clients} onClose={() => {setPayModal(null);load();}}/>}
    </div>
  );
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
function Payments({ clients }) {
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState(false);
  const load = useCallback(() => api.getPayments().then(setPayments).catch(()=>{}), []);
  useEffect(() => { load(); }, [load]);
  const total = payments.reduce((s,p) => s+p.amount,0);
  return (
    <div>
      <div className="topbar-actions"><button className="btn btn-primary" onClick={() => setModal(true)}>+ Record Payment</button></div>
      <div className="grid3 mb16">
        <div className="metric"><div className="metric-label">Transactions</div><div className="metric-val">{payments.length}</div></div>
        <div className="metric"><div className="metric-label">Total Received</div><div className="metric-val green">{fmtAmt(total)}</div></div>
        <div className="metric"><div className="metric-label">This Month</div><div className="metric-val blue">{fmtAmt(payments.filter(p=>p.date?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,p)=>s+p.amount,0))}</div></div>
      </div>
      <div className="card">
        <table><thead><tr><th>ID</th><th>Invoice</th><th>Client</th><th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th></tr></thead>
        <tbody>{payments.map(p => {
          const cl=clients.find(c=>c.id===p.client_id);
          return (<tr key={p.id}><td><code>{p.id}</code></td><td><code>{p.invoice_id||'—'}</code></td><td>{cl?.name||'—'}</td><td>{p.date}</td><td className="success bold">{fmtAmt(p.amount,p.currency)}</td><td>{p.mode}</td><td><small className="muted">{p.ref}</small></td></tr>);
        })}</tbody></table>
      </div>
      {modal&&<PayForm clients={clients} onClose={() => {setModal(false);load();}}/>}
    </div>
  );
}

// ── REMINDERS ─────────────────────────────────────────────────────────────────
function Reminders({ clients, brand }) {
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({client_id:'',document_id:'',type:'quotation',channel:'whatsapp',message:''});
  const [ledgerData, setLedgerData] = useState([]);
  const [tab, setTab] = useState('reminders');
  const load = useCallback(() => { api.getReminders().then(setReminders).catch(()=>{}); api.getLedger().then(setLedgerData).catch(()=>{}); }, []);
  useEffect(() => { load(); }, [load]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const cfg = BRAND_CONFIG[brand];

  const openModal = (cl=null) => {
    const lc = cl ? ledgerData.find(l=>l.id===cl.id) : null;
    const dueStr = lc&&lc.due>0.01?`\nOutstanding: ${fmtAmt(lc.due)}`:'';
    setForm({client_id:cl?.id||'',document_id:'',type:'quotation',channel:'whatsapp',
      message:cl?`Dear ${cl.name},\n\nThis is a reminder from ${cfg.name}.\nGSTIN: ${cfg.gstin}${dueStr}\n\nKindly revert at your earliest.\n\nBest Regards,\n${cfg.name}`:''});
    setModal(true);
  };

  const sendReminder = async () => {
    const cl = clients.find(c=>c.id===form.client_id);
    if(!cl)return;
    if(form.channel==='whatsapp'){const phone=(cl.phone||'').replace(/\D/g,'');window.open(`https://wa.me/${phone.startsWith('91')?phone:'91'+phone}?text=${encodeURIComponent(form.message)}`,'_blank');}
    if(form.channel==='email'){window.open(`mailto:${cl.email}?subject=${encodeURIComponent('Reminder - '+cfg.name)}&body=${encodeURIComponent(form.message)}`,'_blank');}
    if(form.channel==='sms'){window.open(`sms:${cl.phone}?body=${encodeURIComponent(form.message)}`,'_blank');}
    await api.createReminder(form);
    setModal(false); load();
  };

  const selectedClient = clients.find(c=>c.id===form.client_id);
  const ledgerClient = ledgerData.find(l=>l.id===form.client_id);
  const totalDue = ledgerData.reduce((s,cl)=>s+(cl.due>0?cl.due:0),0);

  return (
    <div>
      <div style={{display:'flex',gap:0,marginBottom:16,background:'#f1f5f9',borderRadius:10,padding:4,width:'fit-content'}}>
        {[['reminders','📨 Reminders'],['ledger','💰 Paid & Due Ledger']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{padding:'8px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:tab===key?700:400,background:tab===key?'#fff':'transparent',color:tab===key?'#0f172a':'#64748b',boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.1)':'none',fontSize:13,fontFamily:'inherit'}}>{label}</button>
        ))}
      </div>

      {tab==='ledger'&&(
        <div>
          <div className="grid4 mb16">
            <div className="metric"><div className="metric-label">Total Invoiced</div><div className="metric-val blue">{fmtAmt(ledgerData.reduce((s,l)=>s+l.totalInvoiced,0))}</div></div>
            <div className="metric"><div className="metric-label">Total Received</div><div className="metric-val green">{fmtAmt(ledgerData.reduce((s,l)=>s+l.totalPaid,0))}</div></div>
            <div className="metric"><div className="metric-label">Outstanding</div><div className="metric-val amber">{fmtAmt(totalDue)}</div></div>
            <div className="metric"><div className="metric-label">Overdue Clients</div><div className="metric-val red">{ledgerData.filter(l=>l.overdueCount>0).length}</div></div>
          </div>
          <div className="card">
            <table><thead><tr><th>Client</th><th>Phone</th><th style={{textAlign:'right'}}>Invoiced</th><th style={{textAlign:'right'}}>Paid</th><th style={{textAlign:'right'}}>Outstanding</th><th></th></tr></thead>
            <tbody>{ledgerData.map(cl=>(
              <tr key={cl.id}>
                <td><strong>{cl.name}</strong></td>
                <td>{cl.phone||'—'}</td>
                <td style={{textAlign:'right',fontWeight:600}}>{fmtAmt(cl.totalInvoiced)}</td>
                <td style={{textAlign:'right',fontWeight:600,color:'#15803d'}}>{fmtAmt(cl.totalPaid)}</td>
                <td style={{textAlign:'right'}}><span style={{fontWeight:700,color:cl.due>0.01?'#dc2626':'#15803d'}}>{cl.due>0.01?fmtAmt(cl.due):'✓ Cleared'}</span></td>
                <td><button className="btn btn-sm btn-primary" onClick={()=>openModal(cl)}>📨 Remind</button></td>
              </tr>
            ))}</tbody></table>
          </div>
        </div>
      )}

      {tab==='reminders'&&(
        <div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button className="btn btn-primary" onClick={()=>openModal()}>+ Send Reminder</button>
          </div>
          <div className="card">
            {reminders.length===0?<div style={{padding:40,textAlign:'center',color:'#94a3b8'}}><div style={{fontSize:32,marginBottom:8}}>📨</div><div>No reminders sent yet</div></div>:(
              <table><thead><tr><th>Client</th><th>Channel</th><th>Type</th><th>Sent At</th><th>Status</th><th></th></tr></thead>
              <tbody>{reminders.map(r=>(
                <tr key={r.id}>
                  <td><strong>{r.client_name||'—'}</strong></td>
                  <td><span className="badge badge-success">{r.channel}</span></td>
                  <td style={{fontSize:12}}>{(r.type||'').replace('_',' ')}</td>
                  <td style={{fontSize:12,color:'#64748b'}}>{r.sent_at?new Date(r.sent_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—'}</td>
                  <td><span className="badge badge-success">{r.status}</span></td>
                  <td><button className="btn-x" style={{fontSize:16}} onClick={async()=>{await api.deleteReminder(r.id);load();}}>🗑</button></td>
                </tr>
              ))}</tbody></table>
            )}
          </div>
        </div>
      )}

      {modal&&(
        <Modal title="Send Reminder" onClose={() => setModal(false)} wide>
          <div className="form-grid2">
            <div className="form-row col-span2"><label>Client *</label>
              <select value={form.client_id} onChange={e => {
                set('client_id',e.target.value);
                const cl=clients.find(c=>c.id===e.target.value);
                const lc=ledgerData.find(l=>l.id===e.target.value);
                if(cl) set('message',`Dear ${cl.name},\n\nThis is a reminder from ${cfg.name}.\n${lc&&lc.due>0.01?'Outstanding: '+fmtAmt(lc.due)+'\n':''}\nKindly revert at your earliest.\n\nBest Regards,\n${cfg.name}\nGSTIN: ${cfg.gstin}`);
              }}>
                <option value="">— Select Client —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name} {c.phone?`(${c.phone})`:''}</option>)}
              </select>
            </div>
            {selectedClient&&ledgerClient&&(
              <div className="col-span2" style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:13,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div><div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>Phone</div><strong>{selectedClient.phone||'—'}</strong></div>
                <div><div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>Email</div><strong>{selectedClient.email||'—'}</strong></div>
                <div><div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>Outstanding</div><strong style={{color:ledgerClient.due>0?'#dc2626':'#15803d'}}>{ledgerClient.due>0.01?fmtAmt(ledgerClient.due):'✓ Cleared'}</strong></div>
              </div>
            )}
            <div className="form-row"><label>Channel</label>
              <select value={form.channel} onChange={e => set('channel',e.target.value)}>
                <option value="whatsapp">💬 WhatsApp</option><option value="email">📧 Email</option><option value="sms">📱 SMS</option>
              </select>
            </div>
            <div className="form-row"><label>Type</label>
              <select value={form.type} onChange={e => set('type',e.target.value)}>
                {['quotation','invoice','overdue','proforma','purchase_order','general'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-row col-span2"><label>Message</label><textarea rows={7} value={form.message} onChange={e => set('message',e.target.value)} style={{fontFamily:'inherit',lineHeight:1.7}}/></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.client_id||!form.message} onClick={sendReminder} style={{opacity:(!form.client_id||!form.message)?0.5:1}}>
              {form.channel==='whatsapp'?'💬 WhatsApp':form.channel==='email'?'📧 Email':'📱 SMS'} &amp; Log
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── APP SHELL ─────────────────────────────────────────────────────────────────
const NAV = [
  {section:'Overview',items:[{key:'dashboard',label:'Dashboard',icon:'◼'}]},
  {section:'Masters',items:[{key:'clients',label:'Clients',icon:'👤'},{key:'products',label:'Products',icon:'📦'},{key:'inventory',label:'Inventory',icon:'📊'}]},
  {section:'Billing Flow',items:[
    {key:'quotations',label:'Quotations',icon:'💬'},
    {key:'proforma',label:'Proforma Invoices',icon:'📋'},
    {key:'purchase_orders',label:'Purchase Orders',icon:'📥'},
    {key:'sales_orders',label:'Sales Orders',icon:'🛒'},
    {key:'invoices',label:'Tax Invoices',icon:'🧾'},
  ]},
  {section:'Finance',items:[{key:'payments',label:'Payments',icon:'💰'},{key:'reminders',label:'Reminders & Ledger',icon:'📨'}]},
];
const PAGE_TITLES = {dashboard:'Dashboard',clients:'Clients',products:'Products',inventory:'Inventory',quotations:'Quotations',proforma:'Proforma Invoices',purchase_orders:'Purchase Orders',sales_orders:'Sales Orders',invoices:'Tax Invoices',payments:'Payments & Ledger',reminders:'Reminders & Ledger'};
const PAGE_DOC_TYPE = {quotations:'quotation',proforma:'proforma',purchase_orders:'purchase_order',sales_orders:'sales_order',invoices:'invoice'};

export default function App() {
  const [brand, setBrand] = useState(null); // null = selection screen
  const [page, setPage] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  const loadMasters = useCallback(() => {
    if (!brand) return;
    api.getClients(brand).then(setClients).catch(()=>{});
    api.getProducts(brand).then(setProducts).catch(()=>{});
  }, [brand]);

  useEffect(() => { loadMasters(); }, [loadMasters]);
  useEffect(() => { if(brand && (page==='clients'||page==='products')) loadMasters(); }, [page, brand, loadMasters]);

  // Show brand selection screen
  if (!brand) {
    return <BrandSelect onSelect={(b) => { setBrand(b); setPage('dashboard'); }} />;
  }

  const cfg = BRAND_CONFIG[brand];
  const navTo = (p) => setPage(p);
  const docType = PAGE_DOC_TYPE[page];

  return (
    <div className="erp">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-brand-row">
            <img src={cfg.logo} alt={cfg.name} style={{width:36,height:36,objectFit:'contain',borderRadius:6,background:'#fff',padding:3,flexShrink:0}}/>
            <div style={{color: brand==='india' ? '#4ade80' : '#60a5fa', fontWeight:800, fontSize:14}}>{cfg.name}</div>
          </div>
          <div style={{fontSize:9,color:'#475569',marginTop:4,fontFamily:'monospace',lineHeight:1.5}}>
            {cfg.gstin}
          </div>
          {/* Switch brand button */}
          <button onClick={() => { setBrand(null); setPage('dashboard'); setClients([]); setProducts([]); }}
            style={{marginTop:10,width:'100%',padding:'6px 0',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,color:'#94a3b8',fontSize:11,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}>
            ⇄ Switch Brand
          </button>
        </div>
        {NAV.map(sec => (
          <div key={sec.section}>
            <div className="nav-section">{sec.section}</div>
            {sec.items.map(item => (
              <div key={item.key} className={`nav-item ${page===item.key?'active':''}`} onClick={() => navTo(item.key)}>
                <span className="nav-icon">{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
        ))}
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <div className={`brand-tab ${cfg.tabClass}`}>
              <img src={cfg.logo} alt={cfg.name} style={{width:20,height:20,objectFit:'contain'}}/>
              {cfg.name}
            </div>
            <div className="topbar-title">{PAGE_TITLES[page]||page}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <GlobalSearch onNav={navTo} brand={brand}/>
            <div style={{fontSize:10,color:'#6b7280',fontFamily:'monospace'}}>
              {cfg.gstin}
            </div>
          </div>
        </div>
        <div className="content">
          {page==='dashboard'&&<Dashboard onNav={navTo} brand={brand}/>}
          {page==='clients'&&<Clients onDataChange={loadMasters} brand={brand}/>}
          {page==='products'&&<Products onDataChange={loadMasters} brand={brand}/>}
          {page==='inventory'&&<Inventory brand={brand}/>}
          {docType&&<DocList key={page+brand} type={docType} clients={clients} products={products} brand={brand} showNew={false} onClearNew={()=>{}}/>}
          {page==='payments'&&<Payments clients={clients}/>}
          {page==='reminders'&&<Reminders clients={clients} brand={brand}/>}
        </div>
      </div>
    </div>
  );
}
