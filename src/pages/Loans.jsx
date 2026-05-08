import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { loanApi } from '../services/api';
import { offlineGetAll } from '../store/db';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => { loadLoans(); }, [filter]);

  async function loadLoans() {
    setLoading(true);
    try {
      const { data } = await loanApi.getAll({ status: filter === 'all' ? undefined : filter });
      setLoans(data.loans);
    } catch (e) {
      const offline = await offlineGetAll('loans');
      setLoans(offline.filter(l => filter === 'all' || l.status === filter));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 page-transition">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Loans</h2>
          <p className="text-sm text-gray-500">{loans.length} loans</p>
        </div>
        <NavLink to="/loans/add" className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:bg-teal-700 transition-colors shadow-sm">
          + New Loan
        </NavLink>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {['active', 'completed', 'defaulted', 'all'].map(f => (
          <button key={f}
            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              filter === f ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="card space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1.5">
                  <div className="skeleton skeleton-shimmer h-4 w-32 rounded" />
                  <div className="skeleton skeleton-shimmer h-3 w-20 rounded" />
                </div>
                <div className="skeleton skeleton-shimmer h-5 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="skeleton skeleton-shimmer h-4 w-full rounded" />
                <div className="skeleton skeleton-shimmer h-4 w-full rounded" />
                <div className="skeleton skeleton-shimmer h-4 w-full rounded" />
              </div>
              <div className="skeleton skeleton-shimmer h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-bold text-gray-500 text-lg">No {filter !== 'all' ? filter : ''} loans found</p>
          <p className="text-sm text-gray-400 mt-1">Disburse your first loan to get started</p>
          <NavLink to="/loans/add" className="inline-block mt-4 bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold">
            Disburse First Loan
          </NavLink>
        </div>
      ) : (
        <div className="space-y-2.5">
          {loans.map(loan => (
            <NavLink key={loan._id} to={`/members/${loan.memberId?._id}`}
              className="card block active:scale-[0.98] transition-all duration-200">
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <p className="font-bold text-sm text-gray-800">{loan.memberId?.name || 'Unknown Member'}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{loan.loanId}</p>
                </div>
                <span className={`text-[11px] ${
                  loan.status === 'active' ? 'badge-yellow' :
                  loan.status === 'completed' ? 'badge-green' : 'badge-red'
                }`}>{loan.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-2.5">
                <div className="text-center bg-gray-50 rounded-lg py-1.5">
                  <p className="text-gray-400">Principal</p>
                  <p className="font-bold text-gray-700">৳{loan.principalAmount?.toLocaleString()}</p>
                </div>
                <div className="text-center bg-emerald-50 rounded-lg py-1.5">
                  <p className="text-gray-400">Paid</p>
                  <p className="font-bold text-emerald-700">৳{loan.totalPaid?.toLocaleString()}</p>
                </div>
                <div className="text-center bg-red-50 rounded-lg py-1.5">
                  <p className="text-gray-400">Remaining</p>
                  <p className="font-bold text-red-600">৳{loan.remainingBalance?.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (loan.totalPaid / loan.totalPayable) * 100)}%` }} />
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
