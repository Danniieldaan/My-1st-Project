const BASE = '/api';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) { const e = await res.json().catch(() => ({error:res.statusText})); throw new Error(e.error || res.statusText); }
  return res.json();
}

export const api = {
  customers: {
    list: () => request('GET', '/customers'),
    get: (id) => request('GET', `/customers/${id}`),
    create: (data) => request('POST', '/customers', data),
    update: (id, data) => request('PUT', `/customers/${id}`, data),
    delete: (id) => request('DELETE', `/customers/${id}`)
  },
  quotes: {
    list: () => request('GET', '/quotes'),
    get: (id) => request('GET', `/quotes/${id}`),
    create: (data) => request('POST', '/quotes', data),
    update: (id, data) => request('PUT', `/quotes/${id}`, data),
    updateStatus: (id, status) => request('PUT', `/quotes/${id}/status`, { status }),
    delete: (id) => request('DELETE', `/quotes/${id}`)
  },
  quoteItems: {
    byQuote: (quoteId) => request('GET', `/quote-items/by-quote/${quoteId}`),
    create: (data) => request('POST', '/quote-items', data),
    update: (id, data) => request('PUT', `/quote-items/${id}`, data),
    delete: (id) => request('DELETE', `/quote-items/${id}`)
  },
  productionLogs: {
    list: () => request('GET', '/production-logs'),
    byJob: (jobId) => request('GET', `/production-logs/by-job/${jobId}`),
    productionJobs: () => request('GET', '/production-logs/production-jobs'),
    create: (data) => request('POST', '/production-logs', data),
    pay: (id) => request('PUT', `/production-logs/${id}/pay`, { payment_status: 'Paid' }),
    payAll: (ids) => request('PUT', '/production-logs/pay-all', { ids })
  },
  receipts: {
    byQuote: (quoteId) => request('GET', `/receipts/by-quote/${quoteId}`),
    create: (data) => request('POST', '/receipts', data),
    delete: (id) => request('DELETE', `/receipts/${id}`)
  },
  settings: {
    get: () => request('GET', '/settings'),
    update: (key, value) => request('PUT', '/settings', { key, value })
  },
  dashboard: {
    get: () => request('GET', '/dashboard')
  },
  payroll: {
    weekly: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('GET', `/payroll/weekly${q ? '?'+q : ''}`);
    },
    history: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('GET', `/payroll/history${q ? '?'+q : ''}`);
    }
  },
  reports: {
    sales: (month, year) => request('GET', `/reports/sales?month=${month}&year=${year}`),
    production: (month, year) => request('GET', `/reports/production?month=${month}&year=${year}`),
    artisans: (month, year) => request('GET', `/reports/artisans?month=${month}&year=${year}`)
  }
};
