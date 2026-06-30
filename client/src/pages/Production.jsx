import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const stages = ['Wood Cut', 'Wood Join', 'Stretch', 'Frame Cut', 'Frame Join', 'Glass Cut', 'Assembly'];
const artisans = ['Kunle', 'Tobi', 'Segun', 'Ade', 'Emma'];

export default function Production() {
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterProd, setFilterProd] = useState('');
  const [form, setForm] = useState({ stage: stages[0], artisans: [artisans[0]], date: new Date().toISOString().split('T')[0] });

  useEffect(() => { load(); }, []);

  function load() {
    api.productionLogs.productionJobs().then(setJobs);
    api.productionLogs.list().then(setLogs);
  }

  function openQuickLog(job) {
    setSelectedJob(job);
    setForm({ stage: stages[0], artisans: [artisans[0]], date: new Date().toISOString().split('T')[0] });
    setShowLogModal(true);
  }

  function saveLog() {
    if (!selectedJob) return;
    api.productionLogs.create({
      job_id: selectedJob.id,
      stage_completed: form.stage,
      artisans: form.artisans,
      date_completed: form.date
    }).then(() => {
      setShowLogModal(false);
      load();
    });
  }

  function getRequiredStages(pt) {
    const map = {
      'Stretch Canvas': ['Wood Cut', 'Wood Join', 'Stretch'],
      'Floating Frame': ['Wood Cut', 'Wood Join', 'Stretch', 'Frame Cut', 'Frame Join', 'Assembly'],
      'Glass Frame': ['Wood Cut', 'Wood Join', 'Stretch', 'Frame Cut', 'Frame Join', 'Glass Cut', 'Assembly']
    };
    return map[pt] || [];
  }

  function getLoggedStages(jobId) {
    return logs.filter(l => l.job_id === jobId).map(l => l.stage_completed);
  }

  const filteredJobs = jobs.filter(j => !filterProd || j.production_status === filterProd);

  return (
    <>
      <div className="page-header">
        <h1>Production Ledger</h1>
        <button className="btn" onClick={load}>&#x21bb; Refresh</button>
      </div>

      <div className="filter-bar">
        <label>Filter:</label>
        <select value={filterProd} onChange={e => setFilterProd(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Production">In Production</option>
          <option value="Complete">Complete</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Job ID</th><th>Quote</th><th>Customer</th><th>Product</th><th>Tier</th><th>Stages</th><th>Progress</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filteredJobs.map(j => {
                const required = getRequiredStages(j.product_type);
                const loggedStages = getLoggedStages(j.id);
                return (
                  <tr key={j.id}>
                    <td className="font-bold">JOB-{j.id}</td>
                    <td>#{j.quote_id}</td>
                    <td>{j.customer_name}</td>
                    <td>{j.product_type}</td>
                    <td>{j.size_tier}</td>
                    <td>{loggedStages.length}/{required.length}</td>
                    <td>
                      <div className="progress-bar">
                        {required.map((s, i) => (
                          <div key={s} className={`progress-dot ${loggedStages.includes(s) ? 'done' : ''}`} title={s} />
                        ))}
                      </div>
                    </td>
                    <td><span className={`badge badge-${j.production_status === 'Complete' ? 'complete' : j.production_status === 'In Production' ? 'progress' : 'pending'}`}>{j.production_status}</span></td>
                    <td>
                      {j.production_status !== 'Complete' && (
                        <button className="btn btn-sm btn-primary" onClick={() => openQuickLog(j)}>Quick Log</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && <tr><td colSpan={9} className="text-muted text-sm">No production jobs found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showLogModal && selectedJob && (
        <Modal title={`Quick Log - JOB-${selectedJob.id} (${selectedJob.product_type})`} onClose={() => setShowLogModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowLogModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveLog}>Log Stage</button></>}>
          <div className="form-group">
            <label>Stage Completed</label>
            <select className="form-control" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Artisans (hold Ctrl to select multiple)</label>
            <select className="form-control" multiple size={4} value={form.artisans}
              onChange={e => setForm({...form, artisans: Array.from(e.target.selectedOptions, o => o.value)})}>
              {artisans.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date Completed</label>
            <input className="form-control" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div className="text-sm text-muted">
            Commission: \u20A6{Number(selectedJob.size_tier === 'Large' ? 150 : selectedJob.size_tier === 'Small' ? 100 : 125).toLocaleString()} per artisan (split equally)
          </div>
        </Modal>
      )}
    </>
  );
}
