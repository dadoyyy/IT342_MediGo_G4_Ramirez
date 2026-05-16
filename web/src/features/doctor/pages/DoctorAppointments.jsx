import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Activity, Calendar, ChevronDown, ChevronUp, FileText, User } from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

const STATUS_META = {
  PENDING_DOCTOR_APPROVAL: { label: 'Pending Approval', color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
  CONFIRMED:               { label: 'Confirmed',        color: '#EF233C', bg: 'rgba(239,35,60,0.1)' },
  COMPLETED:               { label: 'Completed',        color: '#34A853', bg: 'rgba(52,168,83,0.1)' },
  CANCELLED:               { label: 'Cancelled',        color: '#8D99AE', bg: 'rgba(141,153,174,0.1)' },
  REJECTED:                { label: 'Rejected',         color: '#D90429', bg: 'rgba(217,4,41,0.1)' },
};

function fmtDt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const TABS = [
  { key: 'pending',   label: 'Pending',   filter: 'PENDING_DOCTOR_APPROVAL' },
  { key: 'confirmed', label: 'Confirmed', filter: 'CONFIRMED' },
  { key: 'history',   label: 'History',   filter: null },
];

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, apptRes] = await Promise.all([authApi.me(), appointmentApi.listMine()]);
        const u = meRes.data?.data ?? meRes.data; setUser(u); authSession.setUser(u);
        const list = apptRes.data?.data ?? apptRes.data; setAppointments(Array.isArray(list) ? list : []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  async function updateStatus(id, status) {
    setUpdating(id);
    try { await appointmentApi.updateStatus(id, { status }); setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a)); }
    catch { alert('Failed to update appointment status.'); }
    finally { setUpdating(null); }
  }

  const displayed = (() => {
    if (activeTab === 'pending') return appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL');
    if (activeTab === 'confirmed') return appointments.filter(a => a.status === 'CONFIRMED');
    return appointments.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(a.status));
  })();
  const sorted = [...displayed].sort((a, b) => (b.appointmentAt ? new Date(b.appointmentAt).getTime() : 0) - (a.appointmentAt ? new Date(a.appointmentAt).getTime() : 0));
  const pendingCount = appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const historyCount = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(a.status)).length;

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#2B2D42', margin: '0 0 6px', letterSpacing: '-0.04em' }}>
            Consultation Pipeline
          </h1>
          <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 600 }}>Manage and track your patient clinical journey</p>
        </motion.div>

        {/* Tabs - Glassmorphic Switch */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
          style={{ 
            display: 'flex', gap: 6, marginBottom: 32, background: '#2B2D42', 
            borderRadius: 20, padding: '6px', boxShadow: '0 15px 35px rgba(43,45,66,0.15)',
            width: 'fit-content'
          }}>
          {TABS.map(tab => {
            const count = tab.key === 'pending' ? pendingCount : tab.key === 'confirmed' ? confirmedCount : historyCount;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                style={{
                  padding: '10px 24px', borderRadius: 16, fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: active ? '#EF233C' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  border: 'none', fontFamily: 'inherit',
                  boxShadow: active ? '0 8px 20px rgba(239,35,60,0.3)' : 'none'
                }}>
                {tab.label}
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 8,
                  background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                }}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)' }}>
              <Activity size={22} style={{ color: 'rgba(239,35,60,0.4)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#2B2D42', marginBottom: 4 }}>No {activeTab === 'history' ? 'past' : activeTab} appointments</p>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              {activeTab === 'pending' ? 'No appointment requests waiting for your review' : activeTab === 'confirmed' ? 'No confirmed appointments at the moment' : 'No appointment history yet'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, color: '#8D99AE', bg: 'rgba(141,153,174,0.1)' };
              const isExpanded = expandedId === appt.id;
              return (
                <motion.div key={appt.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(43,45,66,0.05)' }}>
                  <div onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(43,45,66,0.01)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ 
                      width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      flexShrink: 0, background: 'rgba(239,35,60,0.05)', border: '1px solid rgba(239,35,60,0.1)',
                      boxShadow: '0 8px 16px rgba(239,35,60,0.04)'
                    }}>
                      <User size={22} style={{ color: '#EF233C' }} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>{appt.patientName}</p>
                        <span style={{ 
                          fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8,
                          background: meta.bg, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>{meta.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: appt.appointmentType === 'Video' ? '#EF233C' : '#4CC9F0' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#8D99AE' }}>{appt.appointmentType}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={13} style={{ color: '#8D99AE' }} />
                          <span style={{ fontSize: 13, color: '#2B2D42', fontWeight: 600 }}>{fmtDt(appt.appointmentAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'CONFIRMED'); }} disabled={updating === appt.id}
                            style={{ 
                              padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 800, 
                              background: '#EF233C', color: '#fff', border: 'none', cursor: 'pointer',
                              boxShadow: '0 10px 20px rgba(239,35,60,0.2)'
                            }}>
                            Confirm
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'REJECTED'); }} disabled={updating === appt.id}
                            style={{ 
                              padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 800, 
                              background: 'rgba(43,45,66,0.05)', color: '#2B2D42', border: '1px solid rgba(43,45,66,0.1)', cursor: 'pointer'
                            }}>
                            Decline
                          </motion.button>
                        </div>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'COMPLETED'); }} disabled={updating === appt.id}
                          style={{ 
                            padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 800, 
                            background: '#34A853', color: '#fff', border: 'none', cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(52,168,83,0.2)'
                          }}>
                          Complete
                        </motion.button>
                      )}
                      <div style={{ padding: '8px', color: '#8D99AE', transition: 'all 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '32px', borderTop: '1px solid rgba(43,45,66,0.05)', background: 'rgba(43,45,66,0.01)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 800, color: '#8D99AE', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Patient Details</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} style={{ color: '#2B2D42' }} /></div>
                                <span style={{ fontSize: 15, color: '#2B2D42', fontWeight: 800 }}>{appt.patientName || '—'}</span>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 800, color: '#8D99AE', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Consultation</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} style={{ color: '#8D99AE' }} /></div>
                                <span style={{ fontSize: 15, color: '#2B2D42', fontWeight: 800 }}>{appt.appointmentType || '—'}</span>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 800, color: '#8D99AE', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Schedule</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(43,45,66,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={16} style={{ color: '#EF233C' }} /></div>
                                <span style={{ fontSize: 15, color: '#2B2D42', fontWeight: 800 }}>{fmtDate(appt.appointmentAt)}</span>
                              </div>
                            </div>
                          </div>
                          {appt.notes && (
                            <div style={{ marginTop: 32 }}>
                              <p style={{ fontSize: 10, fontWeight: 800, color: '#8D99AE', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Clinical Notes</p>
                              <div style={{ 
                                padding: '20px 24px', borderRadius: 16, background: '#fff', border: '1px solid rgba(43,45,66,0.08)',
                                color: '#6B7280', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                              }}>
                                "{appt.notes}"
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px dashed rgba(43,45,66,0.1)' }}>
                            <p style={{ fontSize: 12, color: '#8D99AE', fontWeight: 600 }}>ID: #{appt.id.slice(-8).toUpperCase()}</p>
                            <p style={{ fontSize: 12, color: '#8D99AE', fontWeight: 600 }}>Requested: {fmtDt(appt.createdAt)}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
