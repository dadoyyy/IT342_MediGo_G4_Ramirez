import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, BadgeCheck, ArrowRight } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';
import MEDICAL_SPECIALIZATIONS from '../../../shared/constants/medicalSpecializations';

const SPECIALTIES = ['All', ...MEDICAL_SPECIALIZATIONS];
const ACCENT_PALETTE = ['#2EC4B6', '#9B8CFF', '#FF7A59'];
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.07em', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA' }}>
            Hello{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#8892A4', marginTop: 4 }}>Find and book your next appointment</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.4)' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search doctors by name or specialization…"
            className="mg-input" style={{ paddingLeft: 44 }} />
        </motion.div>

        {/* Specialty pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', marginBottom: 32, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(136,146,164,0.15) transparent' }}>
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setActiveSpecialty(s)}
              style={activeSpecialty === s
                ? { padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,196,182,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }
                : { padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(136,146,164,0.75)', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }
              }>
              {s}
            </button>
          ))}
        </motion.div>

        {/* Doctor grid */}
        {loading || searching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
              <Search size={22} style={{ color: 'rgba(46,196,182,0.5)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 4 }}>No doctors found</p>
            <p style={{ fontSize: 14, color: '#8892A4' }}>Try a different search or specialty</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((doctor, idx) => {
              const accent = ACCENTS[idx % ACCENTS.length];
              return (
                <motion.button key={doctor.doctorId} variants={cardItem}
                  onClick={() => navigate(`/doctor/${doctor.doctorId}`)}
                  className="card"
                  style={{ padding: 20, textAlign: 'left', cursor: 'pointer', background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease' }}
                  whileHover={{ y: -3, boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 24px rgba(${accent === '#2EC4B6' ? '46,196,182' : accent === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.08)` }}
                  transition={{ duration: 0.2 }}>
                  {/* Top accent line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />

                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 13, fontWeight: 700, background: `rgba(${accent === '#2EC4B6' ? '46,196,182' : accent === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.1)`, border: `1px solid rgba(${accent === '#2EC4B6' ? '46,196,182' : accent === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.2)`, color: accent }}>
                    {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                  </div>

                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA', marginBottom: 2 }}>Dr. {doctor.doctorName}</p>
                  {doctor.specialization && (
                    <p style={{ fontSize: 12, fontWeight: 500, color: accent, marginBottom: 8 }}>{doctor.specialization}</p>
                  )}
                  {doctor.clinicName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                      <MapPin size={10} style={{ color: 'rgba(136,146,164,0.4)', flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doctor.clinicName}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <BadgeCheck size={11} style={{ color: '#2EC4B6' }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(136,146,164,0.5)' }}>Verified</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: accent }}>
                      Book <ArrowRight size={11} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
