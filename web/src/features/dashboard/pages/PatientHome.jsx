import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, BadgeCheck, ArrowRight, X, Clock, GraduationCap, Building2, Calendar, Stethoscope, ChevronRight } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { AnimatePresence } from 'framer-motion';
import { authSession } from '../../auth/authSession';
import MEDICAL_SPECIALIZATIONS from '../../../shared/constants/medicalSpecializations';

const SPECIALTIES = ['All', ...MEDICAL_SPECIALIZATIONS];
const ACCENT_PALETTE = ['#EF233C', '#8D99AE', '#D90429'];
const ACCENTS = SPECIALTIES.map((_, i) => ACCENT_PALETTE[i % ACCENT_PALETTE.length]);

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const cardItem = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function PatientHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeSpecialty, setActiveSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => { authApi.me().then(r => { const u = r.data?.data ?? r.data; setUser(u); authSession.setUser(u); }).catch(() => {}); }, []);

  const searchDoctors = useCallback(async (q) => {
    setSearching(true);
    try {
      const res = await doctorApi.search(q);
      const list = res.data?.data ?? res.data;
      setDoctors(Array.isArray(list) ? list : []);
    } catch { setDoctors([]); }
    finally { setSearching(false); setLoading(false); }
  }, []);

  useEffect(() => { searchDoctors(''); }, [searchDoctors]);
  useEffect(() => {
    const t = setTimeout(() => searchDoctors(query), 400);
    return () => clearTimeout(t);
  }, [query, searchDoctors]);

  const filtered = activeSpecialty === 'All'
    ? doctors
    : doctors.filter(d => d.specialization?.toLowerCase().includes(activeSpecialty.toLowerCase()));

  const firstName = user?.fullName?.split(' ')[0] || '';

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Find your perfect doctor{firstName ? `, ${firstName}` : ''}</h1>
          <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>Browse verified specialists and book your appointment in seconds</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search doctors by name or specialization…"
            className="mg-input" style={{ paddingLeft: 44 }} />
        </motion.div>

        {/* Specialty pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', marginBottom: 32, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(43,45,66,0.12) transparent' }}>
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setActiveSpecialty(s)}
              style={activeSpecialty === s
                ? { padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #EF233C, #D90429)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(239,35,60,0.25)', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }
                : { padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(43,45,66,0.1)', color: '#6B7280', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }
              }>
              {s}
            </button>
          ))}
        </motion.div>

        {/* Doctor grid */}
        {loading || searching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)' }}>
              <Search size={22} style={{ color: 'rgba(239,35,60,0.4)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#2B2D42', marginBottom: 4 }}>No doctors found</p>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Try a different search or specialty</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((doctor, idx) => {
              const accent = ACCENTS[idx % ACCENTS.length];
              const rgb = accent === '#EF233C' ? '239,35,60' : accent === '#8D99AE' ? '141,153,174' : '217,4,41';
              return (
                <motion.div key={doctor.doctorId} variants={cardItem}
                  onClick={() => setSelectedDoctor(doctor)}
                  className="card"
                  style={{ 
                    padding: 24, 
                    textAlign: 'left', 
                    cursor: 'pointer', 
                    background: '#FFFFFF', 
                    border: '1px solid rgba(43,45,66,0.06)', 
                    borderRadius: 20, 
                    position: 'relative', 
                    overflow: 'hidden', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                  whileHover={{ y: -6, boxShadow: `0 20px 40px rgba(43,45,66,0.08), 0 0 0 1px ${accent}30` }}>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.12)`, color: accent }}>
                      {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      <BadgeCheck size={12} style={{ color: '#16A34A' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Verified</span>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2D42', marginBottom: 4 }}>Dr. {doctor.doctorName}</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {(doctor.specialization || '').split(',').slice(0, 2).map((s, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: i === 0 ? `rgba(${rgb},0.08)` : 'rgba(141,153,174,0.08)', color: i === 0 ? accent : '#8D99AE', border: i === 0 ? `1px solid rgba(${rgb},0.12)` : '1px solid rgba(141,153,174,0.12)' }}>
                          {s.trim()}
                        </span>
                      ))}
                      {(doctor.specialization || '').split(',').length > 2 && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: 'rgba(43,45,66,0.03)', color: '#8D99AE' }}>
                          +{(doctor.specialization || '').split(',').length - 2} more
                        </span>
                      )}
                    </div>

                    {doctor.clinicName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(141,153,174,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={11} style={{ color: '#8D99AE' }} />
                        </div>
                        <p style={{ fontSize: 12, color: '#8D99AE', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doctor.clinicName}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: accent, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(43,45,66,0.04)' }}>
                    View Profile <ChevronRight size={14} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Doctor Profile Quick View Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedDoctor(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(43,45,66,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#F8F9FA', width: '100%', maxWidth: 540, height: '90vh', borderTopLeftRadius: 32, borderTopRightRadius: 32, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -20px 40px rgba(0,0,0,0.1)' }}>
              
              {/* Modal Drag Handle & Close */}
              <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(43,45,66,0.1)' }} />
                <button onClick={() => setSelectedDoctor(null)}
                  style={{ position: 'absolute', right: 20, top: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(43,45,66,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} style={{ color: '#8D99AE' }} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 40px', scrollbarWidth: 'none' }}>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, marginTop: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #EF233C, #D90429)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', boxShadow: '0 12px 24px rgba(239,35,60,0.2)' }}>
                    {selectedDoctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2B2D42', margin: '0 0 6px' }}>Dr. {selectedDoctor.doctorName}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(selectedDoctor.specialization || '').split(',').map((s, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,35,60,0.08)', color: '#EF233C' }}>{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                  <div style={{ padding: 16, borderRadius: 20, background: '#fff', border: '1px solid rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,35,60,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} style={{ color: '#EF233C' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Experience</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedDoctor.yearsOfExperience || '5+'} Years</p>
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 20, background: '#fff', border: '1px solid rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={16} style={{ color: '#16A34A' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Patients</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedDoctor.patientCount || '0'}+ Served</p>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2B2D42', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: '#EF233C', borderRadius: 2 }} />
                    About Doctor
                  </h3>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
                    {selectedDoctor.bio || `Dr. ${selectedDoctor.doctorName} is a highly skilled professional with expertise in ${selectedDoctor.specialization}. Dedicated to providing the best patient care and clinical excellence.`}
                  </p>
                </div>

                {/* Background Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: '1px solid rgba(43,45,66,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GraduationCap size={18} style={{ color: '#8D99AE' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#8D99AE', marginBottom: 4 }}>EDUCATION</p>
                      <p style={{ fontSize: 14, color: '#2B2D42', fontWeight: 500, margin: 0 }}>{selectedDoctor.education || 'Medical Degree from Top Institution'}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: '1px solid rgba(43,45,66,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} style={{ color: '#8D99AE' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#8D99AE', marginBottom: 4 }}>CLINIC LOCATION</p>
                      <p style={{ fontSize: 14, color: '#2B2D42', fontWeight: 500, margin: 0 }}>{selectedDoctor.clinicName}</p>
                      <p style={{ fontSize: 12, color: '#8D99AE', margin: '4px 0 0' }}>{selectedDoctor.clinicAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ padding: '24px 28px', background: '#fff', borderTop: '1px solid rgba(43,45,66,0.05)' }}>
                <button onClick={() => navigate(`/doctor/${selectedDoctor.doctorId}`)}
                  style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #EF233C, #D90429)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(239,35,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Calendar size={18} />
                  Book Appointment Now
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
