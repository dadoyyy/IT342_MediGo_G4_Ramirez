import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { appointmentApi } from '../api/api';

const RED = '#7C2327';

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

function formatStatus(status) {
  return (status || '').replaceAll('_', ' ').toLowerCase();
}

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentApi.listMine();
      setAppointments(res.data.data || []);
    } catch (err) {
      setError(friendlyError(err, 'Unable to load schedule.'));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await appointmentApi.updateStatus(id, { status });
      await loadAppointments();
    } catch (err) {
      setError(friendlyError(err, 'Unable to update appointment status.'));
    }
  }

  const today = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => {
        const d = new Date(a.appointmentAt);
        return d.toDateString() === now.toDateString() && ['PENDING_DOCTOR_APPROVAL', 'CONFIRMED'].includes(a.status);
      })
      .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime());
  }, [appointments]);

  const pendingCount = appointments.filter((a) => a.status === 'PENDING_DOCTOR_APPROVAL').length;

  return (
    <div className="min-h-screen bg-[#f7f3f3] px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
          <h1 className="text-xl font-bold text-slate-800">Doctor Dashboard (Schedule Management)</h1>
          <p className="text-sm text-slate-500 mt-1">Vertical timeline of today's appointments with quick actions.</p>
        </header>

        <section className="mt-4 grid md:grid-cols-2 gap-4">
          <article className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-sm text-slate-500">Total Appointments Today</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{today.length}</p>
          </article>
          <article className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-sm text-slate-500">Pending Requests</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{pendingCount}</p>
          </article>
        </section>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading schedule...</p>}
        {!!error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div>}

        {!loading && (
          <section className="mt-4 bg-white border border-slate-200 rounded-2xl p-4">
            <h2 className="font-semibold text-slate-800">Today Timeline</h2>
            <div className="mt-3 space-y-2">
              {today.map((appointment) => (
                <article key={appointment.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{new Date(appointment.appointmentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {appointment.patientName}</p>
                      <p className="text-xs text-slate-500">{appointment.appointmentType} · {formatStatus(appointment.status)}</p>
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <>
                          <button onClick={() => updateStatus(appointment.id, 'CONFIRMED')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#14532d' }}>
                            Accept
                          </button>
                          <button onClick={() => updateStatus(appointment.id, 'REJECTED')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: RED }}>
                            Decline
                          </button>
                        </>
                      )}
                      {appointment.status === 'CONFIRMED' && (
                        <button onClick={() => updateStatus(appointment.id, 'COMPLETED')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: RED }}>
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {!today.length && <p className="text-sm text-slate-500">No appointments in today's timeline.</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
