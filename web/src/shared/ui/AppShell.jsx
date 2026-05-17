import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, LayoutDashboard, Calendar, MessageSquare, LogOut, Menu, ChevronRight, UserCircle, ChevronDown, ClipboardList, ShieldCheck, Users, FileText } from 'lucide-react';
import { authApi, adminApi, chatApi } from '../api/api';
import { authSession } from '../../features/auth/authSession';
import { authEvents } from '../../features/auth/authEventBus';
import { DoctorProfileContext } from '../../features/doctor/context/DoctorProfileContext';
import AuthImage from './AuthImage';
import NotificationDropdown from './NotificationDropdown';
import useNotifications from '../hooks/useNotifications';
import { useToast } from './ToastProvider';

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
  { icon: FileText,        label: 'Specialization Requests', path: '/admin/specialization-requests' },
  { icon: Stethoscope,     label: 'Doctors',             path: '/admin/doctors' },
  { icon: Users,           label: 'Patients',            path: '/admin/patients' },
];

export default function AppShell({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasNewChat, setHasNewChat] = useState(false);
  const [hasAdminPending, setHasAdminPending] = useState(false);
  const [adminPendingCount, setAdminPendingCount] = useState(0);
  const [hasAdminDoctorsNew, setHasAdminDoctorsNew] = useState(false);
  const [hasAdminPatientsNew, setHasAdminPatientsNew] = useState(false);
  const [hasAdminSpecReqNew, setHasAdminSpecReqNew] = useState(false);
  const [adminDoctorsCount, setAdminDoctorsCount] = useState(0);
  const [adminPatientsCount, setAdminPatientsCount] = useState(0);
  const [adminSpecReqCount, setAdminSpecReqCount] = useState(0);
  const profileDropdownRef = useRef(null);
  const { addToast } = useToast();

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
  const unreadNotifications = notifications.filter(n => !n.read);
  const hasAppointmentUpdates = unreadNotifications.some(n => (n.type || '').includes('appointment'));
  const userId = resolvedUser?.id;
  const adminPendingSeenKey = userId ? `medigo_admin_pending_seen:${userId}` : null;
  const adminDoctorsSeenKey = userId ? `medigo_admin_doctors_seen:${userId}` : null;
  const adminPatientsSeenKey = userId ? `medigo_admin_patients_seen:${userId}` : null;
  const adminSpecReqSeenKey = userId ? `medigo_admin_spec_requests_seen:${userId}` : null;
  const navPulseMap = {
    '/appointments': hasAppointmentUpdates,
    '/doctor/appointments': hasAppointmentUpdates,
    '/doctor/schedule': hasAppointmentUpdates,
    '/chat': hasNewChat,
    '/admin/verification': hasAdminPending,
    '/admin/specialization-requests': hasAdminSpecReqNew,
    '/admin/doctors': hasAdminDoctorsNew,
    '/admin/patients': hasAdminPatientsNew,
  };

  useEffect(() => {
    if (!userId || role === 'ADMIN') return undefined;

    let active = true;
    async function checkChat() {
      try {
        const res = await chatApi.unreadCount();
        const count = res.data?.data ?? res.data;
        if (active) setHasNewChat(Number(count) > 0);
      } catch {
        if (active) setHasNewChat(false);
      }
    }

    checkChat();
    const interval = setInterval(checkChat, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId, role]);

  useEffect(() => {
    if (!userId || role !== 'ADMIN') return undefined;

    let active = true;
    async function checkAdmin() {
      try {
        const [pendingRes, doctorsRes, patientsRes, specReqRes] = await Promise.all([
          adminApi.getPendingDoctors(),
          adminApi.getAllDoctors(),
          adminApi.getAllPatients(),
          adminApi.getSpecializationChangeRequests('PENDING'),
        ]);

        const pendingList = pendingRes.data?.data ?? pendingRes.data;
        const doctorsList = doctorsRes.data?.data ?? doctorsRes.data;
        const patientsList = patientsRes.data?.data ?? patientsRes.data;
        const specReqList = specReqRes.data?.data ?? specReqRes.data;
        const pendingCount = Array.isArray(pendingList) ? pendingList.length : 0;
        const doctorsCount = Array.isArray(doctorsList) ? doctorsList.length : 0;
        const patientsCount = Array.isArray(patientsList) ? patientsList.length : 0;
        const specReqCount = Array.isArray(specReqList) ? specReqList.length : 0;
        if (!active) return;

        setAdminPendingCount(pendingCount);
        setAdminDoctorsCount(doctorsCount);
        setAdminPatientsCount(patientsCount);
        setAdminSpecReqCount(specReqCount);

        if (adminPendingSeenKey && localStorage.getItem(adminPendingSeenKey) === null) {
          localStorage.setItem(adminPendingSeenKey, String(pendingCount));
        }
        if (adminDoctorsSeenKey && localStorage.getItem(adminDoctorsSeenKey) === null) {
          localStorage.setItem(adminDoctorsSeenKey, String(doctorsCount));
        }
        if (adminPatientsSeenKey && localStorage.getItem(adminPatientsSeenKey) === null) {
          localStorage.setItem(adminPatientsSeenKey, String(patientsCount));
        }
        if (adminSpecReqSeenKey && localStorage.getItem(adminSpecReqSeenKey) === null) {
          localStorage.setItem(adminSpecReqSeenKey, String(specReqCount));
        }

        const pendingSeen = adminPendingSeenKey ? Number(localStorage.getItem(adminPendingSeenKey) || 0) : 0;
        const doctorsSeen = adminDoctorsSeenKey ? Number(localStorage.getItem(adminDoctorsSeenKey) || 0) : 0;
        const patientsSeen = adminPatientsSeenKey ? Number(localStorage.getItem(adminPatientsSeenKey) || 0) : 0;
        const specReqSeen = adminSpecReqSeenKey ? Number(localStorage.getItem(adminSpecReqSeenKey) || 0) : 0;

        setHasAdminPending(pendingCount > pendingSeen);
        setHasAdminDoctorsNew(doctorsCount > doctorsSeen);
        setHasAdminPatientsNew(patientsCount > patientsSeen);
        setHasAdminSpecReqNew(specReqCount > specReqSeen);
      } catch {
        if (active) {
          setHasAdminPending(false);
          setHasAdminDoctorsNew(false);
          setHasAdminPatientsNew(false);
          setHasAdminSpecReqNew(false);
        }
      }
    }

    checkAdmin();
    const interval = setInterval(checkAdmin, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId, role, adminPendingSeenKey, adminDoctorsSeenKey, adminPatientsSeenKey, adminSpecReqSeenKey]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    if (location.pathname !== '/admin/verification') return;
    if (!adminPendingSeenKey) return;
    localStorage.setItem(adminPendingSeenKey, String(adminPendingCount));
    setHasAdminPending(false);
  }, [role, location.pathname, adminPendingSeenKey, adminPendingCount]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    if (location.pathname !== '/admin/doctors') return;
    if (!adminDoctorsSeenKey) return;
    localStorage.setItem(adminDoctorsSeenKey, String(adminDoctorsCount));
    setHasAdminDoctorsNew(false);
  }, [role, location.pathname, adminDoctorsSeenKey, adminDoctorsCount]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    if (location.pathname !== '/admin/patients') return;
    if (!adminPatientsSeenKey) return;
    localStorage.setItem(adminPatientsSeenKey, String(adminPatientsCount));
    setHasAdminPatientsNew(false);
  }, [role, location.pathname, adminPatientsSeenKey, adminPatientsCount]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    if (location.pathname !== '/admin/specialization-requests') return;
    if (!adminSpecReqSeenKey) return;
    localStorage.setItem(adminSpecReqSeenKey, String(adminSpecReqCount));
    setHasAdminSpecReqNew(false);
  }, [role, location.pathname, adminSpecReqSeenKey, adminSpecReqCount]);

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

  const pulseStyle = `
    @keyframes pulse-red {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,35,60,0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239,35,60,0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,35,60,0); }
    }
    .pulse-dot {
      animation: pulse-red 2s infinite;
    }
  `;

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    addToast('You have been signed out successfully.', 'info');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#8D99AE', fontWeight: 500 }}>Pages</span>
        <span style={{ fontSize: 13, color: 'rgba(43,45,66,0.2)', fontWeight: 500 }}>/</span>
        <span style={{ fontSize: 13, color: '#2B2D42', fontWeight: 800, letterSpacing: '-0.02em' }}>
          {(() => {
            const path = location.pathname;
            if (path === '/home') return 'Home';
            if (path === '/appointments') return 'Appointments';
            if (path === '/chat') return 'Messages';
            if (path.startsWith('/doctor/dashboard')) return 'Dashboard';
            if (path.startsWith('/doctor/appointments')) return 'Appointments';
            if (path.startsWith('/doctor/schedule')) return 'My Schedule';
            if (path.startsWith('/doctor/profile')) return 'Profile';
            if (path.startsWith('/doctor/register')) return 'Account Setup';
            if (path.startsWith('/admin/dashboard')) return 'Dashboard';
            if (path.startsWith('/admin/verification')) return 'Doctor Verification';
            if (path.startsWith('/admin/specialization-requests')) return 'Specialization Requests';
            if (path.startsWith('/admin/doctors')) return 'Doctors';
            if (path.startsWith('/admin/patients')) return 'Patients';
            return 'Profile';
          })()}
        </span>
      </div>
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
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,1)', boxShadow: '0 8px 24px rgba(43,45,66,0.06)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setProfileDropdownOpen(o => !o)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px',
              borderRadius: 24, background: '#FFFFFF',
              border: '1px solid rgba(43,45,66,0.06)', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(43,45,66,0.02)'
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: 'linear-gradient(135deg, #EF233C, #D90429)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 2, border: '2px solid rgba(239,35,60,0.1)'
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
                <AuthImage
                  key={profileVersion}
                  src={profilePictureUrl}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallback={<span style={{ fontSize: 13, fontWeight: 900, color: '#EF233C' }}>{initials}</span>}
                />
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{displayName}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8D99AE', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{role}</p>
            </div>
            <ChevronDown size={14} style={{
              color: '#8D99AE',
              marginLeft: 4,
              transition: 'transform 0.2s',
              transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }} />
          </motion.button>

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
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(43,45,66,0.07)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: '0 0 2px' }}>{displayName}</p>
                  <p style={{ fontSize: 11, color: '#8D99AE', margin: 0 }}>{role === 'DOCTOR' ? 'Doctor' : role === 'ADMIN' ? 'Admin' : 'Patient'}</p>
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
                    style={{ color: '#D90429' }}
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
      {/* Logo Area */}
      <div style={{ padding: '32px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 42, height: 42, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: 'linear-gradient(135deg, #EF233C, #D90429)', 
            boxShadow: '0 8px 24px rgba(239,35,60,0.4)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>MediGo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34A853', boxShadow: '0 0 6px rgba(52,168,83,0.5)' }} />
              <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>System Live</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 12px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ icon: Icon, label, path, gated }) => {
          const locked = role === 'DOCTOR' && gated && !isProfileComplete;
          const active = !locked && location.pathname === path;
          const showPulse = !locked && Boolean(navPulseMap[path]);
          return (
            <motion.button key={path}
              onClick={locked ? undefined : () => { navigate(path); setMobileOpen(false); }}
              whileHover={locked ? {} : { x: 4, background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)' }}
              style={{ 
                width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', 
                borderRadius: 16, background: active ? 'rgba(255,255,255,0.1)' : 'transparent', 
                border: 'none', textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                opacity: locked ? 0.35 : 1, position: 'relative', overflow: 'hidden'
              }}>
              {active && (
                <motion.div layoutId="activeIndicator" style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 4, background: '#EF233C', borderRadius: '0 4px 4px 0', boxShadow: '0 0 12px rgba(239,35,60,0.6)' }} />
              )}
              <Icon size={18} style={{ color: active ? '#EF233C' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }} />
              <span style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>{label}</span>
              <span style={{ marginLeft: 'auto', position: 'relative' }}>
                {showPulse && <span className="nav-pulse pulse-dot" style={{ position: 'static', display: 'block', width: 8, height: 8 }} />}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Branding */}
      <div style={{ padding: '0 12px 24px' }}>
        <div style={{ height: 1, margin: '0 8px 12px', background: 'rgba(255,255,255,0.06)' }} />
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0, fontWeight: 700, letterSpacing: '0.05em' }}>MediGo v1.0 • SYSTEM LIVE</p>
      </div>
    </div>
  );

  const sidebarStyle = {
    background: 'linear-gradient(180deg, #2B2D42 0%, #1E1F33 100%)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EDF2F4' }}>
      <style>{pulseStyle}</style>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 relative" style={sidebarStyle}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full"
            style={{ width: 160, height: 160, top: 50, left: -30, background: 'radial-gradient(circle, rgba(239,35,60,0.07) 0%, transparent 70%)', filter: 'blur(30px)' }} />
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
