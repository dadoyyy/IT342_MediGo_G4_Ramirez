import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Mail, Calendar, Search, X, User, 
  Shield, Info, Trash2, AlertTriangle, ShieldCheck, UserMinus, Clock
} from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';
import { useToast } from '../../../shared/ui/ToastProvider';

export default function AdminPatients() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // { patient, reason }
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u); authSession.setUser(u);
        const patsRes = await adminApi.getAllPatients();
        setPatients(patsRes.data?.data || patsRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const filtered = patients.filter(p =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteModal.reason?.trim()) {
      addToast('Please provide a reason for deletion.', 'error');
      return;
    }
    setProcessing(true);
    try {
      await adminApi.deletePatientAccount(deleteModal.patient.id, deleteModal.reason);
      setPatients(prev => prev.filter(p => p.id !== deleteModal.patient.id));
      addToast(`Account for ${deleteModal.patient.fullName} has been deleted.`, 'success');
      setDeleteModal(null);
      setSelectedPatient(null);
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
              Patient Registry
            </h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: '4px 0 0' }}>Manage the patient database, monitor platform activity, and oversee user accounts.</p>
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px' }}>No Patients Found</h2>
            <p style={{ fontSize: 15, color: '#8D99AE', margin: 0 }}>Try adjusting your search terms to find the patient you're looking for.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {filtered.map((patient, i) => (
              <motion.div key={patient.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedPatient(patient)} className="card" style={{ padding: 0, background: '#FFFFFF', overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 6, background: '#8D99AE' }} />
                  <div style={{ flex: 1, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(141,153,174,0.06)', border: '1px solid rgba(141,153,174,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#8D99AE' }}>
                        {patient.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2B2D42', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.fullName}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(141,153,174,0.05)', color: '#8D99AE', border: '1px solid rgba(141,153,174,0.1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PATIENT</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0', borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Mail size={14} style={{ color: '#8D99AE' }} />
                        <span style={{ fontSize: 13, color: '#6B7280' }}>{patient.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Calendar size={14} style={{ color: '#8D99AE' }} />
                        <span style={{ fontSize: 13, color: '#6B7280' }}>Member since {new Date(patient.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Patient Details Modal */}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 28, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                
                <div style={{ padding: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(141,153,174,0.06)', border: '1px solid rgba(141,153,174,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#8D99AE' }}>
                        {selectedPatient.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 6px' }}>{selectedPatient.fullName}</h2>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: 'rgba(141,153,174,0.08)', color: '#8D99AE', border: '1px solid currentColor', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Registered Patient
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} 
                      style={{ background: 'rgba(43,45,66,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#8D99AE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <section>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Account Architecture</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: '#F8FAFB', borderRadius: 20, border: '1px solid rgba(43,45,66,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)' }}>
                            <User size={16} style={{ color: '#EF233C' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedPatient.id}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Patient UID</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)' }}>
                            <Mail size={16} style={{ color: '#8D99AE' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{selectedPatient.email}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Official Email</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)' }}>
                            <Calendar size={16} style={{ color: '#D90429' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>{new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Registration Date</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Platform Compliance</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: '#F8FAFB', borderRadius: 20, border: '1px solid rgba(43,45,66,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(43,45,66,0.06)' }}>
                            <Shield size={16} style={{ color: '#16A34A' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>Active</p>
                            <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>Account Integrity</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div style={{ padding: 16, borderRadius: 16, background: 'rgba(239,35,60,0.04)', border: '1px solid rgba(239,35,60,0.08)', display: 'flex', gap: 12 }}>
                      <Info size={16} style={{ color: '#EF233C', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                        This user has full access to the patient dashboard and appointment booking systems. Deleting this account will purge all scheduled consultations and health records.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px 32px', background: '#F8FAFB', borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                  <button onClick={() => setDeleteModal({ patient: selectedPatient, reason: '' })} 
                    className="mg-btn" style={{ width: '100%', background: '#EF233C', height: 48, gap: 10 }}>
                    <UserMinus size={18} /> Decommission Patient Account
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
                  You are about to permanently delete **{deleteModal.patient.fullName}**. This action is irreversible and will purge all appointment history and health data associated with this user.
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
