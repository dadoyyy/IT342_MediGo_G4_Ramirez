import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';

export default function Dashboard() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function redirect() {
      // Add a slight delay to make the handshake feel intentional and premium
      const startTime = Date.now();
      
      try {
        const res = await authApi.me();
        const user = res.data?.data ?? res.data;
        authSession.setUser(user);

        // Calculate remaining time for the 1.2s delay
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1200 - elapsed);
        
        setTimeout(() => {
          if (user?.role === 'PATIENT') {
            navigate('/home', { replace: true });
          } else if (user?.role === 'DOCTOR') {
            doctorApi.getMyProfile().then(profileRes => {
              const profile = profileRes.data?.data ?? profileRes.data;
              if (profile?.specialization) {
                if (profile.verified) navigate('/doctor/dashboard', { replace: true });
                else navigate('/pending-approval', { replace: true });
              } else {
                navigate('/doctor/profile', { replace: true });
              }
            }).catch(() => navigate('/doctor/profile', { replace: true }));
          } else if (user?.role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        }, remaining);

      } catch {
        navigate('/login', { replace: true });
      } finally {
        setDone(true);
      }
    }
    redirect();
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#EDF2F4', margin: 0, letterSpacing: '-0.02em' }}>Secure Access Handshake</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Preparing your medical dashboard...</p>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Decorative Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
    </div>
  );
}
