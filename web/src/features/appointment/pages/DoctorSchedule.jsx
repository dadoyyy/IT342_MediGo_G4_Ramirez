import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Save, CheckCircle, Plus, Trash2, Calendar } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const LS_KEY = 'medigo_doctor_schedule';

function getDefaultSchedule() {
  return DAYS.map((day) => ({
    day,
    enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
    slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  }));
}

function loadSchedule() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultSchedule();
}

function saveScheduleToStorage(schedule) {
  localStorage.setItem(LS_KEY, JSON.stringify(schedule));
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12}:${m} ${ampm}`;
}

export default function DoctorSchedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState(loadSchedule);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);
      } catch { navigate('/login', { replace: true }); }
      finally { setLoading(false); }
    }
    load();
  }, [navigate]);

  function toggleDay(dayIdx) {
    setSchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, enabled: !d.enabled } : d
    ));
    setSaveSuccess(false);
  }

  function updateSlot(dayIdx, slotIdx, field, value) {
    setSchedule(prev => prev.map((d, i) =>
      i === dayIdx ? {
        ...d,
        slots: d.slots.map((s, si) => si === slotIdx ? { ...s, [field]: value } : s),
      } : d
    ));
    setSaveSuccess(false);
  }

  function addSlot(dayIdx) {
    setSchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, slots: [...d.slots, { start: '09:00', end: '17:00' }] } : d
    ));
    setSaveSuccess(false);
  }

  function removeSlot(dayIdx, slotIdx) {
    setSchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, slots: d.slots.filter((_, si) => si !== slotIdx) } : d
    ));
    setSaveSuccess(false);
  }

  function handleSave() {
    setSaving(true);
    // Simulate saving with a small delay (persists to localStorage)
    setTimeout(() => {
      saveScheduleToStorage(schedule);
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  }

  // Total active hours
  const totalHours = schedule.reduce((sum, day) => {
    if (!day.enabled) return sum;
    return sum + day.slots.reduce((s, slot) => {
      const [sh, sm] = (slot.start || '0:0').split(':').map(Number);
      const [eh, em] = (slot.end || '0:0').split(':').map(Number);
      return s + Math.max(0, (eh + em / 60) - (sh + sm / 60));
    }, 0);
  }, 0);

  const activeDays = schedule.filter(d => d.enabled).length;

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : (
          <>
            {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>My Schedule</h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: 0 }}>Set your availability for patient appointments</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mg-btn" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Saving…</>
            ) : (
              <><Save size={14} /> Save Schedule</>
            )}
          </button>
        </motion.div>

        {/* Save success toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '12px 16px',
                background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.2)', fontSize: 13, color: '#EF233C',
              }}>
              <CheckCircle size={15} />
              <span>Schedule saved successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div className="card" style={{ padding: '18px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#EF233C', margin: '0 0 2px' }}>{activeDays}</p>
            <p style={{ fontSize: 12, color: '#8D99AE', margin: 0 }}>Active Days</p>
          </div>
          <div className="card" style={{ padding: '18px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8D99AE', margin: '0 0 2px' }}>{totalHours.toFixed(1)}</p>
            <p style={{ fontSize: 12, color: '#8D99AE', margin: 0 }}>Total Hours / Week</p>
          </div>
          <div className="card" style={{ padding: '18px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#D90429', margin: '0 0 2px' }}>
              {schedule.reduce((s, d) => s + (d.enabled ? d.slots.length : 0), 0)}
            </p>
            <p style={{ fontSize: 12, color: '#8D99AE', margin: 0 }}>Time Slots</p>
          </div>
        </motion.div>

        {/* Weekly calendar overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card" style={{ padding: '20px 20px 16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Calendar size={15} style={{ color: '#8D99AE' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42', margin: 0 }}>Weekly Overview</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {schedule.map((day, i) => (
              <div key={day.day} style={{
                padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                background: day.enabled ? 'rgba(239,35,60,0.04)' : 'rgba(43,45,66,0.02)',
                border: day.enabled ? '1px solid rgba(239,35,60,0.12)' : '1px solid rgba(43,45,66,0.06)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
                onClick={() => toggleDay(i)}
              >
                <p style={{
                  fontSize: 11, fontWeight: 700, margin: '0 0 6px',
                  color: day.enabled ? '#EF233C' : '#8D99AE',
                }}>{DAY_SHORT[i]}</p>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', margin: '0 auto 6px',
                  background: day.enabled ? '#EF233C' : 'rgba(141,153,174,0.15)',
                  boxShadow: day.enabled ? '0 0 8px rgba(239,35,60,0.4)' : 'none',
                  transition: 'all 0.2s',
                }} />
                <p style={{ fontSize: 10, color: day.enabled ? 'rgba(239,35,60,0.6)' : 'rgba(141,153,174,0.5)', margin: 0 }}>
                  {day.enabled ? `${day.slots.length} slot${day.slots.length !== 1 ? 's' : ''}` : 'Off'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Day-by-day schedule editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {schedule.map((day, dayIdx) => (
            <motion.div key={day.day}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + dayIdx * 0.03 }}
              className="card" style={{ padding: '18px 20px', opacity: day.enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: day.enabled ? 16 : 0 }}>
                {/* Toggle */}
                <button onClick={() => toggleDay(dayIdx)} style={{
                  width: 42, height: 24, borderRadius: 99, position: 'relative', cursor: 'pointer',
                  background: day.enabled ? 'rgba(239,35,60,0.2)' : 'rgba(141,153,174,0.15)',
                  border: 'none', transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', position: 'absolute', top: 3,
                    left: day.enabled ? 21 : 3, transition: 'all 0.2s',
                    background: day.enabled ? '#EF233C' : '#8D99AE',
                    boxShadow: day.enabled ? '0 0 8px rgba(239,35,60,0.3)' : 'none',
                  }} />
                </button>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: day.enabled ? '#2B2D42' : '#8D99AE', margin: 0 }}>
                    {day.day}
                  </p>
                  {day.enabled && day.slots.length > 0 && (
                    <p style={{ fontSize: 12, color: '#8D99AE', margin: '2px 0 0' }}>
                      {day.slots.map(s => `${formatTime(s.start)} – ${formatTime(s.end)}`).join('  •  ')}
                    </p>
                  )}
                </div>

                {day.enabled && (
                  <button onClick={() => addSlot(dayIdx)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)',
                    color: '#EF233C', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                    <Plus size={12} /> Add Slot
                  </button>
                )}
              </div>

              {/* Time slots */}
              {day.enabled && day.slots.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {day.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 10, background: 'rgba(43,45,66,0.02)',
                      border: '1px solid rgba(43,45,66,0.06)',
                    }}>
                      <Clock size={14} style={{ color: 'rgba(239,35,60,0.4)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 11, color: '#8D99AE', fontWeight: 600 }}>FROM</label>
                        <input type="time" value={slot.start}
                          onChange={e => updateSlot(dayIdx, slotIdx, 'start', e.target.value)}
                          className="mg-input"
                          style={{ width: 130, padding: '8px 12px', fontSize: 13 }}
                        />
                        <label style={{ fontSize: 11, color: '#8D99AE', fontWeight: 600 }}>TO</label>
                        <input type="time" value={slot.end}
                          onChange={e => updateSlot(dayIdx, slotIdx, 'end', e.target.value)}
                          className="mg-input"
                          style={{ width: 130, padding: '8px 12px', fontSize: 13 }}
                        />
                      </div>
                      {day.slots.length > 1 && (
                        <button onClick={() => removeSlot(dayIdx, slotIdx)} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: 8,
                          background: 'rgba(217,4,41,0.06)', border: '1px solid rgba(217,4,41,0.15)',
                          color: '#D90429', cursor: 'pointer', transition: 'all 0.2s',
                          flexShrink: 0,
                        }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {day.enabled && day.slots.length === 0 && (
                <p style={{ fontSize: 12, color: '#8D99AE', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                  No time slots — click "Add Slot" to set your availability
                </p>
              )}
            </motion.div>
          ))}
        </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
