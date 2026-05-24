const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const getClients       = (brand)    => api('/api/clients' + (brand ? `?brand=${brand}` : ''));
export const createClient     = (data)     => api('/api/clients', { method: 'POST', body: data });
export const updateClient     = (id, data) => api(`/api/clients/${id}`, { method: 'PUT', body: data });

export const getProducts   = (brand)    => api('/api/products' + (brand ? `?brand=${brand}` : ''));
export const createProduct = (data)     => api('/api/products', { method: 'POST', body: data });
export const updateProduct = (id, data) => api(`/api/products/${id}`, { method: 'PUT', body: data });

export const getInventory = ()     => api('/api/inventory');
export const updateStock  = (data) => api('/api/inventory/update', { method: 'POST', body: data });

export const getDocuments    = (type, brand) => api(`/api/documents?${type ? `type=${type}` : ''}${brand ? `&brand=${brand}` : ''}`);
export const getDocument     = (id)         => api(`/api/documents/${id}`);
export const createDocument  = (data)       => api('/api/documents', { method: 'POST', body: data });
export const updateDocument  = (id, data)   => api(`/api/documents/${id}`, { method: 'PUT', body: data });
export const convertDocument = (id, target) => api(`/api/documents/${id}/convert`, { method: 'POST', body: { target_type: target } });

// Dual PDF downloads
export const downloadPDF      = (id, brand = 'india') => window.open(`${BASE}/api/documents/${id}/pdf/${brand}`, '_blank');
export const downloadIndiaPDF = (id) => downloadPDF(id, 'india');
export const downloadWorldPDF = (id) => downloadPDF(id, 'world');
export const downloadBothPDFs = (id) => window.open(`${BASE}/api/documents/${id}/pdf/both`, '_blank');

export const getPayments   = ()     => api('/api/payments');
export const createPayment = (data) => api('/api/payments', { method: 'POST', body: data });
export const getDashboard  = (brand) => api('/api/dashboard' + (brand ? `?brand=${brand}` : ''));

export const searchDocuments = (q, type, brand) => api(`/api/search/documents?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}${brand ? `&brand=${brand}` : ''}`);
export const searchClients   = (q)       => api(`/api/search/clients?q=${encodeURIComponent(q)}`);

export const getReminders    = ()     => api('/api/reminders');
export const createReminder  = (data) => api('/api/reminders', { method: 'POST', body: data });
export const deleteReminder  = (id)   => api(`/api/reminders/${id}`, { method: 'DELETE' });
export const getLedger       = ()     => api('/api/ledger');

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY'];
export const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ', SGD: 'S$', JPY: '¥' };

// Flow: Quotation → Proforma → Purchase Order → Sales Order → Invoice
// Series: BVM-QT, BVM-PI, BVM-PO, BVM-SO, BVM-INV
export const FLOW         = ['quotation', 'proforma', 'purchase_order', 'sales_order', 'invoice'];
export const FLOW_LABELS  = {
  quotation:      'Quotation',
  proforma:       'Proforma Invoice',
  purchase_order: 'Purchase Order',
  sales_order:    'Sales Order',
  invoice:        'Tax Invoice'
};
export const FLOW_NEXT = {
  quotation:      'proforma',
  proforma:       'purchase_order',
  purchase_order: 'sales_order',
  sales_order:    'invoice'
};
export const FLOW_NEXT_LABELS = {
  quotation:      'Proforma Invoice',
  proforma:       'Purchase Order',
  purchase_order: 'Sales Order',
  sales_order:    'Tax Invoice'
};

export const COMPANY = {
  name:    'BVM India / BVM World',
  address: '#1, 2nd Floor, Kamla Palace, Jail Road, Sohna Chowk',
  city:    'Gurugram, Haryana - 122001',
  gstin:   '06AGYPR1117M1ZT',
  pan:     'AGYPR1117M',
};

export const deleteDocument = (id) => api(`/api/documents/${id}`, { method: 'DELETE' });
