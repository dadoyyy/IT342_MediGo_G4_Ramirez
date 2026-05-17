import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Building2, MapPin, ArrowRight, Clock, FileText, Banknote, Camera } from 'lucide-react';
import { authApi, doctorApi, fetchAuthBlob } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import SpecializationSelect from '../../../shared/ui/SpecializationSelect';
import AuthImage from '../../../shared/ui/AuthImage';
import axios from 'axios';
import { useToast } from '../../../shared/ui/ToastProvider';

function validate(form, addToast) {
  const e = {};
  if (!form.specialization || form.specialization.length === 0) {
    e.specialization = 'At least one specialization is required.';
    addToast(e.specialization, 'error');
  }
  if (!form.clinicName.trim()) {
    e.clinicName = 'Clinic / hospital name is required.';
    addToast(e.clinicName, 'error');
  }
  if (!form.clinicAddress.trim()) {
    e.clinicAddress = 'Clinic address is required.';
    addToast(e.clinicAddress, 'error');
  }
  if (!form.bio || form.bio.trim().length < 20) {
    e.bio = 'Please provide a short professional bio (at least 20 characters).';
    addToast(e.bio, 'error');
  }
  if (!form.yearsOfExperience || parseInt(form.yearsOfExperience) < 0) {
    e.yearsOfExperience = 'Please enter valid years of experience.';
    addToast(e.yearsOfExperience, 'error');
  }
  if (!form.education || !form.education.trim()) {
    e.education = 'Education / Medical school is required.';
    addToast(e.education, 'error');
  }
  if (!form.consultationFee || parseFloat(form.consultationFee) < 0) {
    e.consultationFee = 'Please enter a valid consultation fee.';
    addToast(e.consultationFee, 'error');
  }
  return e;
}

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const { addToast } = useToast();
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
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!authSession.getToken()) { navigate('/login', { replace: true }); return; }
    
    async function load() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);

        const profileRes = await doctorApi.getMyProfile().catch(() => null);
        if (profileRes) {
          const p = profileRes.data?.data ?? profileRes.data;
          if (p) {
            setForm({
              specialization: p.specialization ? p.specialization.split(',').map(s => s.trim()).filter(Boolean) : [],
              clinicName: p.clinicName || '',
              clinicAddress: p.clinicAddress || '',
              bio: p.bio || '',
              yearsOfExperience: p.yearsOfExperience || '',
              education: p.education || '',
              consultationFee: p.consultationFee || ''
            });
            setProfilePhoto(p.profilePictureUrl || null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    }
    load();
  }, [navigate]);

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await doctorApi.uploadDocument('profile_picture', file);
      const url = res.data?.data?.url ?? res.data?.url;
      setProfilePhoto(url);
      addToast('Profile photo uploaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to upload photo. Please try again.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form, addToast);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      await doctorApi.upsertMyProfile({
        specialization: form.specialization.join(', '),
        clinicName: form.clinicName.trim(),
        clinicAddress: form.clinicAddress.trim(),
        bio: form.bio.trim(),
        yearsOfExperience: parseInt(form.yearsOfExperience),
        education: form.education.trim(),
        consultationFee: parseFloat(form.consultationFee)
      });
      addToast('Practice profile saved successfully!', 'success');
      navigate('/doctor/profile', { replace: true });
    } catch (err) {
      const msg = (axios.isAxiosError(err) && err.response?.data)
        ? (err.response.data?.error?.message || err.response.data?.message || 'Submission failed.')
        : 'Unable to connect. Please try again.';
      addToast(msg, 'error');
    } finally { setLoading(false); }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDF2F4' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#2B2D42' }}>
      
      {/* ── LEFT PANEL (Branding & Hero) ── */}
      <div className="hidden lg:flex" style={{
        width: '45%', flexShrink: 0, position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '56px', background: 'linear-gradient(135deg, #1A1B28 0%, #2B2D42 50%, #1A1B28 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div className="blob-1" style={{ position: 'absolute', width: 600, height: 600, top: -200, left: -200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,35,60,0.15) 0%, transparent 60%)', filter: 'blur(60px)' }} />
          <div className="blob-2" style={{ position: 'absolute', width: 500, height: 500, bottom: -150, right: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(141,153,174,0.12) 0%, transparent 60%)', filter: 'blur(50px)' }} />
          
          <svg width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.12, mixBlendMode: 'screen' }}>
            <motion.path
              d="M 0 200 L 200 200 L 220 180 L 240 220 L 260 100 L 280 300 L 300 200 L 500 200 L 520 180 L 540 220 L 560 100 L 580 300 L 600 200 L 800 200 L 820 180 L 840 220 L 860 100 L 880 300 L 900 200 L 1000 200"
              fill="transparent" stroke="#EF233C" strokeWidth="1.5" strokeDasharray="1000"
              initial={{ strokeDashoffset: 1000 }} animate={{ strokeDashoffset: [1000, -1000] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 32px rgba(239,35,60,0.3)' }}>
            <Stethoscope size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#EDF2F4', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>MediGo</p>
            <p style={{ fontSize: 11, color: '#8D99AE', letterSpacing: '0.15em', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Next-Gen Healthcare</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0, color: '#EDF2F4' }}>
            Experience the <span className="gradient-text">future of care.</span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#8D99AE', margin: 0, maxWidth: 400 }}>
            Join thousands of professionals and patients on a secure, intelligent, and beautifully designed platform.
          </p>
        </motion.div>

        <p style={{ position: 'relative', zIndex: 1, fontSize: 13, color: 'rgba(141,153,174,0.4)', margin: 0 }}>
          © 2026 MediGo Inc. High-Performance Healthcare.
        </p>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#EDF2F4', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(239,35,60,0.02) 0%, transparent 70%)' }} />
        
        <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 540 }}>
            
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="glass" style={{ padding: '48px 40px', borderRadius: 24 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 20px rgba(239,35,60,0.2)' }}>
                  <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Doctor Portal Setup
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Provide your professional details to get started</p>
              </div>

              {/* Identity Section */}
              <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 24, padding: 20, background: 'rgba(43,45,66,0.02)', borderRadius: 20, border: '1px solid rgba(43,45,66,0.05)' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, overflow: 'hidden', background: '#fff', border: '2px dashed rgba(239,35,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   <AuthImage src={profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                     fallback={<div style={{ fontSize: 24, fontWeight: 800, color: '#EF233C' }}>{user?.fullName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>} />
                   {uploadingPhoto && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" /></div>}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Dr. {user?.fullName}</h3>
                  <p style={{ fontSize: 13, color: '#8D99AE', margin: '0 0 12px' }}>{user?.email}</p>
                  <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
                  <button type="button" onClick={() => photoInputRef.current?.click()} 
                    style={{ fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 10, background: 'rgba(239,35,60,0.08)', color: '#EF233C', border: '1px solid rgba(239,35,60,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={14} /> UPLOAD PHOTO
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', letterSpacing: '0.03em' }}>
                    SPECIALIZATION(S) <span style={{ color: '#D90429' }}>*</span>
                  </label>
                  <SpecializationSelect
                    value={form.specialization}
                    onChange={(val) => { setForm(p => ({ ...p, specialization: val })); setFieldErrors(p => ({ ...p, specialization: undefined })); }}
                    error={!!fieldErrors.specialization}
                    placeholder="Select your specializations"
                  />
                  {fieldErrors.specialization && <p style={{ fontSize: 13, color: '#D90429', fontWeight: 500 }}>{fieldErrors.specialization}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {[
                    { name: 'education', label: 'EDUCATION / MEDICAL SCHOOL', Icon: Building2, ph: "e.g. UST - Medicine" },
                    { name: 'yearsOfExperience', label: 'YEARS OF EXPERIENCE', Icon: Clock, ph: "e.g. 12", type: 'number' },
                    { name: 'consultationFee', label: 'CONSULTATION FEE (₱)', Icon: Banknote, ph: "e.g. 500", type: 'number' },
                    { name: 'clinicName', label: 'CLINIC / HOSPITAL NAME', Icon: Building2, ph: "e.g. St. Luke's" },
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
                      {fieldErrors[name] && <p style={{ fontSize: 13, color: '#D90429', fontWeight: 500 }}>{fieldErrors[name]}</p>}
                    </div>
                  ))}
                </div>

                {[
                  { name: 'clinicAddress', label: 'CLINIC ADDRESS', Icon: MapPin, ph: 'Full address of your clinic', textarea: true },
                  { name: 'bio', label: 'PROFESSIONAL BIO', Icon: FileText, ph: 'Tell patients about your expertise...', textarea: true },
                ].map(({ name, label, Icon, ph, textarea }) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', letterSpacing: '0.03em' }}>
                      {label} <span style={{ color: '#D90429' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Icon size={16} style={{ position: 'absolute', left: 16, top: textarea ? 16 : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: '#8D99AE' }} />
                      <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={name === 'bio' ? 4 : 2}
                        className={`mg-input ${fieldErrors[name] ? 'error' : ''}`} style={{ paddingLeft: 44, resize: 'none', lineHeight: 1.6 }} />
                    </div>
                    {fieldErrors[name] && <p style={{ fontSize: 13, color: '#D90429', fontWeight: 500 }}>{fieldErrors[name]}</p>}
                  </div>
                ))}

                <button type="submit" disabled={loading} className="mg-btn w-full" style={{ padding: '18px', fontSize: 16, marginTop: 8 }}>
                  {loading ? <><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />Saving Profile…</> : <>Initialize Account <ArrowRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
