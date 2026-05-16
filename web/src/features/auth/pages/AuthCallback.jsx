import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, AlertTriangle, Activity, Users, Calendar, ArrowRight } from 'lucide-react';
import { authSession } from '../authSession';
import { authEvents } from '../authEventBus';
import { resolveAuthCallbackAction } from '../authCallbackResolutionStrategy';

const STATS = [
  { icon: Users,       value: '2M+',    label: 'Active Patients',  color: '#EDF2F4' },
  { icon: Stethoscope, value: '5,000+', label: 'Verified Doctors', color: '#8D99AE' },
  { icon: Calendar,    value: '98%',    label: 'Booking Success',  color: '#EF233C' },
  { icon: Activity,    value: '99.9%',  label: 'System Uptime',    color: '#D90429' },
];

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const action = resolveAuthCallbackAction(globalThis.location.search);
    if (action.type === 'TOKEN_SUCCESS') {
      authSession.setToken(action.token);
      authEvents.emit(authEvents.names.login, { source: 'oauth2' });
      navigate('/dashboard', { replace: true, state: { justLoggedIn: true } });
    } else if (action.type === 'PENDING_ROLE') {
      navigate(`/register?pendingToken=${encodeURIComponent(action.pendingToken)}`, { replace: true });
    } else {
      setError(action.error);
    }
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#2B2D42' }}>
      
      {/* ── LEFT PANEL: BRANDING ── */}
      <div className="hidden lg:flex" style={{
        width: '55%', flexShrink: 0, position: 'relative', overflow: 'hidden',
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
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 32px rgba(239,35,60,0.3)' }}>
            <Stethoscope size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#EDF2F4', lineHeight: 1.1, margin: 0 }}>MediGo</p>
            <p style={{ fontSize: 11, color: '#8D99AE', letterSpacing: '0.15em', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Next-Gen Healthcare</p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 16px', color: '#EDF2F4' }}>
            Completing your <span className="gradient-text">secure access.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#8D99AE', maxWidth: 400 }}>
            Verifying your credentials and preparing your personalized medical dashboard.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', padding: '24px 0 0', borderTop: '1px solid rgba(141,153,174,0.1)' }}>
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Icon size={16} style={{ color }} />
              <p style={{ fontSize: 20, fontWeight: 800, color: '#EDF2F4', margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#8D99AE', fontWeight: 500, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL: LOADING / ERROR ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', background: '#EDF2F4' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(239,35,60,0.03) 0%, transparent 70%)' }} />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass" style={{ width: '100%', maxWidth: 400, padding: 48, borderRadius: 24, zIndex: 1, textAlign: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 20px rgba(239,35,60,0.2)' }}>
              <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#2B2D42', letterSpacing: '-0.02em' }}>MediGo</span>
          </div>

          <AnimatePresence mode="wait">
            {!error ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,35,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(239,35,60,0.1)' }}>
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Authenticating</h2>
                <p style={{ fontSize: 14, color: '#6B7280' }}>Please wait while we securely sign you in.</p>
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(217,4,41,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(217,4,41,0.15)' }}>
                  <AlertTriangle size={32} style={{ color: '#D90429' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Sign-in Failed</h2>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>{error}</p>
                <button onClick={() => navigate('/login', { replace: true })} className="mg-btn w-full">
                  Back to Login <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
