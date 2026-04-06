import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/api';
import { authSession } from '../session/authSession';
import { authEvents } from '../patterns/observer/authEventBus';

/**
 * Placeholder dashboard shown after a successful login.
 * Replace with real Phase 2+ features.
 */
export default function Dashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user, setUser]               = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast]             = useState(false);
  const profileRef = useRef(null);

  // Load current user from /me
  useEffect(() => {
    authApi.me()
      .then(res => setUser(res.data.data))
      .catch(() => {}); // silently fail; user info is cosmetic here
  }, []);

  // Show toast once if arriving from a login flow
  useEffect(() => {
    if (location.state?.justLoggedIn) {
      setToast(true);
      const t = setTimeout(() => setToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // React to global auth session expiration events.
  useEffect(() => {
    const unsubscribe = authEvents.subscribe(authEvents.names.sessionExpired, () => {
      navigate('/login', { replace: true });
    });
    return unsubscribe;
  }, [navigate]);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Proceed regardless — token is cleared client-side
    } finally {
      authSession.clearSession();
      authEvents.emit(authEvents.names.logout, { source: 'dashboard' });
      navigate('/login', { replace: true });
    }
  }

  // Derive initials and role color
  const initials   = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const roleColor  = user?.role === 'DOCTOR'
    ? { bg: '#EDE9FE', text: '#6D28D9' }
    : { bg: '#D1FAE5', text: '#065F46' };
  const firstName  = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top navigation bar ── */}
      <header
        className="h-16 flex items-center justify-between px-6 md:px-8 shadow-sm"
        style={{ backgroundColor: '#2563EB' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-base">⚕</span>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">MediGo</span>
        </div>

        {/* Right side: profile + logout */}
        <div className="flex items-center gap-3">

          {/* Profile avatar & dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/10 transition"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none ring-2 ring-white/40"
                style={{ backgroundColor: '#1d4ed8', color: 'white' }}
              >
                {initials}
              </div>
              {/* Name + role – hidden on small screens */}
              {user && (
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-white text-sm font-medium">{user.fullName}</span>
                  <span className="text-blue-200 text-xs capitalize">{user.role?.toLowerCase()}</span>
                </div>
              )}
              {/* Chevron */}
              <svg
                className={`text-white/70 transition-transform ${showProfile ? 'rotate-180' : ''}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40">
                {/* User info block */}
                <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-blue-100 flex-shrink-0"
                    style={{ backgroundColor: '#2563EB', color: 'white' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    <span
                      className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                    >
                      {user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
                {/* Logout action */}
                <button
                  onClick={() => { setShowProfile(false); setShowConfirm(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Standalone logout button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loggingOut}
            className="hidden sm:flex min-h-[36px] items-center gap-1.5 px-3 rounded-lg text-white text-sm font-medium border border-white/30 hover:bg-white/10 transition disabled:opacity-60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {loggingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white"
          style={{ backgroundColor: '#10B981' }}
        >
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome{user ? `, ${firstName}` : ' to MediGo'}!
        </h2>
        <p className="text-gray-500 max-w-md">
          You are successfully logged in. This dashboard will be expanded in
          Phase 2 with appointment booking and patient management features.
        </p>
      </main>

      {/* ── Success toast ── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          </span>
          <span>Signed in successfully{user ? ` as ${user.fullName}` : ''}!</span>
          <button
            onClick={() => setToast(false)}
            className="ml-1 text-white/50 hover:text-white transition"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Logout confirmation modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">🚪</div>
              <h2 className="text-lg font-semibold text-gray-800">Log out of MediGo?</h2>
              <p className="text-sm text-gray-500">Your session will be terminated and you will need to sign in again.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loggingOut}
                className="flex-1 min-h-[42px] rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 min-h-[42px] rounded-xl text-white text-sm font-semibold transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {loggingOut
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing out…
                    </span>
                  : 'Yes, log out'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

