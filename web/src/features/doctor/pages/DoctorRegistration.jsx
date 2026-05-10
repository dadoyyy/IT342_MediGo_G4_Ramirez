import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import axios from 'axios';

const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Neurology', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Surgery', 'Urology', 'Other',
];

function validate(form) {
  const errors = {};
  if (!form.specialty) errors.specialty = 'Please select a specialty.';
  if (!form.licenseNumber.trim()) errors.licenseNumber = 'License number is required.';
  if (!form.hospital.trim()) errors.hospital = 'Hospital / clinic name is required.';
  return errors;
}

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    specialty: '',
    licenseNumber: '',
    hospital: '',
    bio: '',
    yearsOfExperience: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!authSession.getToken()) {
      navigate('/login', { replace: true });
      return;
    }
    // Pre-fill if profile already exists
    doctorApi.getMyProfile()
      .then((res) => {
        const p = res.data;
        setForm({
          specialty: p.specialty || '',
          licenseNumber: p.licenseNumber || '',
          hospital: p.hospital || '',
          bio: p.bio || '',
          yearsOfExperience: p.yearsOfExperience != null ? String(p.yearsOfExperience) : '',
        });
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
        specialty: form.specialty,
        licenseNumber: form.licenseNumber.trim(),
        hospital: form.hospital.trim(),
        bio: form.bio.trim() || undefined,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      });
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data.message || 'Submission failed. Please try again.');
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
              Complete your professional profile. Our team will review and verify your credentials.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠</span><span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Specialty <span className="text-red-500">*</span></label>
              <select
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                  fieldErrors.specialty ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                }`}
              >
                <option value="">Select a specialty…</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {fieldErrors.specialty && <p className="text-xs text-red-500">{fieldErrors.specialty}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">License Number <span className="text-red-500">*</span></label>
              <input
                name="licenseNumber"
                type="text"
                value={form.licenseNumber}
                onChange={handleChange}
                placeholder="e.g. PRC-12345"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                  fieldErrors.licenseNumber ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                }`}
              />
              {fieldErrors.licenseNumber && <p className="text-xs text-red-500">{fieldErrors.licenseNumber}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Hospital / Clinic <span className="text-red-500">*</span></label>
              <input
                name="hospital"
                type="text"
                value={form.hospital}
                onChange={handleChange}
                placeholder="e.g. St. Luke's Medical Center"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 transition-all ${
                  fieldErrors.hospital ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-rose-100 focus:border-rose-400'
                }`}
              />
              {fieldErrors.hospital && <p className="text-xs text-red-500">{fieldErrors.hospital}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Years of Experience <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                name="yearsOfExperience"
                type="number"
                min="0"
                max="60"
                value={form.yearsOfExperience}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Brief professional background, areas of expertise…"
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all resize-none"
              />
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
              ) : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
