import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Users, CheckCircle, Clock, XCircle, TrendingUp, CalendarCheck, Activity } from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

/* ── Chart helpers (vanilla Canvas) ─────────────────────────────────────── */
function drawLineChart(canvas, data, label, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
  if (!data.length) return;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const padX = 44, padY = 24, padBottom = 40;
  const chartW = w - padX - 16; const chartH = h - padY - padBottom;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padY + (chartH / gridLines) * i;
    ctx.strokeStyle = 'rgba(43,45,66,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - 16, y); ctx.stroke();
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.fillStyle = '#8D99AE'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val, padX - 8, y + 3);
  }
  ctx.fillStyle = '#8D99AE'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
  data.forEach((d, i) => { const x = padX + (chartW / Math.max(data.length - 1, 1)) * i; ctx.fillText(d.label, x, h - 10); });
  const points = data.map((d, i) => ({ x: padX + (chartW / Math.max(data.length - 1, 1)) * i, y: padY + chartH - (d.value / maxVal) * chartH }));
  const gradient = ctx.createLinearGradient(0, padY, 0, padY + chartH);
  gradient.addColorStop(0, color + '20'); gradient.addColorStop(1, color + '00');
  ctx.beginPath(); ctx.moveTo(points[0].x, padY + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padY + chartH); ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath(); points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
  points.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  });
}

function drawBarChart(canvas, data, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
  if (!data.length) return;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const padX = 44, padY = 16, padBottom = 40;
  const chartW = w - padX - 16; const chartH = h - padY - padBottom;
  const barWidth = Math.min(32, (chartW / data.length) * 0.55);
  const gap = chartW / data.length;
  for (let i = 0; i <= 4; i++) {
    const y = padY + (chartH / 4) * i;
    ctx.strokeStyle = 'rgba(43,45,66,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - 16, y); ctx.stroke();
    const val = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillStyle = '#8D99AE'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val, padX - 8, y + 3);
  }
  data.forEach((d, i) => {
    const x = padX + gap * i + (gap - barWidth) / 2;
    const barH = (d.value / maxVal) * chartH; const y = padY + chartH - barH;
    const radius = Math.min(6, barWidth / 2);
    ctx.beginPath(); ctx.moveTo(x, padY + chartH); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, padY + chartH); ctx.closePath();
    const gr = ctx.createLinearGradient(0, y, 0, padY + chartH);
    gr.addColorStop(0, color); gr.addColorStop(1, color + '60');
    ctx.fillStyle = gr; ctx.fill();
    ctx.fillStyle = '#8D99AE'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, h - 10);
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
      drawBarChart(barChartRef.current, barData, '#8D99AE');
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
    { label: 'Total Appointments', value: total, icon: CalendarCheck, color: '#2B2D42', bg: 'rgba(43,45,66,0.06)', border: 'rgba(43,45,66,0.15)' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: '#EF233C', bg: 'rgba(239,35,60,0.06)', border: 'rgba(239,35,60,0.15)' },
    { label: 'Pending', value: pending, icon: Clock, color: '#8D99AE', bg: 'rgba(141,153,174,0.06)', border: 'rgba(141,153,174,0.15)' },
    { label: 'Confirmed', value: confirmed, icon: TrendingUp, color: '#D90429', bg: 'rgba(217,4,41,0.06)', border: 'rgba(217,4,41,0.12)' },
    { label: 'Cancelled', value: cancelled, icon: XCircle, color: '#6B7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.12)' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Activity, color: '#2B2D42', bg: 'rgba(43,45,66,0.06)', border: 'rgba(43,45,66,0.15)' },
  ];

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Welcome back, Dr. {user?.fullName?.split(' ')[0] || ''} — here's your performance overview</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
              {statCards.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                  className="card" style={{ padding: '20px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, border: `1px solid ${s.border}` }}>
                      <s.icon size={17} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: '#2B2D42', margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: '#8D99AE', margin: 0 }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18, marginBottom: 28 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="card" style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TrendingUp size={15} style={{ color: '#EF233C' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42', margin: 0 }}>Weekly Appointments</p>
                </div>
                <div style={{ width: '100%', height: 220, position: 'relative' }}>
                  <canvas ref={lineChartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card" style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BarChart3 size={15} style={{ color: '#8D99AE' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42', margin: 0 }}>Monthly Performance</p>
                </div>
                <div style={{ width: '100%', height: 220, position: 'relative' }}>
                  <canvas ref={barChartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Users size={15} style={{ color: '#EF233C' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2D42', margin: 0 }}>Recent Patients</p>
                <span style={{ fontSize: 11, color: '#8D99AE', marginLeft: 'auto' }}>{Object.keys(patientMap).length} unique patient{Object.keys(patientMap).length !== 1 ? 's' : ''}</span>
              </div>
              {recentPatients.length === 0 ? (
                <p style={{ fontSize: 13, color: '#8D99AE', textAlign: 'center', padding: '24px 0' }}>No patient data yet</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {recentPatients.map((p, i) => (
                    <div key={p.name + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(43,45,66,0.02)', border: '1px solid rgba(43,45,66,0.06)', transition: 'all 0.2s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.12)', fontSize: 12, fontWeight: 700, color: '#EF233C', flexShrink: 0 }}>
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#2B2D42', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: '#8D99AE', margin: '2px 0 0' }}>{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                      </div>
                    </div>
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
