import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Building2, MapPin, ArrowRight } from 'lucide-react';
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
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authSession.getToken()) { navigate('/login', { replace: true }); return; }
    doctorApi.getMyProfile()
      .then(res => {
        const p = res.data?.data ?? res.data;
        if (p) setForm({ specialization: p.specialization || '', clinicName: p.clinicName || '', clinicAddress: p.clinicAddress || '' });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setLoading(true); setApiError('');
    try {
      await doctorApi.upsertMyProfile({ specialization: form.specialization.trim(), clinicName: form.clinicName.trim(), clinicAddress: form.clinicAddress.trim() });
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setApiError(err.response.data?.error?.message || err.response.data?.message || 'Submission failed.');
      } else { setApiError('Unable to connect. Please try again.'); }
    } finally { setLoading(false); }
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1020' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: '#0B1020' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #9B8CFF, transparent)', top: '-60px', right: '-60px', filter: 'blur(70px)' }} />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 16px rgba(46,196,182,0.35)' }}>
            <Stethoscope size={18} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold" style={{ color: '#F7F8FA' }}>MediGo</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F7F8FA' }}>Doctor Profile</h1>
            <p className="text-sm" style={{ color: 'rgba(247,248,250,0.4)' }}>
              Complete your professional profile to start accepting appointments.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)', color: '#FF5C7A' }}>
              <span>⚠</span><span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>
                Specialization <span style={{ color: '#FF5C7A' }}>*</span>
              </label>
              <div className="relative">
                <Stethoscope size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(247,248,250,0.3)' }} />
                <input name="specialization" type="text" value={form.specialization} onChange={handleChange}
                  placeholder="e.g. Cardiology, General Practice, Pediatrics"
                  className={`mg-input pl-11 ${fieldErrors.specialization ? 'error' : ''}`} />
              </div>
              {fieldErrors.specialization && <p className="text-xs" style={{ color: '#FF5C7A' }}>{fieldErrors.specialization}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>
                Clinic / Hospital Name <span style={{ color: '#FF5C7A' }}>*</span>
              </label>
              <div className="relative">
                <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(247,248,250,0.3)' }} />
                <input name="clinicName" type="text" value={form.clinicName} onChange={handleChange}
                  placeholder="e.g. St. Luke's Medical Center"
                  className={`mg-input pl-11 ${fieldErrors.clinicName ? 'error' : ''}`} />
              </div>
              {fieldErrors.clinicName && <p className="text-xs" style={{ color: '#FF5C7A' }}>{fieldErrors.clinicName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'rgba(247,248,250,0.6)' }}>
                Clinic Address <span style={{ color: '#FF5C7A' }}>*</span>
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-4 top-3.5" style={{ color: 'rgba(247,248,250,0.3)' }} />
                <textarea name="clinicAddress" value={form.clinicAddress} onChange={handleChange}
                  placeholder="Full address of your clinic or hospital"
                  rows={3} className={`mg-input pl-11 resize-none ${fieldErrors.clinicAddress ? 'error' : ''}`}
                  style={{ lineHeight: '1.5' }} />
              </div>
              {fieldErrors.clinicAddress && <p className="text-xs" style={{ color: '#FF5C7A' }}>{fieldErrors.clinicAddress}</p>}
            </div>

            <button type="submit" disabled={loading} className="mg-btn-primary w-full" style={{ padding: '16px' }}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(11,16,32,0.3)', borderTopColor: '#0B1020' }} />
                  Submitting…
                </>
              ) : (
                <>Save Profile <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
