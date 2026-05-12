import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, LayoutDashboard, Calendar, MessageSquare, LogOut, Menu, Bell, ChevronRight, UserCircle } from 'lucide-react';
import { authApi } from '../api/api';
import { authSession } from '../../features/auth/authSession';
import { authEvents } from '../../features/auth/authEventBus';
import { DoctorProfileContext } from '../../features/doctor/context/DoctorProfileContext';

const patientNav = [
  { icon: LayoutDashboard, label: 'Home',         path: '/home' },
  { icon: Calendar,        label: 'Appointments', path: '/appointments' },
  { icon: MessageSquare,   label: 'Messages',     path: '/chat' },
];
const doctorNav = [
  { icon: Calendar,      label: 'My Schedule', path: '/doctor/schedule', gated: true },
  { icon: MessageSquare, label: 'Messages',    path: '/chat',            gated: true },
  { icon: UserCircle,    label: 'My Profile',  path: '/doctor/profile' },
];

export default function AppShell({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use the passed-in user, falling back to the cached user from localStorage.
  // This means nav items render immediately on page load/refresh without waiting
  // for the authApi.me() call to complete.
  const resolvedUser = user ?? authSession.getUser();
  const role = resolvedUser?.role || 'PATIENT';
  const navItems = role === 'DOCTOR' ? doctorNav : patientNav;

  const doctorProfileCtx = useContext(DoctorProfileContext);
  const isProfileComplete = role === 'DOCTOR' ? (doctorProfileCtx?.isProfileComplete ?? true) : true;

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  const initials = resolvedUser?.fullName
    ? resolvedUser.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  /* Sidebar JSX — rendered as plain JSX, NOT as a nested component */
  const sidebarJSX = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px 16px', marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 18px rgba(46,196,182,0.35)' }}>
          <Stethoscope size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F7F8FA', lineHeight: 1.2 }}>MediGo</p>
          <p style={{ fontSize: 9, color: 'rgba(136,146,164,0.4)', letterSpacing: '0.07em' }}>HEALTHCARE</p>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: '0 20px 8px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(136,146,164,0.35)', letterSpacing: '0.08em' }}>NAVIGATION</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ icon: Icon, label, path, gated }) => {
          const locked = role === 'DOCTOR' && gated && !isProfileComplete;
          const active = !locked && location.pathname === path;
          return (
            <button key={path}
              onClick={locked ? undefined : () => { navigate(path); setMobileOpen(false); }}
              className={`nav-item ${active ? 'active' : ''}`}
              style={locked ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block', background: active ? '#2EC4B6' : 'rgba(136,146,164,0.2)', boxShadow: active ? '0 0 8px rgba(46,196,182,0.6)' : 'none', transition: 'all 0.2s' }} />
              <Icon size={15} />
              <span>{label}</span>
              {active && <ChevronRight size={11} style={{ marginLeft: 'auto', color: '#5EEAD4' }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 1, margin: '0 8px 8px', background: 'rgba(255,255,255,0.06)' }} />
        {/* User card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#fff' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F7F8FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resolvedUser?.fullName || 'User'}</p>
            <p style={{ fontSize: 10, color: 'rgba(136,146,164,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item" style={{ color: 'rgba(252,165,165,0.65)', width: '100%' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block', background: 'rgba(252,165,165,0.3)' }} />
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  const sidebarStyle = {
    background: 'linear-gradient(180deg, #111827 0%, #0D1526 100%)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0B1020' }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 relative" style={sidebarStyle}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full"
            style={{ width: 160, height: 160, top: 50, left: -30, background: 'radial-gradient(circle, rgba(46,196,182,0.07) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        </div>
        {sidebarJSX}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(11,16,32,0.8)', backdropFilter: 'blur(6px)' }} />
            <motion.aside key="drawer"
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col"
              style={sidebarStyle}>
              {sidebarJSX}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: 'rgba(17,24,39,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#8892A4', background: 'none', border: 'none', padding: 4 }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
              <Stethoscope size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F7F8FA' }}>MediGo</span>
          </div>
          <button style={{ color: 'rgba(136,146,164,0.5)', background: 'none', border: 'none', padding: 4 }}>
            <Bell size={18} />
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#0B1020' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
