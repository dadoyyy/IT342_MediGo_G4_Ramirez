import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, User, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';

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
        setUser(meRes.data?.data ?? meRes.data);
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
    } catch { alert('Failed to update. Please try again.'); }
    finally { setUpdating(null); }
  }

  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const stats = [
    { label: 'Total',     value: appointments.length,                                                    color: '#9B8CFF' },
    { label: 'Pending',   value: appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length, color: '#F59E0B' },
    { label: 'Confirmed', value: appointments.filter(a => a.status === 'CONFIRMED').length,               color: '#2EC4B6' },
    { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,               color: '#22D3A5' },
  ];

  return (
    <AppShell user={user}>
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F7F8FA' }}>My Schedule</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(247,248,250,0.4)' }}>Manage your patient appointments</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'rgba(247,248,250,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={filter === f
                ? { background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#0B1020', fontWeight: 600 }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(247,248,250,0.5)' }
              }>
              {f === 'ALL' ? 'All' : STATUS_META[f]?.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
              <TrendingUp size={24} style={{ color: 'rgba(46,196,182,0.5)' }} />
            </div>
            <p className="font-medium" style={{ color: 'rgba(247,248,250,0.5)' }}>No appointments here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayed.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF' }}>
                        {appt.patientName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#F7F8FA' }}>{appt.patientName}</p>
                        {appt.appointmentType && (
                          <p className="text-xs mt-0.5" style={{ color: '#9B8CFF' }}>{appt.appointmentType}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={11} style={{ color: 'rgba(247,248,250,0.3)' }} />
                          <span className="text-xs" style={{ color: 'rgba(247,248,250,0.4)' }}>{fmtDt(appt.appointmentAt)}</span>
                        </div>
                        {appt.notes && (
                          <p className="text-xs mt-2 italic" style={{ color: 'rgba(247,248,250,0.3)' }}>"{appt.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <>
                          <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} disabled={updating === appt.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: 'rgba(46,196,182,0.15)', border: '1px solid rgba(46,196,182,0.25)', color: '#2EC4B6' }}>
                            <CheckCircle size={12} /> Confirm
                          </button>
                          <button onClick={() => updateStatus(appt.id, 'REJECTED')} disabled={updating === appt.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)', color: '#FF5C7A' }}>
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: 'rgba(34,211,165,0.15)', border: '1px solid rgba(34,211,165,0.25)', color: '#22D3A5' }}>
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
