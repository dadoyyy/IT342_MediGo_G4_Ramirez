import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Calendar, Save, Trash, AlertCircle, Edit2, ChevronRight, Video, User, Coffee } from 'lucide-react';
import { authApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';
import { useToast } from '../../../shared/ui/ToastProvider';

const LS_KEY = 'medigo_doctor_slots';
const RULES_KEY = 'medigo_doctor_rules';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  const [dayRules, setDayRules] = useState(() => {
    try {
      const raw = localStorage.getItem(RULES_KEY);
      return raw ? JSON.parse(raw) : Array(7).fill('In-person');
    } catch { return Array(7).fill('In-person'); }
  });

  const [weekOffset, setWeekOffset] = useState(0);
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

  function handleSave() {
    localStorage.setItem(LS_KEY, JSON.stringify(slots));
    localStorage.setItem(RULES_KEY, JSON.stringify(dayRules));
    addToast('Schedule synchronized and saved successfully.', 'success');
  }

  function validate() {
    const e = {};
    if (!form.date) e.date = 'Select date.';
    if (!form.startTime) e.startTime = 'Select start time.';
    if (!form.endTime) e.endTime = 'Select end time.';
    return e;
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => {
      const newForm = { ...p, [name]: value };
      
      // Smart Rule: Auto-set type when date changes
      if (name === 'date' && value) {
        const day = new Date(value).getDay();
        const ruleType = dayRules[day];
        if (ruleType) newForm.type = ruleType;
      }
      
      return newForm;
    });
  }

  function updateDayRule(dayIndex, type) {
    setDayRules(p => ({ ...p, [dayIndex]: type }));
    addToast(`${DAYS[dayIndex]} set to ${type} by default.`, 'success');
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
      doctorId: user?.id,
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

  function editSlot(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    if (form.endTime <= form.startTime) {
      addToast('End time must be after start time.', 'error');
      return;
    }

    setSlots(p => p.map(s => s.id === form.id ? { ...s, ...form, doctorId: user?.id } : s).sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.startTime}`);
      const dtB = new Date(`${b.date}T${b.startTime}`);
      return dtA - dtB;
    }));

    setIsModalOpen(false);
    setForm({ date: '', startTime: '', endTime: '', type: 'In-person' });
    addToast('Slot updated.', 'success');
  }

  function openEditModal(slot) {
    setForm(slot);
    setIsModalOpen(true);
  }

  function bulkGenerate() {
    const newSlots = [];
    const baseDate = new Date();
    const defaultTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const day = d.getDay();
      
      const rule = dayRules[day];
      if (rule === 'Day-off') continue;

      defaultTimes.forEach((startTime, idx) => {
        const [h, m] = startTime.split(':');
        const endTime = `${(parseInt(h) + 1).toString().padStart(2, '0')}:${m}`;
        
        // Check if slot already exists
        const exists = slots.some(s => s.date === dateStr && s.startTime === startTime);
        if (!exists) {
          newSlots.push({
            id: Date.now() + i * 100 + idx,
            doctorId: user?.id,
            date: dateStr,
            startTime,
            endTime,
            type: rule || 'In-person',
            status: 'Available'
          });
        }
      });
    }

    if (newSlots.length === 0) {
      addToast('No new slots to generate for the coming week.', 'info');
      return;
    }

    setSlots(p => [...p, ...newSlots].sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.startTime}`);
      const dtB = new Date(`${b.date}T${b.startTime}`);
      return dtA - dtB;
    }));
    addToast(`Generated ${newSlots.length} slots for the coming week.`, 'success');
  }

  function removeSlot(id) {
    setSlots(p => p.filter(s => s.id !== id));
    addToast('Slot removed.', 'info');
  }

  function clearDay(date) {
    setSlots(p => p.filter(s => s.date !== date));
    addToast(`All slots for ${new Date(date).toLocaleDateString()} removed.`, 'info');
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
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#2B2D42', margin: '0 0 6px', letterSpacing: '-0.04em' }}>
                  Weekly Availability
                </h1>
                <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 600 }}>Configure your consultation hours and manage weekly slots</p>
              </motion.div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={bulkGenerate} className="mg-btn-ghost" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} /> Bulk Generate Week
                </button>
                <button onClick={() => { setForm({ date: '', startTime: '', endTime: '', type: 'In-person' }); setIsModalOpen(true); }} className="mg-btn-ghost" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> Add New Slot
                </button>
                <button onClick={handleSave} className="mg-btn" style={{ padding: '10px 24px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #EF233C, #D90429)', boxShadow: '0 8px 20px rgba(239,35,60,0.2)' }}>
                  <Save size={16} /> Save Schedule
                </button>
              </div>
            </div>

            {/* Smart Rules Configuration - Premium floating bar */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '24px 32px', marginBottom: 40, borderRadius: 24,
                background: 'linear-gradient(135deg, #2B2D42 0%, #1A1B28 100%)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Decorative background accent */}
              <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(239,35,60,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,35,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,35,60,0.3)' }}>
                    <Save size={20} style={{ color: '#EF233C' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#EDF2F4', margin: 0, letterSpacing: '-0.02em' }}>Smart Scheduling Intelligence</h3>
                    <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, fontWeight: 500 }}>AI-powered defaults for your weekly workflow</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: '#8D99AE', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>Active Rules</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#EDF2F4', margin: 0 }}>7 Days Configured</p>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {DAYS.map((day, i) => {
                  const rule = dayRules[i];
                  const getRuleColor = () => {
                    if (rule === 'Online') return '#EF233C';
                    if (rule === 'In-person') return '#4CC9F0'; // Professional Cyan
                    return '#8D99AE'; // Day-off
                  };
                  const RuleIcon = rule === 'Online' ? Video : rule === 'In-person' ? User : Coffee;

                  return (
                    <motion.div 
                      key={day} 
                      whileHover={{ scale: 1.02 }}
                      style={{ 
                        flex: '1 1 140px', padding: '16px', borderRadius: 16, 
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</span>
                        <RuleIcon size={12} style={{ color: getRuleColor(), opacity: 0.8 }} />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <select 
                          value={rule} 
                          onChange={(e) => updateDayRule(i, e.target.value)}
                          style={{ 
                            width: '100%', fontSize: 13, fontWeight: 800, padding: '10px 14px', borderRadius: 12, 
                            border: 'none', 
                            background: rule === 'Online' ? 'rgba(239,35,60,0.15)' : rule === 'In-person' ? 'rgba(76,201,240,0.15)' : 'rgba(141,153,174,0.15)',
                            color: getRuleColor(),
                            outline: 'none', cursor: 'pointer', appearance: 'none',
                            textAlign: 'center', transition: 'all 0.3s'
                          }}
                        >
                          <option value="In-person">In-person</option>
                          <option value="Online">Online</option>
                          <option value="Day-off">Day-off</option>
                        </select>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Weekly Grid View - Premium Reference Design */}
            <div className="card" style={{ padding: '40px', borderRadius: 32, boxShadow: '0 30px 60px rgba(43,45,66,0.1)', background: '#fff' }}>
              
              {/* Navigation Arrows - Floating outside grid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <motion.button 
                    whileHover={{ x: -4, backgroundColor: 'rgba(239,35,60,0.05)' }} whileTap={{ scale: 0.9 }}
                    onClick={() => setWeekOffset(p => p - 7)}
                    style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(43,45,66,0.1)', background: '#fff', color: '#2B2D42', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ x: 4, backgroundColor: 'rgba(239,35,60,0.05)' }} whileTap={{ scale: 0.9 }}
                    onClick={() => setWeekOffset(p => p + 7)}
                    style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(43,45,66,0.1)', background: '#fff', color: '#2B2D42', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                {/* Central Month & Year Display */}
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#2B2D42', margin: 0, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
                    {(() => {
                      const today = new Date();
                      const start = new Date(today);
                      start.setDate(today.getDate() - today.getDay() + weekOffset);
                      const end = new Date(start);
                      end.setDate(start.getDate() + 6);
                      
                      const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
                      const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
                      const year = start.getFullYear();
                      
                      return startMonth === endMonth ? `${startMonth} ${year}` : `${startMonth} - ${endMonth} ${year}`;
                    })()}
                  </h2>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#8D99AE', margin: 0, opacity: 0.8 }}>Philippine Standard Time (GMT+08:00)</p>
                </div>
              </div>

              {/* Main Grid Container - Locked 7 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 32 }}>
                
                {/* 1. Day Headers Row */}
                {Array.from({ length: 7 }).map((_, i) => {
                  const today = new Date();
                  const currentDay = today.getDay(); // 0 is Sunday
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - currentDay + weekOffset);
                  
                  const d = new Date(startOfWeek);
                  d.setDate(startOfWeek.getDate() + i);
                  
                  const isRealToday = new Date().toDateString() === d.toDateString();
                  return (
                    <div key={`head-${i}`} style={{ textAlign: 'center', marginBottom: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: '0.12em' }}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: 16, margin: '0 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isRealToday ? '#EF233C' : 'rgba(43,45,66,0.02)',
                        color: isRealToday ? '#fff' : '#2B2D42',
                        boxShadow: isRealToday ? '0 12px 24px rgba(239,35,60,0.3)' : 'none',
                        fontSize: 20, fontWeight: 900,
                        border: isRealToday ? 'none' : '1px solid rgba(43,45,66,0.05)'
                      }}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}

                {/* 2. Slot Columns Row */}
                {Array.from({ length: 7 }).map((_, i) => {
                  const today = new Date();
                  const currentDay = today.getDay();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - currentDay + weekOffset);
                  
                  const d = new Date(startOfWeek);
                  d.setDate(startOfWeek.getDate() + i);
                  
                  const dateStr = d.toISOString().split('T')[0];
                  const daySlots = slots.filter(s => s.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
                  const rule = dayRules[d.getDay()];

                  return (
                    <div key={`col-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {daySlots.length > 0 ? daySlots.map(slot => {
                        const isOnline = slot.type === 'Online';
                        const themeColor = isOnline ? '#EF233C' : '#4CC9F0';
                        const bgColor = isOnline ? 'rgba(239,35,60,0.05)' : 'rgba(76,201,240,0.05)';
                        
                        return (
                          <motion.div 
                            key={slot.id}
                            whileHover={{ 
                              scale: 1.04, 
                              backgroundColor: bgColor,
                              borderColor: themeColor,
                              boxShadow: `0 10px 20px ${isOnline ? 'rgba(239,35,60,0.1)' : 'rgba(76,201,240,0.1)'}`
                            }}
                            onClick={() => openEditModal(slot)}
                            style={{ 
                              padding: '16px 10px', borderRadius: 16, border: '1px solid rgba(43,45,66,0.06)',
                              textAlign: 'center', background: '#fff', cursor: 'pointer', position: 'relative',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <p style={{ fontSize: 14, fontWeight: 800, color: themeColor, margin: 0, letterSpacing: '-0.02em' }}>
                              {formatTime(slot.startTime).toLowerCase()}
                            </p>
                            <span style={{ fontSize: 9, color: '#8D99AE', fontWeight: 800, textTransform: 'uppercase', marginTop: 4, display: 'block', letterSpacing: '0.05em' }}>
                              {isOnline ? 'Online' : 'In-person'}
                            </span>
                            
                            {/* Trash Icon - Subtle presence */}
                            <div style={{ position: 'absolute', top: 6, right: 6 }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(217,4,41,0.2)', cursor: 'pointer', padding: 4 }}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      }) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
                          <p style={{ textAlign: 'center', color: 'rgba(141,153,174,0.2)', fontWeight: 900, fontSize: 18, margin: 0 }}>—</p>
                          <p style={{ textAlign: 'center', color: 'rgba(141,153,174,0.2)', fontWeight: 900, fontSize: 18, margin: 0 }}>—</p>
                          <p style={{ textAlign: 'center', color: 'rgba(141,153,174,0.2)', fontWeight: 900, fontSize: 18, margin: 0 }}>—</p>
                        </div>
                      )}
                      
                      <motion.button 
                        whileHover={{ backgroundColor: 'rgba(239,35,60,0.03)', borderColor: 'rgba(239,35,60,0.2)' }}
                        onClick={() => { setForm({ date: dateStr, startTime: '', endTime: '', type: rule === 'Day-off' ? 'In-person' : (rule || 'In-person') }); setIsModalOpen(true); }}
                        style={{ 
                          padding: '14px', borderRadius: 16, border: '2px dashed rgba(141,153,174,0.15)', 
                          background: 'transparent', color: '#8D99AE', fontSize: 11, fontWeight: 800,
                          cursor: 'pointer', transition: 'all 0.2s', marginTop: 8, letterSpacing: '0.05em'
                        }}
                      >
                        ADD
                      </motion.button>

                      {daySlots.length > 0 && (
                        <button 
                          onClick={() => clearDay(dateStr)}
                          style={{ background: 'none', border: 'none', color: 'rgba(217,4,41,0.3)', cursor: 'pointer', padding: 8, marginTop: 4, fontSize: 10, fontWeight: 700 }}
                        >
                          CLEAR DAY
                        </button>
                      )}
                    </div>
                  );
                })}
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
              
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                {form.id ? 'Edit Availability' : 'Add Availability'}
              </h2>
              <p style={{ fontSize: 14, color: '#8D99AE', marginBottom: 28 }}>
                {form.id ? 'Modify the selected availability slot.' : 'Define a specific date and time you are available for booking.'}
              </p>

              <form onSubmit={form.id ? editSlot : addSlot} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2D42', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</label>
                  <input type="date" name="date" value={form.date} onChange={onChange} min={today} className="mg-input" required />
                  {form.date && dayRules[new Date(form.date).getDay()] === 'Day-off' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#D97706' }}>
                      <AlertCircle size={12} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Note: This is your scheduled day-off.</span>
                    </div>
                  )}
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
                    <option value="In-person">In-person</option>
                    <option value="Online">Online</option>
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
