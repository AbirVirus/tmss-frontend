import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CascadingLocationSelect from '../components/CascadingLocationSelect';
import { memberApi } from '../services/api';
import { offlineSave } from '../store/db';

export default function AddMember() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    memberId: 'TM-' + Date.now().toString(36).toUpperCase(),
    name: '', phone: '', status: 'New', somitiName: '',
    location: { division: '', district: '', upazila: '', union: '', village: '', para: '' }
  });

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updateLocation(loc) {
    setForm(prev => ({ ...prev, location: loc }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone) {
      setError('Name and phone number are required');
      return;
    }
    if (!/^01\d{9}$/.test(form.phone)) {
      setError('Please enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX)');
      return;
    }
    if (!form.location.division || !form.location.district || !form.location.upazila || !form.location.union || !form.location.village) {
      setError('Please complete the location (at least up to Village)');
      return;
    }
    setSaving(true);
    try {
      await memberApi.create(form);
      navigate('/members');
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error);
      } else {
        await offlineSave('members', form);
        navigate('/members');
      }
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4 page-transition">
      <button onClick={() => navigate(-1)} className="text-teal-600 font-semibold text-sm flex items-center gap-1 hover:text-teal-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-xl font-bold text-gray-800">Register New Member</h2>

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
            <h3 className="font-bold text-gray-700 text-sm">Personal Info</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Member ID (auto-generated)</label>
            <input className="input-field bg-gray-50 text-gray-500" value={form.memberId} disabled />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Full Name *</label>
            <input className="input-field" placeholder="Enter full name"
              value={form.name} onChange={e => updateField('name', e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Phone Number *</label>
            <input className="input-field" type="tel" placeholder="01XXXXXXXXX"
              value={form.phone} onChange={e => updateField('phone', e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Member Status</label>
            <select className="cascading-select"
              value={form.status} onChange={e => updateField('status', e.target.value)}>
              <option value="New">New</option>
              <option value="Old">Old / Returning</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Somiti / Group Name</label>
            <input className="input-field" placeholder="Somiti name (optional)"
              value={form.somitiName} onChange={e => updateField('somitiName', e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <h3 className="font-bold text-gray-700 text-sm">Location *</h3>
          </div>
          <CascadingLocationSelect value={form.location} onChange={updateLocation} />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Register Member'}
        </button>
      </form>
    </div>
  );
}
