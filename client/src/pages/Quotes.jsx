import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal';

const statusBadge = { 'Draft': 'badge-draft', 'Sent': 'badge-sent', 'Deposit Paid': 'badge-deposit', 'Send to Production': 'badge-production' };

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.quotes.list().then(setQuotes);
    api.customers.list().then(setCustomers);
  }, []);

  function createQuote() {
    if (!customerId) return;
    api.quotes.create({ customer_id: parseInt(customerId) }).then(q => {
      setShowCreate(false);
      navigate(`/quotes/${q.id}`);
    });
  }

  return (
    <>
      <div className="page-header">
        <h1>Quotes</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Quote</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Discount</th><th>Grand Total</th><th>Deposit</th><th>Balance</th><th>Status</th></tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} style={{cursor:'pointer'}} onClick={() => navigate(`/quotes/${q.id}`)}>
                  <td className="font-bold">#{q.id}</td>
                  <td>{q.customer_name}</td>
                  <td>{q.date_created}</td>
                  <td>\u20A6{Number(q.total_amount).toLocaleString()}</td>
                  <td>\u20A6{Number(q.discount).toLocaleString()}</td>
                  <td>\u20A6{Number(q.grand_total).toLocaleString()}</td>
                  <td>\u20A6{Number(q.deposit_paid).toLocaleString()}</td>
                  <td>\u20A6{Number(q.balance_due).toLocaleString()}</td>
                  <td><span className={`badge ${statusBadge[q.status] || 'badge-draft'}`}>{q.status}</span></td>
                </tr>
              ))}
              {quotes.length === 0 && <tr><td colSpan={9} className="text-muted text-sm">No quotes yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <Modal title="New Quote" onClose={() => setShowCreate(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={createQuote}>Create</button></>}>
          <div className="form-group">
            <label>Customer *</label>
            <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </>
  );
}
