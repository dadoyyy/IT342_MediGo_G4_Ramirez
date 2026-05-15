import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, BadgeCheck, ArrowRight, Activity, Calendar, Clock } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';
import MEDICAL_SPECIALIZATIONS from '../../../shared/constants/medicalSpecializations';

const SPECIALTIES = ['All', ...MEDICAL_SPECIALIZATIONS];

const container = { animate: { transition: { staggerChildren: 0.08 } } };
const cardItem = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function PatientHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeSpecialty, setActiveSpecialty] = useState('All');

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

  const firstName = user?.fullName?.split(' ')[0] || 'Guest';

  return (
    <AppShell user={user}>
      <div style={{ padding: '32px 40px 60px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Dashboard Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.08)', border: '1px solid rgba(239,35,60,0.15)', marginBottom: 12 }}>
              <Activity size={14} style={{ color: '#EF233C' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#D90429', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Dashboard</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0, fontWeight: 500 }}>Find a specialist and book your next appointment seamlessly.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button onClick={() => navigate('/appointments')} className="mg-btn-ghost" style={{ background: '#FFFFFF' }}>
               <Calendar size={16} /> My Appointments
             </button>
          </div>
        </motion.div>

        {/* ── Search & Filter Section ── */}
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.06)', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search doctors by name or specialization…"
                className="mg-input" style={{ paddingLeft: 48, fontSize: 15, background: 'rgba(237,242,244,0.5)', border: '1px solid rgba(43,45,66,0.08)', borderRadius: 16 }} />
            </div>
          </div>

          {/* Specialty Tabs */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {SPECIALTIES.map(s => {
              const active = activeSpecialty === s;
              return (
                <button key={s} onClick={() => setActiveSpecialty(s)}
                  style={{
                    padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 500,
                    background: active ? '#2B2D42' : 'rgba(237,242,244,0.5)',
                    color: active ? '#EDF2F4' : '#6B7280',
                    border: `1px solid ${active ? '#2B2D42' : 'rgba(43,45,66,0.08)'}`,
                    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                    boxShadow: active ? '0 4px 12px rgba(43,45,66,0.2)' : 'none'
                  }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Doctor Grid ── */}
        {loading || searching ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.15)', borderTopColor: '#EF233C' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: 24, border: '1px dashed rgba(141,153,174,0.4)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(239,35,60,0.05)', border: '1px solid rgba(239,35,60,0.1)' }}>
              <Search size={28} style={{ color: '#EF233C' }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', margin: '0 0 8px' }}>No specialists found</p>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>Try adjusting your search terms or selecting a different specialty.</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filtered.map(doctor => (
              <motion.button key={doctor.doctorId} variants={cardItem}
                onClick={() => navigate(`/doctor/${doctor.doctorId}`)}
                className="card"
                style={{ padding: 24, textAlign: 'left', cursor: 'pointer', borderRadius: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, rgba(43,45,66,0.05), rgba(43,45,66,0.1))', color: '#2B2D42', border: '1px solid rgba(43,45,66,0.08)' }}>
                    {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2B2D42', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {doctor.doctorName}</h3>
                      <BadgeCheck size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
                    </div>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(239,35,60,0.08)', color: '#D90429', marginBottom: 8 }}>
                      {doctor.specialization || 'General'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {doctor.clinicName && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <MapPin size={14} style={{ color: '#8D99AE', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>{doctor.clinicName}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} style={{ color: '#8D99AE', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Available for booking</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(43,45,66,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#8D99AE' }}>View Profile</span>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,35,60,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    <ArrowRight size={14} style={{ color: '#EF233C' }} />
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
