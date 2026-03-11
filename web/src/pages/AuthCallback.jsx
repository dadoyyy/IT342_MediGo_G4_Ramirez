import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Landing page for the OAuth2 redirect.
 * The Spring backend redirects here after Google authentication:
 *   /auth/callback?token=<jwt>          → success
 *   /auth/callback?error=<message>      → failure
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const pending = params.get('pending');
    const err     = params.get('error');

    if (token) {
      localStorage.setItem('medigo_token', token);
      navigate('/dashboard', { replace: true });
    } else if (pending) {
      // New user — redirect to role selection, keeping the pending token in the URL
      navigate(`/auth/select-role?pending=${encodeURIComponent(pending)}`, { replace: true });
    } else {
      setError(err ? decodeURIComponent(err) : 'Google sign-in failed. Please try again.');
    }
  }, [navigate]);

  if (!error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <span className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm">Completing sign-in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-800">Sign-in failed</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="mt-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
