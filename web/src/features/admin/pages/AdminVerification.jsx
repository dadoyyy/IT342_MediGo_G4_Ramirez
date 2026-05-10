import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Stethoscope, Building2, MapPin, LogOut, ShieldCheck } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';
import api from '../../../shared/api/api';

export default function AdminVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    authApi.me().then(r => {
      const u = r.data?.data ?? r.data;
      setUser(u);
      if (u?.role !== 'ADMIN') navigate('/dashboard', { replace: true });
    }).catch(() => {});
    api.get('/admin/doctors/pending').then(r => {
      const list = r.data?.data ?? r.data;
      setPending(Array.isArray(list) ? list : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  async function handleAction(doctorId, action) {
    setProcessing(doctorId);
    try {
      await api.put(`/admin/doctors/${doctorId}/${action}`);
      setPending(prev => prev.filter(d => d.userId !== doctorId));
      showToast(`Doctor ${action === 'approve' ? 'approved' : 'rejected'} successfully.`, action === 'approve' ? 'success' : 'error');
    } catch { showToast('Action failed. Please try again.', 'error'); }
    finally { setProcessing(null); }
  }

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F9FC' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
            style={toast.type === 'success'
              ? { background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A' }
              : { background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }
            }>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between bg-white"
        style={{ borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(31,41,55,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)' }}>
            <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="font-bold" style={{ color: '#1F2937' }}>MediGo</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm hidden sm:block" style={{ color: '#6B7280' }}>{user.fullName}</span>}
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#9CA3AF', background: 'none', border: 'none' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE' }}>
              <ShieldCheck size={16} style={{ color: '#6366F1' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>Doctor Verification</h1>
          </div>
          <p className="text-sm" style={{ color: '#6B7280' }}>Review and approve pending doctor registrations</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
          </div>
        ) : pending.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#DCFCE7', border: '1.5px solid #BBF7D0' }}>
              <CheckCircle size={26} style={{ color: '#16A34A' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: '#1F2937' }}>All caught up!</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>No pending verifications at this time.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {pending.map((doctor, i) => (
              <motion.div key={doctor.userId}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #CCFBF1, #EDE9FE)', color: '#0D9488' }}>
                      {(doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`).trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold" style={{ color: '#1F2937' }}>
                        Dr. {doctor.doctorName || `${doctor.firstName} ${doctor.lastName}`}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{doctor.email}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {(doctor.specialization || doctor.specialty) && (
                          <div className="flex items-center gap-1.5">
                            <Stethoscope size={11} style={{ color: '#14B8A6' }} />
                            <span className="text-xs" style={{ color: '#6B7280' }}>{doctor.specialization || doctor.specialty}</span>
                          </div>
                        )}
                        {(doctor.clinicName || doctor.hospital) && (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={11} style={{ color: '#8B93FF' }} />
                            <span className="text-xs" style={{ color: '#6B7280' }}>{doctor.clinicName || doctor.hospital}</span>
                          </div>
                        )}
                        {doctor.clinicAddress && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} style={{ color: '#9CA3AF' }} />
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>{doctor.clinicAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAction(doctor.userId, 'reject')} disabled={processing === doctor.userId}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}>
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handleAction(doctor.userId, 'approve')} disabled={processing === doctor.userId}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A' }}>
                      {processing === doctor.userId
                        ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(22,163,74,0.3)', borderTopColor: '#16A34A' }} />
                        : <CheckCircle size={14} />
                      }
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
