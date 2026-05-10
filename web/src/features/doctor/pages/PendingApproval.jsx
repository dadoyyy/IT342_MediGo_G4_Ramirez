import { useNavigate } from 'react-router-dom';
import { authSession } from '../../auth/authSession';
import { authApi } from '../../../shared/api/api';
import { authEvents } from '../../auth/authEventBus';

export default function PendingApproval() {
  const navigate = useNavigate();

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-xl">⚕</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center text-3xl mx-auto">
            ⏳
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Verification Pending</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your doctor profile has been submitted and is currently under review by our admin team.
              You'll be notified once your account is verified.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm font-medium text-yellow-800">What happens next?</p>
            <ul className="text-xs text-yellow-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">1.</span>
                <span>Our team reviews your license and credentials.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">2.</span>
                <span>Verification typically takes 1–2 business days.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">3.</span>
                <span>Once approved, you can start accepting appointments.</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/doctor/register')}
              className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 min-h-[44px] rounded-xl text-white text-sm font-semibold transition-all"
              style={{ backgroundColor: '#7C2327' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
