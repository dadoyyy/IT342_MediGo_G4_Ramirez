import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Stethoscope, ShieldCheck, Activity, Heart, ChevronLeft, Calendar, Smartphone, MapPin } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';
import axios from 'axios';
import { useToast } from '../../../shared/ui/ToastProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function validate(f, addToast) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = 'Required.';
  if (!f.lastName.trim()) e.lastName = 'Required.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email.';
  if (!f.password) e.password = 'Password is required.';
  else if (f.password.length < 8) e.password = 'Min. 8 characters.';
  else if (!PW_RE.test(f.password)) e.password = 'Requires uppercase, lowercase & special character.';
  if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  
  if (f.role === 'PATIENT') {
    if (!f.birthDate) e.birthDate = 'Required.';
    if (!f.gender) e.gender = 'Required.';
    if (!f.contactNumber.trim()) e.contactNumber = 'Required.';
  }

  if (!f.privacyConsent) {
    e.privacyConsent = 'You must agree to continue.';
    addToast('Please accept the privacy consent.', 'error');
  }

  if (Object.keys(e).length > 0) {
    addToast('Please correct the errors in the form.', 'error');
  }
  return e;
}

const PERKS = [
  { icon: ShieldCheck, text: 'Bank-grade security & verified professionals', color: '#EF233C' },
  { icon: Activity,    text: 'Real-time appointment synchronization',        color: '#D90429' },
  { icon: Heart,       text: 'Comprehensive personalized health insights',       color: '#EF233C' },
];

const ROLES = [
  {
    id: 'PATIENT',
    icon: User,
    title: 'Patient Portal',
    description: 'Book appointments, track history, and consult seamlessly',
    color: '#EF233C',
    rgb: '239,35,60',
  },
  {
    id: 'DOCTOR',
    icon: Stethoscope,
    title: 'Doctor Portal',
    description: 'Manage schedules, analytics, and patient records securely',
    color: '#2B2D42',
    rgb: '43,45,66',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const pendingToken = new URLSearchParams(window.location.search).get('pendingToken');
  
  const [step, setStep] = useState('role');
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    birthDate: '',
    gender: '',
    contactNumber: '',
    address: '',
    privacyConsent: false
  });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrs(p => ({ ...p, [name]: undefined }));
  }

  async function handleRoleSelect(r) {
    if (pendingToken) {
      setLoading(true);
      try {
        const res = await authApi.completeOAuth2(pendingToken, r);
        const token = authResponseAdapter.extractToken(res);
        if (token) {
          authSession.setToken(token);
          authEvents.emit(authEvents.names.login, { source: 'oauth2' });
          navigate(r === 'DOCTOR' ? '/doctor/register' : '/dashboard', { replace: true });
        } else {
          const email = res?.data?.data?.user?.email ?? '';
          setRegisteredEmail(email);
          setIsSuccess(true);
          addToast('Registration successful! Please check your Gmail for verification.', 'success');
        }
      } catch (err) {
        addToast('Failed to complete Google sign-in. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }
    setRole(r);
    setStep('form');
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form, addToast);
    if (Object.keys(v).length) { setErrs(v); return; }
    setLoading(true);
    try {
      const res = await authApi.register({
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        birthDate: role === 'PATIENT' ? form.birthDate : undefined,
        gender: role === 'PATIENT' ? form.gender : undefined,
        contactNumber: role === 'PATIENT' ? form.contactNumber.trim() : undefined,
        address: role === 'PATIENT' ? form.address.trim() : undefined,
      });
      const token = authResponseAdapter.extractToken(res);
      if (token) {
        authSession.setToken(token);
        authEvents.emit(authEvents.names.login, { source: 'register' });
        if (role === 'DOCTOR') {
          navigate('/doctor/register', { replace: true });
        } else {
          navigate('/login', { state: { registered: true } });
        }
      } else {
        setRegisteredEmail(form.email.trim());
        setIsSuccess(true);
        addToast('Registration successful! Please check your Gmail for verification.', 'success');
      }
    } catch (err) {
      let msg = 'Registration failed.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data?.error;
        if (errData?.details && typeof errData.details === 'object') {
          msg = Object.values(errData.details).join(' · ');
        } else {
          msg = errData?.message || err.response.data?.message || 'Registration failed.';
        }
      } else {
        msg = 'Unable to connect. Please check your network.';
      }
      addToast(msg, 'error');
    } finally { setLoading(false); }
  }

  const selectedRole = ROLES.find(r => r.id === role);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#2B2D42' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex" style={{
        width: '55%', flexShrink: 0, position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '56px', background: 'linear-gradient(135deg, #1A1B28 0%, #2B2D42 50%, #1A1B28 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div className="blob-1" style={{ position: 'absolute', width: 600, height: 600, top: -200, left: -200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,35,60,0.15) 0%, transparent 60%)', filter: 'blur(60px)' }} />
          <div className="blob-2" style={{ position: 'absolute', width: 500, height: 500, bottom: -150, right: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(141,153,174,0.12) 0%, transparent 60%)', filter: 'blur(50px)' }} />
          <div className="blob-3" style={{ position: 'absolute', width: 400, height: 400, top: '35%', left: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,4,41,0.1) 0%, transparent 60%)', filter: 'blur(70px)' }} />
          
          {/* Animated Heartbeat Line */}
          <svg width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.12, mixBlendMode: 'screen' }}>
            <motion.path
              d="M 0 200 L 200 200 L 220 180 L 240 220 L 260 100 L 280 300 L 300 200 L 500 200 L 520 180 L 540 220 L 560 100 L 580 300 L 600 200 L 800 200 L 820 180 L 840 220 L 860 100 L 880 300 L 900 200 L 1000 200"
              fill="transparent"
              stroke="#EF233C"
              strokeWidth="1.5"
              strokeDasharray="1000"
              initial={{ strokeDashoffset: 1000 }}
              animate={{ strokeDashoffset: [1000, -1000] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </svg>

          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Branding Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 32px rgba(239,35,60,0.3)' }}>
            <Stethoscope size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#EDF2F4', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>MediGo</p>
            <p style={{ fontSize: 11, color: '#8D99AE', letterSpacing: '0.15em', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Next-Gen Healthcare</p>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0, color: '#EDF2F4', maxWidth: 800 }}>
              Experience the <span className="gradient-text">future of care.</span>
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#8D99AE', margin: 0, maxWidth: 400, fontWeight: 400 }}>
              Join thousands of professionals and patients on a secure, intelligent, and beautifully designed platform.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {PERKS.map(({ icon: Icon, text, color }, i) => (
              <motion.div key={text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `rgba(${color === '#EF233C' ? '239,35,60' : color === '#D90429' ? '217,4,41' : '141,153,174'}, 0.1)`, border: `1px solid rgba(${color === '#EF233C' ? '239,35,60' : color === '#D90429' ? '217,4,41' : '141,153,174'}, 0.2)` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <span style={{ fontSize: 15, color: '#EDF2F4', fontWeight: 500 }}>{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p style={{ position: 'relative', zIndex: 1, fontSize: 13, color: 'rgba(141,153,174,0.4)', margin: 0 }}>
          © 2026 MediGo Inc. High-Performance Healthcare.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative', background: '#EDF2F4', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(239,35,60,0.03) 0%, transparent 70%)' }} />
        
        <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Mobile logo (hidden on desktop if branding is above) */}

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Role selection ── */}
            {step === 'role' && !isSuccess && (
              <motion.div key="role"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: "easeInOut" }}>

                {/* Consistent Branding Placement */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 20px rgba(239,35,60,0.2)' }}>
                    <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  {ROLES.map(r => (
                    <motion.button key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', background: '#FFFFFF', border: '1px solid rgba(43,45,66,0.08)', width: '100%', boxShadow: '0 4px 12px rgba(43,45,66,0.03)' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `rgba(${r.rgb},0.08)`, border: `1px solid rgba(${r.rgb},0.15)` }}>
                        <r.icon size={26} style={{ color: r.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>{r.title}</p>
                        <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, lineHeight: 1.4 }}>{r.description}</p>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `rgba(${r.rgb},0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowRight size={18} style={{ color: r.color }} />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {!pendingToken && (
                  <>
                    {/* Google OAuth */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.08)' }} />
                      <span style={{ fontSize: 12, color: '#8D99AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.08)' }} />
                    </div>
                    <button type="button" onClick={() => { globalThis.location.href = '/oauth2/authorization/google'; }}
                      className="mg-btn-ghost w-full" style={{ padding: '14px' }}>
                      <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Sign up with Google</span>
                    </button>
                  </>
                )}

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 15, color: '#6B7280' }}>
                  Already registered?{' '}
                  <Link to="/login" style={{ color: '#EF233C', fontWeight: 700, textDecoration: 'none' }}>Access Portal</Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: Registration form ── */}
            {step === 'form' && !isSuccess && (
              <motion.div key="form"
                initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="glass" style={{ padding: '48px 40px', borderRadius: 24 }}>

                {/* Consistent Branding Placement */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 20px rgba(239,35,60,0.2)' }}>
                    <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
                </div>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                  <button onClick={() => { setStep('role'); setApiErr(''); setErrs({}); }}
                    style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(43,45,66,0.05)', border: '1px solid rgba(43,45,66,0.1)', color: '#2B2D42', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>
                      {selectedRole?.title} Setup
                    </h2>
                    <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Provide your professional details</p>
                  </div>

                </div>
                <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[['firstName','First Name','John','given-name'],['lastName','Last Name','Doe','family-name']].map(([name,label,ph,ac]) => (
                      <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>
                          {label} <span style={{ color: '#D90429' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                          <input name={name} type="text" value={form[name]} onChange={onChange}
                            autoComplete={ac} placeholder={ph}
                            className={`mg-input ${errs[name] ? 'error' : ''}`} style={{ paddingLeft: 44, fontSize: 15 }} />
                        </div>
                        {errs[name] && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs[name]}</p>}
                      </div>
                    ))}
                  </div>
                  
                  {role === 'PATIENT' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>
                            Birthdate <span style={{ color: '#D90429' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                            <input name="birthDate" type="date" value={form.birthDate} onChange={onChange}
                              className={`mg-input ${errs.birthDate ? 'error' : ''}`} style={{ paddingLeft: 44, fontSize: 15 }} />
                          </div>
                          {errs.birthDate && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs.birthDate}</p>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>
                            Gender <span style={{ color: '#D90429' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <select name="gender" value={form.gender} onChange={onChange}
                              className={`mg-input ${errs.gender ? 'error' : ''}`} style={{ paddingLeft: 16, fontSize: 15 }}>
                              <option value="">Select</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          {errs.gender && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs.gender}</p>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>
                          Contact Number <span style={{ color: '#D90429' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Smartphone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                          <input name="contactNumber" type="tel" value={form.contactNumber} onChange={onChange}
                            placeholder="+63 9xx xxx xxxx"
                            className={`mg-input ${errs.contactNumber ? 'error' : ''}`} style={{ paddingLeft: 48, fontSize: 15 }} />
                        </div>
                        {errs.contactNumber && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs.contactNumber}</p>}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>Address (Optional)</label>
                        <div style={{ position: 'relative' }}>
                          <MapPin size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                          <input name="address" type="text" value={form.address} onChange={onChange}
                            placeholder="Current address"
                            className="mg-input" style={{ paddingLeft: 48, fontSize: 15 }} />
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>
                      Email Address <span style={{ color: '#D90429' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                      <input name="email" type="email" value={form.email} onChange={onChange}
                        autoComplete="email" placeholder="john.doe@example.com"
                        className={`mg-input ${errs.email ? 'error' : ''}`} style={{ paddingLeft: 48, fontSize: 15 }} />
                    </div>
                    {errs.email && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs.email}</p>}
                  </div>

                  {[
                    ['password','Password','Min 8 chars, 1 uppercase, 1 symbol','new-password',showPw,setShowPw],
                    ['confirmPassword','Confirm Password','Match password exactly','new-password',showCf,setShowCf],
                  ].map(([name,label,ph,ac,show,setShow]) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>
                        {label} <span style={{ color: '#D90429' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                        <input name={name} type={show ? 'text' : 'password'} value={form[name]} onChange={onChange}
                          autoComplete={ac} placeholder={ph}
                          className={`mg-input ${errs[name] ? 'error' : ''}`} style={{ paddingLeft: 48, paddingRight: 52, fontSize: 15 }} />
                        <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
                          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {show ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errs[name] && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs[name]}</p>}
                    </div>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 4 }}>
                    <input name="privacyConsent" type="checkbox" checked={form.privacyConsent} onChange={onChange}
                      id="privacyConsent" style={{ marginTop: 4, cursor: 'pointer' }} />
                    <label htmlFor="privacyConsent" style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, cursor: 'pointer' }}>
                      I agree to the <span style={{ color: '#EF233C', fontWeight: 600 }}>Privacy Policy</span> and consent to the collection of my health data for consultation purposes. <span style={{ color: '#D90429' }}>*</span>
                    </label>
                  </div>
                  {errs.privacyConsent && <p style={{ fontSize: 13, color: '#D90429', margin: '-12px 0 0', fontWeight: 500 }}>{errs.privacyConsent}</p>}

                  <button type="submit" disabled={loading} className="mg-btn w-full" style={{ marginTop: 8, padding: '16px', fontSize: 16 }}>
                    {loading
                      ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                      : <>Initialize Account <ArrowRight size={18} /></>}
                  </button>
                </form>

              </motion.div>
            )}

            {/* ── STEP 3: Verification pending ── */}
            {isSuccess && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass" style={{ padding: '48px 40px', borderRadius: 24, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,35,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Mail size={32} style={{ color: '#EF233C' }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', marginBottom: 12 }}>Verify your email</h2>
                <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
                  We've sent a verification link to <strong style={{ color: '#2B2D42' }}>{registeredEmail}</strong>.<br/>
                  Please check your Gmail inbox and click the link to activate your account.
                </p>
                <div style={{ padding: '16px', background: 'rgba(43,45,66,0.03)', borderRadius: 12, marginBottom: 32, fontSize: 13, color: '#8D99AE' }}>
                  <p style={{ margin: 0 }}>Only Gmail or Medigo accounts can be used for verification on this system.</p>
                </div>
                <Link to="/login" className="mg-btn w-full" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                  Continue to Login <ArrowRight size={18} />
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
