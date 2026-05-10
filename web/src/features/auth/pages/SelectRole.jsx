import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';
import axios from 'axios';

const ROLES = [
  { id: 'PATIENT', icon: User, title: 'Patient', description: 'Book appointments and consult with verified doctors', color: '#2EC4B6' },
  { id: 'DOCTOR', icon: Stethoscope, title: 'Doctor', description: 'Manage your schedule and accept patient appointments', color: '#9B8CFF' },
];

export default function SelectRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingToken = new URLSearchParams(location.search).get('pendingToken') || '';
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!selected) return;
    setLoading(true); setError('');
    try {
      const res = await authApi.completeOAuth2(pendingToken, selected);
      const token = authResponseAdapter.extractToken(res);
      authSession.setToken(token);
      authEvents.emit(authEvents.names.login, { source: 'oauth2' });
      navigate(selected === 'DOCTOR' ? '/doctor/register' : '/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data)
        setError(err.response.data?.error?.message || err.response.data?.message || 'Something went wrong.');
      else setError('Unable to connect. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#0B1020', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob-1 absolute rounded-full" style={{ width: 480, height: 480, top: -140, left: -140, background: 'radial-gradient(circle, rgba(46,196,182,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob-2 absolute rounded-full" style={{ width: 400, height: 400, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(155,140,255,0.1) 0%, transparent 70%)', filter: 'blur(55px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 24px rgba(46,196,182,0.4)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA', lineHeight: 1.2 }}>MediGo</p>
            <p style={{ fontSize: 10, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.1em' }}>HEALTHCARE PLATFORM</p>
          </div>
        </div>

        <div className="glass" style={{ borderRadius: 24, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F7F8FA', marginBottom: 8 }}>Choose your role</h1>
            <p style={{ fontSize: 14, color: '#8892A4' }}>How will you be using MediGo?</p>
          </div>

          {error && (
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', fontSize: 13, color: '#FCA5A5' }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {ROLES.map(role => {
              const Icon = role.icon;
              const active = selected === role.id;
              const rgb = role.color === '#2EC4B6' ? '46,196,182' : '155,140,255';
              return (
                <motion.button key={role.id} onClick={() => setSelected(role.id)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', background: active ? `rgba(${rgb},0.08)` : 'rgba(255,255,255,0.03)', border: `1px solid rgba(${rgb},${active ? '0.25' : '0.07'})` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? `rgba(${rgb},0.12)` : 'rgba(255,255,255,0.04)', border: `1px solid rgba(${rgb},${active ? '0.2' : '0.08'})` }}>
                    <Icon size={20} style={{ color: active ? role.color : 'rgba(136,146,164,0.5)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: active ? role.color : '#F7F8FA', marginBottom: 2 }}>{role.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.6)' }}>{role.description}</p>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid rgba(${rgb},${active ? '1' : '0.2'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? role.color : 'transparent' }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button onClick={handleContinue} disabled={!selected || loading} className="mg-btn w-full">
            {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Setting up…</> : <>Continue <ArrowRight size={15} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
