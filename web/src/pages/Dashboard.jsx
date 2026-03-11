import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

/**
 * Placeholder dashboard shown after a successful login.
 * Replace with real Phase 2+ features.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Proceed regardless — token is cleared client-side
    } finally {
      localStorage.removeItem('medigo_token');
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top navigation bar */}
      <header
        className="h-16 flex items-center justify-between px-8 shadow-sm"
        style={{ backgroundColor: '#2563EB' }}
      >
        <span className="text-white text-xl font-bold tracking-tight">MediGo</span>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loggingOut}
          className="min-h-[44px] px-4 rounded-[8px] text-white text-sm font-medium border border-white/40 hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loggingOut ? 'Signing out…' : 'Log out'}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white"
          style={{ backgroundColor: '#10B981' }}
        >
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome to MediGo!</h2>
        <p className="text-gray-500 max-w-md">
          You are successfully logged in. This dashboard will be expanded in
          Phase 2 with appointment booking and patient management features.
        </p>
      </main>

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
