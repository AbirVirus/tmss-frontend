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
  const [searching, setSearching] = useState(false);
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
    setSearching(true);
    setError('');
    try {
      const { data } = await memberApi.getByPhone(searchPhone);
      setMembers([data]);
      setForm(f => ({ ...f, memberId: data._id }));
    } catch (e) {
      setError('Member not found with that phone number');
      setMembers([]);
    }
    setSearching(false);
  }

  function updateField(field, value) {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
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
    if (+form.principalAmount <= 0) {
      setError('Principal amount must be greater than 0');
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
    <div className="space-y-4 page-transition">
      <button onClick={() => navigate(-1)} className="text-teal-600 font-semibold text-sm flex items-center gap-1 hover:text-teal-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-xl font-bold text-gray-800">Disburse New Loan</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <h3 className="font-bold text-gray-700 text-sm">Find Member</h3>
          </div>
          {!preMemberId && (
            <div className="flex gap-2">
              <input className="input-field flex-1" type="tel" placeholder="Search by phone number..."
                value={searchPhone} onChange={e => setSearchPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByPhone()} />
              <button type="button" onClick={searchByPhone} disabled={searching}
                className="bg-teal-600 text-white px-5 rounded-xl text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {searching ? '...' : 'Search'}
              </button>
            </div>
          )}
          {members.map(m => (
            <div key={m._id}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                form.memberId === m._id ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setForm(f => ({ ...f, memberId: m._id }))}>
              <p className="font-bold text-sm text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.phone} &middot; {m.memberId}</p>
              {m.location?.village && (
                <p className="text-xs text-gray-400 mt-0.5">{m.location.village}{m.location.para ? ' > ' + m.location.para : ''}</p>
              )}
            </div>
          ))}
          {!preMemberId && members.length === 0 && !searching && searchPhone && (
            <p className="text-xs text-gray-400 text-center py-2">Search for a member by phone number to continue</p>
          )}
        </div>

        <div className="card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="font-bold text-gray-700 text-sm">Loan Details</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Principal Amount * (৳)</label>
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
              <div className="input-field bg-gray-50 text-gray-700 font-semibold">
                ৳{(form.installmentAmount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Start Date</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={e => updateField('startDate', e.target.value)} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Total Payable:</span>
              <span className="font-bold text-blue-700 text-lg">৳{totalPayable.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1.5 text-gray-500">
              <span>{form.totalInstallments} installments</span>
              <span>৳{(form.installmentAmount || 0).toLocaleString()} each</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Disbursing...
            </span>
          ) : 'Disburse Loan'}
        </button>
      </form>
    </div>
  );
}
