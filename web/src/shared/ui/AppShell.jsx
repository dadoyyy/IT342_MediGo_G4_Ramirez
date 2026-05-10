import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, LayoutDashboard, Calendar, MessageSquare, LogOut, Menu, Bell, ChevronRight } from 'lucide-react';
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
      <div className="flex items-center gap-3 px-5 py-6 mb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 16px rgba(20,184,166,0.3)' }}>
          <Stethoscope size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-white">MediGo</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button key={path} onClick={() => { navigate(path); setMobileOpen(false); }}
              className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto" style={{ color: '#5EEAD4' }} />}
            </button>
          );
        })}
      </nav>

      {/* User card + logout */}
      <div className="px-3 pb-6 space-y-1.5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', color: '#fff' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'User'}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(249,250,251,0.35)' }}>{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full"
          style={{ color: 'rgba(252,165,165,0.7)' }}>
          <LogOut size={15} /><span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F9FC' }}>
      {/* Desktop sidebar — dark */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0"
        style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col"
              style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0 bg-white"
          style={{ borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(31,41,55,0.04)' }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ color: '#6B7280', background: 'none', border: 'none', padding: 4 }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)' }}>
              <Stethoscope size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#1F2937' }}>MediGo</span>
          </div>
          <button style={{ color: '#9CA3AF', background: 'none', border: 'none', padding: 4 }}>
            <Bell size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: '#F7F9FC' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
