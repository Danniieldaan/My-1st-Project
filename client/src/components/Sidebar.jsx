import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: '\u2302', label: 'Dashboard' },
  { to: '/customers', icon: '\U0001F465', label: 'Customers' },
  { to: '/quotes', icon: '\U0001F4B0', label: 'Quotes' },
  { to: '/production', icon: '\u2699', label: 'Production' },
  { to: '/payroll', icon: '\U0001F4B5', label: 'Payroll' },
  { to: '/receipts', icon: '\U0001F4CB', label: 'Receipts' },
  { to: '/reports', icon: '\U0001F4CA', label: 'Reports' },
  { to: '/settings', icon: '\u2699', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>FRAMING ERP</span>
        <small>Admin Control Tower</small>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <span className="icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
