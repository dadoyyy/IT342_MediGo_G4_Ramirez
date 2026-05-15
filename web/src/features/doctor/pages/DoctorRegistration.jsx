import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Building2, MapPin, ArrowRight } from 'lucide-react';
import { doctorApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import SpecializationSelect from '../../../shared/ui/SpecializationSelect';
import axios from 'axios';

import { useToast } from '../../../shared/ui/ToastProvider';

function validate(form, addToast) {
  const e = {};
  if (!form.specialization || form.specialization.length === 0) {
    e.specialization = 'At least one specialization is required.';
    addToast(e.specialization, 'error');
  }
  if (!form.clinicName.trim()) {
    e.clinicName = 'Clinic / hospital name is required.';
    addToast(e.clinicName, 'error');
  }
  if (!form.clinicAddress.trim()) {
    e.clinicAddress = 'Clinic address is required.';
    addToast(e.clinicAddress, 'error');
  }
  return e;
}

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ specialization: [], clinicName: '', clinicAddress: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authSession.getToken()) { navigate('/login', { replace: true }); return; }
    doctorApi.getMyProfile()
      .then(res => {
        const p = res.data?.data ?? res.data;
        if (p) setForm({
          specialization: p.specialization ? p.specialization.split(',').map(s => s.trim()).filter(Boolean) : [],
          clinicName: p.clinicName || '',
          clinicAddress: p.clinicAddress || '',
        });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form, addToast);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      await doctorApi.upsertMyProfile({ specialization: form.specialization.join(', '), clinicName: form.clinicName.trim(), clinicAddress: form.clinicAddress.trim() });
      addToast('Practice profile saved successfully!', 'success');
      navigate('/doctor/profile', { replace: true });
    } catch (err) {
      const msg = (axios.isAxiosError(err) && err.response?.data)
        ? (err.response.data?.error?.message || err.response.data?.message || 'Submission failed.')
        : 'Unable to connect. Please try again.';
      addToast(msg, 'error');
    } finally { setLoading(false); }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDF2F4' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px', background: '#EDF2F4', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob-1 absolute rounded-full" style={{ width: 400, height: 400, top: -100, right: -100, background: 'radial-gradient(circle, rgba(239,35,60,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 0 18px rgba(239,35,60,0.3)' }}>
            <Stethoscope size={17} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2D42', lineHeight: 1.2 }}>MediGo</p>
            <p style={{ fontSize: 9, color: '#8D99AE', letterSpacing: '0.07em' }}>HEALTHCARE</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ borderRadius: 24, padding: 32, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(43,45,66,0.08)', backdropFilter: 'blur(16px)' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', marginBottom: 8 }}>Set up your practice</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Complete your professional profile to start accepting patient appointments.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.04em' }}>
                SPECIALIZATION(S) <span style={{ color: '#D90429' }}>*</span>
              </label>
              <SpecializationSelect
                value={form.specialization}
                onChange={(val) => { setForm(p => ({ ...p, specialization: val })); setFieldErrors(p => ({ ...p, specialization: undefined })); }}
                error={!!fieldErrors.specialization}
                placeholder="Select your specializations"
              />
              {fieldErrors.specialization && <p style={{ fontSize: 12, color: '#D90429' }}>{fieldErrors.specialization}</p>}
            </div>

            {[
              { name: 'clinicName', label: 'CLINIC / HOSPITAL NAME', Icon: Building2, ph: "e.g. St. Luke's Medical Center", textarea: false },
              { name: 'clinicAddress', label: 'CLINIC ADDRESS', Icon: MapPin, ph: 'Full address of your clinic', textarea: true },
            ].map(({ name, label, Icon, ph, textarea }) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8D99AE', letterSpacing: '0.04em' }}>
                  {label} <span style={{ color: '#D90429' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Icon size={15} style={{ position: 'absolute', left: 16, top: textarea ? 14 : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: '#8D99AE' }} />
                  {textarea ? (
                    <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={3}
                      className={`mg-input ${fieldErrors[name] ? 'error' : ''}`} style={{ paddingLeft: 44, resize: 'none', lineHeight: 1.5 }} />
                  ) : (
                    <input name={name} type="text" value={form[name]} onChange={handleChange} placeholder={ph}
                      className={`mg-input ${fieldErrors[name] ? 'error' : ''}`} style={{ paddingLeft: 44 }} />
                  )}
                </div>
                {fieldErrors[name] && <p style={{ fontSize: 12, color: '#D90429' }}>{fieldErrors[name]}</p>}
              </div>
            ))}

            <button type="submit" disabled={loading} className="mg-btn w-full" style={{ padding: 15, marginTop: 4 }}>
              {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Submitting…</> : <>Save Profile <ArrowRight size={15} /></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
