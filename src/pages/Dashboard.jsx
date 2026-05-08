import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { dailyLogApi, loanApi } from '../services/api';

const SUPERVISOR_ID = 'supervisor-01';

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

function SkeletonCard() {
  return (
    <div className="stat-card space-y-3">
      <div className="skeleton skeleton-shimmer h-8 w-8 rounded-xl" />
      <div className="skeleton skeleton-shimmer h-3 w-16 rounded" />
      <div className="skeleton skeleton-shimmer h-5 w-20 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const [log, setLog] = useState(null);
  const [dueToday, setDueToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const online = useOnlineStatus();

  useEffect(() => {
    Promise.all([
      dailyLogApi.getToday(SUPERVISOR_ID).then(r => setLog(r.data)).catch(() => {}),
      loanApi.getDueToday().then(r => setDueToday(r.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const totalDueAmount = dueToday.reduce((sum, loan) => {
    return sum + loan.installments
      .filter(i => i.status !== 'paid')
      .reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
  }, 0);

  const stats = [
    { label: 'Collection', value: `৳${(log?.totalCollection || 0).toLocaleString()}`, icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Distance', value: `${log?.totalKmTraveled || 0} km`, icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Due Today', value: `৳${totalDueAmount.toLocaleString()}`, icon: 'M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z', bg: 'bg-red-50', text: 'text-red-600' },
    { label: 'Members', value: dueToday.length, icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Personal', value: `৳${(log?.totalPersonalExpense || 0).toLocaleString()}`, icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Fuel', value: `৳${(log?.totalFuelCost || 0).toLocaleString()}`, icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-5 page-transition">
        <div>
          <div className="skeleton skeleton-shimmer h-7 w-32 rounded mb-1" />
          <div className="skeleton skeleton-shimmer h-4 w-40 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-shimmer h-[88px] rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 page-transition">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500">{new Date().toDateString()}</p>
        </div>
        <div className={`badge text-xs ${online ? 'badge-green' : 'badge-red'}`}>
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { to: '/members/add', label: 'Add Member', icon: 'M12 4.5v15m7.5-7.5h-15', grad: 'from-blue-500 to-blue-600' },
          { to: '/loans/add', label: 'New Loan', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', grad: 'from-emerald-500 to-emerald-600' },
          { to: '/ledger', label: 'Ledger', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', grad: 'from-amber-500 to-amber-600' }
        ].map(({ to, label, icon, grad }) => (
          <NavLink key={to} to={to}
            className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-gradient-to-br ${grad} text-white shadow-md active:scale-95 transition-all duration-200`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
            <span className="text-[11px] font-bold">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon, bg, text }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2.5`}>
              <svg className={`w-4.5 h-4.5 ${text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {dueToday.length > 0 ? (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-sm">Due Today</h3>
            <span className="badge-yellow text-[11px]">{dueToday.length} members</span>
          </div>
          <div className="divide-y divide-gray-50">
            {dueToday.slice(0, 8).map(loan => (
              <NavLink key={loan._id} to={`/members/${loan.memberId?._id}`}
                className="flex justify-between items-center py-2.5 -mx-1 px-1 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{loan.memberId?.name || 'Unknown'}</p>
                  <p className="text-[11px] text-gray-400">{loan.loanId}</p>
                </div>
                <span className="badge-yellow text-[11px]">
                  ৳{loan.installments.filter(i => i.status !== 'paid')
                    .reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0).toLocaleString()}
                </span>
              </NavLink>
            ))}
          </div>
          {dueToday.length > 8 && (
            <NavLink to="/loans" className="block text-center text-sm text-teal-600 mt-3 font-semibold hover:text-teal-700">
              View all {dueToday.length} dues →
            </NavLink>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-600">All clear for today!</p>
          <p className="text-sm text-gray-400 mt-1">No pending dues to collect.</p>
        </div>
      )}
    </div>
  );
}
