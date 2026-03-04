import { useNavigate } from 'react-router-dom';

/**
 * Placeholder dashboard shown after a successful login.
 * Replace with real Phase 2+ features.
 */
export default function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('medigo_token');
    navigate('/login');
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
          onClick={handleLogout}
          className="min-h-[44px] px-4 rounded-[8px] text-white text-sm font-medium border border-white/40 hover:bg-white/10 transition"
        >
          Log out
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
    </div>
  );
}
