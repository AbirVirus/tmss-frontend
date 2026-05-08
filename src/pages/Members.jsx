import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { memberApi } from '../services/api';
import { offlineGetAll } from '../store/db';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadMembers(); }, [page]);

  async function loadMembers() {
    setLoading(true);
    try {
      const { data } = await memberApi.getAll({ search, page, limit: 30 });
      setMembers(data.members);
      setTotal(data.total);
    } catch (e) {
      const offline = await offlineGetAll('members');
      setMembers(offline);
    }
    setLoading(false);
  }

  function handleSearch() {
    setPage(1);
    loadMembers();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-primary-800">Members ({total})</h2>
        <NavLink to="/members/add" className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-primary-700">
          + New
        </NavLink>
      </div>

      <div className="flex gap-2">
        <input className="input-field flex-1" placeholder="Search name, phone, ID..."
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button onClick={handleSearch} className="bg-primary-600 text-white px-4 rounded-xl text-sm font-semibold">
          Find
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-medium">No members found</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {members.map(m => (
              <NavLink key={m._id} to={`/members/${m._id}`}
                className="card flex justify-between items-center active:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.memberId} &middot; {m.phone}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {(m.location?.village || '')}{(m.location?.para ? ' > ' + m.location?.para : '')}
                  </p>
                </div>
                <span className={m.status === 'New' ? 'badge-blue' : 'badge-green'}>{m.status}</span>
              </NavLink>
            ))}
          </div>

          {total > 30 && (
            <div className="flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="btn-outline w-auto px-4 py-2 text-sm disabled:opacity-30">Previous</button>
              <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}
                className="btn-outline w-auto px-4 py-2 text-sm disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
