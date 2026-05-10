import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Stethoscope, ShieldCheck, Zap, Heart } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import axios from 'axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validate(f) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = 'Required.';
  if (!f.lastName.trim()) e.lastName = 'Required.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email.';
  if (!f.password) e.password = 'Password is required.';
  else if (f.password.length < 8) e.password = 'Min. 8 characters.';
  if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  return e;
}

const PERKS = [
  { icon: ShieldCheck, text: 'Verified healthcare professionals', color: '#2EC4B6' },
  { icon: Zap,         text: 'Instant appointment booking',       color: '#9B8CFF' },
  { icon: Heart,       text: 'Personalized health tracking',      color: '#FF7A59' },
];

export default function Register() {
  const navigate = useNavigate();
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

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length) { setErrs(v); return; }
    setLoading(true); setApiErr('');
    try {
      await authApi.register({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), password: form.password });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data)
        setApiErr(err.response.data?.error?.message || err.response.data?.message || 'Registration failed.');
      else setApiErr('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0B1020' }}>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0B1020 0%, #0E1628 50%, #111827 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-1 absolute rounded-full"
            style={{ width: 480, height: 480, top: -140, right: -140, background: 'radial-gradient(circle, rgba(155,140,255,0.14) 0%, transparent 70%)', filter: 'blur(55px)' }} />
          <div className="blob-2 absolute rounded-full"
            style={{ width: 380, height: 380, bottom: -80, left: -80, background: 'radial-gradient(circle, rgba(46,196,182,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 24px rgba(46,196,182,0.4)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA', lineHeight: 1.2 }}>MediGo</p>
            <p style={{ fontSize: 10, color: 'rgba(136,146,164,0.55)', letterSpacing: '0.1em' }}>HEALTHCARE PLATFORM</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.15, color: '#F7F8FA' }}>
              Join the future<br />
              <span className="gradient-text">of healthcare.</span>
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(136,146,164,0.7)' }}>
              Create your account and experience a smarter way to manage your health.
            </p>
          </div>
          <div className="space-y-4">
            {PERKS.map(({ icon: Icon, text, color }, i) => (
              <motion.div key={text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(${color === '#2EC4B6' ? '46,196,182' : color === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.1)`, border: `1px solid rgba(${color === '#2EC4B6' ? '46,196,182' : color === '#9B8CFF' ? '155,140,255' : '255,117,89'},0.2)` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(136,146,164,0.75)' }}>{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10" style={{ fontSize: 11, color: 'rgba(136,146,164,0.25)' }}>© 2026 MediGo. All rights reserved.</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative"
        style={{ background: 'linear-gradient(180deg, #0E1628 0%, #0B1020 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(155,140,255,0.04) 0%, transparent 70%)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="w-full relative z-10" style={{ maxWidth: 360 }}>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#F7F8FA' }}>MediGo</span>
          </div>

          <div className="mb-7">
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', marginBottom: 6 }}>Create account</h2>
            <p style={{ fontSize: 14, color: '#8892A4' }}>Get started with MediGo today</p>
          </div>

          <AnimatePresence>
            {apiErr && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', fontSize: 13, color: '#FCA5A5' }}>
                <span>⚠</span><span>{apiErr}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="button" onClick={() => { globalThis.location.href = '/oauth2/authorization/google'; }}
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
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 12, color: 'rgba(136,146,164,0.5)' }}>or register with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              {[['firstName','FIRST NAME','John','given-name'],['lastName','LAST NAME','Doe','family-name']].map(([name,label,ph,ac]) => (
                <div key={name} className="space-y-1.5">
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.04em' }}>{label}</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(136,146,164,0.35)' }} />
                    <input name={name} type="text" value={form[name]} onChange={onChange}
                      autoComplete={ac} placeholder={ph}
                      className={`mg-input pl-10 ${errs[name] ? 'error' : ''}`} />
                  </div>
                  {errs[name] && <p style={{ fontSize: 11, color: '#FCA5A5' }}>{errs[name]}</p>}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.04em' }}>EMAIL ADDRESS</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(136,146,164,0.35)' }} />
                <input name="email" type="email" value={form.email} onChange={onChange}
                  autoComplete="email" placeholder="you@example.com"
                  className={`mg-input pl-11 ${errs.email ? 'error' : ''}`} />
              </div>
              {errs.email && <p style={{ fontSize: 12, color: '#FCA5A5' }}>{errs.email}</p>}
            </div>

            {[['password','PASSWORD','Min. 8 characters','new-password',showPw,setShowPw],
              ['confirmPassword','CONFIRM PASSWORD','Re-enter password','new-password',showCf,setShowCf]
            ].map(([name,label,ph,ac,show,setShow]) => (
              <div key={name} className="space-y-1.5">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.04em' }}>{label}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(136,146,164,0.35)' }} />
                  <input name={name} type={show ? 'text' : 'password'} value={form[name]} onChange={onChange}
                    autoComplete={ac} placeholder={ph}
                    className={`mg-input pl-11 pr-12 ${errs[name] ? 'error' : ''}`} />
                  <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(136,146,164,0.35)', background: 'none', border: 'none', padding: 0 }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errs[name] && <p style={{ fontSize: 12, color: '#FCA5A5' }}>{errs[name]}</p>}
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
      </div>
    </div>
  );
}
