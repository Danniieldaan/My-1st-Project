import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.settings.get().then(setSettings); }, []);

  function update(key, value) {
    setSaving(true);
    api.settings.update(key, value).then(() => {
      setMsg('Saved!');
      setTimeout(() => setMsg(''), 2000);
      setSaving(false);
    });
  }

  if (!settings) return <div>Loading...</div>;

  return (
    <>
      <div className="page-header">
        <h1>System Settings</h1>
        {msg && <span style={{color:'#16a34a',fontSize:13}}>{msg}</span>}
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:16}}>Pricing Engine - Base Rates (per cm\u00B2)</h3>
        <div className="form-row">
          {Object.entries(settings.pricing_base_rates || {}).map(([tier, rate]) => (
            <div key={tier} className="form-group">
              <label>{tier}</label>
              <input className="form-control" type="number" step="0.1" value={rate}
                onChange={e => {
                  const newRates = { ...settings.pricing_base_rates, [tier]: parseFloat(e.target.value) || 0 };
                  update('pricing_base_rates', newRates);
                }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:16}}>Framing Multipliers</h3>
        <div className="form-row">
          {Object.entries(settings.pricing_framing_multipliers || {}).map(([tier, mult]) => (
            <div key={tier} className="form-group">
              <label>{tier}</label>
              <input className="form-control" type="number" step="0.1" value={mult}
                onChange={e => {
                  const newMults = { ...settings.pricing_framing_multipliers, [tier]: parseFloat(e.target.value) || 1 };
                  update('pricing_framing_multipliers', newMults);
                }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:16}}>Glass Multipliers</h3>
        <div className="form-row">
          {Object.entries(settings.pricing_glass_multipliers || {}).map(([tier, mult]) => (
            <div key={tier} className="form-group">
              <label>{tier}</label>
              <input className="form-control" type="number" step="0.1" value={mult}
                onChange={e => {
                  const newMults = { ...settings.pricing_glass_multipliers, [tier]: parseFloat(e.target.value) || 1 };
                  update('pricing_glass_multipliers', newMults);
                }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:16}}>Hardwood Floor Rate (per sq.m)</h3>
        <div className="form-group" style={{maxWidth:200}}>
          <label>Rate (NGN)</label>
          <input className="form-control" type="number" value={settings.pricing_floor_rate || 15000}
            onChange={e => update('pricing_floor_rate', parseFloat(e.target.value) || 15000)} />
        </div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:16}}>Artisan Commission Matrix (NGN)</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Stage</th><th>Small</th><th>Medium</th><th>Large</th></tr></thead>
            <tbody>
              {Object.entries(settings.commission_matrix || {}).map(([stage, rates]) => (
                <tr key={stage}>
                  <td className="font-bold">{stage}</td>
                  {['Small', 'Medium', 'Large'].map(tier => (
                    <td key={tier}>
                      <input className="form-control" style={{width:80}} type="number" value={rates[tier]}
                        onChange={e => {
                          const newMatrix = { ...settings.commission_matrix };
                          newMatrix[stage] = { ...newMatrix[stage], [tier]: parseFloat(e.target.value) || 0 };
                          update('commission_matrix', newMatrix);
                        }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{fontSize:14,marginBottom:16}}>Production Routing (Required Stages per Product)</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product Type</th><th>Required Stages</th></tr></thead>
            <tbody>
              {Object.entries(settings.production_routing || {}).map(([product, stages]) => (
                <tr key={product}>
                  <td className="font-bold">{product}</td>
                  <td>{stages.length > 0 ? stages.join(' \u2192 ') : '(No stages / Not applicable)'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
