import { useState, useEffect } from 'react';
import { syncNow, getPendingCount, isSyncing, onSyncChange } from '../services/syncService';
import { syncApi } from '../services/api';

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

export default function SyncPage() {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const online = useOnlineStatus();

  useEffect(() => {
    refresh();
    return onSyncChange(refresh);
  }, []);

  async function refresh() {
    const count = await getPendingCount();
    setPending(count);
    setSyncing(isSyncing());
    try {
      const { data } = await syncApi.status();
      setServerStatus(data);
    } catch (e) {
      setServerStatus(null);
    }
    setLastSync(localStorage.getItem('lastSync'));
  }

  async function handleSync() {
    setResult(null);
    setSyncing(true);
    const res = await syncNow();
    setResult(res);
    setSyncing(false);
    localStorage.setItem('lastSync', new Date().toLocaleString());
    setLastSync(localStorage.getItem('lastSync'));
    refresh();
  }

  async function handleRetryFailed() {
    setResult(null);
    setSyncing(true);
    try {
      const { data } = await syncApi.retryFailed();
      setResult({
        status: data.stillFailed === 0 ? 'success' : 'error',
        count: data.retried - data.stillFailed,
        message: `${data.retried} items retried, ${data.stillFailed} still failing`
      });
    } catch (e) {
      setResult({ status: 'error', message: e.message });
    }
    setSyncing(false);
    refresh();
  }

  return (
    <div className="space-y-5 page-transition">
      <h2 className="text-xl font-bold text-gray-800">Data Sync</h2>

      <div className="card space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Connection Status</span>
          <span className={`badge text-xs ${online ? 'badge-green' : 'badge-red'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Pending Sync Items</span>
          <span className={`font-bold text-xl ${pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {pending}
          </span>
        </div>

        {serverStatus && (
          <>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Server Pending</p>
                <p className="font-bold text-amber-600 text-lg">{serverStatus.pending || 0}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Server Failed</p>
                <p className="font-bold text-red-600 text-lg">{serverStatus.failed || 0}</p>
              </div>
            </div>
            {serverStatus.failed > 0 && (
              <button onClick={handleRetryFailed} disabled={syncing}
                className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 disabled:opacity-50 active:scale-[0.98] transition-all duration-200">
                Retry {serverStatus.failed} Failed Items
              </button>
            )}
          </>
        )}

        {lastSync && (
          <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>Last Synced</span>
            <span className="font-medium">{lastSync}</span>
          </div>
        )}
      </div>

      <button onClick={handleSync} disabled={syncing || !online}
        className="btn-primary">
        {syncing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing...
          </span>
        ) : 'Sync Now'}
      </button>

      {!online && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700 font-medium">You are offline. Sync will resume when internet is restored.</p>
        </div>
      )}

      {result && !syncing && (
        <div className={`rounded-2xl p-4 border ${
          result.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
          result.status === 'error' ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            {result.status === 'success' && (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-semibold">
              {result.status === 'success' && `Synced ${result.count} items successfully`}
              {result.status === 'nothing-to-sync' && 'Everything is up to date'}
              {result.status === 'already-running' && 'Sync already in progress'}
              {result.status === 'error' && `Sync failed: ${result.message}`}
            </p>
          </div>
        </div>
      )}

      <div className="card text-xs text-gray-500 space-y-2">
        <p className="font-bold text-gray-600 text-sm">How Sync Works</p>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <span className="text-teal-600 font-bold">1.</span>
            <span>The app works fully offline using local storage.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-teal-600 font-bold">2.</span>
            <span>All your changes are queued automatically for sync.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-teal-600 font-bold">3.</span>
            <span>When online, tap "Sync Now" to push data to the server.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-teal-600 font-bold">4.</span>
            <span>Sync also runs automatically when you regain internet.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
