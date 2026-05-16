import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Mail, Search, X, MapPin, Briefcase, CheckCircle2, Banknote, Trash2, AlertTriangle } from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';
import { useToast } from '../../../shared/ui/ToastProvider';

export default function AdminDoctors() {
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // { doctor, reason }
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u); authSession.setUser(u);
        const docsRes = await adminApi.getAllDoctors();
        setDoctors(docsRes.data?.data || docsRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const filtered = doctors.filter(d =>
    d.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteModal.reason?.trim()) {
      addToast('Please provide a reason for deletion.', 'error');
      return;
    }
    setProcessing(true);
    try {
      await adminApi.deleteDoctorAccount(deleteModal.doctor.doctorId, deleteModal.reason);
      setDoctors(prev => prev.filter(d => d.doctorId !== deleteModal.doctor.doctorId));
      addToast(`Account for Dr. ${deleteModal.doctor.doctorName} has been deleted.`, 'success');
      setDeleteModal(null);
      setSelectedDoctor(null);
    } catch (err) {
      addToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
            <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} registered on the platform</p>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
            <input type="text" placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="mg-input" style={{ paddingLeft: 40, width: '100%' }} />
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#2B2D42', fontWeight: 600, margin: '0 0 8px' }}>No doctors found</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>There are no registered doctors matching your search.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map((doctor, i) => (
              <motion.div key={doctor.doctorId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDoctor(doctor)} className="card" style={{ padding: 24, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#EF233C', flexShrink: 0 }}>
                    {doctor.doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#2B2D42', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {doctor.doctorName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, fontWeight: 600, background: 'rgba(239,35,60,0.06)', color: '#EF233C', border: '1px solid rgba(239,35,60,0.15)' }}>DOCTOR</span>
                      {doctor.verified && <CheckCircle2 size={12} style={{ color: '#16A34A' }} />}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Briefcase size={13} style={{ color: '#8D99AE' }} />
                    <span style={{ fontSize: 13, color: doctor.specialization ? '#6B7280' : '#8D99AE' }}>{doctor.specialization || 'Profile Incomplete'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={13} style={{ color: '#8D99AE' }} />
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{doctor.email}</span>
                  </div>
                  {doctor.consultationFee && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Banknote size={13} style={{ color: '#16A34A' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₱{doctor.consultationFee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedDoctor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid rgba(43,45,66,0.08)', width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 24px 64px rgba(43,45,66,0.15)' }}>
                <div style={{ padding: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#EF233C' }}>
                        {selectedDoctor.doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Dr. {selectedDoctor.doctorName}</h2>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: 'rgba(34,197,94,0.06)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.15)' }}>Verified Doctor</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedDoctor(null)} style={{ background: 'rgba(43,45,66,0.04)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#8D99AE' }}><X size={20} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', letterSpacing: '0.05em', margin: '0 0 8px' }}>PROFESSIONAL INFO</p>
                      <div className="card" style={{ background: 'rgba(43,45,66,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Briefcase size={16} style={{ color: '#8D99AE' }} /><div><p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: 0 }}>{selectedDoctor.specialization || 'Not specified'}</p><p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Specialization</p></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><CheckCircle2 size={16} style={{ color: selectedDoctor.verified ? '#16A34A' : '#D97706' }} /><div><p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: 0 }}>{selectedDoctor.verified ? 'Fully Verified' : 'Awaiting Verification'}</p><p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Status</p></div></div>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', letterSpacing: '0.05em', margin: '0 0 8px' }}>CLINIC INFO</p>
                      <div className="card" style={{ background: 'rgba(43,45,66,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Stethoscope size={16} style={{ color: '#EF233C' }} /><div><p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: 0 }}>{selectedDoctor.clinicName || 'Not specified'}</p><p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Clinic Name</p></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><MapPin size={16} style={{ color: '#D90429' }} /><div><p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: 0 }}>{selectedDoctor.clinicAddress || 'Not specified'}</p><p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Location</p></div></div>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', letterSpacing: '0.05em', margin: '0 0 8px' }}>CONTACT & FEE INFO</p>
                      <div className="card" style={{ background: 'rgba(43,45,66,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Mail size={16} style={{ color: '#6B7280' }} /><div><p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: 0 }}>{selectedDoctor.email}</p><p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Email Address</p></div></div>
                        {selectedDoctor.consultationFee && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Banknote size={16} style={{ color: '#16A34A' }} /><div><p style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', margin: 0 }}>₱{selectedDoctor.consultationFee.toLocaleString()}</p><p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Consultation Fee</p></div></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '20px 32px', background: 'rgba(43,45,66,0.02)', borderTop: '1px solid rgba(43,45,66,0.06)', display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => setDeleteModal({ doctor: selectedDoctor, reason: '' })} 
                    className="mg-btn"
                    style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#EF233C', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(239,35,60,0.25)' }}>
                    <Trash2 size={18} /> Permanently Delete Account
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deletion Confirmation Modal */}
        <AnimatePresence>
          {deleteModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !processing && setDeleteModal(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(43,45,66,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid rgba(239,35,60,0.15)', width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 24px 64px rgba(43,45,66,0.2)' }}>
                
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,35,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(239,35,60,0.15)' }}>
                  <AlertTriangle size={26} style={{ color: '#EF233C' }} />
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', textAlign: 'center', margin: '0 0 8px' }}>Delete Doctor Account?</h3>
                <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
                  This will permanently delete the account for <strong>Dr. {deleteModal.doctor.doctorName}</strong>. This action cannot be undone.
                </p>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>REASON FOR DELETION (WILL BE EMAILED)</label>
                  <textarea 
                    value={deleteModal.reason} 
                    onChange={e => setDeleteModal(p => ({ ...p, reason: e.target.value }))}
                    placeholder="e.g. Violation of terms, Requested by user, Administrative cleanup..."
                    className="mg-input"
                    style={{ height: 100, resize: 'none', padding: 12, fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setDeleteModal(null)} disabled={processing}
                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.1)', color: '#6B7280', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={processing}
                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: '#EF233C', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {processing ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Yes, Delete'}
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
