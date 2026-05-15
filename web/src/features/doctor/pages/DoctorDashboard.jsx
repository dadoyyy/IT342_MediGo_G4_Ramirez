import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Users, CheckCircle, Clock, XCircle, TrendingUp, CalendarCheck, Activity, Stethoscope } from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

const cardItem = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

/* ── Chart helpers (vanilla Canvas) ─────────────────────────────────────── */
function drawLineChart(canvas, data, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
  if (!data.length) return;
  const maxVal = Math.max(...data.map(d => d.value), 5);
  const padX = 40, padY = 20, padBottom = 30;
  const chartW = w - padX - 20; const chartH = h - padY - padBottom;
  const gridLines = 4;
  
  for (let i = 0; i <= gridLines; i++) {
    const y = padY + (chartH / gridLines) * i;
    ctx.strokeStyle = 'rgba(43,45,66,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - 20, y); ctx.stroke();
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.fillStyle = '#8D99AE'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(val, padX - 10, y);
  }
  
  ctx.fillStyle = '#8D99AE'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  data.forEach((d, i) => { const x = padX + (chartW / Math.max(data.length - 1, 1)) * i; ctx.fillText(d.label, x, h - 20); });
  
  const points = data.map((d, i) => ({ x: padX + (chartW / Math.max(data.length - 1, 1)) * i, y: padY + chartH - (d.value / maxVal) * chartH }));
  const gradient = ctx.createLinearGradient(0, padY, 0, padY + chartH);
  gradient.addColorStop(0, color + '30'); gradient.addColorStop(1, color + '00');
  
  ctx.beginPath(); ctx.moveTo(points[0].x, padY + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padY + chartH); ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();
  
  ctx.beginPath(); points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
  
  points.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.stroke();
  });
}

function drawBarChart(canvas, data, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
  if (!data.length) return;
  const maxVal = Math.max(...data.map(d => d.value), 5);
  const padX = 40, padY = 20, padBottom = 30;
  const chartW = w - padX - 20; const chartH = h - padY - padBottom;
  const barWidth = Math.min(40, (chartW / data.length) * 0.5);
  const gap = chartW / data.length;
  
  for (let i = 0; i <= 4; i++) {
    const y = padY + (chartH / 4) * i;
    ctx.strokeStyle = 'rgba(43,45,66,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - 20, y); ctx.stroke();
    const val = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillStyle = '#8D99AE'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(val, padX - 10, y);
  }
  
  data.forEach((d, i) => {
    const x = padX + gap * i + (gap - barWidth) / 2;
    const barH = (d.value / maxVal) * chartH; const y = padY + chartH - barH;
    const radius = Math.min(8, barWidth / 2);
    ctx.beginPath(); ctx.moveTo(x, padY + chartH); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, padY + chartH); ctx.closePath();
    
    const gr = ctx.createLinearGradient(0, y, 0, padY + chartH);
    gr.addColorStop(0, color); gr.addColorStop(1, color + '90');
    ctx.fillStyle = gr; ctx.fill();
    
    ctx.fillStyle = '#8D99AE'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(d.label, x + barWidth / 2, h - 20);
  });
}

function getLast7Days() { const d = []; for (let i = 6; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); d.push(x); } return d; }
function getLast6Months() { const m = []; for (let i = 5; i >= 0; i--) { const x = new Date(); x.setMonth(x.getMonth() - i); m.push(x); } return m; }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isSameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, apptRes] = await Promise.all([authApi.me(), appointmentApi.listMine()]);
        const u = meRes.data?.data ?? meRes.data; setUser(u); authSession.setUser(u);
        const list = apptRes.data?.data ?? apptRes.data; setAppointments(Array.isArray(list) ? list : []);
      } catch { navigate('/login', { replace: true }); }
      finally { setLoading(false); }
    }
    load();
  }, [navigate]);

  const drawCharts = useCallback(() => {
    if (!appointments.length) return;
    if (lineChartRef.current) {
      const last7 = getLast7Days();
      const lineData = last7.map(day => ({ label: day.toLocaleDateString('en-US', { weekday: 'short' }), value: appointments.filter(a => { const dt = a.appointmentAt || a.createdAt; return dt && isSameDay(new Date(dt), day); }).length }));
      drawLineChart(lineChartRef.current, lineData, '#EF233C');
    }
    if (barChartRef.current) {
      const last6 = getLast6Months();
      const barData = last6.map(month => ({ label: month.toLocaleDateString('en-US', { month: 'short' }), value: appointments.filter(a => { const dt = a.appointmentAt || a.createdAt; return dt && isSameMonth(new Date(dt), month); }).length }));
      drawBarChart(barChartRef.current, barData, '#2B2D42');
    }
  }, [appointments]);

  useEffect(() => { drawCharts(); window.addEventListener('resize', drawCharts); return () => window.removeEventListener('resize', drawCharts); }, [drawCharts]);

  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length;
  const pending = appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length;
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
  const attendanceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const patientMap = {};
  appointments.forEach(a => { if (a.patientName && !patientMap[a.patientName]) { patientMap[a.patientName] = { name: a.patientName, lastVisit: a.appointmentAt || a.createdAt, status: a.status }; } });
  const recentPatients = Object.values(patientMap).sort((a, b) => (b.lastVisit ? new Date(b.lastVisit).getTime() : 0) - (a.lastVisit ? new Date(a.lastVisit).getTime() : 0)).slice(0, 8);

  const statCards = [
    { label: 'Total Appts', value: total, icon: CalendarCheck, color: '#2B2D42', bg: 'rgba(43,45,66,0.08)', gradient: 'linear-gradient(135deg, rgba(43,45,66,0.1), rgba(43,45,66,0.2))' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: '#16A34A', bg: 'rgba(34,197,94,0.08)', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.2))' },
    { label: 'Pending', value: pending, icon: Clock, color: '#D97706', bg: 'rgba(245,158,11,0.08)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.2))' },
    { label: 'Confirmed', value: confirmed, icon: TrendingUp, color: '#EF233C', bg: 'rgba(239,35,60,0.08)', gradient: 'linear-gradient(135deg, rgba(239,35,60,0.1), rgba(217,4,41,0.2))' },
    { label: 'Cancelled', value: cancelled, icon: XCircle, color: '#8D99AE', bg: 'rgba(141,153,174,0.08)', gradient: 'linear-gradient(135deg, rgba(141,153,174,0.1), rgba(141,153,174,0.2))' },
    { label: 'Attendance', value: `${attendanceRate}%`, icon: Activity, color: '#0284C7', bg: 'rgba(2,132,199,0.08)', gradient: 'linear-gradient(135deg, rgba(2,132,199,0.1), rgba(3,105,161,0.2))' },
  ];

  return (
    <AppShell user={user}>
      <div style={{ padding: '32px 40px 60px', maxWidth: 1400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
             <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.15)', borderTopColor: '#EF233C' }} />
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(43,45,66,0.08)', border: '1px solid rgba(43,45,66,0.15)', marginBottom: 12 }}>
                  <Stethoscope size={14} style={{ color: '#2B2D42' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2B2D42', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider Portal</span>
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Dr. {user?.fullName?.split(' ')[0] || ''}'s Overview
                </h1>
                <p style={{ fontSize: 15, color: '#6B7280', margin: 0, fontWeight: 500 }}>Track your appointments, patient engagement, and practice performance.</p>
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
              {statCards.map((s, i) => (
                <motion.div key={s.label} variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.05 * i }}
                  className="card" style={{ padding: '24px', borderRadius: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.gradient }}>
                      <s.icon size={22} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#2B2D42', margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, fontWeight: 600 }}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
              <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.3 }}
                className="card" style={{ padding: '28px', borderRadius: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <TrendingUp size={20} style={{ color: '#EF233C' }} />
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: '0 0 2px' }}>Weekly Appointments</h2>
                    <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Last 7 days of activity</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: 260, position: 'relative' }}>
                  {appointments.length > 0 ? <canvas ref={lineChartRef} style={{ width: '100%', height: '100%', display: 'block' }} /> : <p style={{ textAlign: 'center', color: '#8D99AE', paddingTop: 100 }}>No data to display</p>}
                </div>
              </motion.div>

              <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.4 }}
                className="card" style={{ padding: '28px', borderRadius: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <BarChart3 size={20} style={{ color: '#2B2D42' }} />
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: '0 0 2px' }}>Monthly Performance</h2>
                    <p style={{ fontSize: 13, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Past 6 months overview</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: 260, position: 'relative' }}>
                  {appointments.length > 0 ? <canvas ref={barChartRef} style={{ width: '100%', height: '100%', display: 'block' }} /> : <p style={{ textAlign: 'center', color: '#8D99AE', paddingTop: 100 }}>No data to display</p>}
                </div>
              </motion.div>
            </div>

            <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.5 }}
              className="card" style={{ padding: '28px', borderRadius: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={20} style={{ color: '#EF233C' }} />
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Recent Patients</h2>
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(43,45,66,0.06)', borderRadius: 99 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2B2D42' }}>{Object.keys(patientMap).length} Unique</span>
                </div>
              </div>
              
              {recentPatients.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', background: 'rgba(237,242,244,0.5)', borderRadius: 16 }}>
                  <p style={{ fontSize: 14, color: '#8D99AE', fontWeight: 500, margin: 0 }}>No patient data recorded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {recentPatients.map((p, i) => (
                    <motion.div key={p.name + i} whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(43,45,66,0.06)' }}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(43,45,66,0.08)', cursor: 'default', transition: 'all 0.2s' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(239,35,60,0.08), rgba(217,4,41,0.12))', fontSize: 14, fontWeight: 800, color: '#EF233C', flexShrink: 0 }}>
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Last: {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
