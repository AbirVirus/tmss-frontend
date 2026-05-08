import { useState, useEffect } from 'react';
import { syncNow, getPendingCount, isSyncing, onSyncChange } from '../services/syncService';
import { syncApi } from '../services/api';

export default function SyncPage() {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary-800">Data Sync</h2>

      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Connection Status</span>
          <span className={`badge ${navigator.onLine ? 'badge-green' : 'badge-red'}`}>
            {navigator.onLine ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Pending Sync Items</span>
          <span className={`font-bold text-lg ${pending > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {pending}
          </span>
        </div>

        {serverStatus && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Server Queue</span>
            <span className="text-xs text-gray-500">
              {serverStatus.pending || 0} pending / {serverStatus.failed || 0} failed
            </span>
          </div>
        )}

        {lastSync && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Last Synced</span>
            <span className="text-xs text-gray-500">{lastSync}</span>
          </div>
        )}
      </div>

      <button onClick={handleSync} disabled={syncing}
        className="btn-primary">
        {syncing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing...
          </span>
        ) : (
          'Sync Now'
        )}
      </button>

      {result && !syncing && (
        <div className={`rounded-xl p-4 border ${
          result.status === 'success' ? 'bg-green-50 border-green-200' :
          result.status === 'error' ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <p className="text-sm font-semibold">
            {result.status === 'success' && `Synced ${result.count} items successfully`}
            {result.status === 'nothing-to-sync' && 'Everything is up to date'}
            {result.status === 'already-running' && 'Sync already in progress'}
            {result.status === 'error' && `Sync failed: ${result.message}`}
          </p>
        </div>
      )}

      <div className="card text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">How Sync Works</p>
        <p>1. The app works fully offline using local storage.</p>
        <p>2. All changes are queued for sync automatically.</p>
        <p>3. When online, tap "Sync Now" to push data to the server.</p>
        <p>4. Sync also runs automatically when you regain internet.</p>
      </div>
    </div>
  );
}
