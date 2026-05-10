import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';
import axios from 'axios';

const roles = [
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
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data?.error?.message || err.response.data?.message || 'Something went wrong.');
      } else { setError('Unable to connect. Please try again.'); }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#0B1020' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2EC4B6, transparent)', top: '-100px', left: '-100px', filter: 'blur(80px)' }} />
        <div className="blob-2 absolute w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #9B8CFF, transparent)', bottom: '-80px', right: '-80px', filter: 'blur(70px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 20px rgba(46,196,182,0.4)' }}>
            <Stethoscope size={20} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold" style={{ color: '#F7F8FA' }}>MediGo</span>
        </div>

        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F7F8FA' }}>Choose your role</h1>
            <p className="text-sm" style={{ color: 'rgba(247,248,250,0.4)' }}>How will you be using MediGo?</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)', color: '#FF5C7A' }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <div className="space-y-3 mb-8">
            {roles.map(role => {
              const Icon = role.icon;
              const active = selected === role.id;
              return (
                <motion.button key={role.id} onClick={() => setSelected(role.id)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                  style={active
                    ? { background: `rgba(${role.color === '#2EC4B6' ? '46,196,182' : '155,140,255'},0.1)`, border: `1px solid ${role.color}40` }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? `${role.color}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? role.color + '40' : 'rgba(255,255,255,0.08)'}` }}>
                    <Icon size={20} style={{ color: active ? role.color : 'rgba(247,248,250,0.4)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: active ? role.color : '#F7F8FA' }}>{role.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(247,248,250,0.4)' }}>{role.description}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: active ? role.color : 'rgba(255,255,255,0.2)', background: active ? role.color : 'transparent' }}>
                    {active && <div className="w-2 h-2 rounded-full" style={{ background: '#0B1020' }} />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button onClick={handleContinue} disabled={!selected || loading} className="mg-btn-primary w-full">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(11,16,32,0.3)', borderTopColor: '#0B1020' }} />
                Setting up…
              </>
            ) : (
              <>Continue <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
