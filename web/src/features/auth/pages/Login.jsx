import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Stethoscope, Users, Calendar, Activity } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import axios from 'axios';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';
import { useToast } from '../../../shared/ui/ToastProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validate(f) {
  const e = {};
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email.';
  if (!f.password) e.password = 'Password is required.';
  return e;
}

const STATS = [
  { icon: Users,       value: '2M+',    label: 'Active Patients',  color: '#EDF2F4' },
  { icon: Stethoscope, value: '5,000+', label: 'Verified Doctors', color: '#8D99AE' },
  { icon: Calendar,    value: '98%',    label: 'Booking Success',  color: '#EF233C' },
  { icon: Activity,    value: '99.9%',  label: 'System Uptime',    color: '#D90429' },
];

const PREVIEW_CARDS = [
  { label: 'Upcoming',         value: 'Dr. Sarah Chen',  sub: 'Cardiology · 2:30 PM', color: '#EF233C' },
  { label: 'Prescription',     value: 'Metformin 500mg', sub: 'Ready for pickup',     color: '#8D99AE' },
  { label: 'Lab Results',      value: 'Complete Panel',  sub: 'View detailed report', color: '#D90429' },
];

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrs(p => ({ ...p, [name]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length) { setErrs(v); return; }
    setLoading(true);
    try {
      const res = await authApi.login({ email: form.email.trim(), password: form.password });
      const token = authResponseAdapter.extractToken(res);
      authSession.setToken(token);
      authEvents.emit(authEvents.names.login, { source: 'login' });
      addToast('Welcome back! You have successfully signed in.', 'success');
      navigate('/dashboard', { state: { justLoggedIn: true } });
    } catch (err) {
      const msg = (axios.isAxiosError(err) && err.response?.data)
        ? authResponseAdapter.extractApiErrorMessage(err, 'Invalid credentials.')
        : 'Unable to connect. Please try again.';
      addToast(msg, 'error');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#2B2D42' }}>

      {/* ── LEFT PANEL: ANIMATED SHOWCASE ── */}
      <div className="hidden lg:flex" style={{
        width: '55%', flexShrink: 0, position: 'relative', overflow: 'hidden',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '56px', background: 'linear-gradient(135deg, #1A1B28 0%, #2B2D42 50%, #1A1B28 100%)',
      }}>
        {/* Ambient mesh gradients & orbs */}
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
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
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

        {/* Hero Content */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, background: 'rgba(239,35,60,0.1)', border: '1px solid rgba(239,35,60,0.2)', width: 'fit-content' }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF233C', display: 'inline-block', boxShadow: '0 0 10px rgba(239,35,60,0.5)' }} />
              <span style={{ fontSize: 12, color: '#EDF2F4', fontWeight: 600, letterSpacing: '0.02em' }}>Platform 2026 Edition</span>
            </div>
            <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0, color: '#EDF2F4', maxWidth: 800 }}>
              Healthcare, <span className="gradient-text">evolved.</span>
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#8D99AE', margin: 0, maxWidth: 480, fontWeight: 400 }}>
              Seamlessly connect with top-tier specialists and manage your medical history through an elegant, high-performance interface.
            </p>
          </div>

          {/* Floating Glass Cards Showcase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420, marginTop: 10 }}>
            {PREVIEW_CARDS.map((c, i) => (
              <motion.div key={c.label}
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.6, ease: "easeOut" }}
                className="float-y glass-dark"
                style={{ borderRadius: 16, padding: '16px 20px', animationDelay: `${i * 1.5}s`, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${c.color === '#EF233C' ? '239,35,60' : c.color === '#D90429' ? '217,4,41' : '141,153,174'}, 0.1)`, border: `1px solid rgba(${c.color === '#EF233C' ? '239,35,60' : c.color === '#D90429' ? '217,4,41' : '141,153,174'}, 0.2)` }}>
                  <Activity size={20} color={c.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: '#8D99AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>{c.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#EDF2F4', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</p>
                  <p style={{ fontSize: 12, color: 'rgba(141,153,174,0.7)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', padding: '24px 0 0', borderTop: '1px solid rgba(141,153,174,0.1)' }}>
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Icon size={16} style={{ color }} />
              <p style={{ fontSize: 20, fontWeight: 800, color: '#EDF2F4', margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#8D99AE', fontWeight: 500, margin: 0 }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL: PREMIUM AUTH FORM ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', background: '#EDF2F4' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(239,35,60,0.03) 0%, transparent 70%)' }} />

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="glass" style={{ width: '100%', maxWidth: 480, padding: '48px 40px', borderRadius: 24, zIndex: 1 }}>

          {/* Consistent Branding Placement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 20px rgba(239,35,60,0.2)' }}>
              <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
          </div>

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0, fontWeight: 400 }}>Enter your credentials to access your portal</p>
          </div>

          {/* Google SSO */}
          <button type="button" onClick={() => { globalThis.location.href = '/oauth2/authorization/google'; }}
            className="mg-btn-ghost w-full" style={{ marginBottom: 24, padding: '14px' }}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Continue with Google</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.08)' }} />
            <span style={{ fontSize: 12, color: '#8D99AE', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(43,45,66,0.08)' }} />
          </div>

          <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                <input name="email" type="email" value={form.email} onChange={onChange}
                  autoComplete="email" placeholder="john.doe@example.com"
                  className={`mg-input ${errs.email ? 'error' : ''}`} style={{ paddingLeft: 48, fontSize: 15 }} />
              </div>
              {errs.email && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs.email}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42', letterSpacing: '0.02em' }}>Password</label>
                <Link to="#" style={{ fontSize: 12, color: '#EF233C', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }} />
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={onChange}
                  autoComplete="current-password" placeholder="••••••••"
                  className={`mg-input ${errs.password ? 'error' : ''}`} style={{ paddingLeft: 48, paddingRight: 52, fontSize: 15 }} />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errs.password && <p style={{ fontSize: 13, color: '#D90429', margin: '2px 0 0', fontWeight: 500 }}>{errs.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="mg-btn w-full" style={{ marginTop: 8, padding: '16px', fontSize: 16 }}>
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating…</>
                : <>Access Portal <ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ marginTop: 32, textAlign: 'center', fontSize: 15, color: '#6B7280' }}>
            New to MediGo?{' '}
            <Link to="/register" style={{ color: '#EF233C', fontWeight: 700, textDecoration: 'none' }}>Request an account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
