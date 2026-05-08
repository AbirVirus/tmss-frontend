import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi, loanApi } from '../services/api';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMember();
    loadLoans();
  }, [id]);

  async function loadMember() {
    try {
      const { data } = await memberApi.getById(id);
      setMember(data.member);
      if (data.loans) setLoans(data.loans);
    } catch (e) {
      navigate('/members');
    }
    setLoading(false);
  }

  async function loadLoans() {
    try {
      const { data } = await loanApi.getAll({ memberId: id });
      setLoans(data.loans);
    } catch (e) { /* offline */ }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-primary-600 font-semibold text-sm flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{member.name}</h2>
            <p className="text-sm text-gray-500">{member.memberId}</p>
          </div>
          <span className={member.status === 'New' ? 'badge-blue' : 'badge-green'}>{member.status}</span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Phone</p>
            <p className="font-semibold">{member.phone}</p>
          </div>
          {member.somitiName && (
            <div>
              <p className="text-gray-400 text-xs">Somiti</p>
              <p className="font-semibold">{member.somitiName}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-gray-400 text-xs">Location</p>
          <p className="font-medium text-sm">
            {[
              member.location?.para, member.location?.village, member.location?.union,
              member.location?.upazila, member.location?.district, member.location?.division
            ].filter(Boolean).join(' > ')}
          </p>
        </div>
      </div>

      <h3 className="font-bold text-gray-700">Active Loans ({loans.filter(l => l.status === 'active').length})</h3>

      {loans.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No loans found</p>
      ) : (
        <div className="space-y-2">
          {loans.map(loan => (
            <div key={loan._id} className="card space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">{loan.loanId}</span>
                <span className={`text-xs ${loan.status === 'active' ? 'badge-yellow' : loan.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                  {loan.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Principal:</span> ৳{loan.principalAmount?.toLocaleString()}</div>
                <div><span className="text-gray-400">Interest:</span> {loan.interestRate}%</div>
                <div><span className="text-gray-400">Total Payable:</span> ৳{loan.totalPayable?.toLocaleString()}</div>
                <div><span className="text-gray-400">Total Paid:</span> ৳{loan.totalPaid?.toLocaleString()}</div>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Remaining: ৳{loan.remainingBalance?.toLocaleString()}</span>
                <span>{loan.installments?.filter(i => i.status === 'paid').length}/{loan.totalInstallments} paid</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/loans/add', { state: { memberId: member._id } })}
        className="btn-primary">
        + New Loan for {member.name}
      </button>
    </div>
  );
}
