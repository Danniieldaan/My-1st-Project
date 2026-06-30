import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Receipts() {
  const [quotes, setQuotes] = useState([]);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    api.quotes.list().then(setQuotes);
    api.productionLogs.list().then(() => {});
    loadAllReceipts();
  }, []);

  async function loadAllReceipts() {
    const qs = await api.quotes.list();
    const all = [];
    for (const q of qs) {
      const rs = await api.receipts.byQuote(q.id);
      all.push(...rs.map(r => ({ ...r, quote: q })));
    }
    setReceipts(all.sort((a, b) => b.id - a.id));
  }

  return (
    <>
      <div className="page-header">
        <h1>Payment Receipts Ledger</h1>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Receipt ID</th><th>Quote</th><th>Customer</th><th>Date</th><th>Amount</th><th>Method</th></tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id}>
                  <td className="font-bold">#{r.id}</td>
                  <td>#{r.quote_id}</td>
                  <td>{r.quote?.customer_name || '-'}</td>
                  <td>{r.payment_date}</td>
                  <td className="font-bold">\u20A6{Number(r.amount_paid).toLocaleString()}</td>
                  <td><span className={`badge ${r.payment_method === 'Transfer' ? 'badge-sent' : r.payment_method === 'POS' ? 'badge-deposit' : 'badge-draft'}`}>{r.payment_method}</span></td>
                </tr>
              ))}
              {receipts.length === 0 && <tr><td colSpan={6} className="text-muted text-sm">No receipts recorded yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
