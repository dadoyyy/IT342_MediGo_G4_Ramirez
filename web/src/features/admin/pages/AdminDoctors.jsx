import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, Mail, Search, X, MapPin, Briefcase, 
  CheckCircle2, Banknote, Trash2, AlertTriangle, 
  ShieldCheck, UserCheck, Clock, UserMinus
} from 'lucide-react';
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
  const [deleteModal, setDeleteModal] = useState(null); 
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
    d.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
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
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.1)', marginBottom: 12 }}>
              <ShieldCheck size={14} color="#EF233C" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#EF233C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Command Center</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>
              Physician Registry
            </h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: '4px 0 0' }}>Manage the medical network, monitor credentials, and oversee provider accounts.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} 
                className="mg-input" style={{ paddingLeft: 44, width: '100%', height: 44 }} />
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="card" style={{ padding: '64px 32px', textAlign: 'center', background: '#FFFFFF' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Search size={32} style={{ color: '#8D99AE' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px' }}>No Physicians Found</h2>
            <p style={{ fontSize: 15, color: '#8D99AE', margin: 0 }}>Try adjusting your search terms to find the doctor you're looking for.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
            {filtered.map((doctor, i) => (
              <motion.div key={doctor.doctorId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDoctor(doctor)} 
                className="card" 
                style={{ 
                  padding: 0, 
                  background: '#FFFFFF', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'stretch'
                }}>
                <div style={{ width: 6, background: '#2B2D42', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#EF233C', flexShrink: 0 }}>
                      {doctor.doctorName?.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2B2D42', margin: '0 0 6px', lineHeight: 1.4 }}>Dr. {doctor.doctorName}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(43,45,66,0.05)', color: '#2B2D42', border: '1px solid rgba(43,45,66,0.1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DOCTOR</span>
                        {doctor.verified && <CheckCircle2 size={13} style={{ color: '#16A34A' }} />}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 18, borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Briefcase size={14} style={{ color: '#8D99AE', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: doctor.specialization ? '#2B2D42' : '#8D99AE', lineHeight: 1.5 }}>
                        {doctor.specialization || 'Profile Incomplete'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Mail size={14} style={{ color: '#8D99AE', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctor.email}</span>
                    </div>
                    {doctor.consultationFee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Banknote size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>₱{doctor.consultationFee.toLocaleString()} Consultation</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Doctor Details Modal */}
        <AnimatePresence>
          {selectedDoctor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 28, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                
                <div style={{ padding: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#EF233C' }}>
                        {selectedDoctor.doctorName?.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 6px' }}>Dr. {selectedDoctor.doctorName}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: selectedDoctor.verified ? 'rgba(34,197,94,0.08)' : 'rgba(217,119,6,0.08)', color: selectedDoctor.verified ? '#16A34A' : '#D97706', border: '1px solid currentColor', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {selectedDoctor.verified ? 'Verified Practitioner' : 'Awaiting Verification'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedDoctor(null)} 
                      style={{ background: 'rgba(43,45,66,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#8D99AE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <section>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Clinical Profile</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: '#F8FAFB', borderRadius: 20, border: '1px solid rgba(43,45,66,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)', flexShrink: 0 }}>
                            <Briefcase size={16} style={{ color: '#EF233C' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedDoctor.specialization || 'Not Specified'}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Area of Expertise</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)', flexShrink: 0 }}>
                            <Stethoscope size={16} style={{ color: '#2B2D42' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedDoctor.clinicName || 'Not Specified'}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Primary Practice</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Contact & Registry</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: '#F8FAFB', borderRadius: 20, border: '1px solid rgba(43,45,66,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)', flexShrink: 0 }}>
                            <Mail size={16} style={{ color: '#8D99AE' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedDoctor.email}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Official Email</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)', flexShrink: 0 }}>
                            <Banknote size={16} style={{ color: '#16A34A' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#16A34A', margin: 0 }}>₱{selectedDoctor.consultationFee?.toLocaleString() || '0'}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Professional Fee</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div style={{ padding: '24px 32px', background: '#F8FAFB', borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                  <button onClick={() => setDeleteModal({ doctor: selectedDoctor, reason: '' })} 
                    className="mg-btn" style={{ width: '100%', background: '#EF233C', height: 48, gap: 10 }}>
                    <UserMinus size={18} /> Decommission Doctor Account
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deletion Modal */}
        <AnimatePresence>
          {deleteModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !processing && setDeleteModal(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(217,4,41,0.08)', border: '1px solid rgba(217,4,41,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <AlertTriangle size={26} style={{ color: '#D90429' }} />
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', textAlign: 'center', margin: '0 0 8px' }}>Decommission Account?</h3>
                <p style={{ fontSize: 14, color: '#8D99AE', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>
                  You are about to permanently delete **Dr. {deleteModal.doctor.doctorName}**. This action is irreversible and will purge all clinical data associated with this account.
                </p>

                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Mandatory Reason for Deletion</p>
                  <textarea value={deleteModal.reason} onChange={e => setDeleteModal(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Provide a detailed reason for decommisisoning this account..."
                    style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#F8FAFB', border: '1px solid rgba(43,45,66,0.1)', fontSize: 14, color: '#2B2D42', height: 100, resize: 'none', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setDeleteModal(null)} disabled={processing} className="mg-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={handleDelete} disabled={processing} className="mg-btn" style={{ flex: 1, background: '#D90429' }}>
                    {processing ? 'Processing...' : 'Confirm Deletion'}
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
