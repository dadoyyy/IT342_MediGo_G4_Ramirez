import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, BadgeCheck, ArrowRight } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';

const SPECIALTIES = ['All', 'General Practice', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'];
const container = { animate: { transition: { staggerChildren: 0.06 } } };
const item = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function PatientHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeSpecialty, setActiveSpecialty] = useState('All');

  useEffect(() => { authApi.me().then(r => setUser(r.data?.data ?? r.data)).catch(() => {}); }, []);

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
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm mb-1" style={{ color: '#9CA3AF' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
            Hello{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Find and book your next appointment</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="relative mb-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search doctors by name or specialization…"
            className="mg-input pl-11" />
        </motion.div>

        {/* Specialty pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          className="flex gap-2 flex-wrap mb-8">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setActiveSpecialty(s)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={activeSpecialty === s
                ? { background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', color: '#fff', boxShadow: '0 2px 10px rgba(20,184,166,0.25)' }
                : { background: '#fff', border: '1.5px solid #E5E7EB', color: '#6B7280' }
              }>
              {s}
            </button>
          ))}
        </motion.div>

        {/* Doctor grid */}
        {loading || searching ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F0FDFA', border: '1.5px solid #CCFBF1' }}>
              <Search size={22} style={{ color: '#14B8A6' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: '#374151' }}>No doctors found</p>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Try a different search or specialty</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doctor => (
              <motion.button key={doctor.doctorId} variants={item}
                onClick={() => navigate(`/doctor/${doctor.doctorId}`)}
                className="card p-5 text-left group"
                whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(20,184,166,0.1)' }}
                transition={{ duration: 0.2 }}>
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #CCFBF1, #EDE9FE)', color: '#0D9488' }}>
                  {doctor.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                </div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#1F2937' }}>
                  Dr. {doctor.doctorName}
                </p>
                {doctor.specialization && (
                  <p className="text-xs font-medium mb-2" style={{ color: '#14B8A6' }}>{doctor.specialization}</p>
                )}
                {doctor.clinicName && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={11} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{doctor.clinicName}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid #F3F4F6' }}>
                  <div className="flex items-center gap-1">
                    <BadgeCheck size={12} style={{ color: '#14B8A6' }} />
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Verified</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#14B8A6' }}>
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
