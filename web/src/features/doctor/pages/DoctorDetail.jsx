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
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ date: '', time: '', appointmentType: '', notes: '' });
  const [bookingErrors, setBookingErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    doctorApi.search('').then(res => {
      const list = res.data?.data ?? res.data;
      setDoctor((Array.isArray(list) ? list : []).find(d => String(d.doctorId) === String(doctorId)) || null);
    }).catch(() => setDoctor(null)).finally(() => setLoading(false));
  }, [doctorId]);

  function validate() {
    const e = {};
    if (!booking.date) e.date = 'Select a date.';
    else if (booking.date < getTodayStr()) e.date = 'Date cannot be in the past.';
    if (!booking.time) e.time = 'Select a time.';
    if (!booking.appointmentType.trim()) e.appointmentType = 'Describe the reason for your visit.';
    return e;
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
      if (axios.isAxiosError(err) && err.response?.data)
        setApiError(err.response.data?.error?.message || err.response.data?.message || 'Booking failed.');
      else setApiError('Unable to connect. Please try again.');
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
    </div>
  );

  if (!doctor) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)' }}>
          <Stethoscope size={22} style={{ color: 'rgba(255,117,89,0.6)' }} />
        </div>
        <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 16 }}>Doctor not found</p>
        <button onClick={() => navigate('/home')} className="mg-btn" style={{ padding: '10px 20px', fontSize: 13 }}>Back to Search</button>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#0B1020' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="glass" style={{ borderRadius: 24, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)' }}>
          <CheckCircle size={28} style={{ color: '#2EC4B6' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA', marginBottom: 8 }}>Appointment Requested!</h2>
        <p style={{ fontSize: 14, color: '#8892A4', marginBottom: 24 }}>
          Your request with Dr. {doctor.doctorName} has been submitted for approval.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/appointments')} className="mg-btn" style={{ flex: 1, padding: 12, fontSize: 13 }}>View Appointments</button>
          <button onClick={() => navigate('/home')} className="mg-btn-ghost" style={{ flex: 1, padding: 12, fontSize: 13 }}>Find More</button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B1020' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(11,16,32,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892A4', cursor: 'pointer' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
            <Stethoscope size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F7F8FA' }}>MediGo</span>
        </div>
      </header>

      <main style={{ padding: '28px 28px 40px' }}>
        {/* Doctor card */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0, background: 'linear-gradient(135deg, rgba(46,196,182,0.15), rgba(155,140,255,0.15))', color: '#2EC4B6', border: '1px solid rgba(46,196,182,0.2)' }}>
              {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA' }}>Dr. {doctor.doctorName}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)' }}>
                  <BadgeCheck size={10} style={{ color: '#2EC4B6' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#5EEAD4' }}>Verified</span>
                </div>
              </div>
              {doctor.specialization && <p style={{ fontSize: 14, fontWeight: 500, color: '#2EC4B6', marginBottom: 8 }}>{doctor.specialization}</p>}
              {doctor.clinicName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <MapPin size={12} style={{ color: 'rgba(136,146,164,0.4)' }} />
                  <p style={{ fontSize: 13, color: '#8892A4' }}>{doctor.clinicName}</p>
                </div>
              )}
              {doctor.clinicAddress && <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.4)' }}>{doctor.clinicAddress}</p>}
            </div>
          </div>
        </motion.div>

        {/* Book */}
        <AnimatePresence mode="wait">
          {!showBooking ? (
            <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBooking(true)} className="mg-btn w-full" style={{ padding: 15 }}>
              <Calendar size={16} /> Book Appointment
            </motion.button>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass" style={{ borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F7F8FA', marginBottom: 20 }}>Book an Appointment</h2>

              <AnimatePresence>
                {apiError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', fontSize: 13, color: '#FCA5A5' }}>
                    <span>⚠</span><span>{apiError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleBook} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['date','DATE','date',getTodayStr(),null],['time','TIME','time',null,null]].map(([name,label,type,min]) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.04em' }}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        {name === 'date' ? <Calendar size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} /> : <Clock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} />}
                        <input type={type} min={min || undefined} value={booking[name]}
                          onChange={e => { setBooking(p => ({ ...p, [name]: e.target.value })); setBookingErrors(p => ({ ...p, [name]: undefined })); }}
                          className={`mg-input ${bookingErrors[name] ? 'error' : ''}`}
                          style={{ paddingLeft: 40, colorScheme: 'dark' }} />
                      </div>
                      {bookingErrors[name] && <p style={{ fontSize: 12, color: '#FCA5A5' }}>{bookingErrors[name]}</p>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.04em' }}>REASON FOR VISIT <span style={{ color: '#FCA5A5' }}>*</span></label>
                  <input type="text" value={booking.appointmentType}
                    onChange={e => { setBooking(p => ({ ...p, appointmentType: e.target.value })); setBookingErrors(p => ({ ...p, appointmentType: undefined })); }}
                    placeholder="e.g. General check-up, Follow-up, Consultation"
                    className={`mg-input ${bookingErrors.appointmentType ? 'error' : ''}`} />
                  {bookingErrors.appointmentType && <p style={{ fontSize: 12, color: '#FCA5A5' }}>{bookingErrors.appointmentType}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.04em' }}>NOTES <span style={{ fontSize: 11, color: 'rgba(136,146,164,0.35)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea value={booking.notes} onChange={e => setBooking(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Describe your symptoms or any additional information…"
                    rows={3} className="mg-input" style={{ resize: 'none', lineHeight: 1.5 }} />
                </div>

                <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowBooking(false)} className="mg-btn-ghost" style={{ flex: 1, padding: 12 }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="mg-btn" style={{ flex: 1, padding: 12 }}>
                    {submitting ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Booking…</> : 'Confirm Booking'}
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
