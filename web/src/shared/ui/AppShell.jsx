import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, LayoutDashboard, Calendar, MessageSquare, LogOut, Menu, ChevronRight, UserCircle, ChevronDown } from 'lucide-react';
import { authApi } from '../api/api';
import { authSession } from '../../features/auth/authSession';
import { authEvents } from '../../features/auth/authEventBus';
import { DoctorProfileContext } from '../../features/doctor/context/DoctorProfileContext';
import AuthImage from './AuthImage';
import NotificationDropdown from './NotificationDropdown';
import useNotifications from '../hooks/useNotifications';

const patientNav = [
  { icon: LayoutDashboard, label: 'Home',         path: '/home' },
  { icon: Calendar,        label: 'Appointments', path: '/appointments' },
  { icon: MessageSquare,   label: 'Messages',     path: '/chat' },
];
const doctorNav = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/doctor/dashboard', gated: true },
  { icon: Calendar,        label: 'My Schedule',  path: '/doctor/schedule',  gated: true },
  { icon: MessageSquare,   label: 'Messages',     path: '/chat',             gated: true },
  { icon: UserCircle,      label: 'My Profile',   path: '/doctor/profile' },
];

export default function AppShell({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileDropdownRef = useRef(null);

  // Use the passed-in user, falling back to the cached user from localStorage.
  // This means nav items render immediately on page load/refresh without waiting
  // for the authApi.me() call to complete.
  const resolvedUser = user ?? authSession.getUser();
  const role = resolvedUser?.role || 'PATIENT';
  const navItems = role === 'DOCTOR' ? doctorNav : patientNav;

  const doctorProfileCtx = useContext(DoctorProfileContext);
  // Lock sidebar nav for doctors who haven't completed their profile OR aren't verified yet
  const isProfileComplete = role === 'DOCTOR'
    ? ((doctorProfileCtx?.isProfileComplete && doctorProfileCtx?.isVerified) ?? true)
    : true;
  const profilePictureUrl = role === 'DOCTOR' ? (doctorProfileCtx?.profilePictureUrl ?? null) : null;
  const profileVersion = doctorProfileCtx?.profileVersion ?? 0;

  // Notifications
  const { notifications, unreadCount, loading: notifLoading, markRead, markAllRead } = useNotifications(resolvedUser);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  function confirmLogout() {
    setShowLogoutModal(true);
    setProfileDropdownOpen(false);
  }

  const initials = resolvedUser?.fullName
    ? resolvedUser.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const displayName = resolvedUser?.fullName || 'User';

  /* ── Top Navbar JSX (profile + notifications + logout) ── */
  const topNavbar = (
    <header className="top-navbar">
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notifications */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          loading={notifLoading}
        />

        {/* Profile dropdown */}
        <div ref={profileDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileDropdownOpen(o => !o)}
            className="top-navbar-profile-btn"
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              <AuthImage
                key={profileVersion}
                src={profilePictureUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallback={<span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{initials}</span>}
              />
            </div>
            <span className="top-navbar-profile-name">{displayName}</span>
            <ChevronDown size={14} style={{
              color: 'rgba(136,146,164,0.5)',
              transition: 'transform 0.2s',
              transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }} />
          </button>

          {/* Profile dropdown menu */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="top-navbar-dropdown"
              >
                {/* User info header */}
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: '0 0 2px' }}>{displayName}</p>
                  <p style={{ fontSize: 11, color: 'rgba(136,146,164,0.5)', margin: 0 }}>{role === 'DOCTOR' ? 'Doctor' : role === 'ADMIN' ? 'Admin' : 'Patient'}</p>
                </div>
                <div style={{ padding: '6px 8px' }}>
                  {role === 'DOCTOR' && (
                    <button
                      onClick={() => { navigate('/doctor/profile'); setProfileDropdownOpen(false); }}
                      className="top-navbar-dropdown-item"
                    >
                      <UserCircle size={14} />
                      <span>My Profile</span>
                    </button>
                  )}
                  <button
                    onClick={confirmLogout}
                    className="top-navbar-dropdown-item"
                    style={{ color: 'rgba(252,165,165,0.75)' }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );

  /* Sidebar JSX — rendered as plain JSX, NOT as a nested component */
  const sidebarJSX = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px 16px', marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 18px rgba(46,196,182,0.35)' }}>
          <Stethoscope size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
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

      {/* Bottom — just a subtle branding line */}
      <div style={{ padding: '0 12px 24px' }}>
        <div style={{ height: 1, margin: '0 8px 8px', background: 'rgba(255,255,255,0.06)' }} />
        <p style={{ fontSize: 10, color: 'rgba(136,146,164,0.2)', textAlign: 'center', margin: 0 }}>MediGo v1.0</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              loading={notifLoading}
            />
            <button
              onClick={() => setProfileDropdownOpen(o => !o)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>
                <AuthImage
                  key={profileVersion}
                  src={profilePictureUrl}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallback={<span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{initials}</span>}
                />
              </div>
            </button>
          </div>
        </header>

        {/* Desktop top navbar */}
        <div className="hidden lg:block">{topNavbar}</div>

        <main style={{ flex: 1, overflowY: 'auto', background: '#0B1020' }}>
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="logout-modal-overlay"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="logout-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="logout-modal-icon">
                <LogOut size={24} style={{ color: '#FCA5A5' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F7F8FA', margin: '0 0 6px', textAlign: 'center' }}>
                Sign Out?
              </h3>
              <p style={{ fontSize: 13, color: '#8892A4', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
                Are you sure you want to sign out of your account? You'll need to log in again to access your data.
              </p>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="mg-btn-ghost"
                  style={{ flex: 1, padding: '11px 20px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1, padding: '11px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: 'rgba(252,165,165,0.12)', border: '1px solid rgba(252,165,165,0.25)',
                    color: '#FCA5A5', cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
