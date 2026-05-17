import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Stethoscope, AlertCircle } from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';
import { useToast } from '../../../shared/ui/ToastProvider';

const STATUS_META = {
  PENDING_DOCTOR_APPROVAL: { label: 'Pending Approval', cls: 'badge-pending' },
  CONFIRMED:               { label: 'Confirmed',        cls: 'badge-confirmed' },
  COMPLETED:               { label: 'Completed',        cls: 'badge-completed' },
  CANCELLED:               { label: 'Cancelled',        cls: 'badge-cancelled' },
  REJECTED:                { label: 'Rejected',         cls: 'badge-rejected' },
};

function fmtDt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const FILTERS = ['ALL', 'PENDING_DOCTOR_APPROVAL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

export default function MyAppointments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const { addToast } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);

  useEffect(() => {
    authApi.me().then(r => { const u = r.data?.data ?? r.data; setUser(u); authSession.setUser(u); }).catch(() => {});
    
    setLoading(true);
    appointmentApi.listMine().then(r => {
      const list = r.data?.data ?? r.data;
      setAppointments(Array.isArray(list) ? list : []);
    }).catch(() => {
      setAppointments([]);
    }).finally(() => setLoading(false));
  }, []);

  function triggerCancel(id) {
    setSelectedApptId(id);
    setShowCancelModal(true);
  }

  async function confirmCancel() {
    if (!selectedApptId) return;
    setCancelling(selectedApptId);
    setShowCancelModal(false);
    try {
      await appointmentApi.cancel(selectedApptId);
      setAppointments(prev => prev.map(a => a.id === selectedApptId ? { ...a, status: 'CANCELLED' } : a));
      addToast('Appointment cancelled successfully.', 'success');
    } catch {
      addToast('Failed to cancel appointment. Please try again.', 'error');
    } finally {
      setCancelling(null);
      setSelectedApptId(null);
    }
  }

  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const sortedDisplayed = [...displayed].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.appointmentAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.appointmentAt || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#2B2D42', margin: '0 0 6px', letterSpacing: '-0.04em' }}>
              Your Consultations
            </h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 600 }}>Track your medical journey and manage your appointments</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/home')} 
            className="mg-btn" 
            style={{ padding: '12px 24px', fontSize: 13, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Plus size={16} /> New Booking
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={filter === f
                ? { padding: '10px 20px', borderRadius: 16, fontSize: 12, fontWeight: 700, background: '#2B2D42', color: '#fff', border: '1px solid #2B2D42', cursor: 'pointer', boxShadow: '0 8px 20px rgba(43,45,66,0.15)', transition: 'all 0.2s' }
                : { padding: '10px 20px', borderRadius: 16, fontSize: 12, fontWeight: 700, background: '#fff', border: '1px solid rgba(43,45,66,0.06)', color: '#8D99AE', cursor: 'pointer', transition: 'all 0.2s' }
              }>
              {f === 'ALL' ? `All (${appointments.length})` : STATUS_META[f]?.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : sortedDisplayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)' }}>
              <Calendar size={22} style={{ color: 'rgba(239,35,60,0.4)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#2B2D42', marginBottom: 4 }}>No appointments</p>
            <p style={{ fontSize: 14, color: '#8D99AE', marginBottom: 16 }}>Book your first appointment today</p>
            <button onClick={() => navigate('/home')} className="mg-btn" style={{ padding: '10px 20px', fontSize: 13 }}>
              Find a Doctor
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sortedDisplayed.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
              const canCancel = appt.status === 'PENDING_DOCTOR_APPROVAL' || appt.status === 'CONFIRMED';
              
              const statusColors = {
                PENDING_DOCTOR_APPROVAL: { bg: 'rgba(245,158,11,0.08)', text: '#D97706', border: 'rgba(245,158,11,0.2)' },
                CONFIRMED: { bg: 'rgba(34,197,94,0.08)', text: '#16A34A', border: 'rgba(34,197,94,0.2)' },
                COMPLETED: { bg: 'rgba(59,130,246,0.08)', text: '#2563EB', border: 'rgba(59,130,246,0.2)' },
                CANCELLED: { bg: 'rgba(239,35,60,0.08)', text: '#EF233C', border: 'rgba(239,35,60,0.2)' },
                REJECTED: { bg: 'rgba(43,45,66,0.08)', text: '#2B2D42', border: 'rgba(43,45,66,0.2)' },
              }[appt.status] || { bg: 'rgba(43,45,66,0.05)', text: '#8D99AE', border: 'rgba(43,45,66,0.1)' };

              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card" style={{ padding: 32, borderRadius: 32, border: '1px solid rgba(43,45,66,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(239,35,60,0.04)', border: '1px solid rgba(239,35,60,0.1)' }}>
                        <Stethoscope size={24} style={{ color: '#EF233C' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <span style={{ 
                            fontSize: 10, 
                            fontWeight: 900, 
                            padding: '4px 12px', 
                            borderRadius: 8, 
                            background: statusColors.bg, 
                            color: statusColors.text, 
                            border: `1px solid ${statusColors.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {meta.label}
                          </span>
                          {appt.appointmentType && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase' }}>
                              • {appt.appointmentType} Consultation
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 20, fontWeight: 900, color: '#2B2D42', marginBottom: 4, letterSpacing: '-0.02em' }}>Dr. {appt.doctorName}</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'rgba(43,45,66,0.03)', border: '1px solid rgba(43,45,66,0.05)' }}>
                            <Clock size={13} style={{ color: '#8D99AE' }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2B2D42' }}>{fmtDt(appt.appointmentAt)}</span>
                          </div>
                        </div>

                        {appt.notes && (
                          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 16, background: 'rgba(43,45,66,0.02)', borderLeft: '3px solid #EF233C' }}>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>"{appt.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {canCancel && (
                      <motion.button 
                        whileHover={{ scale: 1.05, color: '#EF233C' }}
                        onClick={() => triggerCancel(appt.id)} 
                        disabled={cancelling === appt.id}
                        style={{ fontSize: 12, fontWeight: 800, color: '#8D99AE', background: 'none', border: 'none', padding: '8px', flexShrink: 0, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      >
                        {cancelling === appt.id ? 'Processing…' : 'Cancel Appointment'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="logout-modal-overlay"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="logout-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="logout-modal-icon" style={{ background: 'rgba(239,35,60,0.08)', borderColor: 'rgba(239,35,60,0.15)' }}>
                <AlertCircle size={24} style={{ color: '#EF233C' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', margin: '0 0 6px', textAlign: 'center' }}>
                Cancel Consultation?
              </h3>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
                Are you sure you want to cancel this consultation? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="mg-btn-ghost"
                  style={{ flex: 1, padding: '11px 20px', borderRadius: 12 }}
                >
                  No, Keep
                </button>
                <button
                  onClick={confirmCancel}
                  style={{
                    flex: 1, padding: '11px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: 'linear-gradient(135deg, #EF233C, #D90429)', border: 'none',
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
