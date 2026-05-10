import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, Building2, MapPin, ArrowRight, User,
  CheckCircle, Clock, XCircle, Activity, AlertCircle
} from 'lucide-react';
import { authApi, doctorApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import axios from 'axios';

/* ── Validation ─────────────────────────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.specialization.trim()) e.specialization = 'Specialization is required.';
  if (!form.clinicName.trim()) e.clinicName = 'Clinic / hospital name is required.';
  if (!form.clinicAddress.trim()) e.clinicAddress = 'Clinic address is required.';
  return e;
}

/* ── Appointment helpers ─────────────────────────────────────────────────── */
const STATUS_META = {
  PENDING_DOCTOR_APPROVAL: { label: 'Pending Approval', cls: 'badge-pending' },
  CONFIRMED:               { label: 'Confirmed',        cls: 'badge-confirmed' },
  COMPLETED:               { label: 'Completed',        cls: 'badge-completed' },
  CANCELLED:               { label: 'Cancelled',        cls: 'badge-cancelled' },
  REJECTED:                { label: 'Rejected',         cls: 'badge-rejected' },
};
function fmtDt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
const APPT_FILTERS = ['ALL', 'PENDING_DOCTOR_APPROVAL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

/* ── Component ──────────────────────────────────────────────────────────── */
export default function DoctorProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL hash or default
  const hashTab = location.hash === '#schedule' ? 'schedule' : 'profile';
  const [tab, setTab] = useState(hashTab);

  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isNewDoctor, setIsNewDoctor] = useState(false);

  // Profile form
  const [form, setForm] = useState({ specialization: '', clinicName: '', clinicAddress: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Schedule
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [apptFilter, setApptFilter] = useState('ALL');

  /* Load user + profile */
  useEffect(() => {
    async function load() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);

        const profileRes = await doctorApi.getMyProfile().catch(() => null);
        if (profileRes) {
          const p = profileRes.data?.data ?? profileRes.data;
          if (p?.specialization) {
            setForm({ specialization: p.specialization || '', clinicName: p.clinicName || '', clinicAddress: p.clinicAddress || '' });
            setIsNewDoctor(false);
          } else {
            setIsNewDoctor(true);
          }
        } else {
          setIsNewDoctor(true);
        }
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setProfileLoading(false);
      }
    }
    load();
  }, [navigate]);

  /* Load appointments when schedule tab is active */
  useEffect(() => {
    if (tab !== 'schedule') return;
    setApptLoading(true);
    appointmentApi.listMine()
      .then(r => {
        const list = r.data?.data ?? r.data;
        setAppointments(Array.isArray(list) ? list : []);
      })
      .catch(() => setAppointments([]))
      .finally(() => setApptLoading(false));
  }, [tab]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(p => ({ ...p, [name]: undefined }));
    setApiError('');
    setSaveSuccess(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setSaving(true); setApiError(''); setSaveSuccess(false);
    try {
      await doctorApi.upsertMyProfile({
        specialization: form.specialization.trim(),
        clinicName: form.clinicName.trim(),
        clinicAddress: form.clinicAddress.trim(),
      });
      setSaveSuccess(true);
      setIsNewDoctor(false);
      // Auto-switch to schedule after first save
      if (isNewDoctor) {
        setTimeout(() => setTab('schedule'), 1200);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data?.error;
        setApiError(errData?.message || err.response.data?.message || 'Failed to save profile.');
      } else {
        setApiError('Unable to connect. Please try again.');
      }
    } finally { setSaving(false); }
  }

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      await appointmentApi.updateStatus(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { alert('Failed to update.'); }
    finally { setUpdating(null); }
  }

  const displayedAppts = apptFilter === 'ALL'
    ? appointments
    : appointments.filter(a => a.status === apptFilter);

  const apptStats = [
    { label: 'Total',     value: appointments.length,                                                    color: '#9B8CFF' },
    { label: 'Pending',   value: appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length, color: '#FCD34D' },
    { label: 'Confirmed', value: appointments.filter(a => a.status === 'CONFIRMED').length,               color: '#2EC4B6' },
    { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,               color: '#86EFAC' },
  ];

  if (profileLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
    </div>
  );

  return (
    <AppShell user={user}>
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          {isNewDoctor && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 20, background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.2)' }}>
              <AlertCircle size={18} style={{ color: '#2EC4B6', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2EC4B6', margin: '0 0 2px' }}>Complete your profile to get started</p>
                <p style={{ fontSize: 13, color: 'rgba(136,146,164,0.75)', margin: 0 }}>
                  Fill in your specialization and clinic details so patients can find and book appointments with you.
                </p>
              </div>
            </div>
          )}

          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: 0 }}>
            {isNewDoctor ? 'Set Up Your Profile' : 'Doctor Dashboard'}
          </h1>
          <p style={{ fontSize: 14, color: '#8892A4', marginTop: 4 }}>
            {isNewDoctor ? 'Tell patients about yourself and your practice' : `Welcome back, Dr. ${user?.fullName?.split(' ')[0] || ''}`}
          </p>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          style={{ display: 'flex', gap: 4, marginBottom: 28, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
          {[
            { id: 'profile',  label: 'My Profile',  icon: User },
            { id: 'schedule', label: 'My Schedule',  icon: Activity, disabled: isNewDoctor },
          ].map(({ id, label, icon: Icon, disabled }) => (
            <button key={id}
              onClick={() => !disabled && setTab(id)}
              disabled={disabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', border: 'none',
                ...(tab === id
                  ? { background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#fff', boxShadow: '0 2px 12px rgba(46,196,182,0.3)' }
                  : { background: 'transparent', color: disabled ? 'rgba(136,146,164,0.3)' : 'rgba(136,146,164,0.7)' }
                ),
              }}>
              <Icon size={14} />
              {label}
              {disabled && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(136,146,164,0.15)', color: 'rgba(136,146,164,0.5)' }}>Save profile first</span>}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <motion.div key="profile"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}>

              <div className="card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, rgba(46,196,182,0.15), rgba(155,140,255,0.15))', color: '#2EC4B6', border: '1px solid rgba(46,196,182,0.2)', flexShrink: 0 }}>
                    {user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#F7F8FA', margin: '0 0 2px' }}>Dr. {user?.fullName}</p>
                    <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>{user?.email}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {apiError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', fontSize: 13, color: '#FCA5A5' }}>
                      <span>⚠</span><span>{apiError}</span>
                    </motion.div>
                  )}
                  {saveSuccess && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '12px 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.2)', fontSize: 13, color: '#5EEAD4' }}>
                      <CheckCircle size={15} />
                      <span>Profile saved successfully{isNewDoctor ? '' : ''}!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { name: 'specialization', label: 'SPECIALIZATION', Icon: Stethoscope, ph: 'e.g. Cardiology, General Practice, Pediatrics', textarea: false },
                    { name: 'clinicName',     label: 'CLINIC / HOSPITAL NAME', Icon: Building2, ph: "e.g. St. Luke's Medical Center", textarea: false },
                    { name: 'clinicAddress',  label: 'CLINIC ADDRESS', Icon: MapPin, ph: 'Full address of your clinic or hospital', textarea: true },
                  ].map(({ name, label, Icon, ph, textarea }) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.75)', letterSpacing: '0.05em' }}>
                        {label} <span style={{ color: '#FCA5A5' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Icon size={15} style={{ position: 'absolute', left: 16, top: textarea ? 14 : '50%', transform: textarea ? 'none' : 'translateY(-50%)', color: 'rgba(136,146,164,0.35)' }} />
                        {textarea ? (
                          <textarea name={name} value={form[name]} onChange={handleChange} placeholder={ph} rows={3}
                            className={`mg-input ${fieldErrors[name] ? 'error' : ''}`}
                            style={{ paddingLeft: 44, resize: 'none', lineHeight: 1.5 }} />
                        ) : (
                          <input name={name} type="text" value={form[name]} onChange={handleChange} placeholder={ph}
                            className={`mg-input ${fieldErrors[name] ? 'error' : ''}`}
                            style={{ paddingLeft: 44 }} />
                        )}
                      </div>
                      {fieldErrors[name] && <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>{fieldErrors[name]}</p>}
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                    <button type="submit" disabled={saving} className="mg-btn" style={{ flex: 1, padding: 14 }}>
                      {saving
                        ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Saving…</>
                        : <>{isNewDoctor ? 'Save & Continue' : 'Save Changes'} <ArrowRight size={15} /></>}
                    </button>
                    {!isNewDoctor && (
                      <button type="button" onClick={() => setTab('schedule')} className="mg-btn-ghost" style={{ padding: '14px 20px' }}>
                        View Schedule
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {tab === 'schedule' && (
            <motion.div key="schedule"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {apptStats.map(s => (
                  <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                    <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.6)', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {APPT_FILTERS.map(f => (
                  <button key={f} onClick={() => setApptFilter(f)}
                    style={apptFilter === f
                      ? { padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(46,196,182,0.25)', transition: 'all 0.2s' }
                      : { padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(136,146,164,0.75)', cursor: 'pointer', transition: 'all 0.2s' }
                    }>
                    {f === 'ALL' ? 'All' : STATUS_META[f]?.label}
                  </button>
                ))}
              </div>

              {apptLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
                </div>
              ) : displayedAppts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)' }}>
                    <Activity size={22} style={{ color: 'rgba(46,196,182,0.5)' }} />
                  </div>
                  <p style={{ fontWeight: 600, color: '#F7F8FA', margin: '0 0 4px' }}>No appointments here</p>
                  <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>Appointments will appear once patients book with you</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {displayedAppts.map((appt, i) => {
                    const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled' };
                    return (
                      <motion.div key={appt.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF' }}>
                              {appt.patientName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ marginBottom: 6 }}>
                                <span className={`badge ${meta.cls}`}>{meta.label}</span>
                              </div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{appt.patientName}</p>
                              {appt.appointmentType && (
                                <p style={{ fontSize: 12, fontWeight: 500, color: '#9B8CFF', margin: '2px 0 0' }}>{appt.appointmentType}</p>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                <Clock size={11} style={{ color: 'rgba(136,146,164,0.4)' }} />
                                <span style={{ fontSize: 12, color: '#8892A4' }}>{fmtDt(appt.appointmentAt)}</span>
                              </div>
                              {appt.notes && (
                                <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.45)', marginTop: 8, fontStyle: 'italic' }}>"{appt.notes}"</p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                              <>
                                <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} disabled={updating === appt.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)', color: '#5EEAD4', cursor: 'pointer', transition: 'all 0.2s' }}>
                                  <CheckCircle size={12} /> Confirm
                                </button>
                                <button onClick={() => updateStatus(appt.id, 'REJECTED')} disabled={updating === appt.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)', color: '#FCA5A5', cursor: 'pointer', transition: 'all 0.2s' }}>
                                  <XCircle size={12} /> Reject
                                </button>
                              </>
                            )}
                            {appt.status === 'CONFIRMED' && (
                              <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86EFAC', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <CheckCircle size={12} /> Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppShell>
  );
}
