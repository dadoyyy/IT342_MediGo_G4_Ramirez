import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, Stethoscope } from 'lucide-react';
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

export default function MyAppointments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    authApi.me().then(r => setUser(r.data?.data ?? r.data)).catch(() => {});
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
    } catch { alert('Failed to cancel. Please try again.'); }
    finally { setCancelling(null); }
  }

  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <AppShell user={user}>
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>My Appointments</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              {appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => navigate('/home')} className="mg-btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>
            <Plus size={14} /> Book New
          </button>
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filter === f
                ? { background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', color: '#fff' }
                : { background: '#fff', border: '1.5px solid #E5E7EB', color: '#6B7280' }
              }>
              {f === 'ALL' ? `All (${appointments.length})` : STATUS_META[f]?.label}
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
              <Calendar size={22} style={{ color: '#14B8A6' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: '#374151' }}>No appointments</p>
            <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>Book your first appointment today</p>
            <button onClick={() => navigate('/home')} className="mg-btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Find a Doctor
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayed.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
              const canCancel = appt.status === 'PENDING_DOCTOR_APPROVAL' || appt.status === 'CONFIRMED';
              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#F0FDFA', border: '1.5px solid #CCFBF1' }}>
                        <Stethoscope size={16} style={{ color: '#14B8A6' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={meta.cls}>{meta.label}</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#1F2937' }}>Dr. {appt.doctorName}</p>
                        {appt.appointmentType && (
                          <p className="text-xs mt-0.5 font-medium" style={{ color: '#14B8A6' }}>{appt.appointmentType}</p>
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
                    {canCancel && (
                      <button onClick={() => handleCancel(appt.id)} disabled={cancelling === appt.id}
                        className="text-xs font-semibold flex-shrink-0 transition-colors"
                        style={{ color: '#EF4444', background: 'none', border: 'none', padding: 0 }}>
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
