import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, Activity, Calendar,
  ChevronDown, ChevronUp, FileText, User
} from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

const STATUS_META = {
  PENDING_DOCTOR_APPROVAL: { label: 'Pending Approval', cls: 'badge-pending',   color: '#FCD34D' },
  CONFIRMED:               { label: 'Confirmed',        cls: 'badge-confirmed', color: '#2EC4B6' },
  COMPLETED:               { label: 'Completed',        cls: 'badge-completed', color: '#86EFAC' },
  CANCELLED:               { label: 'Cancelled',        cls: 'badge-cancelled', color: '#8892A4' },
  REJECTED:                { label: 'Rejected',         cls: 'badge-rejected',  color: '#FCA5A5' },
};

function fmtDt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const TABS = [
  { key: 'pending',   label: 'Pending',    filter: 'PENDING_DOCTOR_APPROVAL' },
  { key: 'confirmed', label: 'Confirmed',  filter: 'CONFIRMED' },
  { key: 'history',   label: 'History',     filter: null }, // completed, cancelled, rejected
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
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);
        const list = apptRes.data?.data ?? apptRes.data;
        setAppointments(Array.isArray(list) ? list : []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      await appointmentApi.updateStatus(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { alert('Failed to update appointment status.'); }
    finally { setUpdating(null); }
  }

  // Filtered appointments based on active tab
  const displayed = (() => {
    if (activeTab === 'pending') return appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL');
    if (activeTab === 'confirmed') return appointments.filter(a => a.status === 'CONFIRMED');
    // History: completed, cancelled, rejected
    return appointments.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(a.status));
  })();

  // Sort by date descending
  const sorted = [...displayed].sort((a, b) => {
    const ta = a.appointmentAt ? new Date(a.appointmentAt).getTime() : 0;
    const tb = b.appointmentAt ? new Date(b.appointmentAt).getTime() : 0;
    return tb - ta;
  });

  // Tab counts
  const pendingCount = appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const historyCount = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(a.status)).length;

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>Appointments</h1>
          <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>
            Manage and review patient appointment requests
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
          style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => {
            const count = tab.key === 'pending' ? pendingCount : tab.key === 'confirmed' ? confirmedCount : historyCount;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: active ? 'rgba(46,196,182,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(46,196,182,0.2)' : '1px solid transparent',
                  color: active ? '#5EEAD4' : 'rgba(136,146,164,0.6)',
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                }}>
                {tab.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: active ? 'rgba(46,196,182,0.15)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#2EC4B6' : 'rgba(136,146,164,0.4)',
                }}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.15)',
            }}>
              <Activity size={22} style={{ color: 'rgba(46,196,182,0.5)' }} />
            </div>
            <p style={{ fontWeight: 600, color: '#F7F8FA', marginBottom: 4 }}>
              No {activeTab === 'history' ? 'past' : activeTab} appointments
            </p>
            <p style={{ fontSize: 14, color: '#8892A4' }}>
              {activeTab === 'pending' ? 'No appointment requests waiting for your review' :
               activeTab === 'confirmed' ? 'No confirmed appointments at the moment' :
               'No appointment history yet'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map((appt, i) => {
              const meta = STATUS_META[appt.status] || { label: appt.status, cls: 'badge-cancelled', color: '#8892A4' };
              const isExpanded = expandedId === appt.id;

              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card" style={{ padding: 0, overflow: 'hidden' }}>

                  {/* Main row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Patient avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 13, fontWeight: 700,
                      background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)', color: '#9B8CFF',
                    }}>
                      {appt.patientName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>{appt.patientName}</p>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        {appt.appointmentType && (
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#9B8CFF' }}>{appt.appointmentType}</span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} style={{ color: 'rgba(136,146,164,0.4)' }} />
                          <span style={{ fontSize: 12, color: '#8892A4' }}>{fmtDt(appt.appointmentAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {appt.status === 'PENDING_DOCTOR_APPROVAL' && (
                        <>
                          <button onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'CONFIRMED'); }}
                            disabled={updating === appt.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                              borderRadius: 10, fontSize: 12, fontWeight: 600,
                              background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.2)',
                              color: '#5EEAD4', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                            }}>
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'REJECTED'); }}
                            disabled={updating === appt.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                              borderRadius: 10, fontSize: 12, fontWeight: 600,
                              background: 'rgba(255,117,89,0.08)', border: '1px solid rgba(255,117,89,0.2)',
                              color: '#FCA5A5', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                            }}>
                            <XCircle size={13} /> Decline
                          </button>
                        </>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'COMPLETED'); }}
                          disabled={updating === appt.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                            borderRadius: 10, fontSize: 12, fontWeight: 600,
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                            color: '#86EFAC', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                          }}>
                          <CheckCircle size={13} /> Mark Complete
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} style={{ color: 'rgba(136,146,164,0.4)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(136,146,164,0.4)' }} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
                          paddingTop: 16,
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', marginBottom: 6 }}>PATIENT</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <User size={14} style={{ color: '#9B8CFF' }} />
                                <span style={{ fontSize: 13, color: '#F7F8FA', fontWeight: 500 }}>{appt.patientName || '—'}</span>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', marginBottom: 6 }}>APPOINTMENT TYPE</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={14} style={{ color: '#2EC4B6' }} />
                                <span style={{ fontSize: 13, color: '#F7F8FA', fontWeight: 500 }}>{appt.appointmentType || '—'}</span>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', marginBottom: 6 }}>SCHEDULED DATE</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calendar size={14} style={{ color: '#FCD34D' }} />
                                <span style={{ fontSize: 13, color: '#F7F8FA', fontWeight: 500 }}>{fmtDate(appt.appointmentAt)}</span>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', marginBottom: 6 }}>STATUS</p>
                              <span className={`badge ${meta.cls}`} style={{ fontSize: 12 }}>{meta.label}</span>
                            </div>
                          </div>
                          {appt.notes && (
                            <div style={{ marginTop: 16 }}>
                              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(136,146,164,0.5)', letterSpacing: '0.05em', marginBottom: 6 }}>NOTES</p>
                              <p style={{
                                fontSize: 13, color: 'rgba(136,146,164,0.7)', margin: 0,
                                padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                fontStyle: 'italic', lineHeight: 1.5,
                              }}>
                                "{appt.notes}"
                              </p>
                            </div>
                          )}
                          {appt.createdAt && (
                            <p style={{ fontSize: 11, color: 'rgba(136,146,164,0.35)', marginTop: 12, margin: '12px 0 0' }}>
                              Requested on {fmtDate(appt.createdAt)}
                            </p>
                          )}
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
