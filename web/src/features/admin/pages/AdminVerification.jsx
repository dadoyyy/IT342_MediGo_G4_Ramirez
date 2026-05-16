import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Stethoscope, Building2, MapPin,
  LogOut, ShieldCheck, FileText, X, Check, AlertTriangle
} from 'lucide-react';
import { authApi, adminApi, fetchAuthBlob } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import axios from 'axios';
import { useToast } from '../../../shared/ui/ToastProvider';
import AuthImage from '../../../shared/ui/AuthImage';
import AppShell from '../../../shared/ui/AppShell';

const DOC_KEYS = [
  { key: 'medicalLicenseUrl',   label: 'Medical License' },
  { key: 'prcIdUrl',            label: 'PRC ID' },
  { key: 'boardCertificateUrl', label: 'Board Certificate' },
  { key: 'governmentIdUrl',     label: 'Government ID' },
];

/** Extract filename from a stored URL like /api/v1/doctors/me/documents/uuid.jpg */
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

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(null); // { doctor }
  const [rejectReason, setRejectReason] = useState('');
  const [docChecks, setDocChecks] = useState({}); // { medicalLicenseUrl: true|false|null }

  // Approve modal state
  const [approveModal, setApproveModal] = useState(null); // { doctor }

  // Document viewer modal
  const [docViewer, setDocViewer] = useState(null); // { url, label }
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
    DOC_KEYS.forEach(({ key }) => { initial[key] = null; }); // null = not reviewed
    setDocChecks(initial);
    setRejectReason('');
    setRejectModal({ doctor });
  }

  async function submitReject() {
    if (!rejectModal) return;
    const { doctor } = rejectModal;

    // Build reason from checklist + custom text
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


      {/* Document viewer modal */}
      <AnimatePresence>
        {docViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeDocViewer}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(43,45,66,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(43,45,66,0.08)', width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(43,45,66,0.15)' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(43,45,66,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={16} style={{ color: '#8D99AE' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42' }}>{docViewer.label}</span>
                </div>
                <button onClick={closeDocViewer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8D99AE', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              {/* Modal content */}
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: '#EDF2F4' }}>
                {docViewerLoading ? (
                  <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
                ) : docViewerBlobUrl ? (
                  isPdf ? (
                    <object
                      data={docViewerBlobUrl}
                      type="application/pdf"
                      style={{ width: '100%', height: '75vh', border: 'none' }}>
                      <p style={{ color: '#6B7280', textAlign: 'center', padding: 24 }}>
                        PDF preview not supported in this browser.{' '}
                        <a href={docViewerBlobUrl} download style={{ color: '#EF233C' }}>Download instead</a>
                      </p>
                    </object>
                  ) : (
                    <img src={docViewerBlobUrl} alt={docViewer.label} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
                  )
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setRejectModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(217,4,41,0.15)', width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 24px 64px rgba(43,45,66,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)' }}>
                  <AlertTriangle size={16} style={{ color: '#D90429' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2B2D42', margin: 0 }}>Reject Registration</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Dr. {rejectModal.doctor.doctorName}</p>
                </div>
                <button onClick={() => setRejectModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8D99AE', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              {/* Document checklist */}
              <p style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.07em', marginBottom: 10 }}>DOCUMENT REVIEW</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {DOC_KEYS.map(({ key, label }) => {
                  const status = docChecks[key]; // null | true | false
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(43,45,66,0.02)', border: `1px solid ${status === true ? 'rgba(34,197,94,0.25)' : status === false ? 'rgba(217,4,41,0.25)' : 'rgba(43,45,66,0.08)'}` }}>
                      <FileText size={13} style={{ color: '#8D99AE', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: '#2B2D42' }}>{label}</span>
                      {/* Accept button */}
                      <button
                        onClick={() => setDocChecks(p => ({ ...p, [key]: true }))}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: status === true ? 'rgba(34,197,94,0.12)' : 'rgba(43,45,66,0.04)', transition: 'all 0.15s' }}>
                        <Check size={13} style={{ color: status === true ? '#16A34A' : '#8D99AE' }} />
                      </button>
                      {/* Reject button */}
                      <button
                        onClick={() => setDocChecks(p => ({ ...p, [key]: false }))}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: status === false ? 'rgba(217,4,41,0.1)' : 'rgba(43,45,66,0.04)', transition: 'all 0.15s' }}>
                        <X size={13} style={{ color: status === false ? '#D90429' : '#8D99AE' }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Rejection reason */}
              <p style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.07em', marginBottom: 8 }}>REJECTION REASON (optional)</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Provide additional details about why this registration is being rejected…"
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(43,45,66,0.1)', color: '#2B2D42', fontSize: 13, resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setRejectModal(null)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.1)', color: '#6B7280', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={submitReject} disabled={processing === rejectModal.doctor.doctorId}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.18)', color: '#D90429', cursor: 'pointer', opacity: processing === rejectModal.doctor.doctorId ? 0.5 : 1 }}>
                  {processing === rejectModal.doctor.doctorId ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Approve modal */}
      <AnimatePresence>
        {approveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setApproveModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(34,197,94,0.15)', width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 24px 64px rgba(43,45,66,0.15)', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle size={32} style={{ color: '#16A34A' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', margin: '0 0 8px' }}>Approve Registration?</h3>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5 }}>
                You are about to verify <strong>Dr. {approveModal.doctor.doctorName}</strong>. This will grant them full access to the platform and notify them via email.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setApproveModal(null)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.1)', color: '#6B7280', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleApprove} disabled={processing === approveModal.doctor.doctorId}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: '#16A34A', border: 'none', color: '#fff', cursor: 'pointer', opacity: processing === approveModal.doctor.doctorId ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {processing === approveModal.doctor.doctorId ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : 'Yes, Approve'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
          <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>{pending.length} application{pending.length !== 1 ? 's' : ''} awaiting your review and approval</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : pending.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card" style={{ borderRadius: 24, padding: 48, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <CheckCircle size={26} style={{ color: '#16A34A' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#2B2D42', marginBottom: 4 }}>All caught up!</p>
            <p style={{ fontSize: 14, color: '#6B7280' }}>No pending verifications at this time.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pending.map((doctor, i) => {
              const hasAnyDoc = DOC_KEYS.some(({ key }) => doctor[key]);
              const avatarAdminUrl = doctor.profilePictureUrl ? adminDocUrl(doctor.profilePictureUrl) : null;
              return (
                <motion.div key={doctor.doctorId}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card" style={{ padding: 24 }}>

                  {/* Doctor info + action buttons */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: hasAnyDoc ? 20 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                      {/* Avatar */}
                      <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, rgba(239,35,60,0.06), rgba(141,153,174,0.06))', border: '1px solid rgba(239,35,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#EF233C' }}>
                        <AuthImage
                          src={avatarAdminUrl}
                          alt="Doctor"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          fallback={<span>{(doctor.doctorName || '').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}</span>}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: '#2B2D42', marginBottom: 2 }}>Dr. {doctor.doctorName}</p>
                        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{doctor.email}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {doctor.specialization && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Stethoscope size={11} style={{ color: '#EF233C' }} />
                              <span style={{ fontSize: 12, color: '#6B7280' }}>{doctor.specialization}</span>
                            </div>
                          )}
                          {doctor.clinicName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Building2 size={11} style={{ color: '#8D99AE' }} />
                              <span style={{ fontSize: 12, color: '#6B7280' }}>{doctor.clinicName}</span>
                            </div>
                          )}
                          {doctor.clinicAddress && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <MapPin size={11} style={{ color: '#8D99AE' }} />
                              <span style={{ fontSize: 12, color: '#8D99AE' }}>{doctor.clinicAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openRejectModal(doctor)} disabled={processing === doctor.doctorId}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)', color: '#D90429', cursor: 'pointer', opacity: processing === doctor.doctorId ? 0.5 : 1, transition: 'all 0.2s' }}>
                        <XCircle size={14} /> Reject
                      </button>
                      <button onClick={() => setApproveModal({ doctor })} disabled={processing === doctor.doctorId}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#16A34A', cursor: 'pointer', opacity: processing === doctor.doctorId ? 0.5 : 1, transition: 'all 0.2s' }}>
                        <CheckCircle size={14} /> Approve
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  {hasAnyDoc && (
                    <div style={{ paddingTop: 16, borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.07em', marginBottom: 10 }}>SUBMITTED DOCUMENTS — click to view</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {DOC_KEYS.map(({ key, label }) => {
                          const url = doctor[key];
                          if (!url) return null;
                          return (
                            <motion.button key={key}
                              onClick={() => openDocViewer(url, label)}
                              whileHover={{ scale: 1.05, backgroundColor: 'rgba(239,35,60,0.05)', borderColor: 'rgba(239,35,60,0.3)' }}
                              whileTap={{ scale: 0.95 }}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8, 
                                padding: '8px 14px', 
                                borderRadius: 10, 
                                fontSize: 12, 
                                fontWeight: 600, 
                                background: '#fff', 
                                border: '1px solid rgba(239,35,60,0.15)', 
                                color: '#2B2D42', 
                                cursor: 'pointer', 
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}>
                              <FileText size={14} style={{ color: '#EF233C' }} />
                              {label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
