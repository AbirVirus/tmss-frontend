import { getPendingSync, markSynced, clearSynced, getSyncCount } from '../store/db';
import { syncApi } from './api';

let syncInProgress = false;
let listeners = [];

export function onSyncChange(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function notify() {
  listeners.forEach(fn => fn());
}

export async function syncNow() {
  if (syncInProgress) return { status: 'already-running' };
  syncInProgress = true;
  notify();

  try {
    const pending = await getPendingSync();
    if (pending.length === 0) {
      syncInProgress = false;
      notify();
      return { status: 'nothing-to-sync' };
    }

    const operations = pending.map(p => ({
      collection: p.collectionName,
      operation: p.operation,
      docId: p.docId,
      data: p.data,
      deviceId: 'pwa'
    }));

    await syncApi.push(operations);

    for (const p of pending) {
      await markSynced(p.id);
    }
    await clearSynced();

    syncInProgress = false;
    notify();
    return { status: 'success', count: pending.length };
  } catch (err) {
    syncInProgress = false;
    notify();
    return { status: 'error', message: err.message };
  }
}

export function isSyncing() {
  return syncInProgress;
}

export async function getPendingCount() {
  return getSyncCount();
}

// Auto-sync on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncNow();
  });
}
