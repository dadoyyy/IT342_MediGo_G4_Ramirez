import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Calendar, Search } from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';

export default function AdminPatients() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);

        const patsRes = await adminApi.getAllPatients();
        setPatients(patsRes.data?.data || patsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(46,196,182,0.1), rgba(155,140,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(46,196,182,0.2)' }}>
              <Users size={20} style={{ color: '#2EC4B6' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>Registered Patients</h1>
              <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>View all patients registered on the platform</p>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8892A4' }} />
            <input 
              type="text" 
              placeholder="Search patients..." 
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
            <p style={{ fontSize: 15, color: '#F7F8FA', fontWeight: 600, margin: '0 0 8px' }}>No patients found</p>
            <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>There are no registered patients matching your search.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map((patient, i) => (
              <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(155,140,255,0.1), rgba(46,196,182,0.1))', border: '1px solid rgba(155,140,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#9B8CFF', flexShrink: 0 }}>
                    {patient.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#F7F8FA', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {patient.fullName}
                    </p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: 'rgba(155,140,255,0.1)', color: '#9B8CFF', border: '1px solid rgba(155,140,255,0.2)' }}>
                      PATIENT
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={14} style={{ color: 'rgba(136,146,164,0.6)' }} />
                    <span style={{ fontSize: 13, color: '#8892A4' }}>{patient.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calendar size={14} style={{ color: 'rgba(136,146,164,0.6)' }} />
                    <span style={{ fontSize: 13, color: '#8892A4' }}>
                      Joined {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
