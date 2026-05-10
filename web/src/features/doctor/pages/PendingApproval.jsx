import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Clock, CheckCircle, Bell, LogOut } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';

const steps = [
  { icon: CheckCircle, label: 'Profile submitted', done: true },
  { icon: Clock,       label: 'Under review by admin team', done: false, inProgress: true },
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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F7F9FC' }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 20px rgba(20,184,166,0.3)' }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold" style={{ color: '#1F2937' }}>MediGo</span>
        </div>

        <div className="card rounded-3xl p-8 space-y-6">
          <div className="text-center">
            <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FEF3C7', border: '1.5px solid #FDE68A' }}>
              <Clock size={28} style={{ color: '#D97706' }} />
            </motion.div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>Verification Pending</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Your profile is under review. We'll notify you once approved.
            </p>
          </div>

          <div className="space-y-2.5">
            {steps.map(({ icon: Icon, label, done, inProgress }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={done
                  ? { background: '#F0FDF4', border: '1px solid #BBF7D0' }
                  : inProgress
                    ? { background: '#FFFBEB', border: '1px solid #FDE68A' }
                    : { background: '#F9FAFB', border: '1px solid #F3F4F6' }
                }>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={done ? { background: '#DCFCE7' } : inProgress ? { background: '#FEF3C7' } : { background: '#F3F4F6' }}>
                  <Icon size={14} style={{ color: done ? '#16A34A' : inProgress ? '#D97706' : '#9CA3AF' }} />
                </div>
                <span className="text-sm" style={{ color: done ? '#16A34A' : inProgress ? '#D97706' : '#9CA3AF' }}>{label}</span>
                {inProgress && (
                  <span className="ml-auto badge-pending">In Progress</span>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-xs" style={{ color: '#92400E' }}>
              ⏱ Verification typically takes 1–2 business days. You'll receive a notification once your account is approved.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/doctor/register')} className="mg-btn-ghost flex-1" style={{ padding: '12px', fontSize: '13px' }}>
              Edit Profile
            </button>
            <button onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{ padding: '12px', background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
