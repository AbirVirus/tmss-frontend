import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { dailyLogApi, loanApi } from '../services/api';

const SUPERVISOR_ID = 'supervisor-01';
const today = new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const [log, setLog] = useState(null);
  const [dueToday, setDueToday] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dailyLogApi.getToday(SUPERVISOR_ID).then(r => setLog(r.data)).catch(() => {}),
      loanApi.getDueToday().then(r => setDueToday(r.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const totalDueAmount = dueToday.reduce((sum, loan) => {
    const due = loan.installments
      .filter(i => i.status === 'pending' || i.status === 'partial' || i.status === 'overdue')
      .reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
    return sum + due;
  }, 0);

  const cards = [
    { label: 'Collection Today', value: `৳${(log?.totalCollection || 0).toLocaleString()}`, color: 'bg-green-500' },
    { label: 'KM Traveled', value: `${log?.totalKmTraveled || 0} km`, color: 'bg-blue-500' },
    { label: 'Due Today', value: `৳${totalDueAmount.toLocaleString()}`, color: 'bg-red-500' },
    { label: 'Members Due', value: dueToday.length, color: 'bg-amber-500' },
    { label: 'Personal Expense', value: `৳${(log?.totalPersonalExpense || 0).toLocaleString()}`, color: 'bg-purple-500' },
    { label: 'Fuel Cost', value: `৳${(log?.totalFuelCost || 0).toLocaleString()}`, color: 'bg-teal-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-primary-800">Dashboard</h2>
          <p className="text-sm text-gray-500">{new Date().toDateString()}</p>
        </div>
        <div className={`badge ${navigator.onLine ? 'badge-green' : 'badge-red'} text-xs`}>
          {navigator.onLine ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { to: '/members/add', label: 'Add Member', icon: 'M12 4.5v15m7.5-7.5h-15' },
          { to: '/loans/add', label: 'New Loan', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { to: '/ledger', label: 'Ledger', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' }
        ].map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white border border-primary-100 active:bg-primary-50 transition-colors shadow-sm">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Due today list */}
      {dueToday.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-2">Due Today ({dueToday.length})</h3>
          <div className="divide-y">
            {dueToday.slice(0, 10).map(loan => (
              <div key={loan._id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{loan.memberId?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{loan.loanId}</p>
                </div>
                <span className="badge-yellow text-xs">
                  ৳{loan.installments.filter(i => i.status !== 'paid')
                    .reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {dueToday.length > 10 && (
            <NavLink to="/loans" className="block text-center text-sm text-primary-600 mt-2 font-medium">
              View all {dueToday.length}...
            </NavLink>
          )}
        </div>
      )}
    </div>
  );
}
