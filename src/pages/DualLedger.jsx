import { useState, useEffect } from 'react';
import { companyLedgerApi, personalLedgerApi } from '../services/api';
import { offlineSave } from '../store/db';

const SUPERVISOR_ID = 'supervisor-01';
const today = new Date().toISOString().split('T')[0];

export default function DualLedger() {
  const [tab, setTab] = useState('company'); // 'company' | 'personal'
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Company Ledger
  const [comp, setComp] = useState({
    dailyTarget: '', actualCollection: '', totalDuesGenerated: '',
    cashDepositedToOffice: '', depositStatus: 'pending', notes: ''
  });

  // Personal Ledger
  const [pers, setPers] = useState({
    openingCashBalance: '', dailyAllowance: '', lunchExpense: '',
    snacksExpense: '', mobileBill: '', otherExpenses: '', otherExpensesNote: ''
  });

  useEffect(() => { loadCompanyLedger(); }, []);
  useEffect(() => { loadPersonalLedger(); }, [tab]);

  async function loadCompanyLedger() {
    try {
      const { data } = await companyLedgerApi.getByDate(today, SUPERVISOR_ID);
      if (data) setComp({
        dailyTarget: data.dailyTarget || '', actualCollection: data.actualCollection || '',
        totalDuesGenerated: data.totalDuesGenerated || '',
        cashDepositedToOffice: data.cashDepositedToOffice || '',
        depositStatus: data.depositStatus || 'pending', notes: data.notes || ''
      });
    } catch (e) { /* offline */ }
  }

  async function loadPersonalLedger() {
    try {
      const { data } = await personalLedgerApi.getByDate(today, SUPERVISOR_ID);
      if (data) setPers({
        openingCashBalance: data.openingCashBalance || '', dailyAllowance: data.dailyAllowance || '',
        lunchExpense: data.lunchExpense || '', snacksExpense: data.snacksExpense || '',
        mobileBill: data.mobileBill || '', otherExpenses: data.otherExpenses || '',
        otherExpensesNote: data.otherExpensesNote || ''
      });
    } catch (e) { /* offline */ }
  }

  async function saveCompanyLedger() {
    setError(''); setSaving(true); setSaved(false);
    const payload = {
      date: today,
      supervisorId: SUPERVISOR_ID,
      dailyTarget: +comp.dailyTarget || 0,
      actualCollection: +comp.actualCollection || 0,
      totalDuesGenerated: +comp.totalDuesGenerated || 0,
      cashDepositedToOffice: +comp.cashDepositedToOffice || 0,
      depositStatus: comp.depositStatus,
      notes: comp.notes
    };
    try {
      await companyLedgerApi.save(payload);
      setSaved(true);
    } catch (e) {
      await offlineSave('companyLedgers', { ...payload, _id: today + '-' + SUPERVISOR_ID });
      setSaved(true);
    }
    setSaving(false);
  }

  async function savePersonalLedger() {
    setError(''); setSaving(true); setSaved(false);
    const payload = {
      date: today,
      supervisorId: SUPERVISOR_ID,
      openingCashBalance: +pers.openingCashBalance || 0,
      dailyAllowance: +pers.dailyAllowance || 0,
      lunchExpense: +pers.lunchExpense || 0,
      snacksExpense: +pers.snacksExpense || 0,
      mobileBill: +pers.mobileBill || 0,
      otherExpenses: +pers.otherExpenses || 0,
      otherExpensesNote: pers.otherExpensesNote
    };
    try {
      await personalLedgerApi.save(payload);
      setSaved(true);
    } catch (e) {
      await offlineSave('personalLedgers', { ...payload, _id: today + '-' + SUPERVISOR_ID });
      setSaved(true);
    }
    setSaving(false);
  }

  const persTotalExpense =
    (+pers.dailyAllowance || 0) + (+pers.lunchExpense || 0) + (+pers.snacksExpense || 0) +
    (+pers.mobileBill || 0) + (+pers.otherExpenses || 0);
  const persRemaining = (+pers.openingCashBalance || 0) - persTotalExpense;

  const collectionRate = comp.dailyTarget > 0
    ? Math.round((comp.actualCollection || 0) / comp.dailyTarget * 100)
    : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary-800">Dual Ledger System</h2>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-amber-700 font-medium">
          Company and Personal ledgers are strictly separate. Never mix these two balances.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {[
          { key: 'company', label: 'Company Ledger' },
          { key: 'personal', label: 'Personal Ledger' }
        ].map(t => (
          <button
            key={t.key}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

      {/* COMPANY LEDGER */}
      {tab === 'company' && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <h3 className="font-semibold text-gray-800">Company Account</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Daily Collection Target (৳)</label>
            <input type="number" className="input-field" placeholder="0"
              value={comp.dailyTarget} onChange={e => setComp({ ...comp, dailyTarget: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Actual Collection Today (৳)</label>
            <input type="number" className="input-field" placeholder="0"
              value={comp.actualCollection} onChange={e => setComp({ ...comp, actualCollection: e.target.value })} />
          </div>

          {comp.dailyTarget > 0 && (
            <div className={`text-sm px-3 py-2 rounded-lg font-medium ${
              collectionRate >= 100 ? 'bg-green-100 text-green-700' :
              collectionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              Collection Rate: {collectionRate}% {collectionRate >= 100 ? '(Target achieved!)' : ''}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Total Dues Generated (৳)</label>
            <input type="number" className="input-field" placeholder="0"
              value={comp.totalDuesGenerated} onChange={e => setComp({ ...comp, totalDuesGenerated: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Cash Deposited to Office (৳)</label>
            <input type="number" className="input-field" placeholder="0"
              value={comp.cashDepositedToOffice} onChange={e => setComp({ ...comp, cashDepositedToOffice: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Deposit Status</label>
            <select className="cascading-select"
              value={comp.depositStatus} onChange={e => setComp({ ...comp, depositStatus: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="deposited">Deposited</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Notes</label>
            <textarea className="input-field" rows={2} placeholder="Any notes..."
              value={comp.notes} onChange={e => setComp({ ...comp, notes: e.target.value })} />
          </div>

          <button onClick={saveCompanyLedger} disabled={saving} className="btn-primary mt-2">
            {saving ? 'Saving...' : saved ? 'Company Ledger Saved!' : 'Save Company Ledger'}
          </button>
        </div>
      )}

      {/* PERSONAL LEDGER */}
      {tab === 'personal' && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600" />
            <h3 className="font-semibold text-gray-800">Personal Account</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Opening Cash Balance (৳)</label>
            <input type="number" className="input-field" placeholder="0"
              value={pers.openingCashBalance} onChange={e => setPers({ ...pers, openingCashBalance: e.target.value })} />
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">Expenses</p>

            <div className="space-y-2">
              {[
                { key: 'dailyAllowance', label: 'Daily Allowance', icon: '💰' },
                { key: 'lunchExpense', label: 'Lunch', icon: '🍛' },
                { key: 'snacksExpense', label: 'Snacks / Tea', icon: '☕' },
                { key: 'mobileBill', label: 'Mobile Bill', icon: '📱' },
                { key: 'otherExpenses', label: 'Other Expenses', icon: '📌' }
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-0.5 ml-1">{icon} {label} (৳)</label>
                  <input type="number" className="input-field" placeholder="0"
                    value={pers[key]} onChange={e => setPers({ ...pers, [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          {pers.otherExpenses > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Other Expenses Note</label>
              <input className="input-field" placeholder="What was the expense?"
                value={pers.otherExpensesNote} onChange={e => setPers({ ...pers, otherExpensesNote: e.target.value })} />
            </div>
          )}

          {/* Personal summary */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Opening Balance:</span>
              <span className="font-semibold">৳{(+pers.openingCashBalance || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-semibold text-red-600">- ৳{persTotalExpense.toLocaleString()}</span>
            </div>
            <div className="border-t border-orange-300 pt-1 flex justify-between">
              <span className="font-semibold text-gray-700">Remaining Balance:</span>
              <span className={`font-bold text-lg ${persRemaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ৳{persRemaining.toLocaleString()}
              </span>
            </div>
          </div>

          <button onClick={savePersonalLedger} disabled={saving} className="btn-primary mt-2">
            {saving ? 'Saving...' : saved ? 'Personal Ledger Saved!' : 'Save Personal Ledger'}
          </button>
        </div>
      )}
    </div>
  );
}
