import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#8b5cf6','#06b6d4','#f43f5e'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return null;

  return (
    <>
      <div className="page-header"><h1>Dashboard</h1></div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value green">\u20A6{Number(data.total_revenue).toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding Payroll</div>
          <div className="kpi-value red">\u20A6{Number(data.outstanding_payroll).toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">This Week Payroll Due</div>
          <div className="kpi-value amber">\u20A6{Number(data.weekly_payroll_due).toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Jobs</div>
          <div className="kpi-value blue">{data.active_jobs}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Quotes</div>
          <div className="kpi-value">{data.total_quotes}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Approved / Deposits</div>
          <div className="kpi-value">{data.approved_quotes}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Active Jobs by Stage</h3>
          {data.production_stages.length === 0 ? (
            <div className="text-muted text-sm">No active production stages</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.production_stages} dataKey="count" nameKey="stage_completed" cx="50%" cy="50%" outerRadius={90} label={({stage_completed, count}) => `${stage_completed} (${count})`}>
                  {data.production_stages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Recent Quotes</h3>
          <table>
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.recent_quotes.map(q => (
                <tr key={q.id}>
                  <td><Link to={`/quotes/${q.id}`}>#{q.id}</Link></td>
                  <td>{q.customer_name}</td>
                  <td>\u20A6{Number(q.grand_total).toLocaleString()}</td>
                  <td><span className={`badge badge-${q.status === 'Draft' ? 'draft' : q.status === 'Sent' ? 'sent' : q.status === 'Deposit Paid' ? 'deposit' : 'production'}`}>{q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
