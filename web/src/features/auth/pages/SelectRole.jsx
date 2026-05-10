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
  { id: 'PATIENT', icon: User, title: 'Patient', description: 'Book appointments and consult with verified doctors', teal: true },
  { id: 'DOCTOR', icon: Stethoscope, title: 'Doctor', description: 'Manage your schedule and accept patient appointments', teal: false },
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
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#F7F9FC' }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 20px rgba(20,184,166,0.3)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold" style={{ color: '#1F2937' }}>MediGo</span>
        </div>

        <div className="card rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>Choose your role</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>How will you be using MediGo?</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <div className="space-y-3 mb-8">
            {roles.map(role => {
              const Icon = role.icon;
              const active = selected === role.id;
              const accent = role.teal ? '#14B8A6' : '#8B93FF';
              const accentBg = role.teal ? '#F0FDFA' : '#EEF2FF';
              const accentBorder = role.teal ? '#CCFBF1' : '#C7D2FE';
              return (
                <motion.button key={role.id} onClick={() => setSelected(role.id)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                  style={active
                    ? { background: accentBg, border: `1.5px solid ${accentBorder}` }
                    : { background: '#F9FAFB', border: '1.5px solid #E5E7EB' }
                  }>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? accentBg : '#fff', border: `1.5px solid ${active ? accentBorder : '#E5E7EB'}` }}>
                    <Icon size={20} style={{ color: active ? accent : '#9CA3AF' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: active ? accent : '#1F2937' }}>{role.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{role.description}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: active ? accent : '#D1D5DB', background: active ? accent : 'transparent' }}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button onClick={handleContinue} disabled={!selected || loading} className="mg-btn-primary w-full">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting up…</>
            ) : (<>Continue <ArrowRight size={15} /></>)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
