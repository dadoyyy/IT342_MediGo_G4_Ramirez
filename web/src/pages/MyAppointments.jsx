import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { appointmentApi, authApi } from '../api/api';

const RED = '#7C2327';

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

function statusClass(status) {
  const map = {
    PENDING_DOCTOR_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    COMPLETED: 'bg-stone-100 text-stone-700 border-stone-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatStatus(status) {
  return (status || '').replaceAll('_', ' ').toLowerCase();
}

export default function MyAppointments() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    setLoading(true);
    setError('');
    try {
      const [meRes, apptRes] = await Promise.all([authApi.me(), appointmentApi.listMine()]);
      setUser(meRes.data.data || null);
      setAppointments(apptRes.data.data || []);
    } catch (err) {
      setError(friendlyError(err, 'Unable to load appointments.'));
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(id) {
    try {
      await appointmentApi.cancel(id);
      await bootstrap();
    } catch (err) {
      setError(friendlyError(err, 'Unable to cancel appointment.'));
    }
  }

  function startReschedule(appointment) {
    globalThis.location.href = `/dashboard?edit=${appointment.id}`;
  }

  const filtered = useMemo(() => {
    if (tab === 'upcoming') {
      return appointments.filter((a) => ['PENDING_DOCTOR_APPROVAL', 'CONFIRMED'].includes(a.status));
    }
    if (tab === 'completed') {
      return appointments.filter((a) => a.status === 'COMPLETED');
    }
    return appointments.filter((a) => ['CANCELLED', 'REJECTED'].includes(a.status));
  }, [appointments, tab]);

  return (
    <div className="min-h-screen bg-[#f7f3f3] px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">My Appointments</h1>
            <p className="text-sm text-slate-500">{user?.fullName || 'Patient'} appointment history and management</p>
          </div>
          <Link to="/home" className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50">Back to Home</Link>
        </header>

        <section className="mt-4 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${tab === item.id ? 'text-white border-transparent' : 'bg-white border-slate-300 text-slate-700'}`}
                style={tab === item.id ? { backgroundColor: RED } : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading && <p className="mt-4 text-sm text-slate-500">Loading appointments...</p>}
          {!!error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div>}

          {!loading && !error && (
            <div className="mt-4 space-y-2">
              {filtered.map((appointment) => (
                <article key={appointment.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{appointment.appointmentType}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{new Date(appointment.appointmentAt).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Doctor: {appointment.doctorName}</p>
                    </div>
                    <span className={`text-xs border rounded-full px-2 py-0.5 capitalize ${statusClass(appointment.status)}`}>
                      {formatStatus(appointment.status)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {['PENDING_DOCTOR_APPROVAL', 'CONFIRMED'].includes(appointment.status) && (
                      <>
                        <button onClick={() => startReschedule(appointment)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50">
                          Reschedule
                        </button>
                        <button onClick={() => cancelAppointment(appointment.id)} className="px-3 py-1.5 text-xs rounded-lg text-white" style={{ backgroundColor: RED }}>
                          Cancel
                        </button>
                        <Link to="/chat" className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50">
                          Message Doctor
                        </Link>
                      </>
                    )}
                    {appointment.status === 'COMPLETED' && (
                      <Link to="/chat" className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50">
                        Message Doctor
                      </Link>
                    )}
                  </div>
                </article>
              ))}

              {!filtered.length && <p className="text-sm text-slate-500">No appointments in this tab.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
