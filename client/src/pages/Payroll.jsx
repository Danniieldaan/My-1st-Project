import { useState, useEffect } from 'react';
import { api } from '../api';

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0]
  };
}

export default function Payroll() {
  const today = new Date().toISOString().split('T')[0];
  const [weekStart, setWeekStart] = useState(getWeekRange(today).start);
  const [weekEnd, setWeekEnd] = useState(getWeekRange(today).end);
  const [data, setData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Unpaid');

  useEffect(() => {
    api.payroll.weekly({ start_date: weekStart, end_date: weekEnd, payment_status: statusFilter }).then(setData);
  }, [weekStart, weekEnd, statusFilter]);

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    const range = getWeekRange(d.toISOString());
    setWeekStart(range.start); setWeekEnd(range.end);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    const range = getWeekRange(d.toISOString());
    setWeekStart(range.start); setWeekEnd(range.end);
  }

  function markAsPaid(artisanName) {
    if (!data || !data.logs) return;
    const ids = data.logs
      .filter(l => {
        const arts = JSON.parse(l.artisans || '[]');
        return arts.includes(artisanName) && l.payment_status === 'Unpaid';
      })
      .map(l => l.id);
    if (ids.length === 0) return;
    if (!confirm(`Mark ${ids.length} stage(s) as Paid for ${artisanName}?`)) return;
    api.productionLogs.payAll(ids).then(() => {
      api.payroll.weekly({ start_date: weekStart, end_date: weekEnd, payment_status: statusFilter }).then(setData);
    });
  }

  return (
    <>
      <div className="page-header">
        <h1>Weekly Payroll</h1>
      </div>

      <div className="filter-bar">
        <button className="btn btn-sm" onClick={prevWeek}>&larr; Prev</button>
        <strong>{weekStart} to {weekEnd}</strong>
        <button className="btn btn-sm" onClick={nextWeek}>Next &rarr;</button>
        <label>Status:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
          <option value="">All</option>
        </select>
      </div>

      {data && (
        <div className="mb-4 text-sm text-muted">
          {data.logs.length} stage log(s) found for this period
        </div>
      )}

      <div>
        {data && Object.entries(data.by_artisan || {}).length === 0 && (
          <div className="card text-muted text-sm">No payroll records found for this period.</div>
        )}
        {data && Object.entries(data.by_artisan || {}).map(([artisan, info]) => (
          <div key={artisan} className="artisan-block">
            <div className="artisan-header">
              <div>
                <div className="artisan-name">{artisan}</div>
                <div className="artisan-summary">
                  <span>Stages: <strong>{info.count}</strong></span>
                  <span>Total Owed: <strong>\u20A6{Number(info.total).toLocaleString()}</strong></span>
                </div>
              </div>
              {statusFilter === 'Unpaid' && (
                <button className="btn btn-green btn-sm" onClick={() => markAsPaid(artisan)}>Mark Week as Paid</button>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Job ID</th><th>Customer</th><th>Stage</th><th>Product</th><th>Size Tier</th><th>Date</th><th>Split Commission</th><th>Paid</th></tr>
                </thead>
                <tbody>
                  {info.stages.map(log => (
                    <tr key={log.id}>
                      <td className="font-bold">JOB-{log.job_id}</td>
                      <td>{log.customer_name}</td>
                      <td>{log.stage_completed}</td>
                      <td>{log.product_type}</td>
                      <td>{log.size_tier}</td>
                      <td>{log.date_completed}</td>
                      <td>\u20A6{Number(log.split_commission).toLocaleString()}</td>
                      <td><span className={`badge badge-${log.payment_status === 'Paid' ? 'paid' : 'unpaid'}`}>{log.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
