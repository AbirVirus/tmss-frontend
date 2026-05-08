import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi, loanApi } from '../services/api';
import { offlineSave } from '../store/db';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingLoan, setPayingLoan] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ installmentNumber: '', amount: '' });
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    loadMember();
    loadLoans();
  }, [id]);

  async function loadMember() {
    try {
      const { data } = await memberApi.getById(id);
      setMember(data.member);
      if (data.loans) setLoans(data.loans);
    } catch (e) {
      navigate('/members');
    }
    setLoading(false);
  }

  async function loadLoans() {
    try {
      const { data } = await loanApi.getAll({ memberId: id });
      setLoans(data.loans);
    } catch (e) { /* offline */ }
  }

  function openPayment(loan) {
    const nextPending = loan.installments?.find(i => i.status === 'pending' || i.status === 'partial');
    setPayingLoan(loan);
    setPaymentForm({
      installmentNumber: nextPending?.installmentNumber || '',
      amount: nextPending ? (nextPending.amount - (nextPending.paidAmount || 0)) : ''
    });
    setPaymentError('');
  }

  async function handlePayment(e) {
    e.preventDefault();
    setPaymentError('');
    if (!paymentForm.installmentNumber || !paymentForm.amount) {
      setPaymentError('Please enter installment number and amount');
      return;
    }
    setPaymentSaving(true);
    try {
      await loanApi.recordPayment(payingLoan._id, {
        installmentNumber: Number(paymentForm.installmentNumber),
        amount: Number(paymentForm.amount),
        collectedBy: 'supervisor-01'
      });
      setPayingLoan(null);
      loadLoans();
      loadMember();
    } catch (err) {
      if (err.response?.data?.error) {
        setPaymentError(err.response.data.error);
      } else {
        await offlineSave('loans', {
          _id: payingLoan._id,
          payment: {
            installmentNumber: Number(paymentForm.installmentNumber),
            amount: Number(paymentForm.amount),
            collectedBy: 'supervisor-01',
            paidAt: new Date().toISOString()
          }
        });
        setPayingLoan(null);
      }
    }
    setPaymentSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 page-transition">
        <div className="skeleton skeleton-shimmer h-5 w-16 rounded" />
        <div className="card space-y-3">
          <div className="skeleton skeleton-shimmer h-6 w-40 rounded" />
          <div className="skeleton skeleton-shimmer h-4 w-24 rounded" />
          <div className="flex gap-4">
            <div className="skeleton skeleton-shimmer h-10 w-28 rounded" />
            <div className="skeleton skeleton-shimmer h-10 w-20 rounded" />
          </div>
          <div className="skeleton skeleton-shimmer h-4 w-64 rounded" />
        </div>
        {[1,2].map(i => (
          <div key={i} className="card space-y-2">
            <div className="skeleton skeleton-shimmer h-4 w-20 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton skeleton-shimmer h-4 w-full rounded" />
              <div className="skeleton skeleton-shimmer h-4 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-4 page-transition">
      <button onClick={() => navigate(-1)} className="text-teal-600 font-semibold text-sm flex items-center gap-1 hover:text-teal-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{member.name}</h2>
            <p className="text-sm text-gray-400 font-mono">{member.memberId}</p>
          </div>
          <span className={member.status === 'New' ? 'badge-blue text-[11px]' : 'badge-green text-[11px]'}>{member.status}</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Phone</p>
            <p className="font-semibold text-gray-700">{member.phone}</p>
          </div>
          {member.somitiName && (
            <div>
              <p className="text-gray-400 text-xs">Somiti</p>
              <p className="font-semibold text-gray-700">{member.somitiName}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-gray-400 text-xs mb-0.5">Location</p>
          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            {[member.location?.division, member.location?.district, member.location?.upazila, member.location?.union, member.location?.village, member.location?.para]
              .filter(Boolean).map((part, i, arr) => (
                <span key={i} className="text-gray-700 font-medium">
                  {part}{i < arr.length - 1 && <span className="text-gray-300 mx-1">›</span>}
                </span>
              ))}
          </div>
        </div>
      </div>

      <h3 className="font-bold text-gray-700 flex items-center gap-2">
        Loans
        <span className="badge-yellow text-[11px]">{loans.filter(l => l.status === 'active').length} active</span>
      </h3>

      {loans.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium text-gray-500">No loans yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => (
            <div key={loan._id} className="card space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-gray-700 font-mono">{loan.loanId}</span>
                  <p className="text-xs text-gray-400 mt-0.5">Started {new Date(loan.startDate).toLocaleDateString()}</p>
                </div>
                <span className={`text-[11px] ${
                  loan.status === 'active' ? 'badge-yellow' :
                  loan.status === 'completed' ? 'badge-green' : 'badge-red'
                }`}>{loan.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-xs">Principal</p>
                  <p className="font-bold text-gray-800">৳{loan.principalAmount?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-xs">Interest Rate</p>
                  <p className="font-bold text-gray-800">{loan.interestRate}%</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-xs">Total Payable</p>
                  <p className="font-bold text-gray-800">৳{loan.totalPayable?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-xs">Total Paid</p>
                  <p className="font-bold text-emerald-600">৳{loan.totalPaid?.toLocaleString()}</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (loan.totalPaid / loan.totalPayable) * 100)}%` }} />
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">
                  Remaining: <span className="text-red-600">৳{loan.remainingBalance?.toLocaleString()}</span>
                </span>
                <span className="text-gray-500 text-xs">
                  {loan.installments?.filter(i => i.status === 'paid').length}/{loan.totalInstallments} paid
                </span>
              </div>

              {/* Installments list */}
              {loan.installments?.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold text-gray-500 py-1 hover:text-teal-600 transition-colors">
                    View Installments ({loan.installments.filter(i => i.status !== 'pending').length} paid)
                  </summary>
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {loan.installments.map(inst => (
                      <div key={inst.installmentNumber}
                        className={`flex justify-between items-center py-1.5 px-2 rounded-lg text-[12px] ${
                          inst.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          inst.status === 'partial' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                        <span className="font-medium">#{inst.installmentNumber} - {new Date(inst.dueDate).toLocaleDateString()}</span>
                        <span>
                          {inst.status === 'paid' ? `Paid ৳${inst.amount.toLocaleString()}` :
                           inst.status === 'partial' ? `Partial ৳${inst.paidAmount.toLocaleString()}/৳${inst.amount.toLocaleString()}` :
                           `৳${inst.amount.toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {loan.status === 'active' && (
                <button onClick={() => openPayment(loan)}
                  className="w-full py-2.5 rounded-xl bg-teal-50 text-teal-700 font-semibold text-sm hover:bg-teal-100 active:scale-[0.98] transition-all duration-200">
                  Record Payment
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/loans/add', { state: { memberId: member._id } })}
        className="btn-primary">
        + New Loan for {member.name.split(' ')[0]}
      </button>

      {/* Payment Modal */}
      {payingLoan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setPayingLoan(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Record Payment</h3>
              <button onClick={() => setPayingLoan(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500">{payingLoan.loanId} - ৳{payingLoan.remainingBalance?.toLocaleString()} remaining</p>

            {paymentError && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{paymentError}</p>
            )}

            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Installment Number</label>
                <select className="cascading-select"
                  value={paymentForm.installmentNumber}
                  onChange={e => {
                    const num = Number(e.target.value);
                    const inst = payingLoan.installments?.find(i => i.installmentNumber === num);
                    setPaymentForm({
                      installmentNumber: e.target.value,
                      amount: inst ? (inst.amount - (inst.paidAmount || 0)) : ''
                    });
                  }}>
                  <option value="">Select installment</option>
                  {payingLoan.installments
                    ?.filter(i => i.status !== 'paid')
                    .map(inst => (
                      <option key={inst.installmentNumber} value={inst.installmentNumber}>
                        #{inst.installmentNumber} - Due {new Date(inst.dueDate).toLocaleDateString()} - ৳{(inst.amount - (inst.paidAmount || 0)).toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Amount (৳)</label>
                <input type="number" className="input-field" placeholder="Enter amount"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              </div>

              <button type="submit" disabled={paymentSaving}
                className="btn-primary">
                {paymentSaving ? 'Recording...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        @media (min-width: 640px) {
          .animate-slide-up { animation: fadeIn 0.2s ease-out; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
