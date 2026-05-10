import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Stethoscope, Calendar, Users, Activity } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import axios from 'axios';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validate(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}

const stats = [
  { icon: Users,       value: '12,400+', label: 'Patients' },
  { icon: Stethoscope, value: '840+',    label: 'Doctors' },
  { icon: Calendar,    value: '98,000+', label: 'Appointments' },
  { icon: Activity,    value: '99.9%',   label: 'Uptime' },
];

const floatingCards = [
  { title: 'Next Appointment', sub: 'Dr. Sarah Chen · Cardiology', time: 'Today, 2:30 PM', color: '#5EEAD4' },
  { title: 'Prescription Ready', sub: 'Metformin 500mg · 30 tabs', time: 'Pickup available', color: '#C4B5FD' },
  { title: 'Lab Results', sub: 'Blood panel complete', time: 'View report →', color: '#FFD2C7' },
];

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setLoading(true); setApiError('');
    try {
      const res = await authApi.login({ email: form.email.trim(), password: form.password });
      const token = authResponseAdapter.extractToken(res);
      authSession.setToken(token);
      authEvents.emit(authEvents.names.login, { source: 'login' });
      navigate('/dashboard', { state: { justLoggedIn: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(authResponseAdapter.extractApiErrorMessage(err, 'Invalid credentials. Please try again.'));
      } else { setApiError('Unable to connect. Please try again.'); }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F9FC' }}>

      {/* ── LEFT PANEL — dark branded ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #111827 0%, #1a2744 50%, #0f2030 100%)' }}>

        {/* Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob-1 absolute w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.25), transparent)', top: '-120px', left: '-120px', filter: 'blur(70px)' }} />
          <div className="blob-2 absolute w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,147,255,0.2), transparent)', bottom: '5%', right: '-80px', filter: 'blur(60px)' }} />
          <div className="blob-3 absolute w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(103,232,249,0.12), transparent)', top: '45%', left: '35%', filter: 'blur(80px)' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 24px rgba(20,184,166,0.45)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">MediGo</span>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 space-y-7">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', color: '#5EEAD4' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Healthcare Platform 2026
            </div>
            <h1 className="text-5xl font-bold leading-tight text-white">
              Your health,<br />
              <span className="gradient-text">reimagined.</span>
            </h1>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(249,250,251,0.55)' }}>
              Connect with verified specialists, manage appointments, and take control of your healthcare journey.
            </p>
          </div>

          {/* Floating preview cards */}
          <div className="space-y-3 max-w-xs">
            {floatingCards.map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="float-y rounded-2xl p-4"
                style={{ animationDelay: `${i * 1.4}s`, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: card.color, boxShadow: `0 0 8px ${card.color}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{card.title}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(249,250,251,0.45)' }}>{card.sub}</p>
                  </div>
                  <span className="text-xs flex-shrink-0 font-medium" style={{ color: card.color }}>{card.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          className="relative z-10 grid grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon size={13} className="mx-auto mb-1" style={{ color: 'rgba(249,250,251,0.3)' }} />
              <p className="text-sm font-bold text-white">{value}</p>
              <p className="text-xs" style={{ color: 'rgba(249,250,251,0.35)' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL — clean white ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold" style={{ color: '#1F2937' }}>MediGo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1F2937' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>Sign in to your account to continue</p>
          </div>

          <AnimatePresence>
            {apiError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{apiError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google */}
          <button type="button"
            onClick={() => { globalThis.location.href = '/oauth2/authorization/google'; }}
            className="mg-btn-ghost w-full mb-5">
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: '#374151' }}>Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  autoComplete="email" placeholder="you@example.com"
                  className={`mg-input pl-11 ${fieldErrors.email ? 'error' : ''}`} />
              </div>
              {fieldErrors.email && <p className="text-xs" style={{ color: '#EF4444' }}>{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                <input name="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  autoComplete="current-password" placeholder="••••••••"
                  className={`mg-input pl-11 pr-12 ${fieldErrors.password ? 'error' : ''}`} />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', background: 'none', border: 'none', padding: 0 }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs" style={{ color: '#EF4444' }}>{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="mg-btn-primary w-full mt-1">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#14B8A6' }}>Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
