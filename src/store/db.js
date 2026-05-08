import Dexie from 'dexie';

const db = new Dexie('TMSSFieldDB');

db.version(1).stores({
  members: '++id,_id,memberId,phone,name,status,[location.village+location.para]',
  loans: '++id,_id,loanId,memberId,status',
  companyLedgers: '++id,_id,[date+supervisorId]',
  personalLedgers: '++id,_id,[date+supervisorId]',
  dailyRoutes: '++id,_id,[date+supervisorId]',
  dailyLogs: '++id,_id,[date+supervisorId]',
  locations: '++id,division,district,upazila,union,village,para',
  syncQueue: '++id,collectionName,operation,status,createdAt'
});

export async function offlineSave(storeName, data) {
  await db[storeName].put(data);
  await db.syncQueue.put({
    collectionName: storeName,
    operation: data._id ? 'update' : 'create',
    docId: data._id || data.id,
    data,
    status: 'queued',
    createdAt: new Date().toISOString()
  });
}

export async function offlineGetAll(storeName) {
  return db[storeName].toArray();
}

export async function offlineGetById(storeName, id) {
  return db[storeName].get({ _id: id });
}

export async function offlineGetByIndex(storeName, indexName, value) {
  return db[storeName].where(indexName).equals(value).toArray();
}

export async function getPendingSync() {
  return db.syncQueue.where('status').equals('queued').toArray();
}

export async function markSynced(syncId) {
  return db.syncQueue.update(syncId, { status: 'completed' });
}

export async function clearSynced() {
  return db.syncQueue.where('status').equals('completed').delete();
}

export async function getSyncCount() {
  return db.syncQueue.where('status').equals('queued').count();
}

export default db;
