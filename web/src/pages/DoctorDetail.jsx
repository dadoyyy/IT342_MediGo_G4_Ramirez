import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { appointmentApi, doctorApi } from '../api/api';

const RED = '#7C2327';

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    appointmentAt: '',
    appointmentType: 'Initial Check-up',
    notes: '',
  });

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  async function loadDoctor() {
    setLoading(true);
    setError('');
    try {
      const res = await doctorApi.search('');
      const found = (res.data.data || []).find((d) => String(d.doctorId) === String(doctorId));
      if (!found) {
        setError('Doctor not found or not available for booking.');
        setDoctor(null);
      } else {
        setDoctor(found);
      }
    } catch (err) {
      setError(friendlyError(err, 'Unable to load doctor details.'));
    } finally {
      setLoading(false);
    }
  }

  const nextSevenDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push(d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
    }
    return days;
  }, []);

  async function handleConfirmBooking(e) {
    e.preventDefault();
    setMessage('');

    if (!form.appointmentAt) {
      setMessage('Please choose an appointment date and time.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentApi.create({
        doctorId: Number(doctorId),
        appointmentAt: `${form.appointmentAt}:00`,
        appointmentType: form.appointmentType,
        notes: form.notes,
      });
      setMessage('Appointment requested successfully. Redirecting to My Appointments...');
      setTimeout(() => navigate('/appointments'), 1200);
    } catch (err) {
      setMessage(friendlyError(err, 'Unable to confirm booking.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f3f3] px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/home" className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50">
          Back
        </Link>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading doctor details...</p>}

        {!loading && error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div>
        )}

        {!loading && doctor && (
          <div className="mt-4 grid lg:grid-cols-[1fr,1.1fr] gap-4">
            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: RED }}>
                  {doctor.doctorName?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-800">{doctor.doctorName}</h1>
                  <p className="text-sm text-slate-600">{doctor.specialization}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-700">Clinic:</span> {doctor.clinicName}</p>
                <p><span className="font-semibold text-slate-700">Address:</span> {doctor.clinicAddress}</p>
                <p><span className="font-semibold text-slate-700">Bio:</span> Experienced physician focused on evidence-based patient care and continuous follow-up.</p>
                <p><span className="font-semibold text-slate-700">Qualifications:</span> Licensed Doctor, Active Verification Status</p>
              </div>

              <div className="mt-5">
                <h2 className="text-sm font-semibold text-slate-800">Interactive Calendar (Next 7 days)</h2>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {nextSevenDays.map((d) => (
                    <div key={d} className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 bg-slate-50">{d}</div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-slate-800">Confirm Booking</h2>
              <p className="text-sm text-slate-500 mt-1">Select preferred schedule and appointment type.</p>

              <form onSubmit={handleConfirmBooking} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.appointmentAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, appointmentAt: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Appointment Type</label>
                  <select
                    value={form.appointmentType}
                    onChange={(e) => setForm((prev) => ({ ...prev, appointmentType: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option>Initial Check-up</option>
                    <option>Follow-up</option>
                    <option>Consultation</option>
                    <option>Vaccination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: RED }}
                >
                  {submitting ? 'Submitting...' : 'Confirm Booking'}
                </button>
              </form>

              {message && <p className="mt-3 text-sm" style={{ color: message.includes('successfully') ? '#065f46' : '#b91c1c' }}>{message}</p>}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
