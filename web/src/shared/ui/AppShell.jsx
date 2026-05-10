import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, LayoutDashboard, Calendar, MessageSquare,
  LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';
import { authApi } from '../api/api';
import { authSession } from '../../features/auth/authSession';
import { authEvents } from '../../features/auth/authEventBus';

const patientNav = [
  { icon: LayoutDashboard, label: 'Home',         path: '/home' },
  { icon: Calendar,        label: 'Appointments', path: '/appointments' },
  { icon: MessageSquare,   label: 'Messages',     path: '/chat' },
];

const doctorNav = [
  { icon: Calendar,      label: 'My Schedule', path: '/doctor/schedule' },
  { icon: MessageSquare, label: 'Messages',    path: '/chat' },
];

export default function AppShell({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'PATIENT';
  const navItems = role === 'DOCTOR' ? doctorNav : patientNav;

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 16px rgba(46,196,182,0.35)' }}>
          <Stethoscope size={18} color="#0B1020" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold" style={{ color: '#F7F8FA' }}>MediGo</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button key={path} onClick={() => { navigate(path); setMobileOpen(false); }}
              className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto" style={{ color: '#2EC4B6' }} />}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-6 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#0B1020' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#F7F8FA' }}>{user?.fullName || 'User'}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(247,248,250,0.35)' }}>{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full" style={{ color: 'rgba(255,92,122,0.7)' }}>
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0B1020' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{ background: '#0F1525', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(11,16,32,0.8)', backdropFilter: 'blur(4px)' }} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col"
              style={{ background: '#0F1525', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: '#0F1525', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'rgba(247,248,250,0.6)', background: 'none', border: 'none', padding: 4 }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)' }}>
              <Stethoscope size={14} color="#0B1020" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#F7F8FA' }}>MediGo</span>
          </div>
          <button style={{ color: 'rgba(247,248,250,0.4)', background: 'none', border: 'none', padding: 4 }}>
            <Bell size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: '#0B1020' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
