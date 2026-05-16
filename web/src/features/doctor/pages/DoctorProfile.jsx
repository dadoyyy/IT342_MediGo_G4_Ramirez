import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, Building2, MapPin, ArrowRight,
  CheckCircle, AlertCircle, FileText, Upload, Camera, X, Clock, Banknote, Activity
} from 'lucide-react';
import { authApi, doctorApi, fetchAuthBlob } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import AuthImage from '../../../shared/ui/AuthImage';
import SpecializationSelect from '../../../shared/ui/SpecializationSelect';
import axios from 'axios';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { authSession } from '../../auth/authSession';
import { useToast } from '../../../shared/ui/ToastProvider';

/* ── Validation ─────────────────────────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.specialization || form.specialization.length === 0) e.specialization = 'At least one specialization is required.';
  if (!form.clinicName.trim()) e.clinicName = 'Clinic / hospital name is required.';
  if (!form.clinicAddress.trim()) e.clinicAddress = 'Clinic address is required.';
  if (!form.bio || form.bio.trim().length < 20) e.bio = 'Bio must be at least 20 characters.';
  if (!form.yearsOfExperience || isNaN(parseInt(form.yearsOfExperience))) e.yearsOfExperience = 'Valid years of experience is required.';
  if (!form.education || !form.education.trim()) e.education = 'Education / Medical school is required.';
  if (!form.consultationFee || isNaN(parseFloat(form.consultationFee))) e.consultationFee = 'Valid consultation fee is required.';
  return e;
}

const REQUIRED_DOCS = ['profile_picture', 'medical_license', 'prc_id', 'board_certificate', 'government_id'];

const DOC_META = {
  profile_picture:   { label: 'Profile Picture',      hint: 'A clear photo of yourself (PNG or JPG)',      accept: '.jpg,.jpeg,.png' },
  medical_license:   { label: 'Medical License',      hint: 'PRC-issued medical license (PDF only)',       accept: '.pdf' },
  prc_id:            { label: 'PRC ID',               hint: 'Professional Regulation Commission ID (PDF)', accept: '.pdf' },
  board_certificate: { label: 'Board Certificate',    hint: 'Certificate of board examination (PDF only)', accept: '.pdf' },
  government_id:     { label: 'Government-Issued ID', hint: 'Passport, driver\'s license, or national ID (PDF)', accept: '.pdf' },
};

/* ── Component ──────────────────────────────────────────────────────────── */
export default function DoctorProfile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const { isProfileComplete, isVerified, markProfileComplete, updateProfilePicture } = useDoctorProfile();
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    specialization: [],
    clinicName: '',
    clinicAddress: '',
    bio: '',
    yearsOfExperience: '',
    education: '',
    consultationFee: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [docs, setDocs] = useState({
    profile_picture: null, medical_license: null,
    prc_id: null, board_certificate: null, government_id: null,
  });
  const [docUploading, setDocUploading] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [docSuccess, setDocSuccess] = useState({});

  // In-page document viewer modal
  const [docViewer, setDocViewer] = useState(null); // { label, blobUrl, isPdf }
  const [docViewerLoading, setDocViewerLoading] = useState(false);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeRequestSubmitting, setChangeRequestSubmitting] = useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRequestForm, setChangeRequestForm] = useState({ specialization: [], reason: '' });

  const formFilled = form.specialization.length > 0 && 
                     form.clinicName.trim() && 
                     form.clinicAddress.trim() &&
                     form.bio.trim().length >= 20 &&
                     form.yearsOfExperience !== '' &&
                     form.education.trim() !== '' &&
                     form.consultationFee !== '';
  const allDocsUploaded = REQUIRED_DOCS.every(k => !!docs[k]);
  const canSave = !!(formFilled && allDocsUploaded && !saving);

  const totalSteps = 1 + REQUIRED_DOCS.length;
  const doneSteps  = (formFilled ? 1 : 0) + REQUIRED_DOCS.filter(k => !!docs[k]).length;
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);

        const profileRes = await doctorApi.getMyProfile().catch(() => null);
        if (profileRes) {
          const p = profileRes.data?.data ?? profileRes.data;
          if (p) {
            setForm(f => ({
              specialization: p.specialization ? p.specialization.split(',').map(s => s.trim()).filter(Boolean) : f.specialization,
              clinicName:     p.clinicName     || f.clinicName,
              clinicAddress:  p.clinicAddress  || f.clinicAddress,
              bio:            p.bio            || f.bio,
              yearsOfExperience: p.yearsOfExperience !== undefined ? p.yearsOfExperience : f.yearsOfExperience,
              education:      p.education      || f.education,
              consultationFee: p.consultationFee || f.consultationFee,
            }));
            setDocs({
              profile_picture:   p.profilePictureUrl   || null,
              medical_license:   p.medicalLicenseUrl   || null,
              prc_id:            p.prcIdUrl            || null,
              board_certificate: p.boardCertificateUrl || null,
              government_id:     p.governmentIdUrl     || null,
            });
          }
        }

        const reqRes = await doctorApi.listMySpecializationChangeRequests().catch(() => null);
        if (reqRes) {
          const list = reqRes.data?.data ?? reqRes.data;
          setChangeRequests(Array.isArray(list) ? list : []);
        }
      } catch {
        navigate('/login', { replace: true });
      }
    }
    load();
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
    setApiError('');
    setSaveSuccess(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    if (!allDocsUploaded) return;
    setSaving(true); setApiError(''); setSaveSuccess(false);
    try {
      await doctorApi.upsertMyProfile({
        specialization: form.specialization.join(', '),
        clinicName:     form.clinicName.trim(),
        clinicAddress:  form.clinicAddress.trim(),
        bio:            form.bio.trim(),
        yearsOfExperience: parseInt(form.yearsOfExperience),
        education:      form.education.trim(),
        consultationFee: parseFloat(form.consultationFee)
      });
      setSaveSuccess(true);
      if (!isProfileComplete || !isVerified) {
        addToast('Profile submitted for review. We will notify you once verification is complete.', 'success');
      } else {
        addToast('Your profile changes were saved successfully.', 'success');
      }
      markProfileComplete();
      if (!isProfileComplete) {
        setTimeout(() => navigate('/pending-approval', { replace: true }), 1200);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data?.error;
        setApiError(errData?.message || err.response.data?.message || 'Failed to save profile.');
        addToast(errData?.message || err.response.data?.message || 'Failed to save profile.', 'error');
      } else {
        setApiError('Unable to connect. Please try again.');
        addToast('Unable to connect. Please try again.', 'error');
      }
    } finally { setSaving(false); }
  }

  async function submitChangeRequest(e) {
    e.preventDefault();
    const requestedSpecialization = changeRequestForm.specialization.join(', ').trim();
    if (!requestedSpecialization) {
      addToast('Please choose a requested specialization.', 'error');
      return;
    }
    setChangeRequestSubmitting(true);
    try {
      const res = await doctorApi.requestSpecializationChange({
        requestedSpecialization,
        reason: changeRequestForm.reason.trim() || null,
      });
      const created = res.data?.data ?? res.data;
      setChangeRequests(prev => [created, ...prev]);
      setChangeRequestOpen(false);
      setChangeRequestForm({ specialization: [], reason: '' });
      addToast('Specialization change request submitted for admin review.', 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error?.message || err.response?.data?.message || 'Request failed.')
        : 'Request failed.';
      addToast(msg, 'error');
    } finally {
      setChangeRequestSubmitting(false);
    }
  }

  async function handleDocUpload(docType, file) {
    if (!file) return;
    setDocUploading(p => ({ ...p, [docType]: true }));
    setDocErrors(p => ({ ...p, [docType]: null }));
    setDocSuccess(p => ({ ...p, [docType]: false }));
    try {
      const res = await doctorApi.uploadDocument(docType, file);
      const p = res.data?.data ?? res.data;
      setDocs(prev => ({
        ...prev,
        profile_picture:   p.profilePictureUrl   ?? prev.profile_picture,
        medical_license:   p.medicalLicenseUrl   ?? prev.medical_license,
        prc_id:            p.prcIdUrl            ?? prev.prc_id,
        board_certificate: p.boardCertificateUrl ?? prev.board_certificate,
        government_id:     p.governmentIdUrl     ?? prev.government_id,
      }));
      // Keep context in sync so sidebar avatar updates immediately
      if (docType === 'profile_picture' && p.profilePictureUrl) {
        updateProfilePicture(p.profilePictureUrl);
      }
      setDocSuccess(prev => ({ ...prev, [docType]: true }));
      setTimeout(() => setDocSuccess(prev => ({ ...prev, [docType]: false })), 3000);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error?.message || err.response?.data?.message || 'Upload failed.')
        : 'Upload failed.';
      setDocErrors(prev => ({ ...prev, [docType]: msg }));
    } finally {
      setDocUploading(p => ({ ...p, [docType]: false }));
    }
  }

  /** Open a document in an in-page modal */
  async function openDocModal(url, label) {
    setDocViewerLoading(true);
    setDocViewer({ label, blobUrl: null, isPdf: url.toLowerCase().endsWith('.pdf') });
    try {
      const blobUrl = await fetchAuthBlob(url);
      setDocViewer({ label, blobUrl, isPdf: url.toLowerCase().endsWith('.pdf') });
    } catch {
      addToast('Failed to load document.', 'error');
    } finally {
      setDocViewerLoading(false);
    }
  }

  const avatarUrl = docs.profile_picture;
  const initials = user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

  const changeRequest = changeRequests[0];
  const changeStatus = changeRequest?.status;

  const statusStyles = {
    PENDING:  { label: 'Pending Approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', Icon: Clock },
    APPROVED: { label: 'Request Approved', color: '#22C55E', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  Icon: CheckCircle },
    REJECTED: { label: 'Request Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  Icon: X },
  };

  return (
    <AppShell>
      <AnimatePresence>
        {docViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDocViewer(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(43,45,66,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F9FA' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#2B2D42' }}>{docViewer.label}</p>
                <button onClick={() => setDocViewer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8D99AE', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E5E7EB', padding: 20 }}>
                {docViewerLoading ? (
                  <span className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
                ) : docViewer.isPdf ? (
                  <object data={docViewer.blobUrl} type="application/pdf" style={{ width: '100%', height: '75vh', borderRadius: 8 }}>
                    <p style={{ color: '#8D99AE', textAlign: 'center', padding: 24 }}>
                      PDF preview not supported in this browser.{' '}
                      <a href={docViewer.blobUrl} download style={{ color: '#8D99AE' }}>Download instead</a>
                    </p>
                  </object>
                ) : (
                  <img src={docViewer.blobUrl} alt={docViewer.label} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Specialization change request modal */}
      <AnimatePresence>
        {changeRequestOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setChangeRequestOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(43,45,66,0.08)', width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 64px rgba(43,45,66,0.15)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2B2D42' }}>Specialization Change Request</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#8D99AE' }}>Admin approval is required to update your medical field.</p>
                </div>
                <button onClick={() => setChangeRequestOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8D99AE', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitChangeRequest} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.05em' }}>
                    REQUESTED SPECIALIZATION <span style={{ color: '#D90429' }}>*</span>
                  </label>
                  <SpecializationSelect
                    value={changeRequestForm.specialization}
                    onChange={(val) => setChangeRequestForm(p => ({ ...p, specialization: val }))}
                    placeholder="Select requested specializations"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.05em' }}>REASON (OPTIONAL)</label>
                  <textarea
                    value={changeRequestForm.reason}
                    onChange={e => setChangeRequestForm(p => ({ ...p, reason: e.target.value }))}
                    rows={3}
                    className="mg-input"
                    style={{ resize: 'none', lineHeight: 1.5 }}
                    placeholder="Share why you need to update your specialization"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setChangeRequestOpen(false)} className="mg-btn-ghost" style={{ padding: '10px 16px' }}>Cancel</button>
                  <button type="submit" disabled={changeRequestSubmitting} className="mg-btn" style={{ padding: '10px 16px' }}>
                    {changeRequestSubmitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '28px 28px 40px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>
            {isProfileComplete ? 'Your professional profile' : 'Complete your professional profile'}
          </h1>
          <p style={{ fontSize: 13, color: '#8D99AE', margin: '0 0 16px' }}>
            {isProfileComplete
              ? 'Keep your credentials and practice details up to date'
              : 'Fill in your details and upload documents to get verified and start accepting patients'}
          </p>
          {!isProfileComplete && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.2)' }}>
              <AlertCircle size={18} style={{ color: '#EF233C', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#EF233C', margin: '0 0 2px' }}>Action required</p>
                <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>
                  Fill in all fields, upload your profile photo, and attach all required documents before submitting.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Progress bar (Full Width) */}
        {!isProfileComplete && (
          <div style={{ marginBottom: 28, padding: '20px', borderRadius: 16, background: 'rgba(43,45,66,0.02)', border: '1px solid rgba(43,45,66,0.07)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} style={{ color: '#EF233C' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2B2D42', letterSpacing: '0.02em' }}>PROFILE COMPLETION PROGRESS</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: doneSteps === totalSteps ? '#EF233C' : '#8D99AE' }}>
                {doneSteps} / {totalSteps} STEPS
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(43,45,66,0.07)', overflow: 'hidden', border: '1px solid rgba(43,45,66,0.03)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(doneSteps / totalSteps) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #EF233C, #D90429)', boxShadow: '0 0 12px rgba(239,35,60,0.3)' }}
              />
            </div>
            {doneSteps === totalSteps && (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 13, color: '#16A34A', marginTop: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Ready for submission — all required information provided.
              </motion.p>
            )}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24, alignItems: 'start' }}>

          {/* ── Profile info card ── */}
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>

            {/* Avatar + identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(43,45,66,0.07)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.div
                  onClick={() => avatarInputRef.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={!avatarUrl ? { 
                    boxShadow: [
                      '0 0 0 0px rgba(239,35,60,0)',
                      '0 0 0 10px rgba(239,35,60,0.1)',
                      '0 0 0 0px rgba(239,35,60,0)'
                    ]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    width: 88, height: 88, borderRadius: 24, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative',
                    background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, rgba(239,35,60,0.12), rgba(155,140,255,0.15))',
                    border: avatarUrl ? '3px solid #EF233C' : '3px dashed rgba(239,35,60,0.3)',
                    transition: 'all 0.2s',
                  }}>
                  {avatarUrl
                    ? <AuthImage
                        src={avatarUrl}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        fallback={<span style={{ fontSize: 22, fontWeight: 700, color: '#EF233C' }}>{initials}</span>}
                      />
                    : <span style={{ fontSize: 22, fontWeight: 700, color: '#EF233C' }}>{initials}</span>}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 18,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: 'rgba(43,45,66,0.65)', opacity: 0, transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Camera size={16} style={{ color: '#fff' }} />
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>CHANGE</span>
                  </div>
                </motion.div>
                {docUploading.profile_picture && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(43,45,66,0.7)' }}>
                    <span className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
                  </div>
                )}
                {docs.profile_picture && !docUploading.profile_picture && (
                  <div style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: '#EF233C', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #0B1020', zIndex: 2 }}>
                    <CheckCircle size={14} style={{ color: '#fff' }} />
                  </div>
                )}
                <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload('profile_picture', f); e.target.value = ''; }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Dr. {user?.fullName}</p>
                <p style={{ fontSize: 14, color: '#8D99AE', margin: '0 0 10px' }}>{user?.email}</p>
                
                {!docs.profile_picture ? (
                  <motion.div 
                    animate={{ x: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      padding: '6px 12px', 
                      borderRadius: 8, 
                      background: 'rgba(217,4,41,0.08)', 
                      border: '1px solid rgba(217,4,41,0.2)',
                      cursor: 'pointer'
                    }}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={14} style={{ color: '#D90429' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#D90429' }}>UPLOAD PHOTO *</span>
                  </motion.div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <CheckCircle size={14} style={{ color: '#16A34A' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>PHOTO UPLOADED</span>
                  </div>
                )}
                


                {docErrors.profile_picture && (
                  <p style={{ fontSize: 11, color: '#D90429', margin: '8px 0 0' }}>⚠ {docErrors.profile_picture}</p>
                )}
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {apiError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)', fontSize: 13, color: '#D90429' }}>
                  <span>⚠</span><span>{apiError}</span>
                </motion.div>
              )}
              {saveSuccess && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.2)', fontSize: 13, color: '#EF233C' }}>
                  <CheckCircle size={15} />
                  <span>Profile saved! Redirecting to pending approval…</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form — id so the external submit button can target it */}
            <form id="profile-form" onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Specialization dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.05em' }}>
                    SPECIALIZATION(S) <span style={{ color: '#D90429' }}>*</span>
                  </label>
                  {isVerified && (
                    <button type="button" onClick={() => setChangeRequestOpen(true)} className="mg-btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}>
                      Request change
                    </button>
                  )}
                </div>
                <SpecializationSelect
                  value={form.specialization}
                  onChange={val => {
                    setForm(p => ({ ...p, specialization: val }));
                    setFieldErrors(p => ({ ...p, specialization: undefined }));
                    setSaveSuccess(false);
                  }}
                  error={!!fieldErrors.specialization}
                  placeholder="Select your specializations"
                  disabled={isVerified}
                />
                {isVerified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <AlertCircle size={14} style={{ color: '#EF233C' }} />
                    <span style={{ fontSize: 11, color: '#EF233C', fontWeight: 600 }}>SPECIALIZATION LOCKED AFTER VERIFICATION</span>
                  </div>
                )}
                {fieldErrors.specialization && <p style={{ fontSize: 12, color: '#D90429', margin: '4px 0 0' }}>{fieldErrors.specialization}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {[
                  { name: 'education', label: 'EDUCATION / MEDICAL SCHOOL', Icon: Building2, ph: "e.g. University of Santo Tomas" },
                  { name: 'yearsOfExperience', label: 'YEARS OF EXPERIENCE', Icon: Clock, ph: "e.g. 5", type: 'number' },
                  { name: 'consultationFee', label: 'CONSULTATION FEE (₱)', Icon: Banknote, ph: "e.g. 500", type: 'number' },
                  { name: 'clinicName', label: 'CLINIC / HOSPITAL NAME', Icon: Building2, ph: "e.g. St. Luke's Medical Center" },
                ].map(({ name, label, Icon, ph, type }) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', letterSpacing: '0.03em' }}>
                      {label} <span style={{ color: '#D90429' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Icon size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                      <input name={name} type={type || "text"} value={form[name]} onChange={handleChange} placeholder={ph}
                        className={`mg-input ${fieldErrors[name] ? 'error' : ''}`} style={{ paddingLeft: 44 }} />
                    </div>
                    {fieldErrors[name] && <p style={{ fontSize: 12, color: '#D90429', margin: '4px 0 0' }}>{fieldErrors[name]}</p>}
                  </div>
                ))}
              </div>

              {[
                { name: 'clinicAddress', label: 'CLINIC ADDRESS', Icon: MapPin, ph: 'Full address of your clinic or hospital' },
                { name: 'bio', label: 'PROFESSIONAL BIO', Icon: FileText, ph: 'Tell patients about your background, expertise, and care philosophy...', textarea: true },
              ].map(({ name, label, Icon, ph, textarea }) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', letterSpacing: '0.03em' }}>
                    {label} <span style={{ color: '#D90429' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={16} style={{ position: 'absolute', left: 16, top: textarea ? 16 : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: '#8D99AE' }} />
                    {textarea ? (
                      <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={4}
                        className={`mg-input ${fieldErrors[name] ? 'error' : ''}`} style={{ paddingLeft: 44, resize: 'none', lineHeight: 1.6 }} />
                    ) : (
                      <input name={name} value={form[name]} onChange={handleChange} placeholder={ph}
                        className={`mg-input ${fieldErrors[name] ? 'error' : ''}`} style={{ paddingLeft: 44 }} />
                    )}
                  </div>
                  {fieldErrors[name] && <p style={{ fontSize: 12, color: '#D90429', margin: '4px 0 0' }}>{fieldErrors[name]}</p>}
                </div>
              ))}
            </form>



          </div>{/* end profile info card */}
          {/* ── Verification Documents card ── */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(43,45,66,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#2B2D42', margin: 0, flex: 1 }}>Verification Documents</p>
                {isVerified && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.2)', color: '#EF233C' }}>
                    <CheckCircle size={11} /> Verified & Locked
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: '#8D99AE', margin: '6px 0 0' }}>
                {isVerified
                  ? 'Your documents have been verified and approved. They cannot be replaced.'
                  : 'All 4 documents are required before you can submit. Accepted format: PDF only.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(['medical_license', 'prc_id', 'board_certificate', 'government_id']).map(key => {
                const { label, hint, accept } = DOC_META[key];
                const existing  = docs[key];
                const uploading = docUploading[key];
                const err       = docErrors[key];
                const success   = docSuccess[key];
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.05em' }}>
                        {label.toUpperCase()}
                      </label>
                      {!isVerified && <span style={{ color: '#D90429' }}>*</span>}
                      {existing && <CheckCircle size={11} style={{ color: '#EF233C', marginLeft: 2 }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isVerified ? (
                        /* Locked read-only row */
                        <div style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(239,35,60,0.02)',
                          border: '1px solid rgba(239,35,60,0.12)',
                          opacity: 0.8,
                        }}>
                          <CheckCircle size={15} style={{ color: '#EF233C', flexShrink: 0 }} />
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#EF233C', flex: 1 }}>
                            Submitted &amp; verified
                          </p>
                          <FileText size={13} style={{ color: 'rgba(239,35,60,0.3)', flexShrink: 0 }} />
                        </div>
                      ) : (
                        /* Editable upload row */
                        <label style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10,
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          background: existing ? 'rgba(239,35,60,0.04)' : 'rgba(43,45,66,0.02)',
                          border: existing ? '1px solid rgba(239,35,60,0.2)' : '1px dashed rgba(43,45,66,0.1)',
                          transition: 'all 0.2s',
                        }}>
                          <input type="file" accept={accept} style={{ display: 'none' }}
                            disabled={uploading}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload(key, f); e.target.value = ''; }} />
                          {uploading
                            ? <span className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
                            : existing
                            ? <CheckCircle size={15} style={{ color: '#EF233C', flexShrink: 0 }} />
                            : <Upload size={15} style={{ color: '#8D99AE', flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: existing ? '#EF233C' : '#8D99AE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {uploading ? 'Uploading…' : existing ? 'Uploaded — click to replace' : hint}
                            </p>
                          </div>
                          {!uploading && <FileText size={13} style={{ color: 'rgba(141,153,174,0.5)', flexShrink: 0 }} />}
                        </label>
                      )}
                      {existing && !uploading && (
                        <button type="button" onClick={() => openDocModal(existing, label)}
                          style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(141,153,174,0.08)', border: '1px solid rgba(141,153,174,0.15)', color: '#8D99AE', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                          View
                        </button>
                      )}
                    </div>
                    {err && <p style={{ fontSize: 12, color: '#D90429', margin: 0 }}>⚠ {err}</p>}
                    {success && (
                      <p style={{ fontSize: 12, color: '#16A34A', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} /> Uploaded successfully
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit button — only shown when not yet verified */}
            {!isVerified && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(43,45,66,0.07)' }}>
                {!canSave && !saving && (
                  <p style={{ fontSize: 12, color: 'rgba(141,153,174,0.7)', marginBottom: 10, textAlign: 'center' }}>
                    {!formFilled && !allDocsUploaded
                      ? 'Fill in all profile fields and upload all required documents to continue'
                      : !formFilled
                      ? 'Fill in all required profile fields to continue'
                      : 'Upload all required documents to continue'}
                  </p>
                )}
                <button
                  type="submit"
                  form="profile-form"
                  disabled={!canSave}
                  className="mg-btn"
                  style={{ width: '100%', padding: 14, opacity: canSave ? 1 : 0.45, cursor: canSave ? 'pointer' : 'not-allowed' }}>
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Saving…</>
                    : <><CheckCircle size={15} /> SUBMIT PROFILE FOR APPROVAL</>}
                </button>
              </div>
            )}

          </div>{/* end verification documents card */}

        </motion.div>
      </div>
    </AppShell>
  );
}
