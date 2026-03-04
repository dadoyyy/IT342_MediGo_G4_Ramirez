import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/api';
import axios from 'axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]               = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setLoading(true);
    setApiError('');
    try {
      const res = await authApi.login({ email: form.email.trim(), password: form.password });
      localStorage.setItem('medigo_token', res.data.data?.token);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data.error?.message ?? 'Login failed. Please try again.');
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
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full opacity-5" style={{ background: 'white' }} />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xl">⚕</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">MediGo</span>
          </div>
        </div>

        {/* Center text */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <h2 className="text-white text-4xl font-bold leading-tight">
              Your health,<br />our priority.
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Book appointments, consult doctors, and manage your healthcare — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[['📅', 'Easy appointment booking'],['👨‍⚕️', 'Verified doctors'],['🔒', 'Secure & private']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm">{icon}</div>
                <span className="text-blue-100 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Error banner */}
          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="text-base mt-0.5">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email" name="email" type="email"
                value={form.email} onChange={handleChange}
                autoComplete="email" placeholder="you@example.com"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] transition-all outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                }`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  autoComplete="current-password" placeholder="••••••••"
                  className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm min-h-[44px] transition-all outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                      : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#2563EB' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
