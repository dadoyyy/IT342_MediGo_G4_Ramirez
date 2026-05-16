import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, BadgeCheck, Calendar, Clock, Stethoscope, CheckCircle, ArrowRight, Banknote, User, Video, ShieldCheck, X } from 'lucide-react';
import { authApi, doctorApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import AuthImage from '../../../shared/ui/AuthImage';
import axios from 'axios';

const getSafeSlots = (doctorId) => {
  try {
    const raw = localStorage.getItem('medigo_doctor_slots');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return (Array.isArray(parsed) ? parsed : []).filter(s => s && s.startTime && Number(s.doctorId) === Number(doctorId));
  } catch { return []; }
};

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ slotId: null, date: '', time: '', appointmentType: '', notes: '' });
  const [bookingErrors, setBookingErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const [user, setUser] = useState(null);

  useEffect(() => {
    authApi.me().then(res => setUser(res.data?.data ?? res.data)).catch(() => {});
    doctorApi.search('').then(res => {
      const list = res.data?.data ?? res.data;
      setDoctor((Array.isArray(list) ? list : []).find(d => String(d.doctorId) === String(doctorId)) || null);
    }).catch(() => setDoctor(null)).finally(() => setLoading(false));
  }, [doctorId]);

  function validate() {
    const e = {};
    if (!booking.slotId) e.slotId = 'Select an available slot.';
    if (!booking.appointmentType.trim()) e.appointmentType = 'Describe the reason for your visit.';
    return e;
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
        notes: booking.notes.trim() || undefined 
      });
      
      const allSlots = JSON.parse(localStorage.getItem('medigo_doctor_slots') || '[]');
      const doctorSlots = Array.isArray(allSlots) ? allSlots : [];
      const updatedSlots = doctorSlots.map(s => s.id === booking.slotId ? { ...s, status: 'Booked' } : s);
      localStorage.setItem('medigo_doctor_slots', JSON.stringify(updatedSlots));
      
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data)
        setApiError(err.response.data?.error?.message || err.response.data?.message || 'Booking failed.');
      else setApiError('Unable to connect. Please try again.');
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDF2F4' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
    </div>
  );

  if (!doctor) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDF2F4' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)' }}>
          <Stethoscope size={22} style={{ color: '#D90429' }} />
        </div>
        <p style={{ fontWeight: 600, color: '#2B2D42', marginBottom: 16 }}>Doctor not found</p>
        <button onClick={() => navigate('/home')} className="mg-btn" style={{ padding: '10px 20px', fontSize: 13 }}>Back to Search</button>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#EDF2F4' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ borderRadius: 24, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(43,45,66,0.08)', boxShadow: '0 8px 32px rgba(43,45,66,0.08)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <CheckCircle size={28} style={{ color: '#16A34A' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Appointment Requested!</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Your request with Dr. {doctor.doctorName} has been submitted for approval.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/appointments')} className="mg-btn" style={{ flex: 1, padding: 12, fontSize: 13 }}>View Appointments</button>
          <button onClick={() => navigate('/home')} className="mg-btn-ghost" style={{ flex: 1, padding: 12, fontSize: 13 }}>Find More</button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <AppShell user={user}>
      {/* Centered Booking Modal */}
      <AnimatePresence>
        {showBooking && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowBooking(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 40, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(43,45,66,0.2)' }}
            >
              {/* Modal Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(43,45,66,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>Choose Appointment Slot</h2>
                  <p style={{ fontSize: 12, color: '#8D99AE', margin: '4px 0 0', fontWeight: 600 }}>Select your preferred date and clinical time</p>
                </div>
                <button onClick={() => setShowBooking(false)} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(43,45,66,0.04)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8D99AE' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 32, scrollbarWidth: 'none' }}>
                <form onSubmit={handleBook} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  
                  {/* Date Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#2B2D42', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={14} style={{ color: '#EF233C' }} /> 1. SELECT CONSULTATION DATE
                    </label>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
                      {(() => {
                        const slots = getSafeSlots(doctorId).filter(s => s.status === 'Available');
                        const uniqueDates = [...new Set(slots.map(s => s.date))].sort();
                        
                        if (uniqueDates.length === 0) return (
                          <div style={{ padding: '24px', borderRadius: 20, background: 'rgba(43,45,66,0.02)', border: '1px dashed rgba(43,45,66,0.1)', width: '100%', textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, fontWeight: 600 }}>No upcoming availability slots found.</p>
                          </div>
                        );

                        return uniqueDates.map(d => {
                          const dateObj = new Date(d);
                          const isSelected = booking.date === d;
                          return (
                            <motion.div key={d} 
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => { setBooking(p => ({ ...p, date: d, slotId: null, time: '' })); setBookingErrors({}); }}
                              style={{
                                minWidth: 70, padding: '16px 10px', borderRadius: 20, textAlign: 'center', cursor: 'pointer',
                                background: isSelected ? '#2B2D42' : '#F8F9FA',
                                border: isSelected ? '2px solid #2B2D42' : '1px solid rgba(43,45,66,0.06)',
                                boxShadow: isSelected ? '0 8px 24px rgba(43,45,66,0.15)' : 'none',
                                transition: 'all 0.2s'
                              }}>
                              <p style={{ fontSize: 10, fontWeight: 900, color: isSelected ? 'rgba(255,255,255,0.5)' : '#8D99AE', margin: 0, textTransform: 'uppercase' }}>{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                              <p style={{ fontSize: 18, fontWeight: 900, color: isSelected ? '#fff' : '#2B2D42', margin: '4px 0 0' }}>{dateObj.getDate()}</p>
                            </motion.div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Slot Selection */}
                  {booking.date && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 900, color: '#2B2D42', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={14} style={{ color: '#EF233C' }} /> 2. CHOOSE CLINICAL TIME
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        {getSafeSlots(doctorId)
                          .filter(s => s.status === 'Available' && s.date === booking.date)
                          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                          .map(slot => {
                            const isSelected = booking.slotId === slot.id;
                            const isOnline = slot.type === 'Online';
                            const TypeIcon = isOnline ? Video : User;
                            
                            return (
                              <motion.div key={slot.id} 
                                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                                onClick={() => { setBooking(p => ({ ...p, slotId: slot.id, time: slot.startTime })); setBookingErrors({}); }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 20, cursor: 'pointer',
                                  background: isSelected ? 'rgba(239,35,60,0.04)' : '#fff',
                                  border: isSelected ? '2px solid #EF233C' : '1px solid rgba(43,45,66,0.06)',
                                  boxShadow: isSelected ? '0 12px 32px rgba(239,35,60,0.12)' : 'none',
                                  transition: 'all 0.2s'
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 12, background: isSelected ? '#EF233C' : 'rgba(43,45,66,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#fff' : '#8D99AE' }}>
                                    <TypeIcon size={18} />
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 15, fontWeight: 900, color: '#2B2D42', margin: 0 }}>
                                      {(() => {
                                        const [h, m] = slot.startTime.split(':');
                                        const hr = parseInt(h, 10);
                                        return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
                                      })()}
                                    </p>
                                    <p style={{ fontSize: 10, fontWeight: 800, color: isOnline ? '#EF233C' : '#8D99AE', margin: 0, textTransform: 'uppercase' }}>
                                      {isOnline ? 'Online' : 'Face-to-Face'}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && <ShieldCheck size={20} style={{ color: '#EF233C' }} />}
                              </motion.div>
                            );
                          })}
                      </div>
                      {bookingErrors.slotId && <p style={{ fontSize: 11, color: '#EF233C', fontWeight: 700 }}>{bookingErrors.slotId}</p>}
                    </motion.div>
                  )}

                  {/* Clinical Reason */}
                  {booking.slotId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 900, color: '#2B2D42', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Stethoscope size={14} style={{ color: '#EF233C' }} /> 3. CLINICAL REASON
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                        {[
                          'Initial Check-up', 'Follow-up', 'Medical Consultation', 
                          'Lab Result Review', 'Emergency Visit'
                        ].map(reason => {
                          const isSelected = booking.appointmentType === reason;
                          return (
                            <motion.button key={reason} type="button"
                              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                              onClick={() => { setBooking(p => ({ ...p, appointmentType: reason })); setBookingErrors(p => ({ ...p, appointmentType: undefined })); }}
                              style={{
                                padding: '14px 10px', borderRadius: 16, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                                background: isSelected ? 'linear-gradient(135deg, #EF233C, #D90429)' : '#F8F9FA',
                                color: isSelected ? '#fff' : '#2B2D42',
                                border: isSelected ? 'none' : '1px solid rgba(43,45,66,0.06)',
                                boxShadow: isSelected ? '0 8px 20px rgba(239,35,60,0.25)' : 'none',
                                transition: 'all 0.2s'
                              }}>
                              {reason}
                            </motion.button>
                          );
                        })}
                      </div>
                      {bookingErrors.appointmentType && <p style={{ fontSize: 11, color: '#EF233C', fontWeight: 700 }}>{bookingErrors.appointmentType}</p>}
                    </motion.div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(43,45,66,0.06)', background: '#F8F9FA' }}>
                <button type="submit" onClick={handleBook} disabled={submitting || !booking.slotId} 
                  style={{ width: '100%', padding: '18px', borderRadius: 16, background: '#2B2D42', border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', opacity: (submitting || !booking.slotId) ? 0.6 : 1, textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 12px 32px rgba(43,45,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {submitting ? 'Processing...' : 'Confirm Consultation'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Search-Preserving Back Header */}
      <div style={{ padding: '24px 28px 0' }}>
        <motion.button 
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8D99AE', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          <ArrowLeft size={16} /> Back to Search
        </motion.button>
      </div>

      <main style={{ padding: '28px 28px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Hero Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 120, height: 120, borderRadius: 32, overflow: 'hidden', background: 'linear-gradient(135deg, #EF233C, #D90429)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#fff', boxShadow: '0 20px 40px rgba(239,35,60,0.15)' }}>
                  <AuthImage src={doctor.profilePictureUrl} alt={doctor.doctorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={<>{doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}</>} />
                </div>
                <div style={{ position: 'absolute', bottom: -6, right: -6, width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <BadgeCheck size={20} style={{ color: '#16A34A' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 42, fontWeight: 900, color: '#2B2D42', margin: 0, letterSpacing: '-0.04em' }}>Dr. {doctor.doctorName}</h1>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {(doctor.specialization || '').split(',').map((s, i) => (
                    <span key={i} style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 10, background: 'rgba(239,35,60,0.06)', color: '#EF233C', border: '1px solid rgba(239,35,60,0.1)' }}>{s.trim()}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8D99AE' }}>
                    <MapPin size={14} />
                    <span style={{ fontSize: 14 }}>{doctor.clinicAddress || 'Location Undefined'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                    <span style={{ fontSize: 14 }}>Available for Booking</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { label: 'Experience', value: `${doctor.yearsOfExperience || '0'}+ Years`, icon: <Clock size={20} />, color: '#EF233C', bg: 'rgba(239,35,60,0.1)' },
                { label: 'Patients', value: `${doctor.patientCount || '0'}+ Served`, icon: <CheckCircle size={20} />, color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
                { label: 'Consultation Fee', value: `₱${doctor.consultationFee?.toLocaleString() || '---'}`, icon: <Banknote size={20} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  style={{ padding: '28px 24px', borderRadius: 32, background: '#2B2D42', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: '0.05em' }}>{stat.label.toUpperCase()}</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: stat.color, margin: 0, letterSpacing: '-0.02em' }}>{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '8px 0' }}>
              
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, background: '#EF233C', borderRadius: 2 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Professional Biography</h3>
                </div>
                <div style={{ padding: '32px', borderRadius: 24, background: '#fff', border: '1px solid rgba(43,45,66,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8, margin: 0 }}>
                    {doctor.bio || `Dr. ${doctor.doctorName} is a distinguished specialist with an extensive background in clinical practice and patient-focused healthcare. With a commitment to medical excellence, they have consistently delivered high-quality care and specialized treatments within their field of expertise.`}
                  </p>
                </div>
              </section>

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, background: '#EF233C', borderRadius: 2 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Education & Qualifications</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(239,35,60,0.02), rgba(239,35,60,0.05))', border: '1px solid rgba(239,35,60,0.1)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF233C', flexShrink: 0, boxShadow: '0 8px 20px rgba(239,35,60,0.1)' }}>
                      <Stethoscope size={22} />
                    </div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: '#2B2D42', marginBottom: 4 }}>{doctor.education || 'Advanced Medical Degree'}</p>
                      <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, fontWeight: 600 }}>Verified Professional Certification</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, background: '#EF233C', borderRadius: 2 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Clinic Location</h3>
                </div>
                <div style={{ padding: '28px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(43,45,66,0.02), rgba(43,45,66,0.05))', border: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ width: 110, height: 110, borderRadius: 20, background: '#fff', border: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                    <MapPin size={36} style={{ color: '#EF233C', opacity: 0.2 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', marginBottom: 6 }}>{doctor.clinicName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8D99AE' }}>
                      <MapPin size={14} />
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{doctor.clinicAddress}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar Column (Sticky Booking Card) */}
          <div style={{ position: 'sticky', top: 100 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: '#2B2D42', borderRadius: 32, padding: 32, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
              
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
                <Calendar size={20} style={{ color: '#EF233C' }} />
                Book Session
              </h2>

              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '40px 20px', borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: 24 }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                    Select a confirmed date and time slot to book your clinical session with Dr. {doctor.doctorName.split(' ')[0]}.
                  </p>
                </div>
                <button onClick={() => setShowBooking(true)} 
                  style={{ width: '100%', padding: '18px', borderRadius: 16, background: 'linear-gradient(135deg, #EF233C, #D90429)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 24px rgba(239,35,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Choose Appointment Slot
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
