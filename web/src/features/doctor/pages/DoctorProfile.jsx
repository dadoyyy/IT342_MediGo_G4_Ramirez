import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, Building2, MapPin, ArrowRight,
  CheckCircle, AlertCircle, FileText, Upload, Camera
} from 'lucide-react';
import { authApi, doctorApi, fetchAuthBlob } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import AuthImage from '../../../shared/ui/AuthImage';
import axios from 'axios';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { authSession } from '../../auth/authSession';

/* ── Validation ─────────────────────────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.specialization.trim()) e.specialization = 'Specialization is required.';
  if (!form.clinicName.trim()) e.clinicName = 'Clinic / hospital name is required.';
  if (!form.clinicAddress.trim()) e.clinicAddress = 'Clinic address is required.';
  return e;
}

const REQUIRED_DOCS = ['profile_picture', 'medical_license', 'prc_id', 'board_certificate', 'government_id'];

const DOC_META = {
  profile_picture:   { label: 'Profile Picture',      hint: 'A clear photo of yourself',                   accept: '.jpg,.jpeg,.png' },
  medical_license:   { label: 'Medical License',      hint: 'PRC-issued medical license',                  accept: '.pdf,.jpg,.jpeg,.png' },
  prc_id:            { label: 'PRC ID',               hint: 'Professional Regulation Commission ID',       accept: '.pdf,.jpg,.jpeg,.png' },
  board_certificate: { label: 'Board Certificate',    hint: 'Certificate of board examination',            accept: '.pdf,.jpg,.jpeg,.png' },
  government_id:     { label: 'Government-Issued ID', hint: "Passport, driver's license, or national ID",  accept: '.pdf,.jpg,.jpeg,.png' },
};

/* ── Component ──────────────────────────────────────────────────────────── */
export default function DoctorProfile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const { isProfileComplete, isLoading, markProfileComplete } = useDoctorProfile();
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({ specialization: '', clinicName: '', clinicAddress: '' });
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

  const formFilled = form.specialization.trim() && form.clinicName.trim() && form.clinicAddress.trim();
  const allDocsUploaded = REQUIRED_DOCS.every(k => !!docs[k]);
  const canSave = !!(formFilled && allDocsUploaded && !saving);

  const totalSteps = 1 + REQUIRED_DOCS.length;
  const doneSteps  = (formFilled ? 1 : 0) + REQUIRED_DOCS.filter(k => !!docs[k]).length;

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
              specialization: p.specialization || f.specialization,
              clinicName:     p.clinicName     || f.clinicName,
              clinicAddress:  p.clinicAddress  || f.clinicAddress,
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
        specialization: form.specialization.trim(),
        clinicName:     form.clinicName.trim(),
        clinicAddress:  form.clinicAddress.trim(),
      });
      setSaveSuccess(true);
      markProfileComplete();
      if (!isProfileComplete) {
        setTimeout(() => navigate('/pending-approval', { replace: true }), 1200);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data?.error;
        setApiError(errData?.message || err.response.data?.message || 'Failed to save profile.');
      } else {
        setApiError('Unable to connect. Please try again.');
      }
    } finally { setSaving(false); }
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

  /** Open a document in a new tab using an authenticated blob URL */
  async function openDoc(url) {
    try {
      const blobUrl = await fetchAuthBlob(url);
      window.open(blobUrl, '_blank');
      // Revoke after a short delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      alert('Could not open document. Please try again.');
    }
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
    </div>
  );

  const avatarUrl = docs.profile_picture;
  const initials  = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  return (
    <AppShell user={user}>
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          {!isProfileComplete && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 20, background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.2)' }}>
              <AlertCircle size={18} style={{ color: '#2EC4B6', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2EC4B6', margin: '0 0 2px' }}>Complete your profile to get started</p>
                <p style={{ fontSize: 13, color: 'rgba(136,146,164,0.75)', margin: 0 }}>
                  Fill in all fields, upload your profile photo, and attach all required documents before submitting.
                </p>
              </div>
            </div>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: 0 }}>
            {!isProfileComplete ? 'Set Up Your Profile' : 'My Profile'}
          </h1>
          <p style={{ fontSize: 14, color: '#8892A4', marginTop: 4 }}>
            {!isProfileComplete
              ? 'Complete all steps below before submitting'
              : `Welcome back, Dr. ${user?.fullName?.split(' ')[0] || ''}`}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

          {/* Progress bar */}
          {!isProfileComplete && (
            <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.7)' }}>PROFILE COMPLETION</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: doneSteps === totalSteps ? '#2EC4B6' : '#9B8CFF' }}>
                  {doneSteps} / {totalSteps} steps
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(doneSteps / totalSteps) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  style={{ height: '100%', borderRadius: 99, background: doneSteps === totalSteps ? 'linear-gradient(90deg, #2EC4B6, #86EFAC)' : 'linear-gradient(90deg, #9B8CFF, #2EC4B6)' }}
                />
              </div>
              {doneSteps === totalSteps && (
                <p style={{ fontSize: 12, color: '#5EEAD4', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={12} /> All steps complete — you can now submit your profile
                </p>
              )}
            </div>
          )}

          {/* ── Profile info card ── */}
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>

            {/* Avatar + identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: 20, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative',
                    background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, rgba(46,196,182,0.15), rgba(155,140,255,0.15))',
                    border: avatarUrl ? '2px solid rgba(46,196,182,0.4)' : '2px dashed rgba(46,196,182,0.3)',
                    transition: 'all 0.2s',
                  }}>
                  {avatarUrl
                    ? <AuthImage
                        src={avatarUrl}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        fallback={<span style={{ fontSize: 22, fontWeight: 700, color: '#2EC4B6' }}>{initials}</span>}
                      />
                    : <span style={{ fontSize: 22, fontWeight: 700, color: '#2EC4B6' }}>{initials}</span>}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 18,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: 'rgba(11,16,32,0.65)', opacity: 0, transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Camera size={16} style={{ color: '#fff' }} />
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>CHANGE</span>
                  </div>
                </div>
                {docUploading.profile_picture && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,16,32,0.7)' }}>
                    <span className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
                  </div>
                )}
                {docs.profile_picture && !docUploading.profile_picture && (
                  <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#2EC4B6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0B1020' }}>
                    <CheckCircle size={11} style={{ color: '#fff' }} />
                  </div>
                )}
                <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload('profile_picture', f); e.target.value = ''; }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#F7F8FA', margin: '0 0 2px' }}>Dr. {user?.fullName}</p>
                <p style={{ fontSize: 13, color: '#8892A4', margin: '0 0 6px' }}>{user?.email}</p>
                <p style={{ fontSize: 11, color: docs.profile_picture ? '#5EEAD4' : 'rgba(136,146,164,0.5)', margin: 0 }}>
                  {docs.profile_picture ? '✓ Profile photo uploaded' : 'Click the avatar to upload your profile photo *'}
                </p>
                {docErrors.profile_picture && (
                  <p style={{ fontSize: 11, color: '#FCA5A5', margin: '4px 0 0' }}>⚠ {docErrors.profile_picture}</p>
                )}
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {apiError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', fontSize: 13, color: '#FCA5A5' }}>
                  <span>⚠</span><span>{apiError}</span>
                </motion.div>
              )}
              {saveSuccess && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.2)', fontSize: 13, color: '#5EEAD4' }}>
                  <CheckCircle size={15} />
                  <span>Profile saved! Redirecting to pending approval…</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form — id so the external submit button can target it */}
            <form id="profile-form" onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { name: 'specialization', label: 'SPECIALIZATION',        Icon: Stethoscope, ph: 'e.g. Cardiology, General Practice, Pediatrics', textarea: false },
                { name: 'clinicName',     label: 'CLINIC / HOSPITAL NAME', Icon: Building2,   ph: "e.g. St. Luke's Medical Center",                textarea: false },
                { name: 'clinicAddress',  label: 'CLINIC ADDRESS',         Icon: MapPin,      ph: 'Full address of your clinic or hospital',        textarea: true  },
              ].map(({ name, label, Icon, ph, textarea }) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.05em' }}>
                    {label} <span style={{ color: '#FCA5A5' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={15} style={{ position: 'absolute', left: 16, top: textarea ? 14 : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} />
                    {textarea ? (
                      <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={3}
                        className={`mg-input ${fieldErrors[name] ? 'error' : ''}`}
                        style={{ paddingLeft: 44, resize: 'none', lineHeight: 1.5 }} />
                    ) : (
                      <input name={name} type="text" value={form[name]} onChange={handleChange} placeholder={ph}
                        className={`mg-input ${fieldErrors[name] ? 'error' : ''}`}
                        style={{ paddingLeft: 44 }} />
                    )}
                  </div>
                  {fieldErrors[name] && <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>{fieldErrors[name]}</p>}
                </div>
              ))}
            </form>

          </div>{/* end profile info card */}

          {/* ── Verification Documents card ── */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>Verification Documents</p>
              <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>
                All 4 documents are required before you can submit. Accepted formats: PDF, JPG, PNG (max 10 MB each).
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
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.05em' }}>
                        {label.toUpperCase()}
                      </label>
                      <span style={{ fontSize: 10, color: '#FCA5A5' }}>*</span>
                      {existing && <CheckCircle size={11} style={{ color: '#2EC4B6', marginLeft: 2 }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 10,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        background: existing ? 'rgba(46,196,182,0.06)' : 'rgba(255,255,255,0.03)',
                        border: existing ? '1px solid rgba(46,196,182,0.25)' : '1px dashed rgba(255,255,255,0.12)',
                        transition: 'all 0.2s',
                      }}>
                        <input type="file" accept={accept} style={{ display: 'none' }}
                          disabled={uploading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload(key, f); e.target.value = ''; }} />
                        {uploading
                          ? <span className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
                          : existing
                          ? <CheckCircle size={15} style={{ color: '#2EC4B6', flexShrink: 0 }} />
                          : <Upload size={15} style={{ color: 'rgba(136,146,164,0.4)', flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: existing ? '#5EEAD4' : 'rgba(136,146,164,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {uploading ? 'Uploading…' : existing ? 'Uploaded — click to replace' : hint}
                          </p>
                        </div>
                        {!uploading && <FileText size={13} style={{ color: 'rgba(136,146,164,0.3)', flexShrink: 0 }} />}
                      </label>
                      {existing && !uploading && (
                        <button type="button" onClick={() => openDoc(existing)}
                          style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                          View
                        </button>
                      )}
                    </div>
                    {err && <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>⚠ {err}</p>}
                    {success && (
                      <p style={{ fontSize: 12, color: '#5EEAD4', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} /> Uploaded successfully
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit button — at the very bottom, after all documents */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {!canSave && !saving && (
                <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.5)', marginBottom: 10, textAlign: 'center' }}>
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
                  : <>{!isProfileComplete ? 'Submit Profile for Review' : 'Save Changes'} <ArrowRight size={15} /></>}
              </button>
            </div>

          </div>{/* end verification documents card */}

        </motion.div>
      </div>
    </AppShell>
  );
}
