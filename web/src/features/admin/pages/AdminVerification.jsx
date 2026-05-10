import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';
import api from '../../../shared/api/api';

export default function AdminVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState('');

  async function loadPending() {
    try {
      const res = await api.get('/admin/doctors/pending');
      setPendingDoctors(res.data || []);
    } catch {
      setPendingDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    authApi.me()
      .then((r) => {
        setUser(r.data?.data ?? r.data);
        if ((r.data?.data ?? r.data).role !== 'ADMIN') {
          navigate('/dashboard', { replace: true });
        }
      })
      .catch(() => {});
    loadPending();
  }, [navigate]);

  async function handleAction(doctorId, action) {
    setProcessing(doctorId);
    setMessage('');
    try {
      await api.put(`/admin/doctors/${doctorId}/${action}`);
      setMessage(`Doctor ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setPendingDoctors((prev) => prev.filter((d) => d.userId !== doctorId));
    } catch {
      setMessage('Action failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  }

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-sm">⚕</span>
          </div>
          <span className="text-lg font-bold" style={{ color: '#7C2327' }}>MediGo</span>
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600 hidden sm:block">{user.fullName}</span>}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve pending doctor registrations.</p>
        </div>

        {message && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm border ${
            message.includes('failed') || message.includes('Failed')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            <span>{message.includes('failed') || message.includes('Failed') ? '⚠' : '✅'}</span>
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : pendingDoctors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500 text-sm">No pending verifications. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDoctors.map((doctor) => (
              <div key={doctor.userId} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl flex-shrink-0">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{doctor.email}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {doctor.specialty && <span>🩺 {doctor.specialty}</span>}
                        {doctor.hospital && <span>🏥 {doctor.hospital}</span>}
                        {doctor.licenseNumber && <span>📋 {doctor.licenseNumber}</span>}
                      </div>
                      {doctor.bio && (
                        <p className="text-xs text-gray-400 mt-2 max-w-lg leading-relaxed">{doctor.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(doctor.userId, 'reject')}
                      disabled={processing === doctor.userId}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(doctor.userId, 'approve')}
                      disabled={processing === doctor.userId}
                      className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-all"
                      style={{ backgroundColor: '#7C2327' }}
                    >
                      {processing === doctor.userId ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
