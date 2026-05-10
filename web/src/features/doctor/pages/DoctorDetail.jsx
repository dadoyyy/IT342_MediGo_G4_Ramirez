import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doctorApi, appointmentApi } from '../../../shared/api/api';
import axios from 'axios';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ date: '', time: '', appointmentType: '', notes: '' });
  const [bookingErrors, setBookingErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await doctorApi.search('');
        // API returns ApiResponse envelope
        const list = res.data?.data ?? res.data;
        const all = Array.isArray(list) ? list : [];
        const found = all.find((d) => String(d.doctorId) === String(doctorId));
        setDoctor(found || null);
      } catch {
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  function validateBooking() {
    const errors = {};
    if (!booking.date) errors.date = 'Please select a date.';
    else if (booking.date < getTodayStr()) errors.date = 'Date cannot be in the past.';
    if (!booking.time) errors.time = 'Please select a time.';
    if (!booking.appointmentType.trim()) errors.appointmentType = 'Please describe the reason for your visit.';
    return errors;
  }

  async function handleBook(e) {
    e.preventDefault();
    const errors = validateBooking();
    if (Object.keys(errors).length) { setBookingErrors(errors); return; }
    setSubmitting(true);
    setApiError('');
    try {
      // Backend expects LocalDateTime as ISO string: "2026-05-15T10:30:00"
      const appointmentAt = `${booking.date}T${booking.time}:00`;
      await appointmentApi.create({
        doctorId: Number(doctorId),
        appointmentAt,
        appointmentType: booking.appointmentType.trim(),
        notes: booking.notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const msg = err.response.data?.error?.message
          || err.response.data?.message
          || 'Booking failed. Please try again.';
        setApiError(msg);
      } else {
        setApiError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <h2 className="text-lg font-semibold text-gray-800">Doctor not found</h2>
          <button onClick={() => navigate('/home')} className="px-5 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: '#7C2327' }}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm text-center space-y-4 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-gray-900">Appointment Requested!</h2>
          <p className="text-sm text-gray-500">
            Your appointment with Dr. {doctor.doctorName} has been submitted for approval.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/appointments')}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ backgroundColor: '#7C2327' }}
            >
              View Appointments
            </button>
            <button
              onClick={() => navigate('/home')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Find More Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors text-lg">←</button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-xs">⚕</span>
          </div>
          <span className="font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Doctor card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl flex-shrink-0">
              👨‍⚕️
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Dr. {doctor.doctorName}
              </h1>
              {doctor.specialization && (
                <p className="text-sm text-gray-500 mt-0.5">{doctor.specialization}</p>
              )}
              {doctor.clinicName && (
                <p className="text-sm text-gray-400 mt-1">🏥 {doctor.clinicName}</p>
              )}
              {doctor.clinicAddress && (
                <p className="text-sm text-gray-400 mt-0.5">📍 {doctor.clinicAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Book appointment */}
        {!showBooking ? (
          <button
            onClick={() => setShowBooking(true)}
            className="w-full min-h-[48px] rounded-xl text-white font-semibold text-sm shadow-md shadow-rose-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: '#7C2327' }}
          >
            Book Appointment
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Book an Appointment</h2>

            {apiError && (
              <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <span>⚠</span><span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleBook} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    min={getTodayStr()}
                    value={booking.date}
                    onChange={(e) => {
                      setBooking((p) => ({ ...p, date: e.target.value }));
                      setBookingErrors((p) => ({ ...p, date: undefined }));
                    }}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                      bookingErrors.date ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                    }`}
                  />
                  {bookingErrors.date && <p className="text-xs text-red-500">{bookingErrors.date}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={booking.time}
                    onChange={(e) => {
                      setBooking((p) => ({ ...p, time: e.target.value }));
                      setBookingErrors((p) => ({ ...p, time: undefined }));
                    }}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                      bookingErrors.time ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                    }`}
                  />
                  {bookingErrors.time && <p className="text-xs text-red-500">{bookingErrors.time}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Reason for Visit <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={booking.appointmentType}
                  onChange={(e) => {
                    setBooking((p) => ({ ...p, appointmentType: e.target.value }));
                    setBookingErrors((p) => ({ ...p, appointmentType: undefined }));
                  }}
                  placeholder="e.g. General check-up, Follow-up, Consultation"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                    bookingErrors.appointmentType ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                  }`}
                />
                {bookingErrors.appointmentType && <p className="text-xs text-red-500">{bookingErrors.appointmentType}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={booking.notes}
                  onChange={(e) => setBooking((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Describe your symptoms or any additional information…"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-all"
                  style={{ backgroundColor: '#7C2327' }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Booking…
                    </span>
                  ) : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
