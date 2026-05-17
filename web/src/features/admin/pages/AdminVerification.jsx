import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Stethoscope, Building2, MapPin,
  ShieldCheck, FileText, X, Check, AlertTriangle, Banknote, Clock
} from 'lucide-react';
import { authApi, adminApi, fetchAuthBlob } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { useToast } from '../../../shared/ui/ToastProvider';
import AuthImage from '../../../shared/ui/AuthImage';
import AppShell from '../../../shared/ui/AppShell';

const DOC_KEYS = [
  { key: 'medicalLicenseUrl',   label: 'Medical License' },
  { key: 'prcIdUrl',            label: 'PRC ID' },
  { key: 'boardCertificateUrl', label: 'Board Certificate' },
  { key: 'governmentIdUrl',     label: 'Government ID' },
];

function adminDocUrl(storedUrl) {
  if (!storedUrl) return null;
  const filename = storedUrl.split('/').pop();
  return `/api/v1/admin/documents/${filename}`;
}

export default function AdminVerification() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [docChecks, setDocChecks] = useState({});

  const [approveModal, setApproveModal] = useState(null);
  const [docViewer, setDocViewer] = useState(null);
  const [docViewerLoading, setDocViewerLoading] = useState(false);
  const [docViewerBlobUrl, setDocViewerBlobUrl] = useState(null);

  useEffect(() => {
    authApi.me().then(r => {
      const u = r.data?.data ?? r.data;
      setUser(u);
      authSession.setUser(u);
      if (u?.role !== 'ADMIN') navigate('/dashboard', { replace: true });
    }).catch(() => {});
    adminApi.getPendingDoctors().then(r => {
      const list = r.data?.data ?? r.data;
      setPending(Array.isArray(list) ? list : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  async function handleApprove() {
    if (!approveModal) return;
    const { doctorId } = approveModal.doctor;
    setProcessing(doctorId);
    try {
      await adminApi.approveDoctor(doctorId);
      setPending(prev => prev.filter(d => d.doctorId !== doctorId));
      addToast('Doctor approved successfully.', 'success');
      setApproveModal(null);
    } catch { addToast('Action failed. Please try again.', 'error'); }
    finally { setProcessing(null); }
  }

  function openRejectModal(doctor) {
    const initial = {};
    DOC_KEYS.forEach(({ key }) => { initial[key] = null; });
    setDocChecks(initial);
    setRejectReason('');
    setRejectModal({ doctor });
  }

  async function submitReject() {
    if (!rejectModal) return;
    const { doctor } = rejectModal;
    const failedDocs = DOC_KEYS.filter(({ key }) => docChecks[key] === false).map(({ label }) => label);
    let fullReason = rejectReason.trim();
    if (failedDocs.length > 0) {
      const docNote = `Issues with: ${failedDocs.join(', ')}.`;
      fullReason = fullReason ? `${docNote} ${fullReason}` : docNote;
    }
    setProcessing(doctor.doctorId);
    try {
      await adminApi.rejectDoctor(doctor.doctorId, fullReason || 'Registration rejected by admin.');
      setPending(prev => prev.filter(d => d.doctorId !== doctor.doctorId));
      addToast('Doctor rejected.', 'error');
      setRejectModal(null);
    } catch { addToast('Action failed. Please try again.', 'error'); }
    finally { setProcessing(null); }
  }

  async function openDocViewer(storedUrl, label) {
    const url = adminDocUrl(storedUrl);
    if (!url) return;
    setDocViewer({ url, label });
    setDocViewerBlobUrl(null);
    setDocViewerLoading(true);
    try {
      const blobUrl = await fetchAuthBlob(url);
      setDocViewerBlobUrl(blobUrl);
    } catch {
      addToast('Could not load document.', 'error');
      setDocViewer(null);
    } finally {
      setDocViewerLoading(false);
    }
  }

  function closeDocViewer() {
    if (docViewerBlobUrl) URL.revokeObjectURL(docViewerBlobUrl);
    setDocViewer(null);
    setDocViewerBlobUrl(null);
  }

  const isPdf = docViewer?.url?.toLowerCase().endsWith('.pdf');

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        
        {/* Modals & Overlays */}
        <AnimatePresence>
          {docViewer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDocViewer}
              style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid rgba(255,255,255,0.4)', width: '100%', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(43,45,66,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,35,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} style={{ color: '#EF233C' }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#2B2D42' }}>{docViewer.label}</span>
                  </div>
                  <button onClick={closeDocViewer} style={{ background: 'rgba(43,45,66,0.05)', border: 'none', cursor: 'pointer', color: '#8D99AE', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: '#F8FAFB' }}>
                  {docViewerLoading ? (
                    <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
                  ) : docViewerBlobUrl ? (
                    isPdf ? (
                      <object data={docViewerBlobUrl} type="application/pdf" style={{ width: '100%', height: '75vh', border: 'none' }}>
                        <div style={{ padding: 40, textAlign: 'center' }}>
                          <p style={{ color: '#6B7280', marginBottom: 16 }}>PDF preview not supported in this browser.</p>
                          <a href={docViewerBlobUrl} download className="mg-btn" style={{ padding: '8px 16px' }}>Download Document</a>
                        </div>
                      </object>
                    ) : (
                      <img src={docViewerBlobUrl} alt={docViewer.label} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
                    )
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          )}

          {rejectModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRejectModal(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 520, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(217,4,41,0.08)', border: '1px solid rgba(217,4,41,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={24} style={{ color: '#D90429' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Reject Application</h3>
                    <p style={{ fontSize: 13, color: '#8D99AE', margin: '4px 0 0' }}>Dr. {rejectModal.doctor.doctorName}</p>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Checklist for Physician</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {DOC_KEYS.map(({ key, label }) => {
                      const status = docChecks[key];
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: '#F8FAFB', border: `1px solid ${status === false ? '#EF233C40' : status === true ? '#22C55E40' : 'transparent'}` }}>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#2B2D42' }}>{label}</span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setDocChecks(p => ({ ...p, [key]: true }))}
                              style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: status === true ? '#22C55E' : 'rgba(43,45,66,0.05)', color: status === true ? '#fff' : '#8D99AE', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                              <Check size={16} />
                            </button>
                            <button onClick={() => setDocChecks(p => ({ ...p, [key]: false }))}
                              style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: status === false ? '#EF233C' : 'rgba(43,45,66,0.05)', color: status === false ? '#fff' : '#8D99AE', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Rejection Remarks</p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Type a message to the doctor explaining the rejection..."
                    style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#F8FAFB', border: '1px solid rgba(43,45,66,0.1)', fontSize: 14, color: '#2B2D42', minHeight: 100, resize: 'none', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setRejectModal(null)} className="mg-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitReject} disabled={processing} className="mg-btn" style={{ flex: 1, background: '#D90429' }}>
                    {processing ? 'Processing...' : 'Confirm Reject'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {approveModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setApproveModal(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 440, padding: 40, textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle size={40} style={{ color: '#16A34A' }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 12px' }}>Verify Physician</h3>
                <p style={{ fontSize: 15, color: '#8D99AE', margin: '0 0 32px', lineHeight: 1.6 }}>
                  You are approving <strong>Dr. {approveModal.doctor.doctorName}</strong>. This grants full clinical access and notifies the provider via secure mail.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setApproveModal(null)} className="mg-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={handleApprove} disabled={processing} className="mg-btn" style={{ flex: 1, background: '#16A34A' }}>
                    {processing ? 'Verifying...' : 'Approve Now'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.1)', marginBottom: 12 }}>
              <ShieldCheck size={14} color="#EF233C" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#EF233C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Command Center</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>
              Verification Portal
            </h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: '4px 0 0' }}>Review clinical credentials and approve physician access to the Medigo network.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: '#2B2D42', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              <Clock size={16} /> {pending.length} Pending Requests
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
          </div>
        ) : pending.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="card" style={{ padding: '64px 32px', textAlign: 'center', background: '#FFFFFF' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={32} style={{ color: '#16A34A' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px' }}>Queue is Clean!</h2>
            <p style={{ fontSize: 15, color: '#8D99AE', margin: 0 }}>All pending physician verifications have been processed.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {pending.map((doctor, i) => {
              const hasAnyDoc = DOC_KEYS.some(({ key }) => doctor[key]);
              const avatarUrl = doctor.profilePictureUrl ? adminDocUrl(doctor.profilePictureUrl) : null;
              return (
                <motion.div key={doctor.doctorId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="card" style={{ padding: 0, background: '#FFFFFF', overflow: 'hidden' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Dark Side Accent */}
                    <div style={{ width: 8, background: '#2B2D42' }} />
                    
                    <div style={{ flex: 1, padding: 32 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 28 }}>
                        <div style={{ display: 'flex', gap: 20 }}>
                          <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', background: '#F8FAFB', border: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AuthImage src={avatarUrl} alt="Dr." style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              fallback={<span style={{ fontSize: 18, fontWeight: 800, color: '#EF233C' }}>{doctor.doctorName[0]}</span>} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: '0 0 4px' }}>Dr. {doctor.doctorName}</h3>
                            <p style={{ fontSize: 14, color: '#8D99AE', margin: '0 0 16px' }}>{doctor.email}</p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Stethoscope size={14} style={{ color: '#EF233C' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42' }}>{doctor.specialization || 'General Practice'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={14} style={{ color: '#8D99AE' }} />
                                <span style={{ fontSize: 13, color: '#6B7280' }}>{doctor.clinicName || 'Private Clinic'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Banknote size={14} style={{ color: '#16A34A' }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₱{doctor.consultationFee?.toLocaleString() || '0'} Fee</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => openRejectModal(doctor)} className="mg-btn-ghost" style={{ padding: '10px 20px', border: '1px solid rgba(217,4,41,0.15)', color: '#D90429' }}>
                            <XCircle size={16} /> Reject Application
                          </button>
                          <button onClick={() => setApproveModal({ doctor })} className="mg-btn" style={{ padding: '10px 24px', background: '#16A34A' }}>
                            <CheckCircle size={16} /> Approve Access
                          </button>
                        </div>
                      </div>

                      {hasAnyDoc && (
                        <div style={{ padding: 24, borderRadius: 20, background: '#F8FAFB', border: '1px solid rgba(43,45,66,0.04)' }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Required Documentation</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {DOC_KEYS.map(({ key, label }) => {
                              if (!doctor[key]) return null;
                              return (
                                <motion.button key={key} onClick={() => openDocViewer(doctor[key], label)}
                                  whileHover={{ y: -2, background: '#FFFFFF', borderColor: '#EF233C' }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 12, background: '#FFFFFF', border: '1px solid rgba(43,45,66,0.08)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                  <FileText size={14} style={{ color: '#EF233C' }} />
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2B2D42' }}>{label}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
