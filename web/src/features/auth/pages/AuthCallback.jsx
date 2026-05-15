import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, AlertTriangle } from 'lucide-react';
import { authSession } from '../authSession';
import { authEvents } from '../authEventBus';
import { resolveAuthCallbackAction } from '../authCallbackResolutionStrategy';

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
      navigate(action.path, { replace: true });
    } else {
      setError(action.error);
    }
  }, [navigate]);

  if (!error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDF2F4' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 0 28px rgba(239,35,60,0.3)' }}>
          <Stethoscope size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
        <p style={{ fontSize: 14, color: '#6B7280' }}>Completing sign-in…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#EDF2F4' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ borderRadius: 24, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(43,45,66,0.08)', boxShadow: '0 8px 32px rgba(43,45,66,0.08)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)' }}>
          <AlertTriangle size={24} style={{ color: '#D90429' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Sign-in failed</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>{error}</p>
        <button onClick={() => navigate('/login', { replace: true })} className="mg-btn w-full">
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
