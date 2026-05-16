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
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const action = resolveAuthCallbackAction(globalThis.location.search);
    
    // Add a tiny delay to make the transition feel intentional and premium, rather than a bug
    const timer = setTimeout(() => {
      if (action.type === 'TOKEN_SUCCESS') {
        authSession.setToken(action.token);
        authEvents.emit(authEvents.names.login, { source: 'oauth2' });
        navigate('/dashboard', { replace: true, state: { justLoggedIn: true } });
      } else if (action.type === 'PENDING_ROLE') {
        navigate(`/register?pendingToken=${encodeURIComponent(action.pendingToken)}`, { replace: true });
      } else {
        setError(action.error);
        setIsProcessing(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2B2D42', position: 'relative', overflow: 'hidden' }}>
      {/* Background Ambience */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="blob-1" style={{ position: 'absolute', width: 600, height: 600, top: '-10%', left: '-10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,35,60,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="blob-2" style={{ position: 'absolute', width: 500, height: 500, bottom: '-10%', right: '-10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(141,153,174,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        
        {/* Elite Pulse Logo */}
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: '#EF233C', filter: 'blur(20px)' }}
          />
          <div style={{ width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 12px 40px rgba(239,35,60,0.4)', position: 'relative' }}>
            <Stethoscope size={40} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#EDF2F4', margin: 0, letterSpacing: '-0.02em' }}>Secure Access Handshake</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Finalizing your clinical session...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 360, padding: 32, borderRadius: 24, background: 'rgba(217,4,41,0.05)', border: '1px solid rgba(217,4,41,0.1)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(217,4,41,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertTriangle size={28} style={{ color: '#D90429' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EDF2F4', marginBottom: 8 }}>Authentication Error</h2>
              <p style={{ fontSize: 14, color: '#8D99AE', marginBottom: 24, lineHeight: 1.6 }}>{error}</p>
              <button onClick={() => navigate('/login', { replace: true })} className="mg-btn w-full">
                Return to Login <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
      
      {/* Decorative Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
    </div>
  );
}
