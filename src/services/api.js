import axios from 'axios';

const api = axios.create({
  // পরিবর্তনটি এখানে করুন
  baseURL: 'https://tmss-backend.vercel.app/api', 
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// ... বাকি সব কোড আগের মতোই থাকবে
export const locationApi = {
  getDivisions: () => api.get('/locations/divisions'),
  getDistricts: (division) => api.get('/locations/districts', { params: { division } }),
  getUpazilas: (division, district) =>
    api.get('/locations/upazilas', { params: { division, district } }),
  getUnions: (division, district, upazila) =>
    api.get('/locations/unions', { params: { division, district, upazila } }),
  getVillages: (division, district, upazila, union) =>
    api.get('/locations/villages', { params: { division, district, upazila, union } }),
  getParas: (division, district, upazila, union, village) =>
    api.get('/locations/paras', { params: { division, district, upazila, union, village } }),
  search: (q) => api.get('/locations/search', { params: { q } }),
  seed: (locations) => api.post('/locations/seed', locations)
};

export const memberApi = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  getByPhone: (phone) => api.get(`/members/phone/${phone}`),
  getByVillage: (village) => api.get(`/members/village/${village}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`)
};

export const loanApi = {
  getAll: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  getDueToday: () => api.get('/loans/due-today'),
  getDueTomorrow: () => api.get('/loans/due-tomorrow'),
  getByVillage: (village) => api.get(`/loans/village/${village}`),
  create: (data) => api.post('/loans', data),
  recordPayment: (id, data) => api.post(`/loans/${id}/payment`, data)
};

export const companyLedgerApi = {
  getByDate: (date, supervisorId) =>
    api.get('/company-ledger', { params: { date, supervisorId } }),
  getRange: (startDate, endDate, supervisorId) =>
    api.get('/company-ledger/range', { params: { startDate, endDate, supervisorId } }),
  save: (data) => api.post('/company-ledger', data),
  addCollection: (data) => api.post('/company-ledger/collection', data)
};

export const personalLedgerApi = {
  getByDate: (date, supervisorId) =>
    api.get('/personal-ledger', { params: { date, supervisorId } }),
  getRange: (startDate, endDate, supervisorId) =>
    api.get('/personal-ledger/range', { params: { startDate, endDate, supervisorId } }),
  save: (data) => api.post('/personal-ledger', data)
};

export const routeApi = {
  getByDate: (date, supervisorId) =>
    api.get('/routes', { params: { date, supervisorId } }),
  getRange: (startDate, endDate, supervisorId) =>
    api.get('/routes/range', { params: { startDate, endDate, supervisorId } }),
  calculate: (data) => api.post('/routes/calculate', data),
  preview: (data) => api.post('/routes/preview', data)
};

export const dailyLogApi = {
  getByDate: (date, supervisorId) =>
    api.get('/daily-logs', { params: { date, supervisorId } }),
  getRange: (startDate, endDate, supervisorId) =>
    api.get('/daily-logs/range', { params: { startDate, endDate, supervisorId } }),
  getToday: (supervisorId) =>
    api.get('/daily-logs/today', { params: { supervisorId } }),
  getMonthly: (month, year, supervisorId) =>
    api.get('/daily-logs/monthly', { params: { month, year, supervisorId } }),
  completeDay: (data) => api.post('/daily-logs/complete', data),
  sendReport: () => api.post('/daily-logs/send-report')
};

export const syncApi = {
  push: (operations) => api.post('/sync/push', { operations }),
  pull: (since, collections) => api.get('/sync/pull', { params: { since, collections } }),
  status: () => api.get('/sync/status')
};

export default api;
