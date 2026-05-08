import { useState, useEffect } from 'react';
import { dailyLogApi } from '../services/api';
import { offlineGetAll } from '../store/db';

const SUPERVISOR_ID = 'supervisor-01';

export default function DailyLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState('list');
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (view === 'list') loadLogs();
    else loadMonthly();
  }, [view]);

  async function loadLogs() {
    setLoading(true);
    try {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
      const { data } = await dailyLogApi.getRange(start, end, SUPERVISOR_ID);
      setLogs(data);
    } catch (e) {
      const offline = await offlineGetAll('dailyLogs');
      setLogs(offline);
    }
    setLoading(false);
  }

  async function loadMonthly() {
    setLoading(true);
    try {
      const now = new Date();
      const { data } = await dailyLogApi.getMonthly(now.getMonth() + 1, now.getFullYear(), SUPERVISOR_ID);
      setMonthlySummary(data.summary);
      setLogs(data.logs);
    } catch (e) {
      setMonthlySummary(null);
    }
    setLoading(false);
  }

  async function handleSendReport() {
    setSending(true);
    try {
      await dailyLogApi.sendReport();
      setToast({ type: 'success', text: 'Report sent via Telegram!' });
    } catch (e) {
      setToast({ type: 'error', text: 'Failed to send report. Check your connection.' });
    }
    setSending(false);
    setTimeout(() => setToast(null), 3000);
  }

  const totals = logs.reduce((acc, log) => ({
    collection: acc.collection + (log.totalCollection || 0),
    km: acc.km + (log.totalKmTraveled || 0),
    personal: acc.personal + (log.totalPersonalExpense || 0),
    fuel: acc.fuel + (log.totalFuelCost || 0),
    due: acc.due + (log.totalDue || 0)
  }), { collection: 0, km: 0, personal: 0, fuel: 0, due: 0 });

  return (
    <div className="space-y-4 page-transition">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Daily Logs</h2>
          <p className="text-sm text-gray-500">{logs.length} days recorded</p>
        </div>
        <button onClick={handleSendReport} disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
          {sending ? 'Sending...' : 'Send Report'}
        </button>
      </div>

      {toast && (
        <div className={`rounded-xl p-3 text-sm font-semibold text-center ${
          toast.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${view === 'list' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setView('list')}>Last 14 Days</button>
        <button
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${view === 'monthly' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setView('monthly')}>This Month</button>
      </div>

      {/* Monthly summary */}
      {view === 'monthly' && monthlySummary && (
        <div className="card">
          <h3 className="font-bold text-gray-700 text-sm mb-3">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Collection', value: `৳${monthlySummary.totalCollection.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Total KM', value: `${monthlySummary.totalKm} km`, color: 'text-blue-600' },
              { label: 'Fuel Cost', value: `৳${monthlySummary.totalFuelCost.toLocaleString()}`, color: 'text-cyan-600' },
              { label: 'Personal Expense', value: `৳${monthlySummary.totalPersonalExpense.toLocaleString()}`, color: 'text-purple-600' },
              { label: 'Working Days', value: `${monthlySummary.workingDays}/${monthlySummary.totalDays}`, color: 'text-teal-600' },
              { label: 'Total Due', value: `৳${monthlySummary.totalDue.toLocaleString()}`, color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`font-bold text-sm mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="card space-y-3">
              <div className="flex justify-between">
                <div className="skeleton skeleton-shimmer h-4 w-36 rounded" />
                <div className="skeleton skeleton-shimmer h-5 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="skeleton skeleton-shimmer h-10 w-full rounded-lg" />
                <div className="skeleton skeleton-shimmer h-10 w-full rounded-lg" />
                <div className="skeleton skeleton-shimmer h-10 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="font-bold text-gray-500 text-lg">No log data yet</p>
          <p className="text-sm text-gray-400 mt-1">Daily logs will appear as you record activities</p>
        </div>
      ) : (
        <>
          {/* 14-day totals */}
          {view === 'list' && logs.length > 1 && (
            <div className="card">
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-3">14-Day Totals</h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                  <p className="text-gray-400">Collection</p>
                  <p className="font-bold text-emerald-700">৳{totals.collection.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                  <p className="text-gray-400">Distance</p>
                  <p className="font-bold text-blue-700">{totals.km} km</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                  <p className="text-gray-400">Personal</p>
                  <p className="font-bold text-orange-700">৳{totals.personal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {logs.map(log => (
              <div key={log._id} className="card space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">
                    {new Date(log.date).toDateString()}
                  </span>
                  <span className={`text-[11px] ${log.telegramReportSent ? 'badge-green' : 'badge-yellow'}`}>
                    {log.telegramReportSent ? 'Reported' : 'Pending'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center bg-emerald-50 rounded-lg p-2">
                    <p className="text-gray-400">Collection</p>
                    <p className="font-bold text-emerald-700">৳{(log.totalCollection || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center bg-blue-50 rounded-lg p-2">
                    <p className="text-gray-400">KM</p>
                    <p className="font-bold text-blue-700">{log.totalKmTraveled || 0}</p>
                  </div>
                  <div className="text-center bg-orange-50 rounded-lg p-2">
                    <p className="text-gray-400">Personal</p>
                    <p className="font-bold text-orange-700">৳{(log.totalPersonalExpense || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span>Due: ৳{(log.totalDue || 0).toLocaleString()}</span>
                  <span>Fuel: ৳{(log.totalFuelCost || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
