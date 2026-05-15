import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Stethoscope, Users, Calendar, TrendingUp } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import axios from 'axios';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validate(f) {
  const e = {};
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email.';
  if (!f.password) e.password = 'Password is required.';
  return e;
}

const STATS = [
  { icon: Users,       value: '12,400+', label: 'Patients',     color: '#EF233C' },
  { icon: Stethoscope, value: '840+',    label: 'Doctors',      color: '#8D99AE' },
  { icon: Calendar,    value: '98K+',    label: 'Appointments', color: '#D90429' },
  { icon: TrendingUp,  value: '99.9%',   label: 'Uptime',       color: '#EF233C' },
];

const PREVIEW_CARDS = [
  { label: 'Next Appointment', value: 'Dr. Sarah Chen',  sub: 'Cardiology · Today 2:30 PM', color: '#EF233C' },
  { label: 'Prescription',     value: 'Metformin 500mg', sub: 'Ready for pickup',            color: '#8D99AE' },
  { label: 'Lab Results',      value: 'Blood Panel',     sub: 'Complete · View report',      color: '#D90429' },
];

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrs(p => ({ ...p, [name]: undefined }));
    setApiErr('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length) { setErrs(v); return; }
    setLoading(true); setApiErr('');
    try {
      const res = await authApi.login({ email: form.email.trim(), password: form.password });
      const token = authResponseAdapter.extractToken(res);
      authSession.setToken(token);
      authEvents.emit(authEvents.names.login, { source: 'login' });
      navigate('/dashboard', { state: { justLoggedIn: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data)
        setApiErr(authResponseAdapter.extractApiErrorMessage(err, 'Invalid credentials.'));
      else setApiErr('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#2B2D42' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex" style={{
        width: '55%', flexShrink: 0, position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', background: 'linear-gradient(145deg, #2B2D42 0%, #1E1F33 45%, #2B2D42 100%)',
      }}>
        {/* Ambient orbs — behind everything */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div className="blob-1" style={{ position: 'absolute', width: 560, height: 560, top: -180, left: -180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,35,60,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="blob-2" style={{ position: 'absolute', width: 480, height: 480, bottom: -120, right: -120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,4,41,0.1) 0%, transparent 70%)', filter: 'blur(55px)' }} />
          <div className="blob-3" style={{ position: 'absolute', width: 320, height: 320, top: '42%', left: '38%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(141,153,174,0.06) 0%, transparent 70%)', filter: 'blur(65px)' }} />
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 0 24px rgba(239,35,60,0.4)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#EDF2F4', lineHeight: 1.2, margin: 0 }}>MediGo</p>
            <p style={{ fontSize: 10, color: 'rgba(141,153,174,0.6)', letterSpacing: '0.1em', margin: 0 }}>HEALTHCARE PLATFORM</p>
          </div>
        </motion.div>

        {/* Hero content */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.1)', border: '1px solid rgba(239,35,60,0.2)', width: 'fit-content' }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF233C', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#EF233C', fontWeight: 500 }}>Healthcare Platform · 2026</span>
            </div>
            <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#EDF2F4' }}>
              Your health,<br />
              <span className="gradient-text">reimagined.</span>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(141,153,174,0.75)', margin: 0, maxWidth: 380 }}>
              Connect with verified specialists, manage appointments intelligently, and take control of your healthcare journey.
            </p>
          </div>

          {/* Heartbeat SVG */}
          <div style={{ maxWidth: 300, height: 40, overflow: 'hidden' }}>
            <svg viewBox="0 0 200 40" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="hbg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(239,35,60,0)" />
                  <stop offset="25%" stopColor="#EF233C" />
                  <stop offset="75%" stopColor="#D90429" />
                  <stop offset="100%" stopColor="rgba(217,4,41,0)" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,20 L28,20 L40,5 L52,35 L64,20 L78,20 L88,12 L98,28 L108,20 L128,20 L138,8 L150,32 L162,20 L200,20"
                fill="none" stroke="url(#hbg)" strokeWidth="1.5"
                strokeDasharray="300"
                initial={{ strokeDashoffset: 300, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.5, delay: 1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5 }}
              />
            </svg>
          </div>

          {/* Floating preview cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
            {PREVIEW_CARDS.map((c, i) => (
              <motion.div key={c.label}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="float-y glass-dark"
                style={{ borderRadius: 16, padding: '12px 16px', animationDelay: `${i * 1.5}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block', background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#EDF2F4', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</p>
                    <p style={{ fontSize: 11, color: 'rgba(141,153,174,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</p>
                  </div>
                  <span style={{ fontSize: 11, color: c.color, fontWeight: 500, flexShrink: 0 }}>{c.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <Icon size={13} style={{ color: 'rgba(141,153,174,0.4)', display: 'block', margin: '0 auto 6px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 10, color: 'rgba(141,153,174,0.45)', margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', background: '#EDF2F4' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,35,60,0.03) 0%, transparent 70%)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42' }}>MediGo</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#2B2D42', margin: '0 0 6px' }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Sign in to your account to continue</p>
          </div>

          <AnimatePresence>
            {apiErr && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)', fontSize: 13, color: '#D90429' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span>{apiErr}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google */}
          <button type="button" onClick={() => { globalThis.location.href = '/oauth2/authorization/google'; }}
            className="mg-btn-ghost w-full" style={{ marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.1)' }} />
            <span style={{ fontSize: 12, color: '#8D99AE' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.1)' }} />
          </div>

          <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                <input name="email" type="email" value={form.email} onChange={onChange}
                  autoComplete="email" placeholder="you@example.com"
                  className={`mg-input ${errs.email ? 'error' : ''}`} style={{ paddingLeft: 44 }} />
              </div>
              {errs.email && <p style={{ fontSize: 12, color: '#D90429', margin: 0 }}>{errs.email}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.05em' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={onChange}
                  autoComplete="current-password" placeholder="••••••••"
                  className={`mg-input ${errs.password ? 'error' : ''}`} style={{ paddingLeft: 44, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errs.password && <p style={{ fontSize: 12, color: '#D90429', margin: 0 }}>{errs.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="mg-btn w-full" style={{ marginTop: 4 }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Signing in…</>
                : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#8D99AE' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#EF233C', fontWeight: 600 }}>Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
