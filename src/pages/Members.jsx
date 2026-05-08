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
      setTotal(offline.length);
    }
    setLoading(false);
  }

  function handleSearch() {
    setPage(1);
    loadMembers();
  }

  return (
    <div className="space-y-4 page-transition">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Members</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <NavLink to="/members/add" className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:bg-teal-700 transition-colors shadow-sm">
          + New
        </NavLink>
      </div>

      <div className="flex gap-2">
        <input className="input-field flex-1" placeholder="Search name, phone, ID..."
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button onClick={handleSearch} className="bg-teal-600 text-white px-5 rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors">
          Find
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <div className="skeleton skeleton-shimmer h-4 w-36 rounded" />
                <div className="skeleton skeleton-shimmer h-3 w-48 rounded" />
                <div className="skeleton skeleton-shimmer h-3 w-28 rounded" />
              </div>
              <div className="skeleton skeleton-shimmer h-5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-bold text-gray-500 text-lg">No members found</p>
          <p className="text-sm text-gray-400 mt-1">{search ? 'Try a different search' : 'Add your first member to get started'}</p>
          {!search && (
            <NavLink to="/members/add" className="inline-block mt-4 bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold">
              Register First Member
            </NavLink>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {members.map(m => (
              <NavLink key={m._id} to={`/members/${m._id}`}
                className="card flex justify-between items-center active:scale-[0.98] active:bg-gray-50 transition-all duration-200">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-semibold text-gray-800 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.memberId} &middot; {m.phone}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {[m.location?.village, m.location?.para].filter(Boolean).join(' > ') || 'No location'}
                  </p>
                </div>
                <span className={m.status === 'New' ? 'badge-blue text-[11px]' : 'badge-green text-[11px]'}>{m.status}</span>
              </NavLink>
            ))}
          </div>

          {total > 30 && (
            <div className="flex justify-center gap-3 pt-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-30 active:bg-gray-50 transition-colors">
                Previous
              </button>
              <span className="flex items-center text-sm text-gray-500 font-medium">Page {page}</span>
              <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-30 active:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
