import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';
import axios from 'axios';

/**
 * Shown to first-time Google sign-in users so they can choose PATIENT or DOCTOR.
 * Receives a short-lived pending token in the URL: /auth/select-role?pending=<token>
 */
export default function SelectRole() {
  const navigate = useNavigate();
  const [role, setRole]         = useState('');
  const [roleError, setRoleError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [pendingToken, setPendingToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('pending');
    if (!token) {
      navigate('/login', { replace: true });
    } else {
      setPendingToken(token);
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!role) { setRoleError('Please select a role to continue.'); return; }
    setRoleError('');
    setApiError('');
    setLoading(true);
    try {
      const res = await authApi.completeOAuth2(pendingToken, role);
      localStorage.setItem('medigo_token', res.data.data?.token);
      navigate('/dashboard', { replace: true, state: { justLoggedIn: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data.error?.message ?? 'Something went wrong. Please try again.');
      } else {
        setApiError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563EB 50%, #7C3AED 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10" style={{ background: 'white' }} />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-xl">⚕</span>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">MediGo</span>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <h2 className="text-white text-4xl font-bold leading-tight">
              Almost there!
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Just one more step — let us know how you'll be using MediGo.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[['🧑‍💼', 'Patients can book appointments & manage health'],
              ['👨‍⚕️', 'Doctors can manage schedules & patient records']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm">{icon}</div>
                <span className="text-blue-100 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-blue-200 text-xs">© 2026 MediGo. All rights reserved.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
              <span className="text-white text-sm">⚕</span>
            </div>
            <span className="text-xl font-bold" style={{ color: '#2563EB' }}>MediGo</span>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Who are you?</h1>
            <p className="text-gray-500 text-sm">
              Select your role to complete your MediGo account setup.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Role picker */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">I am a…</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'PATIENT', icon: '🧑‍💼', label: 'Patient',
                    desc: 'Book appointments & manage health records' },
                  { value: 'DOCTOR',  icon: '👨‍⚕️', label: 'Doctor',
                    desc: 'Manage your schedule & patient consultations' },
                ].map(({ value, icon, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRole(value); setRoleError(''); }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-center cursor-pointer transition-all ${
                      role === value
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-3xl">{icon}</span>
                    <span className={`text-sm font-semibold ${role === value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    <span className={`text-xs leading-relaxed ${role === value ? 'text-blue-500' : 'text-gray-400'}`}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
              {roleError && (
                <p className="text-xs text-red-500 flex items-center gap-1 pt-1">
                  <span>⚠</span>{roleError}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !role}
              className="w-full min-h-[46px] rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Setting up your account…
                </span>
              ) : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
