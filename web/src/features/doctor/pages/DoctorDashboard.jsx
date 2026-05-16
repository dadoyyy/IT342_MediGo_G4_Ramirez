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
    { label: 'Total Appointments', value: total, icon: CalendarCheck, color: '#EF233C' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: '#34A853' },
    { label: 'Pending', value: pending, icon: Clock, color: '#FFB800' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Activity, color: '#4CC9F0' },
  ];

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
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#2B2D42', margin: '0 0 4px', letterSpacing: '-0.04em' }}>Welcome back{user?.fullName ? `, Dr. ${user.fullName.split(' ')[0]}` : ''}</h1>
              <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 600 }}>Here's an overview of your practice and patient activity</p>
            </motion.div>

            {/* Premium Stat Command Center */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ 
                background: '#2B2D42', borderRadius: 32, padding: '32px', marginBottom: 32,
                boxShadow: '0 30px 60px rgba(43,45,66,0.2)', position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Decorative Glow */}
              <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(239,35,60,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
                {statCards.map((s, i) => (
                  <div key={s.label} style={{ borderRight: i < statCards.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingRight: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <s.icon size={16} style={{ color: s.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <h3 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{s.value}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18, marginBottom: 28 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="card" style={{ padding: '28px', borderRadius: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,35,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={16} style={{ color: '#EF233C' }} />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Practice Growth</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34A853' }}>+12.5% this week</span>
                </div>
                <div style={{ width: '100%', height: 220, position: 'relative' }}>
                  <canvas ref={lineChartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card" style={{ padding: '28px', borderRadius: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(76,201,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={16} style={{ color: '#4CC9F0' }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Monthly Performance</p>
                </div>
                <div style={{ width: '100%', height: 220, position: 'relative' }}>
                  <canvas ref={barChartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card" style={{ padding: '32px', borderRadius: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,35,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} style={{ color: '#EF233C' }} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>Recent Patient Activity</p>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(43,45,66,0.04)', color: '#8D99AE', fontSize: 12, fontWeight: 700 }}>
                  {Object.keys(patientMap).length} TOTAL
                </div>
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
