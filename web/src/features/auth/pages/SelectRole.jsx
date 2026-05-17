import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Stethoscope, ArrowRight, Mail } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';
import axios from 'axios';

const ROLES = [
  { id: 'PATIENT', icon: User, title: 'Patient', description: 'Book appointments and consult with verified doctors', color: '#EF233C', rgb: '239,35,60' },
  { id: 'DOCTOR', icon: Stethoscope, title: 'Doctor', description: 'Manage your schedule and accept patient appointments', color: '#8D99AE', rgb: '141,153,174' },
];

export default function SelectRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingToken = new URLSearchParams(location.search).get('pendingToken') || '';
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  async function handleContinue() {
    if (!selected) return;
    setLoading(true); setError('');
    try {
      const res = await authApi.completeOAuth2(pendingToken, selected);
      const token = authResponseAdapter.extractToken(res);
      if (token) {
        authSession.setToken(token);
        authEvents.emit(authEvents.names.login, { source: 'oauth2' });
        navigate(selected === 'DOCTOR' ? '/doctor/register' : '/dashboard', { replace: true });
      } else {
        const email = res?.data?.data?.user?.email ?? '';
        setRegisteredEmail(email);
        setIsSuccess(true);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data)
        setError(err.response.data?.error?.message || err.response.data?.message || 'Something went wrong.');
      else setError('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#EDF2F4', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob-1 absolute rounded-full" style={{ width: 480, height: 480, top: -140, left: -140, background: 'radial-gradient(circle, rgba(239,35,60,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob-2 absolute rounded-full" style={{ width: 400, height: 400, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(43,45,66,0.06) 0%, transparent 70%)', filter: 'blur(55px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 0 24px rgba(239,35,60,0.3)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#2B2D42', lineHeight: 1.2 }}>MediGo</p>
            <p style={{ fontSize: 10, color: '#8D99AE', letterSpacing: '0.1em' }}>HEALTHCARE PLATFORM</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div key="choose-role" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass" style={{ borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(43,45,66,0.08)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Choose your role</h1>
                <p style={{ fontSize: 14, color: '#6B7280' }}>How will you be using MediGo?</p>
              </div>

              {error && (
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)', fontSize: 13, color: '#D90429' }}>
                  <span>⚠</span><span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {ROLES.map(role => {
                  const Icon = role.icon;
                  const active = selected === role.id;
                  return (
                    <motion.button key={role.id} onClick={() => setSelected(role.id)}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', background: active ? `rgba(${role.rgb},0.06)` : 'rgba(255,255,255,0.8)', border: `1px solid rgba(${role.rgb},${active ? '0.2' : '0.08'})`, boxShadow: active ? `0 4px 16px rgba(${role.rgb},0.08)` : '0 1px 3px rgba(43,45,66,0.04)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? `rgba(${role.rgb},0.1)` : 'rgba(43,45,66,0.04)', border: `1px solid rgba(${role.rgb},${active ? '0.2' : '0.08'})` }}>
                        <Icon size={20} style={{ color: active ? role.color : '#8D99AE' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: active ? role.color : '#2B2D42', marginBottom: 2 }}>{role.title}</p>
                        <p style={{ fontSize: 12, color: '#8D99AE' }}>{role.description}</p>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid rgba(${role.rgb},${active ? '1' : '0.2'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? role.color : 'transparent' }}>
                        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <button onClick={handleContinue} disabled={!selected || loading} className="mg-btn w-full">
                {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Setting up…</> : <>Continue <ArrowRight size={15} /></>}
              </button>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass" style={{ padding: '48px 40px', borderRadius: 24, textAlign: 'center', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(43,45,66,0.08)' }}>
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
      </motion.div>
    </div>
  );
}
