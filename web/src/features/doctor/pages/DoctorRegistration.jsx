import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import axios from 'axios';

function validate(form) {
  const errors = {};
  if (!form.specialization.trim()) errors.specialization = 'Specialization is required.';
  if (!form.clinicName.trim()) errors.clinicName = 'Clinic / hospital name is required.';
  if (!form.clinicAddress.trim()) errors.clinicAddress = 'Clinic address is required.';
  return errors;
}

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ specialization: '', clinicName: '', clinicAddress: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!authSession.getToken()) {
      navigate('/login', { replace: true });
      return;
    }
    // Pre-fill if profile already exists
    doctorApi.getMyProfile()
      .then((res) => {
        const p = res.data?.data ?? res.data;
        if (p) {
          setForm({
            specialization: p.specialization || '',
            clinicName: p.clinicName || '',
            clinicAddress: p.clinicAddress || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, [navigate]);

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
      await doctorApi.upsertMyProfile({
        specialization: form.specialization.trim(),
        clinicName: form.clinicName.trim(),
        clinicAddress: form.clinicAddress.trim(),
      });
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const msg = err.response.data?.error?.message
          || err.response.data?.message
          || 'Submission failed. Please try again.';
        setApiError(msg);
      } else {
        setApiError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-lg">⚕</span>
          </div>
          <span className="text-xl font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Doctor Registration</h1>
            <p className="text-gray-500 text-sm">
              Complete your professional profile to start accepting appointments.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠</span><span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                name="specialization"
                type="text"
                value={form.specialization}
                onChange={handleChange}
                placeholder="e.g. Cardiology, General Practice, Pediatrics"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                  fieldErrors.specialization ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                }`}
              />
              {fieldErrors.specialization && <p className="text-xs text-red-500">{fieldErrors.specialization}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Clinic / Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                name="clinicName"
                type="text"
                value={form.clinicName}
                onChange={handleChange}
                placeholder="e.g. St. Luke's Medical Center"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                  fieldErrors.clinicName ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                }`}
              />
              {fieldErrors.clinicName && <p className="text-xs text-red-500">{fieldErrors.clinicName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Clinic Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="clinicAddress"
                value={form.clinicAddress}
                onChange={handleChange}
                placeholder="Full address of your clinic or hospital"
                rows={3}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 transition-all resize-none ${
                  fieldErrors.clinicAddress ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                }`}
              />
              {fieldErrors.clinicAddress && <p className="text-xs text-red-500">{fieldErrors.clinicAddress}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-md shadow-rose-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: '#7C2327' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
