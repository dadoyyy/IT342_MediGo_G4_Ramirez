import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/api';
import axios from 'axios';

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function validate(form) {
  const errors = {};
  if (!form.firstname.trim()) errors.firstname = 'First name is required.';
  if (!form.lastname.trim())  errors.lastname  = 'Last name is required.';
  if (!form.email.trim())     errors.email     = 'Email is required.';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!PASSWORD_RE.test(form.password)) {
    errors.password = 'Must include uppercase, lowercase, number, and special character.';
  }
  if (!form.role) errors.role = 'Please select a role.';
  if (form.role === 'DOCTOR' && !form.licenseNumber.trim())
    errors.licenseNumber = 'License number is required for doctors.';
  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', password: '', role: '', licenseNumber: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
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
      await authApi.register({
        firstname: form.firstname.trim(), lastname: form.lastname.trim(),
        email: form.email.trim(), password: form.password,
        role: form.role, licenseNumber: form.licenseNumber.trim() || undefined,
      });
      setSuccessMsg('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data.error?.message ?? 'Registration failed. Please try again.');
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
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
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
            <h2 className="text-white text-4xl font-bold leading-tight">Join MediGo<br />today.</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Create your account and start managing your healthcare journey in minutes.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[['🏥', 'Patients & Doctors welcome'],['📋', 'Digital health records'],['💬', 'Seamless consultations']].map(([icon, text]) => (
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
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
              <span className="text-white text-sm">⚕</span>
            </div>
            <span className="text-xl font-bold" style={{ color: '#2563EB' }}>MediGo</span>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 text-sm">Fill in the details below to get started</p>
          </div>

          {/* Banners */}
          {successMsg && (
            <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              <span>✓</span><span>{successMsg}</span>
            </div>
          )}
          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠</span><span>{apiError}</span>
            </div>
          )}

          {/* Google OAuth button */}
          <button
            type="button"
            onClick={() => { window.location.href = '/oauth2/authorization/google'; }}
            className="w-full min-h-[46px] flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <InputField label="First Name" id="firstname" name="firstname"
                value={form.firstname} onChange={handleChange}
                error={fieldErrors.firstname} autoComplete="given-name" placeholder="Juan" />
              <InputField label="Last Name" id="lastname" name="lastname"
                value={form.lastname} onChange={handleChange}
                error={fieldErrors.lastname} autoComplete="family-name" placeholder="Dela Cruz" />
            </div>

            {/* Email */}
            <InputField label="Email Address" id="email" name="email" type="email"
              value={form.email} onChange={handleChange}
              error={fieldErrors.email} autoComplete="email" placeholder="juan@example.com" />

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  autoComplete="new-password" placeholder="••••••••"
                  className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm min-h-[44px] transition-all outline-none focus:ring-2 ${
                    fieldErrors.password ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                  }`}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.password
                ? <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{fieldErrors.password}</p>
                : <p className="text-xs text-gray-400">Min 8 chars · uppercase · lowercase · number · special character</p>
              }
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                I am a… <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['PATIENT', 'DOCTOR'].map((r) => (
                  <label
                    key={r}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 cursor-pointer text-sm font-medium transition-all ${
                      form.role === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="role" value={r} checked={form.role === r} onChange={handleChange} className="sr-only" />
                    <span>{r === 'PATIENT' ? '🧑‍💼' : '👨‍⚕️'}</span>
                    <span>{r === 'PATIENT' ? 'Patient' : 'Doctor'}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.role && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{fieldErrors.role}</p>}
            </div>

            {/* License number – doctors only */}
            {form.role === 'DOCTOR' && (
              <InputField label="PRC License Number" id="licenseNumber" name="licenseNumber"
                value={form.licenseNumber} onChange={handleChange}
                error={fieldErrors.licenseNumber} placeholder="e.g. PRC-2024-XXXXX" />
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full min-h-[46px] rounded-xl text-white font-semibold text-sm mt-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2563EB' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable input ─────────────────────────────────────────────────────────
function InputField({ label, id, name, value, onChange, error, type = 'text', autoComplete, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        autoComplete={autoComplete} placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] transition-all outline-none focus:ring-2 ${
          error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
        }`}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

