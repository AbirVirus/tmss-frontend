import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { getPendingCount, onSyncChange } from './services/syncService';

import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import MemberDetail from './pages/MemberDetail';
import Loans from './pages/Loans';
import AddLoan from './pages/AddLoan';
import DualLedger from './pages/DualLedger';
import RouteTracker from './pages/RouteTracker';
import SyncPage from './pages/SyncPage';
import DailyLogPage from './pages/DailyLogPage';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/members', label: 'Members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/loans', label: 'Loans', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/ledger', label: 'Ledger', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { to: '/route', label: 'Route', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' }
];

function Layout({ children }) {
  const location = useLocation();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    getPendingCount().then(setPending);
    return onSyncChange(() => getPendingCount().then(setPending));
  }, []);

  const isVisible = navItems.some(i => i.to === location.pathname || (i.to !== '/' && location.pathname.startsWith(i.to)));

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="sticky top-0 z-40 bg-primary-700 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm">TM</div>
            <div>
              <h1 className="font-bold text-sm leading-tight">TMSS Field</h1>
              <p className="text-xs text-primary-200">Supervisor App</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <NavLink to="/sync" className="badge-yellow text-xs animate-pulse">
                {pending} pending
              </NavLink>
            )}
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-400' : 'bg-red-400'}`}
              title={navigator.onLine ? 'Online' : 'Offline'} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      {isVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
          <div className="flex justify-around max-w-lg mx-auto">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1.5 px-2 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary-700' : 'text-gray-400'
                  }`
                }
              >
                <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/add" element={<AddMember />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/add" element={<AddLoan />} />
          <Route path="/ledger" element={<DualLedger />} />
          <Route path="/route" element={<RouteTracker />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/daily-log" element={<DailyLogPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
