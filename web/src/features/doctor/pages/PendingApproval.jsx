import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Clock, CheckCircle, Bell, LogOut } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';

const steps = [
  { icon: CheckCircle, label: 'Profile submitted', done: true },
  { icon: Clock,       label: 'Under review by admin team', done: false },
  { icon: Bell,        label: 'Approval notification sent', done: false },
];

export default function PendingApproval() {
  const navigate = useNavigate();

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1020' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)', top: '-80px', left: '-80px', filter: 'blur(80px)' }} />
        <div className="blob-2 absolute w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #9B8CFF, transparent)', bottom: '-60px', right: '-60px', filter: 'blur(70px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 20px rgba(46,196,182,0.4)' }}>
            <Stethoscope size={20} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold" style={{ color: '#F7F8FA' }}>MediGo</span>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          {/* Icon */}
          <div className="text-center">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Clock size={28} style={{ color: '#F59E0B' }} />
            </motion.div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F7F8FA' }}>Verification Pending</h1>
            <p className="text-sm" style={{ color: 'rgba(247,248,250,0.4)' }}>
              Your profile is under review. We'll notify you once approved.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map(({ icon: Icon, label, done }, i) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: done ? 'rgba(34,211,165,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(34,211,165,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? 'rgba(34,211,165,0.15)' : 'rgba(255,255,255,0.05)' }}>
                  <Icon size={14} style={{ color: done ? '#22D3A5' : 'rgba(247,248,250,0.3)' }} />
                </div>
                <span className="text-sm" style={{ color: done ? '#22D3A5' : 'rgba(247,248,250,0.4)' }}>{label}</span>
                {i === 1 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full badge-pending">In Progress</span>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-xs" style={{ color: 'rgba(245,158,11,0.8)' }}>
              ⏱ Verification typically takes 1–2 business days. You'll receive a notification once your account is approved.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/doctor/register')} className="mg-btn-ghost flex-1" style={{ padding: '12px', fontSize: '13px' }}>
              Edit Profile
            </button>
            <button onClick={handleLogout} className="mg-btn-primary flex-1" style={{ padding: '12px', fontSize: '13px', background: 'rgba(255,92,122,0.15)', boxShadow: 'none', color: '#FF5C7A', border: '1px solid rgba(255,92,122,0.2)' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
