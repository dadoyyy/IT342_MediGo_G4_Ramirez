import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, Filter, FileText, User, X, 
  ShieldCheck, Clock, ArrowRight, AlertTriangle
} from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AdminSpecializationRequests() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectModal, setRejectModal] = useState(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      try {
        const res = await adminApi.getSpecializationChangeRequests(statusFilter === 'ALL' ? undefined : statusFilter);
        const list = res.data?.data ?? res.data;
        setRequests(Array.isArray(list) ? list : []);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [statusFilter]);

  async function handleApprove(id) {
    setProcessing(id);
    try {
      await adminApi.approveSpecializationChange(id, note.trim() || null);
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'APPROVED', adminNote: note.trim() || r.adminNote } : r)));
      setNote('');
    } finally {
      setProcessing(null);
    }
  }

  function openReject(id) {
    setRejectModal(id);
    setNote('');
  }

  async function submitReject() {
    if (!rejectModal) return;
    setProcessing(rejectModal);
    try {
      await adminApi.rejectSpecializationChange(rejectModal, note.trim() || null);
      setRequests(prev => prev.map(r => (r.id === rejectModal ? { ...r, status: 'REJECTED', adminNote: note.trim() || r.adminNote } : r)));
      setRejectModal(null);
      setNote('');
    } finally {
      setProcessing(null);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return { bg: 'rgba(217,119,6,0.06)', text: '#D97706', border: 'rgba(217,119,6,0.15)' };
      case 'APPROVED': return { bg: 'rgba(34,197,94,0.06)', text: '#16A34A', border: 'rgba(34,197,94,0.15)' };
      case 'REJECTED': return { bg: 'rgba(239,35,60,0.06)', text: '#EF233C', border: 'rgba(239,35,60,0.15)' };
      default: return { bg: 'rgba(141,153,174,0.08)', text: '#8D99AE', border: 'rgba(141,153,174,0.2)' };
    }
  };

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.1)', marginBottom: 12 }}>
              <ShieldCheck size={14} color="#EF233C" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#EF233C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Command Center</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>
              Specialization Portal
            </h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: '4px 0 0' }}>Review and approve clinical specialization updates for registered physicians.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Filter size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8D99AE', pointerEvents: 'none' }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} 
                className="mg-input" style={{ paddingLeft: 38, width: 180, fontWeight: 600 }}>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt} REQUESTS</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
          </div>
        ) : requests.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="card" style={{ padding: '64px 32px', textAlign: 'center', background: '#FFFFFF' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={32} style={{ color: '#16A34A' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px' }}>Queue is Clean!</h2>
            <p style={{ fontSize: 15, color: '#8D99AE', margin: 0 }}>No pending specialization requests for the selected filter.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
            {requests.map((req, i) => {
              const statusStyle = getStatusColor(req.status);
              return (
                <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card" style={{ padding: 0, background: '#FFFFFF', overflow: 'hidden' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ width: 6, background: statusStyle.text }} />
                    
                    <div style={{ flex: 1, padding: 28 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(43,45,66,0.04)', border: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#2B2D42' }}>
                            {req.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Dr. {req.doctorName}</h3>
                            <p style={{ fontSize: 13, color: '#8D99AE', margin: '2px 0 0' }}>{req.email}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {req.status}
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFB', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid rgba(43,45,66,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Current</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <User size={14} style={{ color: '#8D99AE' }} />
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42' }}>{req.currentSpecialization || 'General Practice'}</span>
                            </div>
                          </div>
                          <ArrowRight size={16} style={{ color: '#8D99AE', marginTop: 16 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#EF233C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Requested</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <ShieldCheck size={14} style={{ color: '#EF233C' }} />
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#EF233C' }}>{req.requestedSpecialization}</span>
                            </div>
                          </div>
                        </div>
                        
                        {req.reason && (
                          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(43,45,66,0.06)' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE', marginBottom: 6 }}>Justification:</p>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>"{req.reason}"</p>
                          </div>
                        )}
                      </div>

                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => handleApprove(req.id)} disabled={processing === req.id}
                            className="mg-btn" style={{ flex: 1, background: '#16A34A', padding: '10px 0' }}>
                            {processing === req.id ? 'Approving...' : <><CheckCircle size={16} /> Approve Update</>}
                          </button>
                          <button onClick={() => openReject(req.id)} disabled={processing === req.id}
                            className="mg-btn-ghost" style={{ flex: 1, border: '1px solid rgba(239,35,60,0.15)', color: '#EF233C', padding: '10px 0' }}>
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      ) : (
                        req.adminNote && (
                          <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(43,45,66,0.03)', border: '1px solid rgba(43,45,66,0.05)' }}>
                            <Clock size={14} style={{ color: '#8D99AE', marginTop: 2 }} />
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', margin: '0 0 4px' }}>Admin Decision Note</p>
                              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{req.adminNote}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setRejectModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid rgba(255,255,255,0.4)', width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(217,4,41,0.08)', border: '1px solid rgba(217,4,41,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={24} style={{ color: '#D90429' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Reject Request</h3>
                  <p style={{ fontSize: 13, color: '#8D99AE', margin: '4px 0 0' }}>Decline specialization update.</p>
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Reason for Rejection</p>
                <textarea rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Type a brief note to the doctor explaining why this specialization update was declined..."
                  style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#F8FAFB', border: '1px solid rgba(43,45,66,0.1)', fontSize: 14, color: '#2B2D42', resize: 'none', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setRejectModal(null)} className="mg-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button onClick={submitReject} disabled={processing} className="mg-btn" style={{ flex: 1, background: '#D90429' }}>
                  {processing ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
