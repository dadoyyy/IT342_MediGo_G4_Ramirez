import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, BadgeCheck, Calendar, Clock, Stethoscope, CheckCircle } from 'lucide-react';
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
      setDoctor((Array.isArray(list) ? list : []).find(d => String(d.doctorId) === String(doctorId)) || null);
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
      await appointmentApi.create({ doctorId: Number(doctorId), appointmentAt: `${booking.date}T${booking.time}:00`, appointmentType: booking.appointmentType.trim(), notes: booking.notes.trim() || undefined });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data?.error?.message || err.response.data?.message || 'Booking failed.');
      } else { setApiError('Unable to connect. Please try again.'); }
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FC' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FC' }}>
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
          <Stethoscope size={22} style={{ color: '#EF4444' }} />
        </div>
        <p className="font-semibold" style={{ color: '#1F2937' }}>Doctor not found</p>
        <button onClick={() => navigate('/home')} className="mg-btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
          Back to Search
        </button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F7F9FC' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="card rounded-3xl p-10 max-w-sm w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: '#DCFCE7', border: '1.5px solid #BBF7D0' }}>
          <CheckCircle size={28} style={{ color: '#16A34A' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>Appointment Requested!</h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
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
    <div className="min-h-screen" style={{ background: '#F7F9FC' }}>
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center gap-3 bg-white"
        style={{ borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(31,41,55,0.04)' }}>
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)' }}>
            <Stethoscope size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm" style={{ color: '#1F2937' }}>MediGo</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Doctor card */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-5">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #CCFBF1, #EDE9FE)', color: '#0D9488' }}>
              {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold" style={{ color: '#1F2937' }}>Dr. {doctor.doctorName}</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
                  <BadgeCheck size={11} style={{ color: '#16A34A' }} />
                  <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>Verified</span>
                </div>
              </div>
              {doctor.specialization && (
                <p className="text-sm font-medium mb-2" style={{ color: '#14B8A6' }}>{doctor.specialization}</p>
              )}
              {doctor.clinicName && (
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={12} style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>{doctor.clinicName}</p>
                </div>
              )}
              {doctor.clinicAddress && (
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{doctor.clinicAddress}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Book */}
        <AnimatePresence mode="wait">
          {!showBooking ? (
            <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBooking(true)} className="mg-btn-primary w-full" style={{ padding: '15px' }}>
              <Calendar size={16} /> Book Appointment
            </motion.button>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card p-6">
              <h2 className="text-base font-bold mb-5" style={{ color: '#1F2937' }}>Book an Appointment</h2>

              <AnimatePresence>
                {apiError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <span>⚠</span><span>{apiError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleBook} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold" style={{ color: '#374151' }}>Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                      <input type="date" min={getTodayStr()} value={booking.date}
                        onChange={e => { setBooking(p => ({ ...p, date: e.target.value })); setBookingErrors(p => ({ ...p, date: undefined })); }}
                        className={`mg-input pl-10 ${bookingErrors.date ? 'error' : ''}`} />
                    </div>
                    {bookingErrors.date && <p className="text-xs" style={{ color: '#EF4444' }}>{bookingErrors.date}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold" style={{ color: '#374151' }}>Time</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                      <input type="time" value={booking.time}
                        onChange={e => { setBooking(p => ({ ...p, time: e.target.value })); setBookingErrors(p => ({ ...p, time: undefined })); }}
                        className={`mg-input pl-10 ${bookingErrors.time ? 'error' : ''}`} />
                    </div>
                    {bookingErrors.time && <p className="text-xs" style={{ color: '#EF4444' }}>{bookingErrors.time}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" style={{ color: '#374151' }}>
                    Reason for Visit <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input type="text" value={booking.appointmentType}
                    onChange={e => { setBooking(p => ({ ...p, appointmentType: e.target.value })); setBookingErrors(p => ({ ...p, appointmentType: undefined })); }}
                    placeholder="e.g. General check-up, Follow-up, Consultation"
                    className={`mg-input ${bookingErrors.appointmentType ? 'error' : ''}`} />
                  {bookingErrors.appointmentType && <p className="text-xs" style={{ color: '#EF4444' }}>{bookingErrors.appointmentType}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" style={{ color: '#374151' }}>
                    Notes <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
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
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Booking…</>
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
