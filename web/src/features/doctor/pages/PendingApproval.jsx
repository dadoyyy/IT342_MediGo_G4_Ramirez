import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Clock, CheckCircle, Bell, LogOut } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';

const STEPS = [
  { icon: CheckCircle, label: 'Profile submitted', done: true },
  { icon: Clock,       label: 'Under review by admin team', done: false, active: true },
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#0B1020', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob-1 absolute rounded-full" style={{ width: 480, height: 480, top: -140, left: -140, background: 'radial-gradient(circle, rgba(255,117,89,0.08) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div className="blob-2 absolute rounded-full" style={{ width: 400, height: 400, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(155,140,255,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
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

        <div className="glass" style={{ borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Clock size={28} style={{ color: '#FCD34D' }} />
            </motion.div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F7F8FA', marginBottom: 8 }}>Verification Pending</h1>
            <p style={{ fontSize: 14, color: '#8892A4' }}>Your profile is under review. We'll notify you once approved.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS.map(({ icon: Icon, label, done, active }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: done ? 'rgba(46,196,182,0.08)' : active ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid rgba(${done ? '46,196,182' : active ? '245,158,11' : '255,255,255'},${done ? '0.15' : active ? '0.15' : '0.06'})` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done ? 'rgba(46,196,182,0.12)' : active ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)' }}>
                  <Icon size={14} style={{ color: done ? '#5EEAD4' : active ? '#FCD34D' : 'rgba(136,146,164,0.3)' }} />
                </div>
                <span style={{ fontSize: 13, color: done ? '#5EEAD4' : active ? '#FCD34D' : 'rgba(136,146,164,0.4)', flex: 1 }}>{label}</span>
                {active && <span className="badge badge-pending">In Progress</span>}
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <p style={{ fontSize: 12, color: 'rgba(252,211,77,0.7)' }}>
              Verification typically takes 1–2 business days. You'll receive a notification once your account is approved.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/doctor/register')} className="mg-btn-ghost" style={{ flex: 1, padding: 12, fontSize: 13 }}>Edit Profile</button>
            <button onClick={handleLogout} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', color: '#FCA5A5', cursor: 'pointer' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
