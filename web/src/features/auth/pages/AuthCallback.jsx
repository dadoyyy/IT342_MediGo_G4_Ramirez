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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 28px rgba(46,196,182,0.4)' }}>
          <Stethoscope size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
        <p style={{ fontSize: 14, color: '#8892A4' }}>Completing sign-in…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#0B1020' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="glass" style={{ borderRadius: 24, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)' }}>
          <AlertTriangle size={24} style={{ color: 'rgba(255,117,89,0.7)' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F7F8FA', marginBottom: 8 }}>Sign-in failed</h2>
        <p style={{ fontSize: 14, color: '#8892A4', marginBottom: 24 }}>{error}</p>
        <button onClick={() => navigate('/login', { replace: true })} className="mg-btn w-full">
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
