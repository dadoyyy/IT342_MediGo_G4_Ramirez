import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, ArrowRight, Stethoscope } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';

const SPECIALTIES = ['All', 'General Practice', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'];

const container = { animate: { transition: { staggerChildren: 0.07 } } };
const item = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function PatientHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeSpecialty, setActiveSpecialty] = useState('All');

  useEffect(() => {
    authApi.me().then(r => setUser(r.data?.data ?? r.data)).catch(() => {});
  }, []);

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

  const greeting = user?.fullName ? `Hello, ${user.fullName.split(' ')[0]}` : 'Hello';

  return (
    <AppShell user={user}>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm mb-1" style={{ color: 'rgba(247,248,250,0.4)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#F7F8FA' }}>{greeting} 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(247,248,250,0.4)' }}>Find and book your next appointment</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(247,248,250,0.3)' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search doctors by name or specialization…"
            className="mg-input pl-11"
            style={{ fontSize: '14px' }} />
        </motion.div>

        {/* Specialty pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex gap-2 flex-wrap mb-8">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setActiveSpecialty(s)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={activeSpecialty === s
                ? { background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#0B1020', fontWeight: 600 }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(247,248,250,0.5)' }
              }>
              {s}
            </button>
          ))}
        </motion.div>

        {/* Doctor grid */}
        {loading || searching ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
              <Search size={24} style={{ color: 'rgba(46,196,182,0.5)' }} />
            </div>
            <p className="font-medium mb-1" style={{ color: 'rgba(247,248,250,0.6)' }}>No doctors found</p>
            <p className="text-sm" style={{ color: 'rgba(247,248,250,0.3)' }}>Try a different search or specialty</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doctor => (
              <motion.button key={doctor.doctorId} variants={item}
                onClick={() => navigate(`/doctor/${doctor.doctorId}`)}
                className="glass rounded-2xl p-5 text-left group transition-all duration-200 hover:border-teal-500/30"
                style={{ borderColor: 'rgba(155,140,255,0.12)' }}
                whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(46,196,182,0.12)' }}>
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, rgba(46,196,182,0.2), rgba(155,140,255,0.2))', color: '#2EC4B6', border: '1px solid rgba(46,196,182,0.2)' }}>
                  {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                </div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#F7F8FA' }}>
                  Dr. {doctor.doctorName}
                </p>
                {doctor.specialization && (
                  <p className="text-xs mb-2" style={{ color: '#2EC4B6' }}>{doctor.specialization}</p>
                )}
                {doctor.clinicName && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={11} style={{ color: 'rgba(247,248,250,0.3)', flexShrink: 0 }} />
                    <p className="text-xs truncate" style={{ color: 'rgba(247,248,250,0.4)' }}>{doctor.clinicName}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1">
                    <Star size={11} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                    <span className="text-xs font-medium" style={{ color: 'rgba(247,248,250,0.5)' }}>Verified</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: '#2EC4B6' }}>
                    Book <ArrowRight size={11} />
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
