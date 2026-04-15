import { Link } from 'react-router-dom';

const RED = '#7C2327';

export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-[#f7f3f3] flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl" style={{ backgroundColor: RED }}>
          ⏳
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Account Under Review</h1>
        <p className="text-sm text-slate-600 mt-2">
          Your account is currently under review by an Administrator. While pending approval,
          your doctor profile remains locked and unavailable for booking.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: RED }}>
            Back to Login
          </Link>
          <Link to="/doctor/register" className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 bg-white hover:bg-slate-50">
            Edit Registration
          </Link>
        </div>
      </div>
    </div>
  );
}
