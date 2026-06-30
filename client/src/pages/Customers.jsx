import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => { load(); }, []);

  function load() { api.customers.list().then(setCustomers); }

  function openCreate() { setEdit(null); setForm({ name: '', phone: '', email: '', address: '' }); setShowModal(true); }

  function openEdit(c) { setEdit(c); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address }); setShowModal(true); }

  function save() {
    if (!form.name) return;
    const p = edit ? api.customers.update(edit.id, form) : api.customers.create(form);
    p.then(() => { setShowModal(false); load(); });
  }

  function del(id) { if (confirm('Delete this customer?')) api.customers.delete(id).then(load); }

  return (
    <>
      <div className="page-header">
        <h1>Customers (CRM)</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New Customer</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>Lifetime Spend</th><th>Frames Ordered</th><th>Outstanding</th><th></th></tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="font-bold">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td>\u20A6{Number(c.total_lifetime_spend || 0).toLocaleString()}</td>
                  <td>{c.total_frames_ordered || 0}</td>
                  <td>\u20A6{Number(c.outstanding_balance || 0).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => del(c.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={7} className="text-muted text-sm">No customers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={edit ? 'Edit Customer' : 'New Customer'} onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
          <div className="form-group">
            <label>Customer Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
        </Modal>
      )}
    </>
  );
}
