import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, Stethoscope } from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

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

  useEffect(() => {
    authApi.me().then(r => { const u = r.data?.data ?? r.data; setUser(u); authSession.setUser(u); }).catch(() => {});
    appointmentApi.listMine().then(r => {
      const list = r.data?.data ?? r.data;
      setAppointments(Array.isArray(list) ? list : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleCancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      await appointmentApi.cancel(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch { alert('Failed to cancel.'); }
    finally { setCancelling(null); }
  }

  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA' }}>My Appointments</h1>
            <p style={{ fontSize: 14, color: '#8892A4', marginTop: 4 }}>
              {appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => navigate('/home')} className="mg-btn" style={{ padding: '10px 16px', fontSize: 13 }}>
            <Plus size={14} /> Book New
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={filter === f
                ? { padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,196,182,0.25)', transition: 'all 0.2s' }
                : { padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(136,146,164,0.75)', cursor: 'pointer', transition: 'all 0.2s' }
              }>
              {f === 'ALL' ? `All (${appointments.length})` : STATUS_META[f]?.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(155,140,255,0.08)', border: '1px solid rgba(155,140,255,0.15)' }}>
              <Calendar size={22} style={{ color: 'rgba(155,140,255,0.5)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 4 }}>No appointments</p>
            <p style={{ fontSize: 14, color: '#8892A4', marginBottom: 16 }}>Book your first appointment today</p>
            <button onClick={() => navigate('/home')} className="mg-btn" style={{ padding: '10px 20px', fontSize: 13 }}>
              Find a Doctor
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
              const canCancel = appt.status === 'PENDING_DOCTOR_APPROVAL' || appt.status === 'CONFIRMED';
              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)' }}>
                        <Stethoscope size={16} style={{ color: '#2EC4B6' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 6 }}>
                          <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA' }}>Dr. {appt.doctorName}</p>
                        {appt.appointmentType && (
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#2EC4B6', marginTop: 2 }}>{appt.appointmentType}</p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <Clock size={11} style={{ color: 'rgba(136,146,164,0.4)' }} />
                          <span style={{ fontSize: 12, color: '#8892A4' }}>{fmtDt(appt.appointmentAt)}</span>
                        </div>
                        {appt.notes && (
                          <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.45)', marginTop: 8, fontStyle: 'italic' }}>"{appt.notes}"</p>
                        )}
                      </div>
                    </div>
                    {canCancel && (
                      <button onClick={() => handleCancel(appt.id)} disabled={cancelling === appt.id}
                        style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,117,89,0.75)', background: 'none', border: 'none', padding: 0, flexShrink: 0, cursor: 'pointer' }}>
                        {cancelling === appt.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
