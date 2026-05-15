import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, LayoutDashboard, Calendar, MessageSquare, LogOut, Menu, ChevronRight, UserCircle, ChevronDown, ClipboardList, ShieldCheck, Users } from 'lucide-react';
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
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/doctor/dashboard',     gated: true },
  { icon: ClipboardList,   label: 'Appointments', path: '/doctor/appointments',  gated: true },
  { icon: Calendar,        label: 'My Schedule',  path: '/doctor/schedule',      gated: true },
  { icon: MessageSquare,   label: 'Messages',     path: '/chat',                 gated: true },
];
const adminNav = [
  { icon: LayoutDashboard, label: 'Dashboard',           path: '/admin/dashboard' },
  { icon: ShieldCheck,     label: 'Doctor Verification', path: '/admin/verification' },
  { icon: Stethoscope,     label: 'Doctors',             path: '/admin/doctors' },
  { icon: Users,           label: 'Patients',            path: '/admin/patients' },
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
  const navItems = role === 'ADMIN' ? adminNav : role === 'DOCTOR' ? doctorNav : patientNav;

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
    <header className="top-navbar" style={{
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(43,45,66,0.08)',
      padding: '12px 32px'
    }}>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notifications */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          loading={notifLoading}
        />

        <div style={{ width: 1, height: 24, background: 'rgba(43,45,66,0.1)' }} />

        {/* Profile dropdown */}
        <div ref={profileDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileDropdownOpen(o => !o)}
            className="top-navbar-profile-btn"
            style={{ padding: '6px 16px 6px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(43,45,66,0.08)', boxShadow: '0 2px 8px rgba(43,45,66,0.03)' }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: 'linear-gradient(135deg, #EF233C, #D90429)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              boxShadow: '0 2px 8px rgba(239,35,60,0.3)'
            }}>
              <AuthImage
                key={profileVersion}
                src={profilePictureUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallback={<span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{initials}</span>}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '0 8px' }}>
              <span className="top-navbar-profile-name" style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', lineHeight: 1.2 }}>{displayName}</span>
              <span style={{ fontSize: 10, color: '#8D99AE', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role}</span>
            </div>
            <ChevronDown size={14} style={{
              color: '#8D99AE',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }} />
          </button>

          {/* Profile dropdown menu */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="top-navbar-dropdown"
                style={{ borderRadius: 16, border: '1px solid rgba(43,45,66,0.08)', boxShadow: '0 12px 40px rgba(43,45,66,0.12)' }}
              >
                {/* User info header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(43,45,66,0.06)', background: 'rgba(255,255,255,0.5)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: '0 0 2px' }}>{displayName}</p>
                  <p style={{ fontSize: 11, color: '#8D99AE', margin: 0, fontWeight: 500 }}>{resolvedUser?.email}</p>
                </div>
                <div style={{ padding: '8px' }}>
                  {role === 'DOCTOR' && (
                    <button
                      onClick={() => { navigate('/doctor/profile'); setProfileDropdownOpen(false); }}
                      className="top-navbar-dropdown-item"
                      style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}
                    >
                      <UserCircle size={16} style={{ color: '#8D99AE' }} />
                      <span>My Profile</span>
                    </button>
                  )}
                  <button
                    onClick={confirmLogout}
                    className="top-navbar-dropdown-item"
                    style={{ color: '#D90429', padding: '10px 12px', fontSize: 13, fontWeight: 600, marginTop: 4, background: 'rgba(217,4,41,0.05)' }}
                  >
                    <LogOut size={16} />
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 10 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '32px 24px 24px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 24px rgba(239,35,60,0.4)' }}>
          <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#EDF2F4', lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>MediGo</p>
          <p style={{ fontSize: 10, color: '#8D99AE', letterSpacing: '0.15em', fontWeight: 600, margin: '2px 0 0' }}>PORTAL</p>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: '0 24px 12px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Navigation</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {navItems.map(({ icon: Icon, label, path, gated }) => {
          const locked = role === 'DOCTOR' && gated && !isProfileComplete;
          const active = !locked && location.pathname === path;
          return (
            <button key={path}
              onClick={locked ? undefined : () => { navigate(path); setMobileOpen(false); }}
              className={`nav-item ${active ? 'active' : ''}`}
              style={locked ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}>
              <Icon size={18} style={{ color: active ? '#EDF2F4' : '#8D99AE' }} />
              <span style={{ fontSize: 14, fontWeight: active ? 600 : 500 }}>{label}</span>
              {active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#EF233C' }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom — just a subtle branding line */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ height: 1, margin: '0 0 16px', background: 'rgba(141,153,174,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
          <p style={{ fontSize: 12, color: '#8D99AE', fontWeight: 500, margin: 0 }}>Systems Online</p>
        </div>
      </div>
    </div>
  );

  const sidebarStyle = {
    background: '#2B2D42',
    borderRight: '1px solid rgba(43,45,66,0.1)',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EDF2F4' }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 relative" style={sidebarStyle}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute"
            style={{ width: 200, height: 200, top: -50, left: -50, background: 'radial-gradient(circle, rgba(239,35,60,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
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
              style={{ background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(6px)' }} />
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
          style={{ background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(43,45,66,0.06)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#8D99AE', background: 'none', border: 'none', padding: 4 }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)' }}>
              <Stethoscope size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42' }}>MediGo</span>
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
                background: 'linear-gradient(135deg, #EF233C, #D90429)',
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

        <main style={{ flex: 1, overflowY: 'auto', background: '#EDF2F4' }}>
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
                <LogOut size={24} style={{ color: '#D90429' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2B2D42', margin: '0 0 6px', textAlign: 'center' }}>
                Sign Out?
              </h3>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
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
                    background: 'rgba(217,4,41,0.08)', border: '1px solid rgba(217,4,41,0.2)',
                    color: '#D90429', cursor: 'pointer', transition: 'all 0.2s',
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
