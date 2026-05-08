import { useState, useEffect } from 'react';
import { dailyLogApi } from '../services/api';
import { offlineGetAll } from '../store/db';

const SUPERVISOR_ID = 'supervisor-01';

export default function DailyLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState('list'); // list | monthly

  useEffect(() => {
    loadLogs();
  }, []);

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

  async function handleSendReport() {
    setSending(true);
    try {
      await dailyLogApi.sendReport();
      alert('Report sent via Telegram!');
    } catch (e) {
      alert('Failed to send report');
    }
    setSending(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-primary-800">Daily Logs</h2>
        <button onClick={handleSendReport} disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          {sending ? 'Sending...' : 'Send Report Now'}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button className={`flex-1 py-2 rounded-lg text-xs font-semibold ${view === 'list' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}
          onClick={() => setView('list')}>Last 14 Days</button>
        <button className={`flex-1 py-2 rounded-lg text-xs font-semibold ${view === 'monthly' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}
          onClick={() => setView('monthly')}>Monthly Summary</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log._id} className="card space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {new Date(log.date).toDateString()}
                </span>
                <span className={log.telegramReportSent ? 'badge-green' : 'badge-yellow'}>
                  {log.telegramReportSent ? 'Reported' : 'Pending'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center bg-green-50 rounded-lg p-2">
                  <p className="text-gray-400">Collection</p>
                  <p className="font-bold text-green-700">৳{(log.totalCollection || 0).toLocaleString()}</p>
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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Due:</span> ৳{(log.totalDue || 0).toLocaleString()}</div>
                <div><span className="text-gray-400">Fuel:</span> ৳{(log.totalFuelCost || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
