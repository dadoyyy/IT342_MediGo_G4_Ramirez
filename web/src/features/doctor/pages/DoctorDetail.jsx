import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, BadgeCheck, Calendar, Clock, Stethoscope, CheckCircle, ArrowRight, Banknote } from 'lucide-react';
import { doctorApi, appointmentApi, authApi } from '../../../shared/api/api';
import AuthImage from '../../../shared/ui/AuthImage';
import axios from 'axios';

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

  useEffect(() => {
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
      
      // Update local storage to mark slot as booked
      const allSlots = JSON.parse(localStorage.getItem('medigo_doctor_slots') || '[]');
      const updatedSlots = allSlots.map(s => s.id === booking.slotId ? { ...s, status: 'Booked' } : s);
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
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sticky Top Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(43,45,66,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid rgba(43,45,66,0.08)', color: '#2B2D42', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42' }}>Doctor Profile</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #EF233C, #D90429)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={12} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
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
                  <h1 style={{ fontSize: 32, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Dr. {doctor.doctorName}</h1>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Experience', value: `${doctor.yearsOfExperience || '0'}+ Years`, icon: <Clock size={18} />, color: '#EF233C' },
                { label: 'Patients', value: `${doctor.patientCount || '0'}+ Served`, icon: <CheckCircle size={18} />, color: '#16A34A' },
                { label: 'Consultation Fee', value: `₱${doctor.consultationFee?.toLocaleString() || '---'}`, icon: <Banknote size={18} />, color: '#8D99AE' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  style={{ padding: '20px', borderRadius: 24, background: '#fff', border: '1px solid rgba(43,45,66,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stat.color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8D99AE', marginBottom: 2 }}>{stat.label.toUpperCase()}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>{stat.value}</p>
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
                <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8, margin: 0 }}>
                  {doctor.bio || `Dr. ${doctor.doctorName} is a distinguished specialist with an extensive background in clinical practice and patient-focused healthcare. With a commitment to medical excellence, they have consistently delivered high-quality care and specialized treatments within their field of expertise.`}
                </p>
              </section>

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, background: '#EF233C', borderRadius: 2 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Education & Qualifications</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, padding: '20px', borderRadius: 20, background: 'rgba(141,153,174,0.04)', border: '1px solid rgba(141,153,174,0.08)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D99AE', flexShrink: 0 }}>
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2D42', marginBottom: 4 }}>{doctor.education || 'Advanced Medical Degree'}</p>
                      <p style={{ fontSize: 14, color: '#8D99AE', margin: 0 }}>Verified Professional Certification</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, background: '#EF233C', borderRadius: 2 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Clinic Location</h3>
                </div>
                <div style={{ padding: '24px', borderRadius: 24, background: '#fff', border: '1px solid rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 100, height: 100, borderRadius: 16, background: 'rgba(43,45,66,0.02)', border: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <MapPin size={32} style={{ color: 'rgba(43,45,66,0.1)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2D42', marginBottom: 4 }}>{doctor.clinicName}</p>
                    <p style={{ fontSize: 14, color: '#8D99AE', margin: 0 }}>{doctor.clinicAddress}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar Column (Sticky Booking Card) */}
          <div style={{ position: 'sticky', top: 100 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: '#FFFFFF', borderRadius: 32, padding: 32, border: '1px solid rgba(43,45,66,0.06)', boxShadow: '0 24px 64px rgba(43,45,66,0.06)' }}>
              
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} style={{ color: '#EF233C' }} />
                Book Session
              </h2>

              <AnimatePresence mode="wait">
                {!showBooking ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ padding: '40px 20px', borderRadius: 24, background: 'rgba(239,35,60,0.03)', border: '1px dashed rgba(239,35,60,0.2)', marginBottom: 24 }}>
                      <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                        Select a date and time slot to confirm your consultation with Dr. {doctor.doctorName.split(' ')[0]}.
                      </p>
                    </div>
                    <button onClick={() => setShowBooking(true)} 
                      style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #EF233C, #D90429)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(239,35,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      Choose Appointment Slot
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBook} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', letterSpacing: '0.08em' }}>SELECT A TIME SLOT</label>
                      
                      {(() => {
                        const allSlots = JSON.parse(localStorage.getItem('medigo_doctor_slots') || '[]');
                        const availableSlots = allSlots.filter(s => s.status === 'Available');
                        
                        if (availableSlots.length === 0) {
                          return (
                            <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(43,45,66,0.02)', border: '1px solid rgba(43,45,66,0.05)', textAlign: 'center' }}>
                              <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>No slots available this week.</p>
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
                            {availableSlots.map(slot => {
                              const isSelected = booking.slotId === slot.id;
                              return (
                                <div key={slot.id}
                                  onClick={() => {
                                    setBooking(p => ({ ...p, slotId: slot.id, date: slot.date, time: slot.startTime }));
                                    setBookingErrors(p => ({ ...p, slotId: undefined }));
                                  }}
                                  style={{
                                    padding: '12px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                                    background: isSelected ? 'rgba(239,35,60,0.1)' : '#F8F9FA',
                                    border: isSelected ? '2px solid #EF233C' : '1px solid rgba(43,45,66,0.05)',
                                    transition: 'all 0.2s'
                                  }}>
                                  <p style={{ fontSize: 12, fontWeight: 800, color: isSelected ? '#EF233C' : '#2B2D42', margin: '0 0 2px' }}>
                                    {new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                  <p style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', margin: 0 }}>
                                    {(() => {
                                      if (!slot.startTime) return 'Time TBA';
                                      const [h, m] = slot.startTime.split(':');
                                      const hr = parseInt(h, 10);
                                      return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
                                    })()}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', letterSpacing: '0.08em' }}>CONSULTATION REASON</label>
                      <input type="text" value={booking.appointmentType}
                        onChange={e => { setBooking(p => ({ ...p, appointmentType: e.target.value })); setBookingErrors(p => ({ ...p, appointmentType: undefined })); }}
                        placeholder="e.g. Consultation"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#F8F9FA', border: bookingErrors.appointmentType ? '1px solid #EF233C' : '1px solid rgba(43,45,66,0.05)', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button type="button" onClick={() => setShowBooking(false)} 
                        style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(43,45,66,0.04)', border: 'none', color: '#6B7280', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                        Back
                      </button>
                      <button type="submit" disabled={submitting} 
                        style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#EF233C', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? 'Booking…' : 'Confirm'}
                      </button>
                    </div>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
