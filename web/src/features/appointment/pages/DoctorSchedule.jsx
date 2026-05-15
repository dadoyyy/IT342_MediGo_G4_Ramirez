import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Calendar, Save, Trash, AlertCircle } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';
import { useToast } from '../../../shared/ui/ToastProvider';

const LS_KEY = 'medigo_doctor_slots';

export default function DoctorSchedule() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Slots: { id, date, startTime, endTime, type, status }
  const [slots, setSlots] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', type: 'In-person' });

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

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(slots));
  }, [slots]);

  function validate() {
    const e = {};
    if (!form.date) e.date = 'Select date.';
    if (!form.startTime) e.startTime = 'Select start time.';
    if (!form.endTime) e.endTime = 'Select end time.';
    return e;
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  function addSlot(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      addToast('Please fill in all fields.', 'error');
      return;
    }

    // Basic validation: end time > start time
    if (form.endTime <= form.startTime) {
      addToast('End time must be after start time.', 'error');
      return;
    }

    const newSlot = {
      id: Date.now(),
      ...form,
      status: 'Available'
    };

    setSlots(p => [...p, newSlot].sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.startTime}`);
      const dtB = new Date(`${b.date}T${b.startTime}`);
      return dtA - dtB;
    }));

    setIsModalOpen(false);
    setForm({ date: '', startTime: '', endTime: '', type: 'In-person' });
    addToast('Availability slot added.', 'success');
  }

  function removeSlot(id) {
    setSlots(p => p.filter(s => s.id !== id));
    addToast('Slot removed.', 'info');
  }

  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
    return `${hr12}:${m} ${ampm}`;
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Availability Calendar</h1>
                <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>Define specific slots for patient bookings</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="mg-btn" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={16} /> Add New Slot
              </button>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#EF233C', margin: '0 0 2px' }}>{slots.length}</p>
                <p style={{ fontSize: 12, color: '#8D99AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Slots</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#2B2D42', margin: '0 0 2px' }}>
                  {slots.filter(s => s.status === 'Available').length}
                </p>
                <p style={{ fontSize: 12, color: '#8D99AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Available</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#8D99AE', margin: '0 0 2px' }}>
                  {slots.filter(s => s.status === 'Booked').length}
                </p>
                <p style={{ fontSize: 12, color: '#8D99AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Booked</p>
              </div>
            </div>

            {/* Slots List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(43,45,66,0.06)', background: 'rgba(43,45,66,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} style={{ color: '#EF233C' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42' }}>Upcoming Availability</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: 'rgba(43,45,66,0.01)' }}>
                      <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#8D99AE', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#8D99AE', textTransform: 'uppercase' }}>Time Slot</th>
                      <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#8D99AE', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#8D99AE', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#8D99AE', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.length > 0 ? slots.map(slot => (
                      <tr key={slot.id} style={{ borderTop: '1px solid rgba(43,45,66,0.05)' }}>
                        <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 600, color: '#2B2D42' }}>
                          {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '20px 24px', fontSize: 14, color: '#2B2D42' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={14} color="#8D99AE" />
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{ 
                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                            background: slot.type === 'Video' ? 'rgba(239,35,60,0.08)' : 'rgba(43,45,66,0.05)',
                            color: slot.type === 'Video' ? '#EF233C' : '#2B2D42',
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}>
                            {slot.type}
                          </span>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: slot.status === 'Available' ? '#34A853' : '#EF233C' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: slot.status === 'Available' ? '#34A853' : '#EF233C' }}>{slot.status}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                          {slot.status === 'Available' && (
                            <button onClick={() => removeSlot(slot.id)} style={{ background: 'none', border: 'none', color: '#D90429', cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'all 0.2s' }} className="hover-bg">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '80px 24px', textAlign: 'center' }}>
                          <AlertCircle size={32} color="#8D99AE" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                          <p style={{ fontSize: 14, color: '#8D99AE', margin: 0 }}>No availability slots defined yet.</p>
                          <p style={{ fontSize: 13, color: 'rgba(141,153,174,0.6)', marginTop: 4 }}>Add slots so patients can see when you are free.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(43,45,66,0.4)', backdropFilter: 'blur(4px)' }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card" style={{ position: 'relative', width: '100%', maxWidth: 440, padding: 32, borderRadius: 24, background: '#FFF', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
              
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Add Availability</h2>
              <p style={{ fontSize: 14, color: '#8D99AE', marginBottom: 28 }}>Define a specific date and time you are available for booking.</p>

              <form onSubmit={addSlot} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</label>
                  <input type="date" name="date" value={form.date} onChange={onChange} min={today} className="mg-input" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Start Time</label>
                    <input type="time" name="startTime" value={form.startTime} onChange={onChange} className="mg-input" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', textTransform: 'uppercase', letterSpacing: '0.04em' }}>End Time</label>
                    <input type="time" name="endTime" value={form.endTime} onChange={onChange} className="mg-input" required />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</label>
                  <select name="type" value={form.type} onChange={onChange} className="mg-input">
                    <option value="In-person">In-person Visit</option>
                    <option value="Video">Video Consultation</option>
                  </select>
                </div>

                <button type="submit" className="mg-btn w-full" style={{ padding: 16, marginTop: 8, fontSize: 15 }}>
                  Add Availability Slot
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
