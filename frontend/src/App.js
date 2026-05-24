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

function fmtAmt(n, currency = 'INR') {
  const sym = api.CURRENCY_SYMBOLS[currency] || currency + ' ';
  return sym + Math.abs(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

function PDFButtons({ docId }) {
  return (
    <div className="pdf-btn-group">
      <button className="btn btn-sm btn-pdf-india" onClick={() => api.downloadIndiaPDF(docId)} title="BVM India PDF">🟢 India</button>
      <button className="btn btn-sm btn-pdf-world" onClick={() => api.downloadWorldPDF(docId)} title="BVM World PDF">🔵 World</button>
      <button className="btn-pdf-both" onClick={() => api.downloadBothPDFs(docId)} title="Download both">⬇ Both</button>
    </div>
  );
}

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
function GlobalSearch({ onNav }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = React.useRef(null);
  const PAGE_FOR_TYPE = { quotation:'quotations', proforma:'proforma', purchase_order:'purchase_orders', sales_order:'sales_orders', invoice:'invoices' };

  useEffect(() => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.searchDocuments(q).then(docs => { setResults(docs); setOpen(true); setLoading(false); }).catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative', width:300 }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14, pointerEvents:'none' }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search any document, client, PO/SO..."
          style={{ paddingLeft:32, width:'100%', height:34, borderRadius:8, border:'1px solid #e2e8f0', fontSize:12, background:'#f8fafc' }} />
        {q && <button onClick={() => {setQ('');setResults([]);setOpen(false);}} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>×</button>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 10px 40px rgba(0,0,0,0.15)', zIndex:9999, maxHeight:360, overflowY:'auto' }}>
          <div style={{ padding:'6px 12px', fontSize:11, color:'#94a3b8', borderBottom:'1px solid #f1f5f9', fontWeight:600 }}>{results.length} result{results.length!==1?'s':''} for "{q}"</div>
          {results.map(doc => {
            const sub = (doc.items||[]).reduce((s,it)=>s+(it.qty||0)*(it.rate||0),0);
            return (
              <div key={doc.id} onClick={() => { onNav(PAGE_FOR_TYPE[doc.type]||'dashboard'); setQ(''); setOpen(false); }}
                style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                <div>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#0f172a' }}>{doc.id}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{api.FLOW_LABELS[doc.type]||doc.type} · {doc.client_name||'—'} · {doc.date}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#166534' }}>{fmtAmt(sub*1.18, doc.currency)}</div>
                  <span style={{ padding:'1px 6px', borderRadius:10, background:'#f1f5f9', color:'#475569', fontWeight:600, fontSize:10 }}>{doc.status}</span>
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
function Dashboard({ onNav }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.getDashboard().then(setData).catch(()=>{}); }, []);
  if (!data) return <div className="loading">Loading…</div>;
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <div style={{ background:'linear-gradient(135deg,#166534,#15803d)', borderRadius:10, padding:'16px 20px', color:'#fff', display:'flex', alignItems:'center', gap:14 }}>
          <img src={bvmIndiaLogo} alt="BVM India" style={{ width:56, height:56, objectFit:'contain', borderRadius:6, background:'#fff', padding:3 }} />
          <div>
            <div style={{ fontSize:20, fontWeight:900, letterSpacing:-0.5 }}>BVM India</div>
            <div style={{ fontSize:11, color:'#86efac', marginTop:2 }}>Trading & Distribution</div>
            <div style={{ fontSize:10, color:'#4ade80', marginTop:3 }}>GSTIN: 06AGYPR1117M1ZT · PAN: AGYPR1117M</div>
          </div>
        </div>
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius:10, padding:'16px 20px', color:'#fff', display:'flex', alignItems:'center', gap:14 }}>
          <img src={bvmWorldLogo} alt="BVM World" style={{ width:256, height:256, objectFit:'contain', borderRadius:6, background:'#fff', padding:3 }} />
          <div>
            <div style={{ fontSize:20, fontWeight:900, letterSpacing:-0.5 }}>BVM World</div>
            <div style={{ fontSize:11, color:'#93c5fd', marginTop:2 }}>Global Trading & Distribution</div>
            <div style={{ fontSize:10, color:'#60a5fa', marginTop:3 }}>GSTIN: 06AGYPR1117M1ZT · PAN: AGYPR1117M</div>
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
          <div style={{ fontSize:12, color:'#475569', marginTop:10, lineHeight:1.7 }}>
            Every document auto-generates <strong style={{color:'#166534'}}>BVM India</strong> + <strong style={{color:'#1e3a5f'}}>BVM World</strong> PDFs.
          </div>
          <div style={{ marginTop:14 }}>
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
function Clients({ onDataChange }) {
  const [clients, setClients] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const load = useCallback(() => api.getClients().then(setClients), []);
  useEffect(() => { load(); }, [load]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const save = async () => {
    if (modal==='add') await api.createClient(form);
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
function Products({ onDataChange }) {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({gst:18,unit:'Piece'});
  const load = useCallback(() => api.getProducts().then(setProducts), []);
  useEffect(() => { load(); }, [load]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const save = async () => {
    if (modal==='add') await api.createProduct(form);
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
function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({type:'add',qty:''});
  const load = useCallback(() => Promise.all([api.getInventory(),api.getProducts()]).then(([inv,prods]) => {setInventory(inv);setProducts(prods);}), []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <div className="topbar-actions"><button className="btn btn-primary" onClick={() => {setForm({product_id:products[0]?.id,type:'add',qty:''});setModal(true);}}>Update Stock</button></div>
      <div className="card">
        <table><thead><tr><th>Product</th><th>SKU</th><th>Warehouse</th><th>Unit</th><th>Stock</th><th>Reorder</th><th>Status</th></tr></thead>
        <tbody>{inventory.map(inv => {
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
function DocForm({ type, clients, products, onClose, onSaved }) {
  const label = api.FLOW_LABELS[type]||type;
  const isSO = type === 'sales_order';
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
    const saved = await api.createDocument({...form, type, items: items.map(it=>({...it,qty:parseFloat(it.qty),rate:parseFloat(it.rate)}))});
    onSaved(); onClose();
    setTimeout(() => onSaved(saved), 100);
  };

  return (
    <Modal title={`New ${label}`} onClose={onClose} extraWide>
      <FlowBar current={type}/>

      {isSO && (
        <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'10px 14px',marginTop:10,fontSize:12,color:'#1e3a5f',marginBottom:12}}>
          <strong>ℹ Sales Order Note:</strong> BVM is the BUYER. Client appears as Vendor/Supplier. BVM address appears in Bill To automatically.
        </div>
      )}

      <div className="section-title" style={{marginTop:12}}>Document Details</div>
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
        <div className="form-row"><label>Client's Ref / Quotation No.</label><input value={form.client_quotation_number} onChange={e => set('client_quotation_number',e.target.value)} placeholder="Client's own reference"/></div>
        {showPO && <div className="form-row"><label>Purchase Order No.</label><input value={form.po_number} onChange={e => set('po_number',e.target.value)} placeholder="BVM-PO-0001"/></div>}
        {showSO && <div className="form-row"><label>Sales Order No.</label><input value={form.so_number} onChange={e => set('so_number',e.target.value)} placeholder="BVM-SO-0001"/></div>}
        <div className="form-row"><label>Currency</label>
          <select value={form.currency} onChange={e => {set('currency',e.target.value);setItems(prev=>prev.map(it=>({...it,currency:e.target.value})));}}> 
            {api.CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {form.currency!=='INR' && <div className="form-row"><label>Exchange Rate (1 {form.currency} = ₹)</label><input type="number" step="0.01" value={form.exchange_rate} onChange={e => set('exchange_rate',e.target.value)}/></div>}
      </div>

      {!isSO && (
        <div style={{marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div className="section-title" style={{margin:0}}>Bill To / Ship To</div>
            <button className="btn btn-sm" onClick={() => setShowShipTo(v=>!v)}>{showShipTo?'▲ Hide Ship To':'▼ Different Ship To Address'}</button>
          </div>
          {selectedClient && (
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#475569'}}>
              <strong style={{color:'#0f172a'}}>{selectedClient.name}</strong> · {selectedClient.address} · {selectedClient.city}, {selectedClient.state} - {selectedClient.pincode} · GSTIN: {selectedClient.gstin}
            </div>
          )}
          {showShipTo && (
            <div style={{marginTop:10}}>
              <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Ship To (if different from Bill To)</div>
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
          <div className="section-title">Bill To (BVM — Buyer)</div>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#166534'}}>
            <strong>BVM India / BVM World</strong> · #1, 2nd Floor, Kamla Palace, Jail Road, Sohna Chowk · Gurugram, Haryana - 122001 · GSTIN: 06AGYPR1117M1ZT
          </div>
        </div>
      )}

      <div className="section-title">Line Items</div>
      <div style={{overflowX:'auto'}}>
        <table className="items-table">
          <thead><tr>
            <th style={{width:38}}>S.No</th><th style={{width:145}}>Product</th><th style={{width:165}}>Description</th>
            <th style={{width:50}}>HSN</th><th style={{width:55}}>Qty</th><th style={{width:80}}>Unit</th>
            <th style={{width:90}}>Rate ({form.currency})</th><th style={{width:100}}>Amount ({form.currency})</th><th style={{width:32}}></th>
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
        {form.currency!=='INR' && parseFloat(form.exchange_rate)>0 && (
          <div className="tot-row" style={{fontSize:11,color:'#94a3b8'}}><span>INR Equivalent</span><span>{fmtAmt((subtotal+gstAmt)*parseFloat(form.exchange_rate),'INR')}</span></div>
        )}
      </div>

      <div className="section-title" style={{marginTop:14}}>
        Terms &amp; Conditions
        <span style={{fontSize:11,fontWeight:400,color:'#94a3b8',marginLeft:8}}>(editable — one per line)</span>
      </div>
      <textarea rows={5} value={form.terms} onChange={e => set('terms',e.target.value)}
        style={{width:'100%',fontFamily:'inherit',fontSize:12,lineHeight:1.8,padding:'8px 10px',border:'1px solid #d1d5db',borderRadius:6,color:'#78350f',background:'#fffbeb'}}/>
      <button className="btn" style={{fontSize:11,marginTop:4}} onClick={() => set('terms',DEFAULT_TERMS)}>↺ Reset to Default</button>

      <div className="form-row mt8"><label>Additional Notes</label><textarea rows={2} value={form.notes} onChange={e => set('notes',e.target.value)}/></div>
      <div className="modal-footer">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Save &amp; Preview Both Templates</button>
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

// ── DOC LIST WITH SEARCH ──────────────────────────────────────────────────────
function DocList({ type, clients, products, showNew, onClearNew }) {
  const [docs, setDocs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const load = useCallback(() => api.getDocuments(type).then(setDocs).catch(()=>{}), [type]);
  useEffect(() => { load(); }, [load,type]);
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ID, client, PO/SO, date…`}
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

      {q && (
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#92400e'}}>
          {filtered.length>0?<><strong>{filtered.length}</strong> result{filtered.length!==1?'s':''} for <strong>"{search}"</strong></>:<>No results for <strong>"{search}"</strong></>}
        </div>
      )}

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
              <td><strong>{cl?.name||'—'}</strong>{cl?.gstin&&<><br/><small className="muted" style={{fontSize:10}}>{cl.gstin}</small></>}</td>
              <td>{doc.date}</td>
              {type==='invoice'&&<td>{doc.due_date||'—'}</td>}
              {(type==='purchase_order'||type==='sales_order'||type==='invoice')&&<td><small className="muted">{[doc.po_number,doc.so_number].filter(Boolean).join('/')||'—'}</small></td>}
              <td><span className="badge badge-gray">{currency}</span></td>
              <td className="bold">{fmtAmt(total,currency)}</td>
              {type==='invoice'&&<td className="success">{fmtAmt(doc.paid||0,currency)}</td>}
              <td><Badge status={doc.status}/></td>
              <td><PDFButtons docId={doc.id}/></td>
              <td>
                <div className="actions">
                  <button className="btn btn-sm" onClick={() => setViewDoc(doc)}>View</button>
                  {nextType&&doc.status!=='Converted'&&<button className="btn btn-sm btn-purple" onClick={async()=>{await api.convertDocument(doc.id,nextType);load();}}>→ {nextLabel}</button>}
                  {type==='invoice'&&doc.status!=='Paid'&&<button className="btn btn-sm btn-success" onClick={() => setPayModal(doc)}>Pay</button>}
                </div>
              </td>
            </tr>);
          })}</tbody></table>
        )}
      </div>

      {showForm&&<DocForm type={type} clients={clients} products={products} onClose={() => setShowForm(false)} onSaved={(savedDoc) => {load();if(savedDoc&&savedDoc.id)setViewDoc(savedDoc);}}/>}
      {viewDoc&&<DualDocView doc={viewDoc} clients={clients} products={products} onClose={() => setViewDoc(null)} onRefresh={load}/>}
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
        <table><thead><tr><th>ID</th><th>Invoice</th><th>Client</th><th>Date</th><th>Amount</th><th>Currency</th><th>Mode</th><th>Reference</th></tr></thead>
        <tbody>{payments.map(p => {
          const cl=clients.find(c=>c.id===p.client_id);
          return (<tr key={p.id}><td><code>{p.id}</code></td><td><code>{p.invoice_id||'—'}</code></td><td>{cl?.name||'—'}</td><td>{p.date}</td><td className="success bold">{fmtAmt(p.amount,p.currency)}</td><td><span className="badge badge-gray">{p.currency||'INR'}</span></td><td>{p.mode}</td><td><small className="muted">{p.ref}</small></td></tr>);
        })}</tbody></table>
      </div>
      {modal&&<PayForm clients={clients} onClose={() => {setModal(false);load();}}/>}
    </div>
  );
}

// ── REMINDERS + LEDGER ────────────────────────────────────────────────────────
function Ledger({ onSendReminder }) {
  const [ledger, setLedger] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); api.getLedger().then(d => {setLedger(d);setLoading(false);}).catch(()=>setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const q = search.toLowerCase();
  const filtered = ledger.filter(cl => !q || cl.name?.toLowerCase().includes(q) || cl.phone?.includes(q));
  const totalDue = ledger.reduce((s,cl) => s+(cl.due>0?cl.due:0),0);
  const totalPaid = ledger.reduce((s,cl) => s+cl.totalPaid,0);
  const totalInvoiced = ledger.reduce((s,cl) => s+cl.totalInvoiced,0);
  return (
    <div>
      <div className="grid4 mb16">
        <div className="metric"><div className="metric-label">Total Invoiced</div><div className="metric-val blue">{fmtAmt(totalInvoiced)}</div></div>
        <div className="metric"><div className="metric-label">Total Received</div><div className="metric-val green">{fmtAmt(totalPaid)}</div></div>
        <div className="metric"><div className="metric-label">Total Outstanding</div><div className="metric-val amber">{fmtAmt(totalDue)}</div></div>
        <div className="metric"><div className="metric-label">Overdue Clients</div><div className="metric-val red">{ledger.filter(cl=>cl.overdueCount>0).length}</div></div>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <div style={{position:'relative',flex:1,maxWidth:360}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none'}}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client name, phone…" style={{paddingLeft:34,width:'100%',height:36,borderRadius:8,border:'1px solid #d1d5db',fontSize:13}}/>
        </div>
      </div>
      <div className="card">
        {loading?<div style={{padding:40,textAlign:'center',color:'#94a3b8'}}>Loading ledger…</div>:(
          <table><thead><tr><th>Client</th><th>Phone</th><th style={{textAlign:'right'}}>Invoiced</th><th style={{textAlign:'right'}}>Paid</th><th style={{textAlign:'right'}}>Outstanding</th><th>Overdue</th><th></th></tr></thead>
          <tbody>{filtered.map(cl => {
            const hasDue=cl.due>0.01;
            return (<tr key={cl.id} style={cl.overdueCount>0?{background:'#fff7ed'}:{}}>
              <td><strong>{cl.name}</strong><br/><small className="muted">{cl.city}{cl.state?`, ${cl.state}`:''}</small></td>
              <td>{cl.phone||'—'}</td>
              <td style={{textAlign:'right',fontWeight:600}}>{fmtAmt(cl.totalInvoiced)}</td>
              <td style={{textAlign:'right',fontWeight:600,color:'#15803d'}}>{fmtAmt(cl.totalPaid)}</td>
              <td style={{textAlign:'right'}}><span style={{fontWeight:700,fontSize:14,color:hasDue?'#dc2626':'#15803d'}}>{hasDue?fmtAmt(cl.due):'✓ Cleared'}</span></td>
              <td>{cl.overdueCount>0?<span className="badge badge-danger">⚠ {cl.overdueCount}</span>:<span className="badge badge-success">On time</span>}</td>
              <td><button className="btn btn-sm btn-primary" onClick={() => onSendReminder(cl)}>📨 Remind</button></td>
            </tr>);
          })}</tbody></table>
        )}
      </div>
    </div>
  );
}

function Reminders({ clients }) {
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(false);
  const [prefillClient, setPrefillClient] = useState(null);
  const [form, setForm] = useState({client_id:'',document_id:'',type:'quotation',channel:'whatsapp',message:''});
  const [docs, setDocs] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [tab, setTab] = useState('reminders');
  const load = useCallback(() => { api.getReminders().then(setReminders).catch(()=>{}); api.getLedger().then(setLedgerData).catch(()=>{}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if(form.client_id) api.getDocuments().then(all=>setDocs(all.filter(d=>d.client_id===form.client_id))).catch(()=>{}); else setDocs([]); }, [form.client_id]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const openRemindModal = (cl=null) => {
    const lc = cl ? ledgerData.find(l=>l.id===cl.id) : null;
    const dueStr = lc&&lc.due>0.01?`\nOutstanding Amount: ${fmtAmt(lc.due)}`:'';
    setForm({client_id:cl?.id||'',document_id:'',type:'quotation',channel:'whatsapp',message:cl?`Dear ${cl.name},\n\nThis is a gentle reminder regarding your pending documents with BVM India & BVM World.${dueStr}\n\nKindly revert at your earliest convenience.\n\nBest Regards,\nBVM India / BVM World\nGSTIN: 06AGYPR1117M1ZT`:''});
    setPrefillClient(cl);
    setModal(true);
  };

  const sendReminder = async () => {
    const cl = clients.find(c=>c.id===form.client_id);
    if(!cl)return;
    if(form.channel==='whatsapp'){const phone=(cl.phone||'').replace(/\D/g,'');window.open(`https://wa.me/${phone.startsWith('91')?phone:'91'+phone}?text=${encodeURIComponent(form.message)}`,'_blank');}
    if(form.channel==='email'){window.open(`mailto:${cl.email}?subject=${encodeURIComponent('Reminder - BVM India / BVM World')}&body=${encodeURIComponent(form.message)}`,'_blank');}
    if(form.channel==='sms'){window.open(`sms:${cl.phone}?body=${encodeURIComponent(form.message)}`,'_blank');}
    await api.createReminder(form);
    setModal(false); load();
  };

  const selectedClient = clients.find(c=>c.id===form.client_id);
  const ledgerClient = ledgerData.find(l=>l.id===form.client_id);

  return (
    <div>
      <div style={{display:'flex',gap:0,marginBottom:16,background:'#f1f5f9',borderRadius:10,padding:4,width:'fit-content'}}>
        {[['reminders','📨 Reminders'],['ledger','💰 Paid & Due Ledger']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{padding:'8px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:tab===key?700:400,background:tab===key?'#fff':'transparent',color:tab===key?'#0f172a':'#64748b',boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.1)':'none',fontSize:13,fontFamily:'inherit',transition:'all .15s'}}>{label}</button>
        ))}
      </div>

      {tab==='ledger'&&<Ledger onSendReminder={(cl) => {setTab('reminders');openRemindModal(cl);}}/>}

      {tab==='reminders'&&(
        <div>
          <div className="grid3 mb16">
            <div className="metric"><div className="metric-label">Total Sent</div><div className="metric-val blue">{reminders.length}</div></div>
            <div className="metric"><div className="metric-label">This Week</div><div className="metric-val green">{reminders.filter(r=>{const d=new Date(r.sent_at);return(new Date()-d)/(1000*60*60*24)<=7;}).length}</div></div>
            <div className="metric"><div className="metric-label">Clients with Due</div><div className="metric-val amber">{ledgerData.filter(l=>l.due>0.01).length}</div></div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button className="btn btn-primary" onClick={() => openRemindModal()}>+ Send Reminder</button>
          </div>
          <div className="card">
            <div className="section-title">Reminder History</div>
            {reminders.length===0?(
              <div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}><div style={{fontSize:36,marginBottom:8}}>📨</div><div style={{fontWeight:600}}>No reminders sent yet</div></div>
            ):(
              <table><thead><tr><th>Client</th><th>Phone</th><th>Channel</th><th>Type</th><th>Document</th><th>Sent At</th><th>Status</th><th></th></tr></thead>
              <tbody>{reminders.map(r=>(
                <tr key={r.id}>
                  <td><strong>{r.client_name||'—'}</strong></td><td>{r.phone||'—'}</td>
                  <td><span className="badge" style={{background:r.channel==='whatsapp'?'#dcfce7':r.channel==='email'?'#dbeafe':'#f1f5f9',color:r.channel==='whatsapp'?'#166534':r.channel==='email'?'#1e40af':'#475569'}}>{r.channel==='whatsapp'?'💬 WhatsApp':r.channel==='email'?'📧 Email':'📱 SMS'}</span></td>
                  <td style={{textTransform:'capitalize'}}>{(r.type||'').replace('_',' ')}</td>
                  <td><code>{r.document_id||'—'}</code></td>
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
              <select value={form.client_id} onChange={e => {set('client_id',e.target.value);const cl=clients.find(c=>c.id===e.target.value);const lc=ledgerData.find(l=>l.id===e.target.value);if(cl)set('message',`Dear ${cl.name},\n\nThis is a gentle reminder regarding your pending documents with BVM India & BVM World.${lc&&lc.due>0.01?'\nOutstanding: '+fmtAmt(lc.due):''}\n\nKindly revert at your earliest.\n\nBest Regards,\nBVM India / BVM World`);}}> 
                <option value="">— Select Client —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name} {c.phone?`(${c.phone})`:''}</option>)}
              </select>
            </div>
            {selectedClient&&(
              <div className="col-span2" style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:13,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div><div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>Phone</div><strong>{selectedClient.phone||'—'}</strong></div>
                <div><div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>Email</div><strong>{selectedClient.email||'—'}</strong></div>
                {ledgerClient&&<>
                  <div><div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>Outstanding</div><strong style={{color:ledgerClient.due>0?'#dc2626':'#15803d'}}>{ledgerClient.due>0.01?fmtAmt(ledgerClient.due):'✓ Cleared'}</strong></div>
                </>}
              </div>
            )}
            <div className="form-row"><label>Channel</label>
              <select value={form.channel} onChange={e => set('channel',e.target.value)}>
                <option value="whatsapp">💬 WhatsApp</option><option value="email">📧 Email</option><option value="sms">📱 SMS</option>
              </select>
            </div>
            <div className="form-row"><label>Reminder Type</label>
              <select value={form.type} onChange={e => set('type',e.target.value)}>
                {['quotation','invoice','overdue','proforma','purchase_order','general'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            {docs.length>0&&<div className="form-row col-span2"><label>Link Document (optional)</label>
              <select value={form.document_id} onChange={e => set('document_id',e.target.value)}>
                <option value="">— No specific document —</option>
                {docs.map(d=>{const sub=(d.items||[]).reduce((s,it)=>s+(it.qty||0)*(it.rate||0),0);return<option key={d.id} value={d.id}>{d.id} — {api.FLOW_LABELS[d.type]||d.type} — {fmtAmt(sub*1.18)} — {d.status}</option>;})}
              </select>
            </div>}
            <div className="form-row col-span2"><label>Message</label><textarea rows={8} value={form.message} onChange={e => set('message',e.target.value)} style={{fontFamily:'inherit',lineHeight:1.7}}/></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!form.client_id||!form.message} onClick={sendReminder} style={{opacity:(!form.client_id||!form.message)?0.5:1}}>
              {form.channel==='whatsapp'?'💬 Open WhatsApp':form.channel==='email'?'📧 Open Email':'📱 Open SMS'} &amp; Log
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
  const [page, setPage] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [triggerNew, setTriggerNew] = useState(null);

  const loadMasters = useCallback(() => {
    api.getClients().then(setClients).catch(()=>{});
    api.getProducts().then(setProducts).catch(()=>{});
  }, []);

  useEffect(() => { loadMasters(); }, [loadMasters]);
  useEffect(() => { if(page==='clients'||page==='products') loadMasters(); }, [page,loadMasters]);

  const navTo = (p) => { setPage(p); setTriggerNew(null); };
  const docType = PAGE_DOC_TYPE[page];

  return (
    <div className="erp">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-brand-row">
            <img src={bvmIndiaLogo} alt="BVM India" style={{width:34,height:34,objectFit:'contain',borderRadius:4,background:'#fff',padding:2,flexShrink:0}}/>
            <div className="logo-india">BVM India</div>
          </div>
          <div className="logo-brand-row">
            <img src={bvmWorldLogo} alt="BVM World" style={{width:34,height:34,objectFit:'contain',borderRadius:4,background:'#fff',padding:2,flexShrink:0}}/>
            <div className="logo-world">BVM World</div>
          </div>
          <div className="logo-sub">Unified ERP · One document<br/>Two branded templates</div>
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
            <div className="brand-tab brand-tab-india">
              <img src={bvmIndiaLogo} alt="BVM India" style={{width:22,height:22,objectFit:'contain'}}/>
              BVM India
            </div>
            <div className="brand-tab brand-tab-world">
              <img src={bvmWorldLogo} alt="BVM World" style={{width:22,height:22,objectFit:'contain',borderRadius:2}}/>
              BVM World
            </div>
            <div className="topbar-title">{PAGE_TITLES[page]||page}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <GlobalSearch onNav={navTo}/>
            <div className="topbar-sub">GSTIN: 06AGYPR1117M1ZT</div>
          </div>
        </div>
        <div className="content">
          {page==='dashboard'&&<Dashboard onNav={navTo}/>}
          {page==='clients'&&<Clients onDataChange={loadMasters}/>}
          {page==='products'&&<Products onDataChange={loadMasters}/>}
          {page==='inventory'&&<Inventory/>}
          {docType&&<DocList key={page} type={docType} clients={clients} products={products} showNew={triggerNew===page} onClearNew={() => setTriggerNew(null)}/>}
          {page==='payments'&&<Payments clients={clients}/>}
          {page==='reminders'&&<Reminders clients={clients}/>}
        </div>
      </div>
    </div>
  );
}
