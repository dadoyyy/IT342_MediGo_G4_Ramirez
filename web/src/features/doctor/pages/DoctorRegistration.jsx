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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FC' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: '#F7F9FC' }}>
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 16px rgba(20,184,166,0.25)' }}>
            <Stethoscope size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold" style={{ color: '#1F2937' }}>MediGo</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="card rounded-3xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>Doctor Profile</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Complete your professional profile to start accepting appointments.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <span>⚠</span><span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {[
              { name: 'specialization', label: 'Specialization', icon: Stethoscope, ph: 'e.g. Cardiology, General Practice, Pediatrics', textarea: false },
              { name: 'clinicName',     label: 'Clinic / Hospital Name', icon: Building2, ph: 'e.g. St. Luke\'s Medical Center', textarea: false },
              { name: 'clinicAddress',  label: 'Clinic Address', icon: MapPin, ph: 'Full address of your clinic or hospital', textarea: true },
            ].map(({ name, label, icon: Icon, ph, textarea }) => (
              <div key={name} className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: '#374151' }}>
                  {label} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="relative">
                  <Icon size={15} className={`absolute left-4 ${textarea ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`} style={{ color: '#9CA3AF' }} />
                  {textarea ? (
                    <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={3}
                      className={`mg-input pl-11 resize-none ${fieldErrors[name] ? 'error' : ''}`} style={{ lineHeight: '1.5' }} />
                  ) : (
                    <input name={name} type="text" value={form[name]} onChange={handleChange} placeholder={ph}
                      className={`mg-input pl-11 ${fieldErrors[name] ? 'error' : ''}`} />
                  )}
                </div>
                {fieldErrors[name] && <p className="text-xs" style={{ color: '#EF4444' }}>{fieldErrors[name]}</p>}
              </div>
            ))}

            <button type="submit" disabled={loading} className="mg-btn-primary w-full" style={{ padding: '15px' }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
              ) : (<>Save Profile <ArrowRight size={15} /></>)}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
