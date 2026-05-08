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
  { to: '/', label: 'Home', icon: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { to: '/members', label: 'Members', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  { to: '/loans', label: 'Loans', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/ledger', label: 'Ledger', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { to: '/route', label: 'Route', icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
];

const subPagePaths = ['/members/add', '/loans/add', '/sync', '/daily-log'];
const hideNavPaths = ['/members/add', '/loans/add', '/sync', '/daily-log'];

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const go = () => setOnline(true);
    const goff = () => setOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', goff);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', goff); };
  }, []);
  return online;
}

function Layout({ children }) {
  const location = useLocation();
  const [pending, setPending] = useState(0);
  const online = useOnlineStatus();
  const path = location.pathname;

  useEffect(() => {
    getPendingCount().then(setPending);
    return onSyncChange(() => getPendingCount().then(setPending));
  }, []);

  const showNav = !hideNavPaths.includes(path);

  const isSubPage = subPagePaths.includes(path) || /^\/members\/[^/]+$/.test(path);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center font-bold text-sm backdrop-blur-sm">TM</div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight">TMSS Field</h1>
              <p className="text-[11px] text-teal-200 font-medium">Supervisor App</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {pending > 0 && (
              <NavLink to="/sync" className="bg-amber-400 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                {pending} sync
              </NavLink>
            )}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ring-2 ring-white/40 ${online ? 'bg-green-300' : 'bg-red-400 animate-pulse'}`} />
              <span className="text-[11px] text-teal-200 font-medium">{online ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto px-4 pt-4 w-full max-w-2xl mx-auto ${showNav ? 'pb-20' : 'pb-8'}`}>
        {children}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around max-w-2xl mx-auto px-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1.5 px-1.5 text-[10px] font-semibold transition-all duration-200 ${
                    isActive ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="w-8 h-[3px] bg-teal-500 rounded-full -mt-0.5 mb-0.5" />}
                    <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                    {label}
                  </>
                )}
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
