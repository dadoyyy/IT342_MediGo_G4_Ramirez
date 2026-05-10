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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1020' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 24px rgba(46,196,182,0.4)' }}>
          <Stethoscope size={22} color="#0B1020" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
        <p className="text-sm" style={{ color: 'rgba(247,248,250,0.4)' }}>Completing sign-in…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1020' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 max-w-sm w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)' }}>
          <AlertTriangle size={24} style={{ color: '#FF5C7A' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#F7F8FA' }}>Sign-in failed</h2>
          <p className="text-sm" style={{ color: 'rgba(247,248,250,0.4)' }}>{error}</p>
        </div>
        <button onClick={() => navigate('/login', { replace: true })} className="mg-btn-primary w-full">
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
