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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FC' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 24px rgba(20,184,166,0.3)' }}>
          <Stethoscope size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
        <p className="text-sm" style={{ color: '#6B7280' }}>Completing sign-in…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F7F9FC' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="card rounded-3xl p-10 max-w-sm w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
          <AlertTriangle size={24} style={{ color: '#EF4444' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#1F2937' }}>Sign-in failed</h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>{error}</p>
        </div>
        <button onClick={() => navigate('/login', { replace: true })} className="mg-btn-primary w-full">
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
