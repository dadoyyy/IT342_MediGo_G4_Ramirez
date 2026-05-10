import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
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
    { label: 'Total',     value: appointments.length,                                                    color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Pending',   value: appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length, color: '#D97706', bg: '#FEF3C7' },
    { label: 'Confirmed', value: appointments.filter(a => a.status === 'CONFIRMED').length,               color: '#0D9488', bg: '#CCFBF1' },
    { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,               color: '#16A34A', bg: '#DCFCE7' },
  ];

  return (
    <AppShell user={user}>
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>My Schedule</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Manage your patient appointments</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filter === f
                ? { background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', color: '#fff' }
                : { background: '#fff', border: '1.5px solid #E5E7EB', color: '#6B7280' }
              }>
              {f === 'ALL' ? 'All' : STATUS_META[f]?.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
          </div>
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F0FDFA', border: '1.5px solid #CCFBF1' }}>
              <TrendingUp size={22} style={{ color: '#14B8A6' }} />
            </div>
            <p className="font-semibold" style={{ color: '#374151' }}>No appointments here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayed.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: '#EEF2FF', color: '#6366F1' }}>
                        {appt.patientName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={meta.cls}>{meta.label}</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#1F2937' }}>{appt.patientName}</p>
                        {appt.appointmentType && (
                          <p className="text-xs mt-0.5 font-medium" style={{ color: '#8B93FF' }}>{appt.appointmentType}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={11} style={{ color: '#9CA3AF' }} />
                          <span className="text-xs" style={{ color: '#6B7280' }}>{fmtDt(appt.appointmentAt)}</span>
                        </div>
                        {appt.notes && (
                          <p className="text-xs mt-2 italic" style={{ color: '#9CA3AF' }}>"{appt.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <>
                          <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} disabled={updating === appt.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: '#CCFBF1', color: '#0D9488', border: '1px solid #99F6E4' }}>
                            <CheckCircle size={12} /> Confirm
                          </button>
                          <button onClick={() => updateStatus(appt.id, 'REJECTED')} disabled={updating === appt.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0' }}>
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
