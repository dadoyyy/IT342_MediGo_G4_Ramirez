import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../../shared/api/api';

const STATUS_LABELS = {
  PENDING: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState('ALL');

  async function load() {
    try {
      const res = await appointmentApi.listMine();
      setAppointments(res.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      await appointmentApi.cancel(id);
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: 'CANCELLED' } : a)
      );
    } catch {
      alert('Failed to cancel. Please try again.');
    } finally {
      setCancelling(null);
    }
  }

  const filters = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const displayed = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors text-lg">←</button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
              <span className="text-white text-xs">⚕</span>
            </div>
            <span className="font-bold" style={{ color: '#7C2327' }}>MediGo</span>
          </div>
        </div>
        <h1 className="text-base font-semibold text-gray-800">My Appointments</h1>
        <button
          onClick={() => navigate('/home')}
          className="text-sm font-medium hover:underline"
          style={{ color: '#B4232A' }}
        >
          + Book
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
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
              {f === 'ALL' && ` (${appointments.length})`}
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
            <p className="text-sm">No appointments found.</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 px-5 py-2 rounded-xl text-white text-sm font-medium"
              style={{ backgroundColor: '#7C2327' }}
            >
              Find a Doctor
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((appt) => {
              const statusInfo = STATUS_LABELS[appt.status] || { label: appt.status, color: 'bg-gray-100 text-gray-500 border-gray-200' };
              const canCancel = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
              return (
                <div key={appt.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Dr. {appt.doctorFirstName} {appt.doctorLastName}
                      </p>
                      {appt.doctorSpecialty && (
                        <p className="text-xs text-gray-500 mt-0.5">{appt.doctorSpecialty}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>📅 {formatDate(appt.appointmentDate)}</span>
                        {appt.appointmentTime && <span>🕐 {formatTime(appt.appointmentTime)}</span>}
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-gray-400 mt-2 italic">"{appt.notes}"</p>
                      )}
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(appt.id)}
                        disabled={cancelling === appt.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {cancelling === appt.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
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
