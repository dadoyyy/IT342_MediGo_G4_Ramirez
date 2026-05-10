import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Stethoscope, ShieldCheck, Zap, Heart, ChevronLeft } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import axios from 'axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function validate(f) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = 'Required.';
  if (!f.lastName.trim()) e.lastName = 'Required.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email.';
  if (!f.password) e.password = 'Password is required.';
  else if (f.password.length < 8) e.password = 'Min. 8 characters.';
  else if (!PW_RE.test(f.password)) e.password = 'Must include uppercase, lowercase, number & special character.';
  if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  return e;
}

const PERKS = [
  { icon: ShieldCheck, text: 'Verified healthcare professionals', color: '#2EC4B6' },
  { icon: Zap,         text: 'Instant appointment booking',       color: '#9B8CFF' },
  { icon: Heart,       text: 'Personalized health tracking',      color: '#FF7A59' },
];

const ROLES = [
  {
    id: 'PATIENT',
    icon: User,
    title: 'Patient',
    description: 'Book appointments and consult with verified doctors',
    color: '#2EC4B6',
    rgb: '46,196,182',
  },
  {
    id: 'DOCTOR',
    icon: Stethoscope,
    title: 'Doctor',
    description: 'Manage your schedule and accept patient appointments',
    color: '#9B8CFF',
    rgb: '155,140,255',
  },
];

export default function Register() {
  const navigate = useNavigate();
  // step: 'role' | 'form'
  const [step, setStep] = useState('role');
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrs(p => ({ ...p, [name]: undefined }));
    setApiErr('');
  }

  function handleRoleSelect(r) {
    setRole(r);
    setStep('form');
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length) { setErrs(v); return; }
    setLoading(true); setApiErr('');
    try {
      await authApi.register({
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      });
      // Doctors go to their profile setup; patients go to login
      if (role === 'DOCTOR') {
        navigate('/doctor/register', { state: { fromRegistration: true } });
      } else {
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data?.error;
        if (errData?.details && typeof errData.details === 'object') {
          setApiErr(Object.values(errData.details).join(' · '));
        } else {
          setApiErr(errData?.message || err.response.data?.message || 'Registration failed.');
        }
      } else {
        setApiErr('Unable to connect. Please try again.');
      }
    } finally { setLoading(false); }
  }

  const selectedRole = ROLES.find(r => r.id === role);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#0B1020' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex" style={{
        width: '42%', flexShrink: 0, position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', background: 'linear-gradient(145deg, #0B1020 0%, #0E1628 50%, #111827 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div className="blob-1" style={{ position: 'absolute', width: 480, height: 480, top: -140, right: -140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,140,255,0.14) 0%, transparent 70%)', filter: 'blur(55px)' }} />
          <div className="blob-2" style={{ position: 'absolute', width: 380, height: 380, bottom: -80, left: -80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,196,182,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 24px rgba(46,196,182,0.4)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA', lineHeight: 1.2, margin: 0 }}>MediGo</p>
            <p style={{ fontSize: 10, color: 'rgba(136,146,164,0.55)', letterSpacing: '0.1em', margin: 0 }}>HEALTHCARE PLATFORM</p>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#F7F8FA' }}>
              Join the future<br />
              <span className="gradient-text">of healthcare.</span>
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(136,146,164,0.7)', margin: 0 }}>
              Create your account and experience a smarter way to manage your health.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map(({ icon: Icon, text, color }, i) => (
              <motion.div key={text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `rgba(${color === '#2EC4B6' ? '46,196,182' : color === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.1)`, border: `1px solid rgba(${color === '#2EC4B6' ? '46,196,182' : color === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.2)` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(136,146,164,0.75)' }}>{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p style={{ position: 'relative', zIndex: 1, fontSize: 11, color: 'rgba(136,146,164,0.25)', margin: 0 }}>
          © 2026 MediGo. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', background: 'linear-gradient(180deg, #0E1628 0%, #0B1020 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(155,140,255,0.04) 0%, transparent 70%)' }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#F7F8FA' }}>MediGo</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Role selection ── */}
            {step === 'role' && (
              <motion.div key="role"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}>

                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#F7F8FA', margin: '0 0 6px' }}>Create account</h2>
                  <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>First, tell us how you'll use MediGo</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {ROLES.map(r => (
                    <motion.button key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', width: '100%' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `rgba(${r.rgb},0.1)`, border: `1px solid rgba(${r.rgb},0.2)` }}>
                        <r.icon size={22} style={{ color: r.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#F7F8FA', margin: '0 0 3px' }}>{r.title}</p>
                        <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.65)', margin: 0 }}>{r.description}</p>
                      </div>
                      <ArrowRight size={16} style={{ color: `rgba(${r.rgb},0.6)`, flexShrink: 0 }} />
                    </motion.button>
                  ))}
                </div>

                {/* Google OAuth */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(136,146,164,0.5)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <button type="button" onClick={() => { globalThis.location.href = '/oauth2/authorization/google'; }}
                  className="mg-btn-ghost w-full">
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'rgba(136,146,164,0.55)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#2EC4B6', fontWeight: 600 }}>Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: Registration form ── */}
            {step === 'form' && (
              <motion.div key="form"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}>

                {/* Back + header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <button onClick={() => { setStep('role'); setApiErr(''); setErrs({}); }}
                    style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892A4', cursor: 'pointer', flexShrink: 0 }}>
                    <ChevronLeft size={16} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F7F8FA', margin: 0 }}>
                      Register as {selectedRole?.title}
                    </h2>
                    <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>Fill in your details below</p>
                  </div>
                  {/* Role badge */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: `rgba(${selectedRole?.rgb},0.1)`, border: `1px solid rgba(${selectedRole?.rgb},0.2)`, flexShrink: 0 }}>
                    {selectedRole && <selectedRole.icon size={12} style={{ color: selectedRole.color }} />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: selectedRole?.color }}>{selectedRole?.title}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {apiErr && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', fontSize: 13, color: '#FCA5A5' }}>
                      <span>⚠</span><span>{apiErr}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Name row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[['firstName','FIRST NAME','John','given-name'],['lastName','LAST NAME','Doe','family-name']].map(([name,label,ph,ac]) => (
                      <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.05em' }}>{label}</label>
                        <div style={{ position: 'relative' }}>
                          <User size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} />
                          <input name={name} type="text" value={form[name]} onChange={onChange}
                            autoComplete={ac} placeholder={ph}
                            className={`mg-input ${errs[name] ? 'error' : ''}`} style={{ paddingLeft: 36 }} />
                        </div>
                        {errs[name] && <p style={{ fontSize: 11, color: '#FCA5A5', margin: 0 }}>{errs[name]}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} />
                      <input name="email" type="email" value={form.email} onChange={onChange}
                        autoComplete="email" placeholder="you@example.com"
                        className={`mg-input ${errs.email ? 'error' : ''}`} style={{ paddingLeft: 44 }} />
                    </div>
                    {errs.email && <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>{errs.email}</p>}
                  </div>

                  {/* Password fields */}
                  {[
                    ['password','PASSWORD','Min. 8 chars, uppercase, number & symbol','new-password',showPw,setShowPw],
                    ['confirmPassword','CONFIRM PASSWORD','Re-enter password','new-password',showCf,setShowCf],
                  ].map(([name,label,ph,ac,show,setShow]) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.05em' }}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} />
                        <input name={name} type={show ? 'text' : 'password'} value={form[name]} onChange={onChange}
                          autoComplete={ac} placeholder={ph}
                          className={`mg-input ${errs[name] ? 'error' : ''}`} style={{ paddingLeft: 44, paddingRight: 48 }} />
                        <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errs[name] && <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>{errs[name]}</p>}
                    </div>
                  ))}

                  <button type="submit" disabled={loading} className="mg-btn w-full" style={{ marginTop: 4 }}>
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Creating account…</>
                      : <>Create Account <ArrowRight size={15} /></>}
                  </button>
                </form>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'rgba(136,146,164,0.55)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#2EC4B6', fontWeight: 600 }}>Sign in</Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
