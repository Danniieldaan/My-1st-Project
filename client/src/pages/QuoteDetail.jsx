import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal';

const productTypes = ['Base Print', 'Stretch Canvas', 'Floating Frame', 'Glass Frame', 'Hardwood Floor'];
const statusList = ['Draft', 'Sent', 'Deposit Paid', 'Send to Production'];

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [items, setItems] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [discount, setDiscount] = useState(0);

  const [form, setForm] = useState({
    product_type: 'Stretch Canvas', quantity: 1, measurement_unit: 'cm',
    width: '', height: '', square_meters: ''
  });

  const [receiptForm, setReceiptForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: '', payment_method: 'Cash'
  });

  useEffect(() => {
    api.quotes.get(id).then(q => {
      setQuote(q);
      setItems(q.items || []);
      setReceipts(q.receipts || []);
      setDiscount(q.discount || 0);
    });
  }, [id]);

  function load() {
    api.quotes.get(id).then(q => {
      setQuote(q);
      setItems(q.items || []);
      setReceipts(q.receipts || []);
    });
  }

  function openAddItem() {
    setEditItem(null);
    setForm({ product_type: 'Stretch Canvas', quantity: 1, measurement_unit: 'cm', width: '', height: '', square_meters: '' });
    setShowItemModal(true);
  }

  function openEditItem(item) {
    setEditItem(item);
    setForm({
      product_type: item.product_type, quantity: item.quantity, measurement_unit: item.measurement_unit,
      width: item.width || '', height: item.height || '', square_meters: item.square_meters || ''
    });
    setShowItemModal(true);
  }

  function saveItem() {
    const data = {
      quote_id: parseInt(id),
      product_type: form.product_type,
      quantity: parseInt(form.quantity) || 1,
      measurement_unit: form.measurement_unit,
      width: parseFloat(form.width) || 0,
      height: parseFloat(form.height) || 0,
      square_meters: parseFloat(form.square_meters) || 0
    };
    const p = editItem ? api.quoteItems.update(editItem.id, data) : api.quoteItems.create(data);
    p.then(() => { setShowItemModal(false); load(); });
  }

  function deleteItem(itemId) {
    if (confirm('Delete this line item?')) api.quoteItems.delete(itemId).then(load);
  }

  function saveReceipt() {
    api.receipts.create({
      quote_id: parseInt(id),
      payment_date: receiptForm.payment_date,
      amount_paid: parseFloat(receiptForm.amount_paid),
      payment_method: receiptForm.payment_method
    }).then(() => { setShowReceiptModal(false); load(); });
  }

  function deleteReceipt(rId) {
    if (confirm('Delete this receipt?')) api.receipts.delete(rId).then(load);
  }

  function updateStatus() {
    api.quotes.updateStatus(id, newStatus).then(() => { setShowStatusModal(false); load(); });
  }

  function saveDiscount() {
    api.quotes.update(id, { discount: parseFloat(discount) || 0 }).then(() => { setShowDiscountModal(false); load(); });
  }

  if (!quote) return <div>Loading...</div>;

  const isFloor = form.product_type === 'Hardwood Floor';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Quote #{quote.id}</h1>
          <div className="text-muted text-sm" style={{marginTop:2}}>
            {quote.customer_name} &middot; {quote.date_created} &middot;
            <span className={`badge badge-${quote.status === 'Draft' ? 'draft' : quote.status === 'Sent' ? 'sent' : quote.status === 'Deposit Paid' ? 'deposit' : 'production'}`} style={{marginLeft:6}}>{quote.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setShowDiscountModal(true)}>Set Discount</button>
          <button className="btn" onClick={() => setShowStatusModal(true)}>Change Status</button>
          <button className="btn" onClick={() => setShowReceiptModal(true)}>+ Receipt</button>
          <button className="btn btn-primary" onClick={openAddItem}>+ Add Item</button>
          <button className="btn btn-ghost" onClick={() => navigate('/quotes')}>Back</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Total Amount</div><div className="kpi-value">\u20A6{Number(quote.total_amount).toLocaleString()}</div></div>
        <div className="kpi-card"><div className="kpi-label">Discount</div><div className="kpi-value amber">-\u20A6{Number(quote.discount).toLocaleString()}</div></div>
        <div className="kpi-card"><div className="kpi-label">Grand Total</div><div className="kpi-value blue">\u20A6{Number(quote.grand_total).toLocaleString()}</div></div>
        <div className="kpi-card"><div className="kpi-label">Deposit Paid</div><div className="kpi-value green">\u20A6{Number(quote.deposit_paid).toLocaleString()}</div></div>
        <div className="kpi-card"><div className="kpi-label">Balance Due</div><div className="kpi-value red">\u20A6{Number(quote.balance_due).toLocaleString()}</div></div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:12}}>Line Items (Jobs)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Product</th><th>Qty</th><th>WxH</th><th>Unit</th><th>Sq.M</th><th>Tier</th><th>Price</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td className="font-bold">JOB-{i.id}</td>
                  <td>{i.product_type}</td>
                  <td>{i.quantity}</td>
                  <td>{i.width && i.height ? `${i.width}\u00D7${i.height}` : '-'}</td>
                  <td>{i.measurement_unit}</td>
                  <td>{i.square_meters || '-'}</td>
                  <td>{i.size_tier}</td>
                  <td>\u20A6{Number(i.calculated_price).toLocaleString()}</td>
                  <td><span className={`badge badge-${i.production_status === 'Complete' ? 'complete' : i.production_status === 'In Production' ? 'progress' : 'pending'}`}>{i.production_status}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditItem(i)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteItem(i.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={10} className="text-muted text-sm">No items yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:12}}>Receipts</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Date</th><th>Amount</th><th>Method</th><th></th></tr></thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.payment_date}</td>
                  <td>\u20A6{Number(r.amount_paid).toLocaleString()}</td>
                  <td>{r.payment_method}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => deleteReceipt(r.id)}>Del</button></td>
                </tr>
              ))}
              {receipts.length === 0 && <tr><td colSpan={5} className="text-muted text-sm">No receipts</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showItemModal && (
        <Modal title={editItem ? 'Edit Line Item' : 'Add Line Item'} onClose={() => setShowItemModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowItemModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveItem}>{editItem ? 'Update' : 'Add'}</button></>}>
          <div className="form-group">
            <label>Product Type *</label>
            <select className="form-control" value={form.product_type} onChange={e => setForm({...form, product_type: e.target.value})}>
              {productTypes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {!isFloor && (
            <>
              <div className="form-group">
                <label>Measurement Unit</label>
                <select className="form-control" value={form.measurement_unit} onChange={e => setForm({...form, measurement_unit: e.target.value})}>
                  <option value="cm">cm</option><option value="inches">inches</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Width ({form.measurement_unit})</label>
                  <input className="form-control" type="number" min="0" step="0.1" value={form.width} onChange={e => setForm({...form, width: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Height ({form.measurement_unit})</label>
                  <input className="form-control" type="number" min="0" step="0.1" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
                </div>
              </div>
            </>
          )}
          {isFloor && (
            <div className="form-group">
              <label>Square Meters *</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.square_meters} onChange={e => setForm({...form, square_meters: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label>Quantity</label>
            <input className="form-control" type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>
        </Modal>
      )}

      {showReceiptModal && (
        <Modal title="Add Receipt" onClose={() => setShowReceiptModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowReceiptModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveReceipt}>Save</button></>}>
          <div className="form-group">
            <label>Payment Date</label>
            <input className="form-control" type="date" value={receiptForm.payment_date} onChange={e => setReceiptForm({...receiptForm, payment_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Amount Paid (NGN)</label>
            <input className="form-control" type="number" min="0" value={receiptForm.amount_paid} onChange={e => setReceiptForm({...receiptForm, amount_paid: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select className="form-control" value={receiptForm.payment_method} onChange={e => setReceiptForm({...receiptForm, payment_method: e.target.value})}>
              <option value="Cash">Cash</option><option value="Transfer">Transfer</option><option value="POS">POS</option>
            </select>
          </div>
        </Modal>
      )}

      {showStatusModal && (
        <Modal title="Change Status" onClose={() => setShowStatusModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowStatusModal(false)}>Cancel</button><button className="btn btn-primary" onClick={updateStatus}>Update</button></>}>
          <div className="form-group">
            <label>New Status</label>
            <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="">Select...</option>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {newStatus === 'Send to Production' && (
            <div className="text-sm" style={{color:'#d97706',marginTop:8}}>
              This will push all items to the Production floor as individual Jobs.
            </div>
          )}
        </Modal>
      )}

      {showDiscountModal && (
        <Modal title="Set Discount" onClose={() => setShowDiscountModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowDiscountModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveDiscount}>Save</button></>}>
          <div className="form-group">
            <label>Discount Amount (NGN)</label>
            <input className="form-control" type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>
        </Modal>
      )}
    </>
  );
}
