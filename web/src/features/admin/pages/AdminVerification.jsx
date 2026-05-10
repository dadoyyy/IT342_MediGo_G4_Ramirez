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
    <div style={{ minHeight: '100vh', background: '#0B1020' }}>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)', ...(toast.type === 'success' ? { background: 'rgba(46,196,182,0.12)', border: '1px solid rgba(46,196,182,0.25)', color: '#5EEAD4' } : { background: 'rgba(255,117,89,0.12)', border: '1px solid rgba(255,117,89,0.25)', color: '#FCA5A5' }) }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,16,32,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
            <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, color: '#F7F8FA' }}>MediGo</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && <span style={{ fontSize: 13, color: '#8892A4' }} className="hidden sm:block">{user.fullName}</span>}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(136,146,164,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)' }}>
              <ShieldCheck size={16} style={{ color: '#9B8CFF' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA' }}>Doctor Verification</h1>
          </div>
          <p style={{ fontSize: 14, color: '#8892A4' }}>Review and approve pending doctor registrations</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : pending.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass" style={{ borderRadius: 24, padding: 48, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
              <CheckCircle size={26} style={{ color: 'rgba(46,196,182,0.6)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 4 }}>All caught up!</p>
            <p style={{ fontSize: 14, color: '#8892A4' }}>No pending verifications at this time.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.map((doctor, i) => (
              <motion.div key={doctor.userId}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, background: 'linear-gradient(135deg, rgba(46,196,182,0.12), rgba(155,140,255,0.12))', color: '#2EC4B6', border: '1px solid rgba(46,196,182,0.15)' }}>
                      {(doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`).trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 2 }}>
                        Dr. {doctor.doctorName || `${doctor.firstName} ${doctor.lastName}`}
                      </p>
                      <p style={{ fontSize: 13, color: '#8892A4', marginBottom: 8 }}>{doctor.email}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {(doctor.specialization || doctor.specialty) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Stethoscope size={11} style={{ color: '#2EC4B6' }} />
                            <span style={{ fontSize: 12, color: '#8892A4' }}>{doctor.specialization || doctor.specialty}</span>
                          </div>
                        )}
                        {(doctor.clinicName || doctor.hospital) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Building2 size={11} style={{ color: '#9B8CFF' }} />
                            <span style={{ fontSize: 12, color: '#8892A4' }}>{doctor.clinicName || doctor.hospital}</span>
                          </div>
                        )}
                        {doctor.clinicAddress && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={11} style={{ color: 'rgba(136,146,164,0.4)' }} />
                            <span style={{ fontSize: 12, color: 'rgba(136,146,164,0.5)' }}>{doctor.clinicAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleAction(doctor.userId, 'reject')} disabled={processing === doctor.userId}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', color: '#FCA5A5', cursor: 'pointer', opacity: processing === doctor.userId ? 0.5 : 1, transition: 'all 0.2s' }}>
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handleAction(doctor.userId, 'approve')} disabled={processing === doctor.userId}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)', color: '#5EEAD4', cursor: 'pointer', opacity: processing === doctor.userId ? 0.5 : 1, transition: 'all 0.2s' }}>
                      {processing === doctor.userId ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(46,196,182,0.3)', borderTopColor: '#2EC4B6' }} /> : <CheckCircle size={14} />}
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
