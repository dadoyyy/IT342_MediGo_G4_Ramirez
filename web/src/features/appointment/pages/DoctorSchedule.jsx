import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, appointmentApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';

const STATUS_LABELS = {
  PENDING_DOCTOR_APPROVAL: { label: 'Pending Approval', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  CONFIRMED:               { label: 'Confirmed',        color: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED:               { label: 'Completed',        color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED:               { label: 'Cancelled',        color: 'bg-gray-100 text-gray-500 border-gray-200' },
  REJECTED:                { label: 'Rejected',         color: 'bg-red-50 text-red-600 border-red-200' },
};

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

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
        const [meRes, apptRes] = await Promise.all([
          authApi.me(),
          appointmentApi.listMine(),
        ]);
        setUser(meRes.data?.data ?? meRes.data);
        const list = apptRes.data?.data ?? apptRes.data;
        setAppointments(Array.isArray(list) ? list : []);
      } catch {
        // interceptor handles 401
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      await appointmentApi.updateStatus(id, { status });
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status } : a)
      );
    } catch {
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  const filters = ['ALL', 'PENDING_DOCTOR_APPROVAL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];
  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-sm">⚕</span>
          </div>
          <span className="text-lg font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/chat')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Messages
          </button>
        </nav>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600 hidden sm:block">Dr. {user.fullName}</span>}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your patient appointments.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',     value: appointments.length,                                                icon: '📋' },
            { label: 'Pending',   value: appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length, icon: '⏳' },
            { label: 'Confirmed', value: appointments.filter(a => a.status === 'CONFIRMED').length,          icon: '✅' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,          icon: '🏁' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={filter === f ? { backgroundColor: '#7C2327' } : {}}
            >
              {f === 'ALL' ? 'All' : STATUS_LABELS[f]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-sm">No appointments in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((appt) => {
              const statusInfo = STATUS_LABELS[appt.status] || { label: appt.status, color: 'bg-gray-100 text-gray-500 border-gray-200' };
              return (
                <div key={appt.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{appt.patientName}</p>
                      {appt.appointmentType && (
                        <p className="text-xs text-gray-500 mt-0.5">{appt.appointmentType}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        📅 {formatDateTime(appt.appointmentAt)}
                      </p>
                      {appt.notes && (
                        <p className="text-xs text-gray-400 mt-2 italic">"{appt.notes}"</p>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                          disabled={updating === appt.id}
                          className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50 transition-all"
                          style={{ backgroundColor: '#7C2327' }}
                        >
                          Confirm
                        </button>
                      )}
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'REJECTED')}
                          disabled={updating === appt.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50 transition-all"
                        >
                          Reject
                        </button>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'COMPLETED')}
                          disabled={updating === appt.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium disabled:opacity-50 transition-all"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
