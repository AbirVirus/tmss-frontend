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
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-primary-600 font-semibold text-sm flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-lg font-bold text-primary-800">Register New Member</h2>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="card space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Member ID</label>
            <input className="input-field" value={form.memberId} disabled />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Full Name *</label>
            <input className="input-field" placeholder="Enter full name"
              value={form.name} onChange={e => updateField('name', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Phone Number * (unique)</label>
            <input className="input-field" type="tel" placeholder="01XXXXXXXXX"
              value={form.phone} onChange={e => updateField('phone', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Status</label>
            <select className="cascading-select"
              value={form.status} onChange={e => updateField('status', e.target.value)}>
              <option value="New">New</option>
              <option value="Old">Old</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Somiti Name (optional)</label>
            <input className="input-field" placeholder="Somiti/Group name"
              value={form.somitiName} onChange={e => updateField('somitiName', e.target.value)} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
          <CascadingLocationSelect value={form.location} onChange={updateLocation} />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Register Member'}
        </button>
      </form>
    </div>
  );
}
