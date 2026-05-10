import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Star, Calendar, Clock, FileText, CheckCircle, Stethoscope } from 'lucide-react';
import { doctorApi, appointmentApi, authApi } from '../../../shared/api/api';
import axios from 'axios';

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ date: '', time: '', appointmentType: '', notes: '' });
  const [bookingErrors, setBookingErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    authApi.me().then(r => setUser(r.data?.data ?? r.data)).catch(() => {});
    doctorApi.search('').then(res => {
      const list = res.data?.data ?? res.data;
      const all = Array.isArray(list) ? list : [];
      setDoctor(all.find(d => String(d.doctorId) === String(doctorId)) || null);
    }).catch(() => setDoctor(null)).finally(() => setLoading(false));
  }, [doctorId]);

  function validate() {
    const errors = {};
    if (!booking.date) errors.date = 'Select a date.';
    else if (booking.date < getTodayStr()) errors.date = 'Date cannot be in the past.';
    if (!booking.time) errors.time = 'Select a time.';
    if (!booking.appointmentType.trim()) errors.appointmentType = 'Describe the reason for your visit.';
    return errors;
  }

  async function handleBook(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setBookingErrors(errors); return; }
    setSubmitting(true); setApiError('');
    try {
      await appointmentApi.create({
        doctorId: Number(doctorId),
        appointmentAt: `${booking.date}T${booking.time}:00`,
        appointmentType: booking.appointmentType.trim(),
        notes: booking.notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data?.error?.message || err.response.data?.message || 'Booking failed.');
      } else { setApiError('Unable to connect. Please try again.'); }
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1020' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1020' }}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)' }}>
          <Stethoscope size={24} style={{ color: '#FF5C7A' }} />
        </div>
        <p className="font-semibold" style={{ color: '#F7F8FA' }}>Doctor not found</p>
        <button onClick={() => navigate('/home')} className="mg-btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
          Back to Search
        </button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1020' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 max-w-sm w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(34,211,165,0.15)', border: '1px solid rgba(34,211,165,0.25)' }}>
          <CheckCircle size={28} style={{ color: '#22D3A5' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#F7F8FA' }}>Appointment Requested!</h2>
          <p className="text-sm" style={{ color: 'rgba(247,248,250,0.5)' }}>
            Your request with Dr. {doctor.doctorName} has been submitted for approval.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/appointments')} className="mg-btn-primary flex-1" style={{ padding: '12px', fontSize: '13px' }}>
            View Appointments
          </button>
          <button onClick={() => navigate('/home')} className="mg-btn-ghost flex-1" style={{ padding: '12px', fontSize: '13px' }}>
            Find More
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0B1020' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center gap-3"
        style={{ background: 'rgba(11,16,32,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(247,248,250,0.6)' }}>
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
            <Stethoscope size={14} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm" style={{ color: '#F7F8FA' }}>MediGo</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Doctor card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(46,196,182,0.2), rgba(155,140,255,0.2))', color: '#2EC4B6', border: '1px solid rgba(46,196,182,0.2)' }}>
              {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold" style={{ color: '#F7F8FA' }}>Dr. {doctor.doctorName}</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)' }}>
                  <Star size={10} style={{ color: '#22D3A5', fill: '#22D3A5' }} />
                  <span className="text-xs font-medium" style={{ color: '#22D3A5' }}>Verified</span>
                </div>
              </div>
              {doctor.specialization && (
                <p className="text-sm mb-2" style={{ color: '#2EC4B6' }}>{doctor.specialization}</p>
              )}
              {doctor.clinicName && (
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={12} style={{ color: 'rgba(247,248,250,0.3)' }} />
                  <p className="text-sm" style={{ color: 'rgba(247,248,250,0.5)' }}>{doctor.clinicName}</p>
                </div>
              )}
              {doctor.clinicAddress && (
                <p className="text-xs" style={{ color: 'rgba(247,248,250,0.3)' }}>{doctor.clinicAddress}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Book button / form */}
        <AnimatePresence mode="wait">
          {!showBooking ? (
            <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBooking(true)} className="mg-btn-primary w-full" style={{ padding: '16px' }}>
              <Calendar size={16} /> Book Appointment
            </motion.button>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-3xl p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: '#F7F8FA' }}>Book an Appointment</h2>

              <AnimatePresence>
                {apiError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)', color: '#FF5C7A' }}>
                    <span>⚠</span><span>{apiError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleBook} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(247,248,250,0.3)' }} />
                      <input type="date" min={getTodayStr()} value={booking.date}
                        onChange={e => { setBooking(p => ({ ...p, date: e.target.value })); setBookingErrors(p => ({ ...p, date: undefined })); }}
                        className={`mg-input pl-10 ${bookingErrors.date ? 'error' : ''}`}
                        style={{ colorScheme: 'dark' }} />
                    </div>
                    {bookingErrors.date && <p className="text-xs" style={{ color: '#FF5C7A' }}>{bookingErrors.date}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>Time</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(247,248,250,0.3)' }} />
                      <input type="time" value={booking.time}
                        onChange={e => { setBooking(p => ({ ...p, time: e.target.value })); setBookingErrors(p => ({ ...p, time: undefined })); }}
                        className={`mg-input pl-10 ${bookingErrors.time ? 'error' : ''}`}
                        style={{ colorScheme: 'dark' }} />
                    </div>
                    {bookingErrors.time && <p className="text-xs" style={{ color: '#FF5C7A' }}>{bookingErrors.time}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>
                    Reason for Visit <span style={{ color: '#FF5C7A' }}>*</span>
                  </label>
                  <input type="text" value={booking.appointmentType}
                    onChange={e => { setBooking(p => ({ ...p, appointmentType: e.target.value })); setBookingErrors(p => ({ ...p, appointmentType: undefined })); }}
                    placeholder="e.g. General check-up, Follow-up, Consultation"
                    className={`mg-input ${bookingErrors.appointmentType ? 'error' : ''}`} />
                  {bookingErrors.appointmentType && <p className="text-xs" style={{ color: '#FF5C7A' }}>{bookingErrors.appointmentType}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>
                    Notes <span style={{ color: 'rgba(247,248,250,0.3)' }}>(optional)</span>
                  </label>
                  <textarea value={booking.notes} onChange={e => setBooking(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Describe your symptoms or any additional information…"
                    rows={3} className="mg-input resize-none" style={{ lineHeight: '1.5' }} />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowBooking(false)} className="mg-btn-ghost flex-1" style={{ padding: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="mg-btn-primary flex-1" style={{ padding: '12px' }}>
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(11,16,32,0.3)', borderTopColor: '#0B1020' }} />
                        Booking…
                      </>
                    ) : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
