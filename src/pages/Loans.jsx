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
      setLoans(offline);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-primary-800">Loans</h2>
        <NavLink to="/loans/add" className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          + New Loan
        </NavLink>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {['active', 'completed', 'defaulted', 'all'].map(f => (
          <button key={f}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-white shadow text-primary-700' : 'text-gray-500'
            }`}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {loans.map(loan => (
            <div key={loan._id} className="card space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{loan.memberId?.name || 'Unknown Member'}</p>
                  <p className="text-xs text-gray-400">{loan.loanId}</p>
                </div>
                <span className={`text-xs ${
                  loan.status === 'active' ? 'badge-yellow' :
                  loan.status === 'completed' ? 'badge-green' : 'badge-red'
                }`}>{loan.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-gray-400">Principal:</span> <strong>৳{loan.principalAmount?.toLocaleString()}</strong></div>
                <div><span className="text-gray-400">Paid:</span> <strong>৳{loan.totalPaid?.toLocaleString()}</strong></div>
                <div><span className="text-gray-400">Remaining:</span> <strong className="text-red-600">৳{loan.remainingBalance?.toLocaleString()}</strong></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (loan.totalPaid / loan.totalPayable) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
