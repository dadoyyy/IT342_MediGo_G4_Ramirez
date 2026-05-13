import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Mail, Calendar, Search, X, MapPin, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';

export default function AdminDoctors() {
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);

        const docsRes = await adminApi.getAllDoctors();
        setDoctors(docsRes.data?.data || docsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = doctors.filter(d => 
    d.doctorName.toLowerCase().includes(search.toLowerCase()) || 
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(155,140,255,0.1), rgba(46,196,182,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(155,140,255,0.2)' }}>
              <Stethoscope size={20} style={{ color: '#9B8CFF' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>Registered Doctors</h1>
              <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>View all doctors registered on the platform</p>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8892A4' }} />
            <input 
              type="text" 
              placeholder="Search doctors..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mg-input" 
              style={{ paddingLeft: 40, width: '100%' }}
            />
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#F7F8FA', fontWeight: 600, margin: '0 0 8px' }}>No doctors found</p>
            <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>There are no registered doctors matching your search.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map((doctor, i) => (
              <motion.div key={doctor.doctorId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDoctor(doctor)}
                className="card" style={{ padding: 24, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(46,196,182,0.1), rgba(155,140,255,0.1))', border: '1px solid rgba(46,196,182,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#2EC4B6', flexShrink: 0 }}>
                    {doctor.doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#F7F8FA', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Dr. {doctor.doctorName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, fontWeight: 600, background: 'rgba(46,196,182,0.1)', color: '#5EEAD4', border: '1px solid rgba(46,196,182,0.2)' }}>
                        DOCTOR
                      </span>
                      {doctor.verified && (
                        <CheckCircle2 size={12} style={{ color: '#5EEAD4' }} />
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Briefcase size={13} style={{ color: 'rgba(136,146,164,0.6)' }} />
                    <span style={{ fontSize: 13, color: doctor.specialization ? '#8892A4' : 'rgba(136,146,164,0.4)' }}>
                      {doctor.specialization || 'Profile Incomplete'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={13} style={{ color: 'rgba(136,146,164,0.6)' }} />
                    <span style={{ fontSize: 13, color: '#8892A4' }}>{doctor.email}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Doctor Info Modal */}
        <AnimatePresence>
          {selectedDoctor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(11,16,32,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#111827', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 500, overflow: 'hidden' }}>
                
                <div style={{ padding: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, rgba(46,196,182,0.1), rgba(155,140,255,0.1))', border: '1px solid rgba(46,196,182,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#2EC4B6' }}>
                        {selectedDoctor.doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>Dr. {selectedDoctor.doctorName}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: 'rgba(46,196,182,0.1)', color: '#5EEAD4', border: '1px solid rgba(46,196,182,0.2)' }}>
                            Verified Doctor
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedDoctor(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'rgba(136,146,164,0.6)' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', margin: 0 }}>PROFESSIONAL INFO</p>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Briefcase size={16} style={{ color: '#9B8CFF' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{selectedDoctor.specialization || 'Not specified'}</p>
                            <p style={{ fontSize: 11, color: '#8892A4', margin: 0 }}>Specialization</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <CheckCircle2 size={16} style={{ color: selectedDoctor.verified ? '#5EEAD4' : '#FCD34D' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{selectedDoctor.verified ? 'Fully Verified' : 'Awaiting Verification'}</p>
                            <p style={{ fontSize: 11, color: '#8892A4', margin: 0 }}>Status</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', margin: 0 }}>CLINIC INFO</p>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Stethoscope size={16} style={{ color: '#2EC4B6' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{selectedDoctor.clinicName || 'Not specified'}</p>
                            <p style={{ fontSize: 11, color: '#8892A4', margin: 0 }}>Clinic Name</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <MapPin size={16} style={{ color: '#FF7A59' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{selectedDoctor.clinicAddress || 'Not specified'}</p>
                            <p style={{ fontSize: 11, color: '#8892A4', margin: 0 }}>Location</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', margin: 0 }}>CONTACT INFO</p>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Mail size={16} style={{ color: '#8892A4' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{selectedDoctor.email}</p>
                            <p style={{ fontSize: 11, color: '#8892A4', margin: 0 }}>Email Address</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelectedDoctor(null)} className="mg-btn" style={{ padding: '10px 24px', fontSize: 13 }}>
                    Close Details
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
