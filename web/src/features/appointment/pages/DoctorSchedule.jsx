import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
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

export default function DoctorSchedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        const [meRes, apptRes] = await Promise.all([authApi.me(), appointmentApi.listMine()]);
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);
        const list = apptRes.data?.data ?? apptRes.data;
        setAppointments(Array.isArray(list) ? list : []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      await appointmentApi.updateStatus(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { alert('Failed to update.'); }
    finally { setUpdating(null); }
  }

  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const stats = [
    { label: 'Total',     value: appointments.length,                                                    color: '#9B8CFF' },
    { label: 'Pending',   value: appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length, color: '#FCD34D' },
    { label: 'Confirmed', value: appointments.filter(a => a.status === 'CONFIRMED').length,               color: '#2EC4B6' },
    { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,               color: '#86EFAC' },
  ];

  return (
    <AppShell user={user}>
      <div style={{ padding: '32px 24px', maxWidth: 760, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA' }}>My Schedule</h1>
          <p style={{ fontSize: 14, color: '#8892A4', marginTop: 4 }}>Manage your patient appointments</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {stats.map(s => (
            <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.6)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={filter === f
                ? { padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,196,182,0.25)', transition: 'all 0.2s' }
                : { padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(136,146,164,0.75)', cursor: 'pointer', transition: 'all 0.2s' }
              }>
              {f === 'ALL' ? 'All' : STATUS_META[f]?.label}
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
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
              <Activity size={22} style={{ color: 'rgba(46,196,182,0.5)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#F7F8FA' }}>No appointments here</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF' }}>
                        {appt.patientName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 6 }}>
                          <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA' }}>{appt.patientName}</p>
                        {appt.appointmentType && (
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#9B8CFF', marginTop: 2 }}>{appt.appointmentType}</p>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <>
                          <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} disabled={updating === appt.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)', color: '#5EEAD4', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <CheckCircle size={12} /> Confirm
                          </button>
                          <button onClick={() => updateStatus(appt.id, 'REJECTED')} disabled={updating === appt.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', color: '#FCA5A5', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86EFAC', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <CheckCircle size={12} /> Complete
                        </button>
                      )}
                    </div>
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
