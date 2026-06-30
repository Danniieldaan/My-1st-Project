import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { api } from '../api';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6'];

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sales, setSales] = useState(null);
  const [prod, setProd] = useState(null);
  const [arts, setArts] = useState(null);

  useEffect(() => {
    api.reports.sales(month, year).then(setSales);
    api.reports.production(month, year).then(setProd);
    api.reports.artisans(month, year).then(setArts);
  }, [month, year]);

  return (
    <>
      <div className="page-header">
        <h1>Monthly Reports</h1>
        <div className="flex gap-2">
          <select className="form-control" style={{width:'auto'}} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2020,m-1,1).toLocaleString('en',{month:'long'})}</option>)}
          </select>
          <select className="form-control" style={{width:'auto'}} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="kpi-grid">
        {sales && <>
          <div className="kpi-card"><div className="kpi-label">Quotes Sent</div><div className="kpi-value">{sales.quotes_sent}</div></div>
          <div className="kpi-card"><div className="kpi-label">Quotes Approved</div><div className="kpi-value">{sales.quotes_approved}</div></div>
          <div className="kpi-card"><div className="kpi-label">Revenue Collected</div><div className="kpi-value green">\u20A6{Number(sales.revenue_collected).toLocaleString()}</div></div>
        </>}
        {prod && <>
          <div className="kpi-card"><div className="kpi-label">Frames Produced</div><div className="kpi-value">{prod.total_frames}</div></div>
          <div className="kpi-card"><div className="kpi-label">Floor Sq.M Sold</div><div className="kpi-value amber">{Number(prod.total_floor_sqm).toFixed(1)}</div></div>
        </>}
        {arts && <>
          <div className="kpi-card"><div className="kpi-label">Payroll Paid Out</div><div className="kpi-value red">\u20A6{Number(arts.total_payroll).toLocaleString()}</div></div>
        </>}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {sales && (
          <div className="card">
            <h3 style={{fontSize:14,marginBottom:12}}>Daily Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sales.daily_revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="payment_date" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {prod && (
          <div className="card">
            <h3 style={{fontSize:14,marginBottom:12}}>Frames by Product Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={prod.by_product_type}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product_type" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {arts && arts.leaderboard.length > 0 && (
        <div className="card mt-4">
          <h3 style={{fontSize:14,marginBottom:12}}>Artisan Performance Leaderboard</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Artisan</th><th>Stages Completed</th><th>Total Earned (NGN)</th></tr></thead>
              <tbody>
                {arts.leaderboard.map((a, i) => (
                  <tr key={a.artisan}>
                    <td>{i + 1}</td>
                    <td className="font-bold">{a.artisan}</td>
                    <td>{a.stages_completed}</td>
                    <td className="font-bold">\u20A6{Number(a.total_earned).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
