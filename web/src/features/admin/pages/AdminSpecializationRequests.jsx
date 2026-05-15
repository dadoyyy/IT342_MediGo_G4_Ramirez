import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Filter, FileText, User, X } from 'lucide-react';
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
      } catch {
        // ignore
      }
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

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
            <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>Review and approve updates to doctor specializations.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: '#8D99AE' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mg-input" style={{ padding: '8px 12px', width: 160 }}>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : requests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#2B2D42', fontWeight: 600, margin: '0 0 8px' }}>No requests</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>There are no specialization change requests to review.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {requests.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF233C', fontWeight: 700 }}>
                    {req.doctorName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#2B2D42', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {req.doctorName}</p>
                    <p style={{ fontSize: 12, color: '#8D99AE', margin: 0 }}>{req.email}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(141,153,174,0.08)', color: '#6B7280', border: '1px solid rgba(141,153,174,0.2)' }}>
                    {req.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <User size={14} style={{ color: '#8D99AE' }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#2B2D42' }}>
                      <strong>From:</strong> {req.currentSpecialization || 'Not specified'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={14} style={{ color: '#8D99AE' }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#2B2D42' }}>
                      <strong>To:</strong> {req.requestedSpecialization || 'Not specified'}
                    </p>
                  </div>
                  {req.reason && (
                    <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                      <strong>Reason:</strong> {req.reason}
                    </p>
                  )}
                </div>

                {req.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      disabled={processing === req.id}
                      className="mg-btn"
                      style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}>
                      {processing === req.id ? 'Approving…' : <><CheckCircle size={14} />Approve</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => openReject(req.id)}
                      disabled={processing === req.id}
                      className="mg-btn-ghost"
                      style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}>
                      <XCircle size={14} />Reject
                    </button>
                  </div>
                )}

                {req.adminNote && (
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
                    <strong>Admin note:</strong> {req.adminNote}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setRejectModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(43,45,66,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid rgba(43,45,66,0.08)', width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 64px rgba(43,45,66,0.15)' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(43,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2B2D42' }}>Reject request</p>
                <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8D99AE', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8D99AE' }}>ADMIN NOTE (OPTIONAL)</label>
                <textarea
                  rows={3}
                  className="mg-input"
                  style={{ resize: 'none', lineHeight: 1.5 }}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a brief reason for rejection"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setRejectModal(null)} className="mg-btn-ghost" style={{ padding: '8px 12px' }}>Cancel</button>
                  <button type="button" onClick={submitReject} disabled={processing === rejectModal} className="mg-btn" style={{ padding: '8px 12px' }}>
                    {processing === rejectModal ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
