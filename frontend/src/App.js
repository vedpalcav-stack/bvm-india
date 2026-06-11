import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import * as api from './utils/api'; 
import DualDocView from './DualDocView';
import bvmIndiaLogo from './assets/bvm-india.png';
import bvmWorldLogo from './assets/bvm-world.jpg';

const today = () => new Date().toISOString().split('T')[0];
const futureDate = (d) => new Date(Date.now() + d * 86400000).toISOString().split('T')[0];

const DEFAULT_TERMS = `Freight Forwarder: Will be confirmed at the time of pickup.

1. Payment Terms: As per BVM terms and conditions.
2. Delivery: Immediate, subject to stock availability.
3. Warranty: Standard warranty as provided by the OEM.
4. Taxes: GST extra as applicable.
5. Validity: This quotation is valid for 30 days from the date of issue.
6. Freight: Extra at actuals unless otherwise specified.
7. Installation & Commissioning: Not included unless specifically mentioned in the quotation.
8. Force Majeure: Delivery schedules are subject to circumstances beyond our reasonable control.

For BVM INDIA
Authorized Signatory`;
const BRAND_CONFIG = {
  india: {
    name: 'BVM INDIA',
    fullName: 'BVM INDIA',
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
    fullName: 'BVM WORLD PVT LTD',
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


// ── DEPARTMENT ACCESS CONTROL ─────────────────────────────────────────────────
const DEPARTMENTS = {
  admin: {
    label: 'Admin',
    password: 'admin@bvm2024',
    icon: '🔑',
    access: ['dashboard','clients','products','inventory','quotations','proforma','purchase_orders','sales_orders','invoices','payments','reminders'],
  },
  sales: {
    label: 'Sales',
    password: 'sales@bvm2024',
    icon: '🛒',
    access: ['dashboard','clients','quotations','proforma','purchase_orders','sales_orders'],
  },
  accounts: {
    label: 'Accounts',
    password: 'accounts@bvm2024',
    icon: '💰',
    access: ['dashboard','invoices','payments','reminders','clients'],
  },
  inventory: {
    label: 'Inventory',
    password: 'inventory@bvm2024',
    icon: '📦',
    access: ['dashboard','products','inventory'],
  },
};

// ── DEPARTMENT LOGIN SCREEN ───────────────────────────────────────────────────
function DepartmentLogin({ brand, onLogin, onBack }) {
  const cfg = BRAND_CONFIG[brand];
  const [dept, setDept] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const d = DEPARTMENTS[dept];
    if (password === d.password) {
      setError('');
      onLogin(dept);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0c1220', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${brand==='india'?'rgba(74,222,128,0.3)':'rgba(96,165,250,0.3)'}`, borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:420 }}>
        {/* Brand logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <div style={{ width:64, height:64, background:'#fff', borderRadius:14, padding:8, marginBottom:12 }}>
            <img src={cfg.logo} alt={cfg.name} style={{ width:48, height:48, objectFit:'contain' }} />
          </div>
          <div style={{ fontSize:20, fontWeight:800, color: brand==='india'?'#4ade80':'#60a5fa' }}>{cfg.name}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Department Login</div>
        </div>

        {/* Department dropdown */}
        <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Select Department</label>
        <select value={dept} onChange={e => { setDept(e.target.value); setError(''); }}
          style={{ width:'100%', padding:'11px 14px', marginTop:6, marginBottom:18, borderRadius:9, border:'1px solid #334155', background:'#1e293b', color:'#fff', fontSize:14, fontFamily:'inherit', cursor:'pointer' }}>
          {Object.keys(DEPARTMENTS).map(k => (
            <option key={k} value={k}>{DEPARTMENTS[k].icon} {DEPARTMENTS[k].label}</option>
          ))}
        </select>

        {/* Password */}
        <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Password</label>
        <input type="password" value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Enter department password"
          style={{ width:'100%', padding:'11px 14px', marginTop:6, borderRadius:9, border:`1px solid ${error?'#dc2626':'#334155'}`, background:'#1e293b', color:'#fff', fontSize:14, fontFamily:'inherit' }} />

        {error && <div style={{ color:'#f87171', fontSize:12, marginTop:8 }}>⚠ {error}</div>}

        {/* Login button */}
        <button onClick={handleLogin}
          style={{ width:'100%', marginTop:20, padding:'12px 0', borderRadius:9, border:'none', background: brand==='india'?'#166534':'#1e3a5f', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Login →
        </button>

        {/* Back button */}
        <button onClick={onBack}
          style={{ width:'100%', marginTop:10, padding:'10px 0', borderRadius:9, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'#94a3b8', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          ⇄ Back to Brand Selection
        </button>
      </div>

      <div style={{ marginTop:24, fontSize:11, color:'#334155', textAlign:'center', maxWidth:420 }}>
        Each department has access only to its own areas. Contact your administrator for password help.
      </div>
    </div>
  );
}

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
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Pvt Ltd</div>
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
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{brand === 'world' ? 'Pvt Ltd' : ''}</div>
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

  const duplicate = clients.find(
    c =>
      c.id !== form.id &&
      c.name?.trim().toLowerCase() ===
      form.name?.trim().toLowerCase()
  );

  if (duplicate) {
    alert("Client already exists!");
    return;
  }

  if (modal === 'add') {
    await api.createClient({
      ...form,
      brand
    });
  } else {
    await api.updateClient(form.id, form);
  }

  setModal(null);
  load();

  if (onDataChange) {
    onDataChange();
  }
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
  const [form, setForm] = useState({
    gst: 18,
    unit: "Piece"
  });
  const [search, setSearch] = useState("");

  const load = useCallback(
    () => api.getProducts(brand).then(setProducts),
    [brand]
  );

  useEffect(() => {
    load();
  }, [load]);

  const set = (k, v) =>
    setForm(f => ({
      ...f,
      [k]: v
    }));

  const save = async () => {
    const duplicate = products.find(
      p =>
        p.id !== form.id &&
        (
          p.name?.trim().toLowerCase() ===
            form.name?.trim().toLowerCase() ||
          p.model_no?.trim().toLowerCase() ===
            form.model_no?.trim().toLowerCase()
        )
    );

    if (duplicate) {
      alert("Duplicate Entry! Make or Model already exists.");
      return;
    }

    try {
      if (modal === "add") {
        await api.createProduct({
          ...form,
          brand
        });
      } else {
        await api.updateProduct(form.id, form);
      }

      await load();

      setModal(null);

      if (onDataChange) {
        onDataChange();
      }

      alert("Saved Successfully");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="topbar-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm({
              gst: 18,
              unit: "Piece"
            });
            setModal("add");
          }}
        >
          + Add Make / Model
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search Make or Model"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "350px",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "8px"
          }}
        />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Make</th>
              <th>Model</th>
              <th>Rate</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {products
              .filter(
                p =>
                  (p.name || "")
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                  (p.model_no || "")
                    .toLowerCase()
                    .includes(search.toLowerCase())
              )
              .map(p => (
                <tr
                  key={p.id}
                  style={{
                    backgroundColor:
                      search &&
                      (
                        (p.name || "")
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        (p.model_no || "")
                          .toLowerCase()
                          .includes(search.toLowerCase())
                      )
                        ? "#fff3cd"
                        : ""
                  }}
                >
                  <td>{p.model_no}</td>
                  <td>{p.name}</td>
                  <td>{fmtAmt(p.rate)}</td>

                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        setForm(p);
                        setModal("edit");
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={
            modal === "add"
              ? "Add Make / Model"
              : "Edit Make / Model"
          }
          onClose={() => setModal(null)}
        >
          <div className="form-grid2">
            <div className="form-row">
              <label>Make</label>
              <input
                value={form.model_no || ""}
                onChange={e =>
                  set("model_no", e.target.value)
                }
              />
            </div>

            <div className="form-row">
              <label>Model</label>
              <input
                value={form.name || ""}
                onChange={e =>
                  set("name", e.target.value)
                }
              />
            </div>

            <div className="form-row">
              <label>Rate</label>
              <input
                type="number"
                value={form.rate || ""}
                onChange={e =>
                  set("rate", e.target.value)
                }
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn"
              onClick={() => setModal(null)}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={save}
            >
              Save
            </button>
          </div>
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

  const [form, setForm] = useState({
    product_id: "",
    warehouse: "",
    unit: "Piece",
    rate: "",
    qty: "",
    type: "add"
  });

  const load = useCallback(async () => {
    try {
      const [inv, prods] = await Promise.all([
        api.getInventory(),
        api.getProducts(brand)
      ]);

      setInventory(inv || []);
      setProducts(prods || []);
    } catch (err) {
      console.error(err);
    }
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="topbar-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm({
              product_id: products[0]?.id || "",
              warehouse: "",
              unit: "Piece",
              rate: "",
              qty: "",
              type: "add"
            });

            setModal(true);
          }}
        >
          Update Stock
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Make</th>
              <th>Model</th>
              <th>Warehouse</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Stock</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((inv, index) => {
              const stock = Number(inv.stock || 0);
              const rate = Number(inv.rate || 0);

              return (
                <tr key={inv.id}>
                  <td>{index + 1}</td>

                  <td>{inv.model_no || "-"}</td>

                  <td>{inv.product_name || "-"}</td>

                  <td>
                    <input
                      value={inv.warehouse || ""}
                      onChange={async e => {
                        const warehouse = e.target.value;

                        setInventory(prev =>
                          prev.map(row =>
                            row.id === inv.id
                              ? { ...row, warehouse }
                              : row
                          )
                        );

                        try {
                          await api.updateInventoryWarehouse(
                            inv.id,
                            warehouse
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    />
                  </td>

                  <td>{inv.unit || "Piece"}</td>

                  <td>₹{rate.toFixed(2)}</td>

                  <td>{stock}</td>

                  <td>₹{(stock * rate).toFixed(2)}</td>

                  <td>
                    <span
                      className={
                        stock <= 0
                          ? "badge badge-danger"
                          : "badge badge-success"
                      }
                    >
                      {stock <= 0
                        ? "Out of Stock"
                        : "In Stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title="Update Stock"
          onClose={() => setModal(false)}
        >
          <div className="form-grid2">

            <div className="form-row col-span2">
              <label>Make / Model</label>

              <select
                value={form.product_id}
                onChange={e =>
                  setForm({
                    ...form,
                    product_id: e.target.value
                  })
                }
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.model_no} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row col-span2">
              <label>Warehouse</label>

              <input
                value={form.warehouse}
                onChange={e =>
                  setForm({
                    ...form,
                    warehouse: e.target.value
                  })
                }
              />
            </div>

            <div className="form-row">
              <label>Unit</label>

              <select
                value={form.unit}
                onChange={e =>
                  setForm({
                    ...form,
                    unit: e.target.value
                  })
                }
              >
                <option>Piece</option>
                <option>Nos</option>
                <option>Box</option>
                <option>Set</option>
                <option>Kg</option>
                <option>Litre</option>
              </select>
            </div>

            <div className="form-row">
              <label>Rate</label>

              <input
                type="number"
                value={form.rate}
                onChange={e =>
                  setForm({
                    ...form,
                    rate: e.target.value
                  })
                }
              />
            </div>

            <div className="form-row">
              <label>Transaction</label>

              <select
                value={form.type}
                onChange={e =>
                  setForm({
                    ...form,
                    type: e.target.value
                  })
                }
              >
                <option value="add">Add Stock</option>
                <option value="sub">Remove Stock</option>
              </select>
            </div>

            <div className="form-row">
              <label>Quantity</label>

              <input
                type="number"
                value={form.qty}
                onChange={e =>
                  setForm({
                    ...form,
                    qty: e.target.value
                  })
                }
              />
            </div>

          </div>

          <div className="modal-footer">
            <button
              className="btn"
              onClick={() => setModal(false)}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  const duplicate = inventory.find(
                    i =>
                      i.product_id === form.product_id &&
                      i.warehouse?.toLowerCase() ===
                        form.warehouse?.toLowerCase()
                  );

                  if (
                    duplicate &&
                    form.type === "add"
                  ) {
                    alert(
                      "Warehouse already exists for this product"
                    );
                    return;
                  }

                  await api.updateStock({
                    product_id: form.product_id,
                    qty: Number(form.qty),
                    type: form.type,
                    warehouse: form.warehouse,
                    unit: form.unit,
                    rate: Number(form.rate)
                  });

                  setModal(false);
                  await load();
                } catch (err) {
                  alert(err.message);
                }
              }}
            >
              Update Stock
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}// ── DOC LIST ──────────────────────────────────────────────────────────────────
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
            {type==='invoice'&&<th>Due Date</th>}
            {(type==='purchase_order'||type==='sales_order')&&<th>ETA</th>}
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
              {(type==='purchase_order'||type==='sales_order')&&<td>{doc.due_date||'—'}</td>}
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
  const [invoices, setInvoices] = useState([]);
  const [modal, setModal] = useState(false);
  const load = useCallback(() => {
    api.getPayments().then(setPayments).catch(()=>{});
    api.getDocuments('invoice').then(setInvoices).catch(()=>{});
  }, []);
  useEffect(() => { load(); }, [load]);
  // FIX 7: Correct total sum using parseFloat
  const total = payments.reduce((s,p) => s + parseFloat(p.amount||0), 0);
  const thisMonth = payments.filter(p=>p.date?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,p)=>s+parseFloat(p.amount||0),0);
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:14,justifyContent:'flex-end'}}>
        <button className="btn" onClick={load}>↺ Refresh</button>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Record Payment</button>
      </div>
      <div className="grid3 mb16">
        <div className="metric"><div className="metric-label">Transactions</div><div className="metric-val">{payments.length}</div></div>
        <div className="metric"><div className="metric-label">Total Received</div><div className="metric-val green">{fmtAmt(total)}</div></div>
        <div className="metric"><div className="metric-label">This Month</div><div className="metric-val blue">{fmtAmt(thisMonth)}</div></div>
      </div>
      <div className="card">
        <table>
          <thead><tr>
            <th>Invoice</th><th>Client</th><th>Date</th>
            <th style={{textAlign:'right'}}>Paid Amount</th>
            <th style={{textAlign:'right'}}>Due Balance</th>
            <th>Reference</th><th></th>
          </tr></thead>
          <tbody>{payments.map(p => {
            const cl = clients.find(c=>c.id===p.client_id);
            const inv = invoices.find(i=>i.id===p.invoice_id);
            const invItems = inv?.items||[];
            const invTotal = invItems.reduce((s,it)=>s+(parseFloat(it.qty)||0)*(parseFloat(it.rate)||0),0)*1.18;
            const paidAmt = parseFloat(p.amount||0);
            const dueBalance = inv ? Math.max(0, invTotal - parseFloat(inv.paid||0)) : null;
            return (
              <tr key={p.id}>
                <td><code>{p.invoice_id||'—'}</code></td>
                <td><strong>{cl?.name||'—'}</strong></td>
                <td style={{fontSize:12}}>{p.date}</td>
                <td style={{textAlign:'right'}} className="success bold">{fmtAmt(paidAmt,p.currency)}</td>
                <td style={{textAlign:'right'}}>
                  {dueBalance !== null
                    ? <span style={{fontWeight:700,color:dueBalance>0?'#dc2626':'#15803d'}}>{dueBalance>0?fmtAmt(dueBalance,p.currency):'✓ Cleared'}</span>
                    : <span className="muted">—</span>}
                </td>
                <td><small className="muted">{p.ref||'—'}</small></td>
                <td>
                  <button className="btn-x" style={{fontSize:15}} onClick={async()=>{
                    if(window.confirm('Delete this payment record?')) {
                      await api.deletePayment(p.id);
                      load();
                    }
                  }}>🗑</button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      {modal&&<PayForm clients={clients} onClose={() => {setModal(false);load();}}/>}
    </div>
  );
}

// ── REMINDERS ─────────────────────────────────────────────────────────────────
function Reminders({ clients, brand }) {
  const [tab, setTab] = useState('due');
  const [reminders, setReminders] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const [creditDays, setCreditDays] = useState(30);
  const [editCredit, setEditCredit] = useState(false);
  const [tempCredit, setTempCredit] = useState(30);
  const [modal, setModal] = useState(false);
  const [addDueModal, setAddDueModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({ client_id:'', document_id:'', type:'quotation', channel:'whatsapp', message:'' });
  const [dueForm, setDueForm] = useState({ invoice_id:'', channel:'whatsapp' });
  const [ledgerData, setLedgerData] = useState([]);
  const cfg = BRAND_CONFIG[brand];

  const load = useCallback(async () => {
    api.getReminders().then(setReminders).catch(() => {});
    api.getDueReminders(brand).then(setDueReminders).catch(() => {});
    api.getCreditSettings(brand).then(r => { setCreditDays(r.credit_days); setTempCredit(r.credit_days); }).catch(() => {});
    api.getLedger().then(setLedgerData).catch(() => {});
    api.getDocuments('invoice', brand).then(setInvoices).catch(() => {});
  }, [brand]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Save credit period
  const saveCreditDays = async () => {
    await api.updateCreditSettings({ brand, credit_days: tempCredit });
    setCreditDays(tempCredit);
    setEditCredit(false);
    load();
  };

  // Add invoice to due reminder tracker
  const addToTracker = async () => {
    const inv = invoices.find(i => i.id === dueForm.invoice_id);
    if (!inv) return;
    const invDate = inv.date;
    const dueDate = new Date(new Date(invDate).getTime() + creditDays * 86400000).toISOString().split('T')[0];
    await api.createDueReminder({
      invoice_id: inv.id,
      client_id: inv.client_id,
      invoice_date: invDate,
      due_date: dueDate,
      credit_days: creditDays,
      channel: dueForm.channel,
      brand,
    });
    setAddDueModal(false);
    load();
  };

  // Send reminder 1 (on invoice date)
  const handleReminder1 = async (dr) => {
    const cl = clients.find(c => c.id === dr.client_id);
    if (!cl) return;
    const msg = `Dear ${cl.name},\n\nThis is your first payment reminder from ${cfg.name}.\n\nInvoice: ${dr.invoice_id}\nInvoice Date: ${dr.invoice_date}\nDue Date: ${dr.due_date}\nBalance Due: ${dr.balance > 0 ? 'INR ' + dr.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'Cleared'}\n\nKindly arrange payment at your earliest convenience.\n\nBest Regards,\n${cfg.name}\nGSTIN: ${cfg.gstin}`;
    const phone1 = (cl.phone || '').replace(/\D/g, '');
    const waPhone1 = phone1.startsWith('91') ? phone1 : '91' + phone1;
    if (dr.channel === 'whatsapp' || dr.channel === 'sms') {
      window.open(`https://wa.me/${waPhone1}?text=${encodeURIComponent(msg)}`, '_blank');
    } else if (dr.channel === 'email') {
      window.open(`mailto:${cl.email}?subject=${encodeURIComponent('Payment Reminder - ' + dr.invoice_id)}&body=${encodeURIComponent(msg)}`, '_blank');
    }
    await api.sendReminder1(dr.id);
    load();
  };

  // Send reminder 2 (after credit period)
  const handleReminder2 = async (dr) => {
    const cl = clients.find(c => c.id === dr.client_id);
    if (!cl) return;
    const msg = `Dear ${cl.name},\n\nThis is your SECOND payment reminder from ${cfg.name}.\n\nYour credit period of ${dr.credit_days} days has ended.\n\nInvoice: ${dr.invoice_id}\nInvoice Date: ${dr.invoice_date}\nDue Date: ${dr.due_date}\nBalance Due: ${dr.balance > 0 ? 'INR ' + dr.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'Cleared'}\n\nKindly clear the outstanding immediately to avoid any inconvenience.\n\nBest Regards,\n${cfg.name}\nGSTIN: ${cfg.gstin}`;
    const phone2 = (cl.phone || '').replace(/\D/g, '');
    const waPhone2 = phone2.startsWith('91') ? phone2 : '91' + phone2;
    if (dr.channel === 'whatsapp' || dr.channel === 'sms') {
      window.open(`https://wa.me/${waPhone2}?text=${encodeURIComponent(msg)}`, '_blank');
    } else if (dr.channel === 'email') {
      window.open(`mailto:${cl.email}?subject=${encodeURIComponent('URGENT: Payment Reminder - ' + dr.invoice_id)}&body=${encodeURIComponent(msg)}`, '_blank');
    }
    await api.sendReminder2(dr.id);
    load();
  };

  const openManualModal = (cl = null) => {
    const lc = cl ? ledgerData.find(l => l.id === cl.id) : null;
    const dueStr = lc && lc.due > 0.01 ? `\nOutstanding: INR ${lc.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '';
    setForm({
      client_id: cl?.id || '', document_id: '', type: 'quotation', channel: 'whatsapp',
      message: cl ? `Dear ${cl.name},\n\nThis is a reminder from ${cfg.name}.\nGSTIN: ${cfg.gstin}${dueStr}\n\nKindly revert at your earliest.\n\nBest Regards,\n${cfg.name}` : ''
    });
    setModal(true);
  };

  const sendManualReminder = async () => {
    const cl = clients.find(c => c.id === form.client_id);
    if (!cl) return;
    if (form.channel === 'whatsapp') { const phone = (cl.phone || '').replace(/\D/g, ''); window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(form.message)}`, '_blank'); }
    if (form.channel === 'email') { window.open(`mailto:${cl.email}?subject=${encodeURIComponent('Reminder - ' + cfg.name)}&body=${encodeURIComponent(form.message)}`, '_blank'); }
    if (form.channel === 'sms') {
      const phone = (cl.phone || '').replace(/\D/g, '');
      const smsPhone = phone.startsWith('91') ? phone : '91' + phone;
      // Try WhatsApp as SMS alternative (works on all devices)
      window.open(`https://wa.me/${smsPhone}?text=${encodeURIComponent(form.message)}`, '_blank');
    }
    await api.createReminder(form);
    setModal(false);
    load();
  };

  const today = new Date().toISOString().split('T')[0];

  // Status badge for due reminders
  const statusBadge = (dr) => {
    if (dr.balance <= 0) return <span className="badge badge-success">✅ Paid</span>;
    if (dr.reminder2_sent) return <span className="badge badge-purple">R2 Sent</span>;
    if (dr.reminder1_sent) return <span className="badge badge-info">R1 Sent</span>;
    if (today > dr.due_date) return <span className="badge badge-danger">⚠ Overdue</span>;
    if (today === dr.invoice_date) return <span className="badge badge-warning">Due Today</span>;
    return <span className="badge badge-gray">Pending</span>;
  };

  // Is reminder 1 due? (invoice date has passed or is today)
  const isR1Due = (dr) => today >= dr.invoice_date && !dr.reminder1_sent && dr.balance > 0;
  // Is reminder 2 due? (credit period has ended)
  const isR2Due = (dr) => today > dr.due_date && !dr.reminder2_sent && dr.balance > 0;

  const pendingCount = dueReminders.filter(dr => isR1Due(dr) || isR2Due(dr)).length;

  return (
    <div>
      {/* Tab Switcher */}
      <div style={{ display:'flex', gap:0, marginBottom:16, background:'#f1f5f9', borderRadius:10, padding:4, width:'fit-content' }}>
        {[
          ['due', `📅 Due Date Reminders${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
          ['manual', '📨 Manual Reminders'],
          ['ledger', '💰 Paid & Due Ledger'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
            fontWeight: tab===key ? 700 : 400,
            background: tab===key ? '#fff' : 'transparent',
            color: tab===key ? '#0f172a' : '#64748b',
            boxShadow: tab===key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            fontSize:13, fontFamily:'inherit', whiteSpace:'nowrap',
          }}>{label}</button>
        ))}
      </div>

      {/* ── DUE DATE REMINDERS TAB ── */}
      {tab === 'due' && (
        <div>
          {/* Credit Period Settings */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>⚙️ Credit Period:</div>
            {editCredit ? (
              <>
                <input type="number" value={tempCredit} onChange={e => setTempCredit(+e.target.value)}
                  style={{ width:80, padding:'6px 10px', border:'1px solid #d1d5db', borderRadius:7, fontSize:13, fontFamily:'inherit' }} />
                <span style={{ fontSize:13, color:'#64748b' }}>days</span>
                <button className="btn btn-success btn-sm" onClick={saveCreditDays}>✓ Save</button>
                <button className="btn btn-sm" onClick={() => setEditCredit(false)}>Cancel</button>
              </>
            ) : (
              <>
                <div style={{ fontSize:20, fontWeight:800, color: cfg.primary }}>{creditDays} days</div>
                <button className="btn btn-sm" onClick={() => { setTempCredit(creditDays); setEditCredit(true); }}>✏️ Edit</button>
              </>
            )}
            <div style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8' }}>
              Reminder 1 sent on invoice date · Reminder 2 sent after {creditDays} days
            </div>
          </div>

          {/* Pending Action Alert */}
          {pendingCount > 0 && (
            <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13, color:'#92400e', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>⚠️</span>
              <strong>{pendingCount} reminder{pendingCount > 1 ? 's' : ''} need to be sent!</strong>
              <span style={{ color:'#78350f' }}>Check the table below and click Send.</span>
            </div>
          )}

          {/* Add Invoice button */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="btn btn-primary" onClick={() => setAddDueModal(true)}>+ Track Invoice</button>
          </div>

          {/* Due Reminders Table */}
          <div className="card">
            <div className="section-title">Invoice Due Date Tracker</div>
            {dueReminders.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                <div style={{ fontSize:14, fontWeight:600 }}>No invoices tracked yet</div>
                <div style={{ fontSize:12, marginTop:4 }}>Click "+ Track Invoice" to add an invoice to the reminder system</div>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table>
                  <thead><tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Invoice Date</th>
                    <th>Due Date ({creditDays}d)</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Reminder 1</th>
                    <th>Reminder 2</th>
                    <th></th>
                  </tr></thead>
                  <tbody>{dueReminders.map(dr => {
                    const cl = clients.find(c => c.id === dr.client_id);
                    const r1due = isR1Due(dr);
                    const r2due = isR2Due(dr);
                    return (
                      <tr key={dr.id} style={{ background: (r1due || r2due) ? '#fffbeb' : '' }}>
                        <td><code>{dr.invoice_id}</code></td>
                        <td><strong>{dr.client_name || cl?.name || '—'}</strong><br/><small className="muted">{cl?.phone || ''}</small></td>
                        <td style={{ fontSize:12 }}>{dr.invoice_date}</td>
                        <td style={{ fontSize:12, color: today > dr.due_date ? '#dc2626' : '#0f172a', fontWeight: today > dr.due_date ? 700 : 400 }}>
                          {dr.due_date}
                          {today > dr.due_date && <div style={{ fontSize:10, color:'#dc2626' }}>Overdue!</div>}
                        </td>
                        <td className="bold" style={{ color: dr.balance > 0 ? '#dc2626' : '#15803d' }}>
                          {dr.balance > 0 ? 'INR ' + dr.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '✓ Paid'}
                        </td>
                        <td>{statusBadge(dr)}</td>
                        <td>
                          {dr.reminder1_sent ? (
                            <div style={{ fontSize:11 }}>
                              <span className="badge badge-success">✓ Sent</span>
                              <div style={{ color:'#94a3b8', marginTop:2 }}>{dr.reminder1_date}</div>
                            </div>
                          ) : (
                            <button
                              className="btn btn-sm"
                              style={{ background: r1due ? cfg.primary : '#f1f5f9', color: r1due ? '#fff' : '#94a3b8', border:'none', fontWeight: r1due ? 700 : 400 }}
                              onClick={() => handleReminder1(dr)}
                              disabled={dr.balance <= 0}
                              title={`Send on invoice date (${dr.invoice_date})`}>
                              {r1due ? '📨 Send Now' : '📨 Send R1'}
                            </button>
                          )}
                        </td>
                        <td>
                          {dr.reminder2_sent ? (
                            <div style={{ fontSize:11 }}>
                              <span className="badge badge-purple">✓ Sent</span>
                              <div style={{ color:'#94a3b8', marginTop:2 }}>{dr.reminder2_date}</div>
                            </div>
                          ) : (
                            <button
                              className="btn btn-sm"
                              style={{ background: r2due ? '#dc2626' : '#f1f5f9', color: r2due ? '#fff' : '#94a3b8', border:'none', fontWeight: r2due ? 700 : 400 }}
                              onClick={() => handleReminder2(dr)}
                              disabled={!dr.reminder1_sent || dr.balance <= 0}
                              title={`Send after credit period ends (${dr.due_date})`}>
                              {r2due ? '🚨 Send Now' : '📨 Send R2'}
                            </button>
                          )}
                        </td>
                        <td>
                          <button className="btn-x" style={{ fontSize:15 }} onClick={async () => { if(window.confirm('Remove from tracker?')) { await api.deleteDueReminder(dr.id); load(); } }}>🗑</button>
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ marginTop:12, display:'flex', gap:16, fontSize:12, color:'#64748b', flexWrap:'wrap' }}>
            <span>📨 <strong>R1</strong> = First reminder (on invoice date)</span>
            <span>🚨 <strong>R2</strong> = Second reminder (after {creditDays} day credit period)</span>
            <span style={{ color:'#d97706' }}>⚠ Highlighted rows need action</span>
          </div>
        </div>
      )}

      {/* ── MANUAL REMINDERS TAB ── */}
      {tab === 'manual' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="btn btn-primary" onClick={() => openManualModal()}>+ Send Reminder</button>
          </div>
          <div className="card">
            {reminders.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📨</div>
                <div style={{ fontWeight:600 }}>No manual reminders sent yet</div>
              </div>
            ) : (
              <table>
                <thead><tr><th>Client</th><th>Channel</th><th>Type</th><th>Sent At</th><th>Status</th><th></th></tr></thead>
                <tbody>{reminders.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.client_name || '—'}</strong><br/><small className="muted">{r.phone || ''}</small></td>
                    <td><span className="badge badge-info">{r.channel === 'whatsapp' ? '💬 WhatsApp' : r.channel === 'email' ? '📧 Email' : '📱 SMS'}</span></td>
                    <td style={{ fontSize:12, textTransform:'capitalize' }}>{(r.type || '').replace('_', ' ')}</td>
                    <td style={{ fontSize:12, color:'#64748b' }}>{r.sent_at ? new Date(r.sent_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—'}</td>
                    <td><span className="badge badge-success">{r.status}</span></td>
                    <td><button className="btn-x" style={{ fontSize:16 }} onClick={async () => { await api.deleteReminder(r.id); load(); }}>🗑</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── LEDGER TAB ── */}
      {tab === 'ledger' && (
        <div>
          <div className="grid4 mb16">
            <div className="metric"><div className="metric-label">Total Invoiced</div><div className="metric-val blue">{fmtAmt(ledgerData.reduce((s, l) => s + l.totalInvoiced, 0))}</div></div>
            <div className="metric"><div className="metric-label">Total Received</div><div className="metric-val green">{fmtAmt(ledgerData.reduce((s, l) => s + l.totalPaid, 0))}</div></div>
            <div className="metric"><div className="metric-label">Outstanding</div><div className="metric-val amber">{fmtAmt(ledgerData.reduce((s, l) => s + (l.due > 0 ? l.due : 0), 0))}</div></div>
            <div className="metric"><div className="metric-label">Overdue Clients</div><div className="metric-val red">{ledgerData.filter(l => l.overdueCount > 0).length}</div></div>
          </div>
          <div className="card">
            <table>
              <thead><tr><th>Client</th><th>Phone</th><th style={{ textAlign:'right' }}>Invoiced</th><th style={{ textAlign:'right' }}>Paid</th><th style={{ textAlign:'right' }}>Outstanding</th><th></th></tr></thead>
              <tbody>{ledgerData.map(cl => (
                <tr key={cl.id}>
                  <td><strong>{cl.name}</strong><br/><small className="muted">{cl.city}{cl.state ? `, ${cl.state}` : ''}</small></td>
                  <td>{cl.phone || '—'}</td>
                  <td style={{ textAlign:'right', fontWeight:600 }}>{fmtAmt(cl.totalInvoiced)}</td>
                  <td style={{ textAlign:'right', fontWeight:600, color:'#15803d' }}>{fmtAmt(cl.totalPaid)}</td>
                  <td style={{ textAlign:'right' }}>
                    <span style={{ fontWeight:700, fontSize:14, color: cl.due > 0.01 ? '#dc2626' : '#15803d' }}>
                      {cl.due > 0.01 ? fmtAmt(cl.due) : '✓ Cleared'}
                    </span>
                  </td>
                  <td><button className="btn btn-sm btn-primary" onClick={() => { setTab('manual'); openManualModal(cl); }}>📨 Remind</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD INVOICE TO TRACKER MODAL ── */}
      {addDueModal && (
        <Modal title="Track Invoice for Due Reminders" onClose={() => setAddDueModal(false)}>
          <div style={{ background: cfg.light, border:`1px solid ${cfg.border}`, borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color: cfg.primary }}>
            <strong>How it works:</strong> Add an invoice here. Reminder 1 will be sent on the invoice date. Reminder 2 will be sent after the {creditDays}-day credit period ends ({creditDays} days after invoice date).
          </div>
          <div className="form-grid2">
            <div className="form-row col-span2">
              <label>Select Invoice *</label>
              <select value={dueForm.invoice_id} onChange={e => setDueForm(f => ({ ...f, invoice_id: e.target.value }))}>
                <option value="">— Select Invoice —</option>
                {invoices.filter(inv => inv.status !== 'Paid').map(inv => {
                  const cl = clients.find(c => c.id === inv.client_id);
                  const items = inv.items || [];
                  const total = items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0) * 1.18;
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} — {cl?.name || '—'} — INR {total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} — {inv.date}
                    </option>
                  );
                })}
              </select>
            </div>
            {dueForm.invoice_id && (() => {
              const inv = invoices.find(i => i.id === dueForm.invoice_id);
              const dueDate = inv ? new Date(new Date(inv.date).getTime() + creditDays * 86400000).toISOString().split('T')[0] : '—';
              return (
                <div className="col-span2" style={{ gridColumn:'span 2', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'12px 14px', fontSize:13, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  <div><div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>Invoice Date</div><strong>{inv?.date}</strong></div>
                  <div><div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>Due Date (+{creditDays}d)</div><strong style={{ color:'#dc2626' }}>{dueDate}</strong></div>
                  <div><div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>Reminder 1</div><strong>On invoice date</strong></div>
                </div>
              );
            })()}
            <div className="form-row col-span2">
              <label>Reminder Channel</label>
              <select value={dueForm.channel} onChange={e => setDueForm(f => ({ ...f, channel: e.target.value }))}>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="email">📧 Email</option>
                <option value="sms">📱 SMS (via WhatsApp)</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setAddDueModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!dueForm.invoice_id} onClick={addToTracker}
              style={{ opacity: !dueForm.invoice_id ? 0.5 : 1 }}>
              + Add to Tracker
            </button>
          </div>
        </Modal>
      )}

      {/* ── MANUAL REMINDER MODAL ── */}
      {modal && (
        <Modal title="Send Manual Reminder" onClose={() => setModal(false)} wide>
          <div className="form-grid2">
            <div className="form-row col-span2">
              <label>Client *</label>
              <select value={form.client_id} onChange={e => {
                set('client_id', e.target.value);
                const cl = clients.find(c => c.id === e.target.value);
                const lc = ledgerData.find(l => l.id === e.target.value);
                if (cl) set('message', `Dear ${cl.name},\n\nThis is a reminder from ${cfg.name}.\n${lc && lc.due > 0.01 ? 'Outstanding: INR ' + lc.due.toLocaleString('en-IN', { minimumFractionDigits: 2 }) + '\n' : ''}\nKindly revert at your earliest.\n\nBest Regards,\n${cfg.name}\nGSTIN: ${cfg.gstin}`);
              }}>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Channel</label>
              <select value={form.channel} onChange={e => set('channel', e.target.value)}>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="email">📧 Email</option>
                <option value="sms">📱 SMS (via WhatsApp)</option>
              </select>
            </div>
            <div className="form-row">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {['quotation', 'invoice', 'overdue', 'proforma', 'purchase_order', 'general'].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-row col-span2">
              <label>Message</label>
              <textarea rows={7} value={form.message} onChange={e => set('message', e.target.value)} style={{ fontFamily:'inherit', lineHeight:1.7 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.client_id || !form.message} onClick={sendManualReminder}
              style={{ opacity: (!form.client_id || !form.message) ? 0.5 : 1 }}>
              {form.channel === 'whatsapp' ? '💬 WhatsApp' : form.channel === 'email' ? '📧 Email' : '📱 SMS'} &amp; Log
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
  // Restore session from localStorage (remember me)
  const [brand, setBrand] = useState(() => {
    try { return localStorage.getItem('bvm_brand') || null; } catch(e) { return null; }
  });
  const [department, setDepartment] = useState(() => {
    try { return localStorage.getItem('bvm_dept') || null; } catch(e) { return null; }
  });
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

  // Logout / switch helpers
  const switchBrand = () => {
    try { localStorage.removeItem('bvm_brand'); localStorage.removeItem('bvm_dept'); } catch(e) {}
    setBrand(null); setDepartment(null); setPage('dashboard'); setClients([]); setProducts([]);
  };
  const logout = () => {
    try { localStorage.removeItem('bvm_dept'); } catch(e) {}
    setDepartment(null); setPage('dashboard');
  };

  // Step 1: Brand selection screen
  if (!brand) {
    return <BrandSelect onSelect={(b) => {
      setBrand(b);
      try { localStorage.setItem('bvm_brand', b); } catch(e) {}
      setPage('dashboard');
    }} />;
  }

  // Step 2: Department login screen
  if (!department) {
    return <DepartmentLogin brand={brand}
      onLogin={(d) => {
        setDepartment(d);
        try { localStorage.setItem('bvm_dept', d); } catch(e) {}
        setPage('dashboard');
      }}
      onBack={switchBrand} />;
  }

  const cfg = BRAND_CONFIG[brand];
  const dept = DEPARTMENTS[department];
  const allowedPages = dept.access;
  const navTo = (p) => { if(allowedPages.includes(p)) setPage(p); };
  // If current page not allowed, go to dashboard
  const safePage = allowedPages.includes(page) ? page : 'dashboard';
  const docType = PAGE_DOC_TYPE[safePage];

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
          {/* Department badge */}
          <div style={{marginTop:8,padding:'5px 10px',background:'rgba(255,255,255,0.06)',borderRadius:6,fontSize:11,color:'#cbd5e1',display:'flex',alignItems:'center',gap:6}}>
            <span>{dept.icon}</span><strong>{dept.label}</strong><span style={{color:'#475569'}}>Dept</span>
          </div>
          {/* Logout + Switch brand buttons */}
          <button onClick={logout}
            style={{marginTop:8,width:'100%',padding:'6px 0',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:6,color:'#f87171',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
            🔒 Logout Department
          </button>
          <button onClick={switchBrand}
            style={{marginTop:6,width:'100%',padding:'6px 0',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,color:'#94a3b8',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
            ⇄ Switch Brand
          </button>
        </div>
        {NAV.map(sec => {
          const visibleItems = sec.items.filter(item => allowedPages.includes(item.key));
          if (visibleItems.length === 0) return null;
          return (
            <div key={sec.section}>
              <div className="nav-section">{sec.section}</div>
              {visibleItems.map(item => (
                <div key={item.key} className={`nav-item ${safePage===item.key?'active':''}`} onClick={() => navTo(item.key)}>
                  <span className="nav-icon">{item.icon}</span>{item.label}
                </div>
              ))}
            </div>
          );
        })}
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <div className={`brand-tab ${cfg.tabClass}`}>
              <img src={cfg.logo} alt={cfg.name} style={{width:20,height:20,objectFit:'contain'}}/>
              {cfg.name}
            </div>
            <div className="topbar-title">{PAGE_TITLES[safePage]||safePage}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <GlobalSearch onNav={navTo} brand={brand}/>
            <div style={{fontSize:10,color:'#6b7280',fontFamily:'monospace'}}>
              {cfg.gstin}
            </div>
          </div>
        </div>
        <div className="content">
          {safePage==='dashboard'&&<Dashboard onNav={navTo} brand={brand}/>}
          {safePage==='clients'&&<Clients onDataChange={loadMasters} brand={brand}/>}
          {safePage==='products'&&<Products onDataChange={loadMasters} brand={brand}/>}
          {safePage==='inventory'&&<Inventory brand={brand}/>}
          {docType&&<DocList key={safePage+brand} type={docType} clients={clients} products={products} brand={brand} showNew={false} onClearNew={()=>{}}/>}
          {safePage==='payments'&&<Payments clients={clients}/>}
          {safePage==='reminders'&&<Reminders clients={clients} brand={brand}/>}
        </div>
      </div>
    </div>
  );
}
