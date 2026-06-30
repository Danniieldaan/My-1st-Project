import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Quotes from './pages/Quotes';
import QuoteDetail from './pages/QuoteDetail';
import Production from './pages/Production';
import Payroll from './pages/Payroll';
import Receipts from './pages/Receipts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/production" element={<Production />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
