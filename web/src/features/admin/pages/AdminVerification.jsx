import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Stethoscope, Building2, MapPin,
  LogOut, ShieldCheck, FileText, X, Check, AlertTriangle
} from 'lucide-react';
import { authApi, adminApi, fetchAuthBlob } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';
import AuthImage from '../../../shared/ui/AuthImage';

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
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(null); // { doctor }
  const [rejectReason, setRejectReason] = useState('');
  const [docChecks, setDocChecks] = useState({}); // { medicalLicenseUrl: true|false|null }

  // Document viewer modal
  const [docViewer, setDocViewer] = useState(null); // { url, label }
  const [docViewerLoading, setDocViewerLoading] = useState(false);
  const [docViewerBlobUrl, setDocViewerBlobUrl] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

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

  async function handleApprove(doctorId) {
    setProcessing(doctorId);
    try {
      await adminApi.approveDoctor(doctorId);
      setPending(prev => prev.filter(d => d.doctorId !== doctorId));
      showToast('Doctor approved successfully.', 'success');
    } catch { showToast('Action failed. Please try again.', 'error'); }
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
      showToast('Doctor rejected.', 'error');
      setRejectModal(null);
    } catch { showToast('Action failed. Please try again.', 'error'); }
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
      showToast('Could not load document.', 'error');
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

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  const isPdf = docViewer?.url?.toLowerCase().endsWith('.pdf');

  return (
    <div style={{ minHeight: '100vh', background: '#0B1020' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)', ...(toast.type === 'success' ? { background: 'rgba(46,196,182,0.12)', border: '1px solid rgba(46,196,182,0.25)', color: '#5EEAD4' } : { background: 'rgba(255,117,89,0.12)', border: '1px solid rgba(255,117,89,0.25)', color: '#FCA5A5' }) }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document viewer modal */}
      <AnimatePresence>
        {docViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeDocViewer}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(11,16,32,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#111827', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={16} style={{ color: '#9B8CFF' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA' }}>{docViewer.label}</span>
                </div>
                <button onClick={closeDocViewer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(136,146,164,0.6)', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              {/* Modal content */}
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: '#0B1020' }}>
                {docViewerLoading ? (
                  <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
                ) : docViewerBlobUrl ? (
                  isPdf ? (
                    <iframe src={docViewerBlobUrl} title={docViewer.label} style={{ width: '100%', height: '75vh', border: 'none' }} />
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
            style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(11,16,32,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#111827', borderRadius: 20, border: '1px solid rgba(255,117,89,0.2)', width: '100%', maxWidth: 520, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,117,89,0.1)', border: '1px solid rgba(255,117,89,0.2)' }}>
                  <AlertTriangle size={16} style={{ color: '#FCA5A5' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F7F8FA', margin: 0 }}>Reject Registration</p>
                  <p style={{ fontSize: 12, color: '#8892A4', margin: 0 }}>Dr. {rejectModal.doctor.doctorName}</p>
                </div>
                <button onClick={() => setRejectModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(136,146,164,0.5)', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              {/* Document checklist */}
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.6)', letterSpacing: '0.07em', marginBottom: 10 }}>DOCUMENT REVIEW</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {DOC_KEYS.map(({ key, label }) => {
                  const status = docChecks[key]; // null | true | false
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${status === true ? 'rgba(46,196,182,0.25)' : status === false ? 'rgba(255,117,89,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                      <FileText size={13} style={{ color: 'rgba(136,146,164,0.4)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: '#F7F8FA' }}>{label}</span>
                      {/* Accept button */}
                      <button
                        onClick={() => setDocChecks(p => ({ ...p, [key]: true }))}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: status === true ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.05)', transition: 'all 0.15s' }}>
                        <Check size={13} style={{ color: status === true ? '#5EEAD4' : 'rgba(136,146,164,0.4)' }} />
                      </button>
                      {/* Reject button */}
                      <button
                        onClick={() => setDocChecks(p => ({ ...p, [key]: false }))}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: status === false ? 'rgba(255,117,89,0.2)' : 'rgba(255,255,255,0.05)', transition: 'all 0.15s' }}>
                        <X size={13} style={{ color: status === false ? '#FCA5A5' : 'rgba(136,146,164,0.4)' }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Rejection reason */}
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.6)', letterSpacing: '0.07em', marginBottom: 8 }}>REJECTION REASON (optional)</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Provide additional details about why this registration is being rejected…"
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F7F8FA', fontSize: 13, resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setRejectModal(null)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892A4', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={submitReject} disabled={processing === rejectModal.doctor.doctorId}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(255,117,89,0.12)', border: '1px solid rgba(255,117,89,0.25)', color: '#FCA5A5', cursor: 'pointer', opacity: processing === rejectModal.doctor.doctorId ? 0.5 : 1 }}>
                  {processing === rejectModal.doctor.doctorId ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,16,32,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
            <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, color: '#F7F8FA' }}>MediGo</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && <span style={{ fontSize: 13, color: '#8892A4' }} className="hidden sm:block">{user.fullName}</span>}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(136,146,164,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)' }}>
              <ShieldCheck size={16} style={{ color: '#9B8CFF' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA' }}>Doctor Verification</h1>
          </div>
          <p style={{ fontSize: 14, color: '#8892A4' }}>Review and approve pending doctor registrations</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : pending.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass" style={{ borderRadius: 24, padding: 48, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
              <CheckCircle size={26} style={{ color: 'rgba(46,196,182,0.6)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 4 }}>All caught up!</p>
            <p style={{ fontSize: 14, color: '#8892A4' }}>No pending verifications at this time.</p>
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
                      <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, rgba(46,196,182,0.12), rgba(155,140,255,0.12))', border: '1px solid rgba(46,196,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#2EC4B6' }}>
                        <AuthImage
                          src={avatarAdminUrl}
                          alt="Doctor"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          fallback={<span>{(doctor.doctorName || '').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}</span>}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 2 }}>Dr. {doctor.doctorName}</p>
                        <p style={{ fontSize: 13, color: '#8892A4', marginBottom: 8 }}>{doctor.email}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {doctor.specialization && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Stethoscope size={11} style={{ color: '#2EC4B6' }} />
                              <span style={{ fontSize: 12, color: '#8892A4' }}>{doctor.specialization}</span>
                            </div>
                          )}
                          {doctor.clinicName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Building2 size={11} style={{ color: '#9B8CFF' }} />
                              <span style={{ fontSize: 12, color: '#8892A4' }}>{doctor.clinicName}</span>
                            </div>
                          )}
                          {doctor.clinicAddress && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <MapPin size={11} style={{ color: 'rgba(136,146,164,0.4)' }} />
                              <span style={{ fontSize: 12, color: 'rgba(136,146,164,0.5)' }}>{doctor.clinicAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openRejectModal(doctor)} disabled={processing === doctor.doctorId}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', color: '#FCA5A5', cursor: 'pointer', opacity: processing === doctor.doctorId ? 0.5 : 1, transition: 'all 0.2s' }}>
                        <XCircle size={14} /> Reject
                      </button>
                      <button onClick={() => handleApprove(doctor.doctorId)} disabled={processing === doctor.doctorId}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)', color: '#5EEAD4', cursor: 'pointer', opacity: processing === doctor.doctorId ? 0.5 : 1, transition: 'all 0.2s' }}>
                        {processing === doctor.doctorId
                          ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(46,196,182,0.3)', borderTopColor: '#2EC4B6' }} />
                          : <CheckCircle size={14} />}
                        Approve
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  {hasAnyDoc && (
                    <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.4)', letterSpacing: '0.07em', marginBottom: 10 }}>SUBMITTED DOCUMENTS — click to view</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {DOC_KEYS.map(({ key, label }) => {
                          const url = doctor[key];
                          if (!url) return null;
                          return (
                            <button key={key}
                              onClick={() => openDocViewer(url, label)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(155,140,255,0.08)', border: '1px solid rgba(155,140,255,0.18)', color: '#9B8CFF', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <FileText size={12} />
                              {label}
                            </button>
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
      </main>
    </div>
  );
}
