import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loanApi, memberApi } from '../services/api';
import { offlineSave } from '../store/db';

export default function AddLoan() {
  const navigate = useNavigate();
  const location = useLocation();
  const preMemberId = location.state?.memberId || '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [form, setForm] = useState({
    memberId: preMemberId || '',
    principalAmount: '', interestRate: '15', totalInstallments: '46',
    installmentAmount: '', startDate: new Date().toISOString().split('T')[0],
    disbursedBy: 'supervisor-01'
  });

  useEffect(() => {
    if (preMemberId) searchMemberById(preMemberId);
  }, []);

  async function searchMemberById(mid) {
    try {
      const { data } = await memberApi.getById(mid);
      setMembers([data.member]);
      setForm(f => ({ ...f, memberId: data.member._id }));
    } catch (e) { /* */ }
  }

  async function searchByPhone() {
    if (!searchPhone) return;
    try {
      const { data } = await memberApi.getByPhone(searchPhone);
      setMembers([data]);
      setForm(f => ({ ...f, memberId: data._id }));
    } catch (e) {
      setError('Member not found with that phone number');
    }
  }

  function updateField(field, value) {
    setForm(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate installment amount
      if (['principalAmount', 'interestRate', 'totalInstallments'].includes(field)) {
        const p = +updated.principalAmount || 0;
        const rate = +updated.interestRate || 0;
        const installments = +updated.totalInstallments || 1;
        const totalPayable = p + (p * rate / 100);
        updated.installmentAmount = Math.round(totalPayable / installments);
      }

      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.memberId || !form.principalAmount) {
      setError('Please select a member and enter principal amount');
      return;
    }
    setSaving(true);
    try {
      await loanApi.create(form);
      navigate('/loans');
    } catch (err) {
      if (err.response?.status >= 400) {
        setError(err.response.data.error);
      } else {
        await offlineSave('loans', form);
        navigate('/loans');
      }
    }
    setSaving(false);
  }

  const totalPayable = (+form.principalAmount || 0) + ((+form.principalAmount || 0) * (+form.interestRate || 0) / 100);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-primary-600 font-semibold text-sm flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-lg font-bold text-primary-800">Disburse New Loan</h2>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Member search */}
        <div className="card space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">Find Member</h3>
          {!preMemberId && (
            <div className="flex gap-2">
              <input className="input-field flex-1" type="tel" placeholder="Search by phone..."
                value={searchPhone} onChange={e => setSearchPhone(e.target.value)} />
              <button type="button" onClick={searchByPhone}
                className="bg-primary-600 text-white px-4 rounded-xl text-sm font-semibold">Search</button>
            </div>
          )}
          {members.map(m => (
            <div key={m._id}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                form.memberId === m._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
              onClick={() => setForm(f => ({ ...f, memberId: m._id }))}>
              <p className="font-semibold text-sm">{m.name}</p>
              <p className="text-xs text-gray-400">{m.phone} &middot; {m.memberId}</p>
            </div>
          ))}
        </div>

        {/* Loan details */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">Loan Details</h3>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Principal Amount (৳)</label>
            <input type="number" className="input-field" placeholder="e.g. 20000"
              value={form.principalAmount} onChange={e => updateField('principalAmount', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Interest Rate (%)</label>
              <input type="number" className="input-field" value={form.interestRate}
                onChange={e => updateField('interestRate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Installments</label>
              <input type="number" className="input-field" value={form.totalInstallments}
                onChange={e => updateField('totalInstallments', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Per Installment</label>
              <input className="input-field" disabled value={`৳${(form.installmentAmount || 0).toLocaleString()}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Start Date</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={e => updateField('startDate', e.target.value)} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Payable:</span>
              <span className="font-bold text-blue-700">৳{totalPayable.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Disbursing...' : 'Disburse Loan'}
        </button>
      </form>
    </div>
  );
}
