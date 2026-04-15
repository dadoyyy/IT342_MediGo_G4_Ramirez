import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authApi } from '../api/api';
import { authResponseAdapter } from '../patterns/adapter/authResponseAdapter';

const RED = '#7C2327';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyError(err, fallback) {
  if (axios.isAxiosError(err)) {
    return authResponseAdapter.extractApiErrorMessage(err, fallback);
  }
  return fallback;
}

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    specialization: '',
    clinic: '',
    licenseNumber: '',
  });
  const [prcFileName, setPrcFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.firstname.trim() || !form.lastname.trim() || !form.specialization.trim() || !form.clinic.trim()) {
      setMessage('Please complete all required doctor profile fields.');
      return;
    }
    if (!EMAIL_RE.test(form.email)) {
      setMessage('Please enter a valid email.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (!form.licenseNumber.trim()) {
      setMessage('PRC license number is required.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await authApi.register({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'DOCTOR',
        licenseNumber: form.licenseNumber.trim(),
      });

      setMessage('Doctor account submitted successfully. Redirecting to pending approval screen...');
      setTimeout(() => navigate('/pending-approval'), 1200);
    } catch (err) {
      setMessage(friendlyError(err, 'Doctor registration failed.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f3f3] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-800">Doctor Registration</h1>
        <p className="text-sm text-slate-500 mt-1">Complete your professional details and verification upload.</p>

        <form onSubmit={onSubmit} className="mt-5 grid md:grid-cols-2 gap-3">
          <input name="firstname" value={form.firstname} onChange={onChange} placeholder="First Name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input name="lastname" value={form.lastname} onChange={onChange} placeholder="Last Name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input name="specialization" value={form.specialization} onChange={onChange} placeholder="Specialization" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input name="clinic" value={form.clinic} onChange={onChange} placeholder="Clinic" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input name="licenseNumber" value={form.licenseNumber} onChange={onChange} placeholder="PRC License Number" className="md:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />

          <div className="md:col-span-2 border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">PRC ID Image Upload</p>
            <p className="text-xs text-slate-500 mt-1">Upload zone UI is ready; backend file endpoint can be wired next.</p>
            <label className="inline-block mt-3 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ backgroundColor: RED }}>
              Choose File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPrcFileName(e.target.files?.[0]?.name || '')}
              />
            </label>
            {prcFileName && <p className="text-xs text-slate-600 mt-2">Selected: {prcFileName}</p>}
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: RED }}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        {message && <p className="mt-3 text-sm" style={{ color: message.includes('successfully') ? '#065f46' : '#b91c1c' }}>{message}</p>}
      </div>
    </div>
  );
}
