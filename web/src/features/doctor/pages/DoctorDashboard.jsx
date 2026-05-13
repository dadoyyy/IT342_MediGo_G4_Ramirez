import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, CheckCircle, Clock, XCircle, TrendingUp,
  CalendarCheck, Activity
} from 'lucide-react';
import { authApi, appointmentApi } from '../../../shared/api/api';
import AppShell from '../../../shared/ui/AppShell';
import { authSession } from '../../auth/authSession';

/* ── Chart helpers (vanilla Canvas) ─────────────────────────────────────── */

function drawLineChart(canvas, data, label, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (!data.length) return;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const padX = 44, padY = 24, padBottom = 40;
  const chartW = w - padX - 16;
  const chartH = h - padY - padBottom;

  // Grid lines
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padY + (chartH / gridLines) * i;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - 16, y);
    ctx.stroke();
    // Label
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.fillStyle = 'rgba(136,146,164,0.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, padX - 8, y + 3);
  }

  // X-axis labels
  ctx.fillStyle = 'rgba(136,146,164,0.4)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const x = padX + (chartW / Math.max(data.length - 1, 1)) * i;
    ctx.fillText(d.label, x, h - 10);
  });

  // Line + gradient fill
  const points = data.map((d, i) => ({
    x: padX + (chartW / Math.max(data.length - 1, 1)) * i,
    y: padY + chartH - (d.value / maxVal) * chartH,
  }));

  // Area fill
  const gradient = ctx.createLinearGradient(0, padY, 0, padY + chartH);
  gradient.addColorStop(0, color + '25');
  gradient.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(points[0].x, padY + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padY + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0B1020';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function drawBarChart(canvas, data, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (!data.length) return;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const padX = 44, padY = 16, padBottom = 40;
  const chartW = w - padX - 16;
  const chartH = h - padY - padBottom;
  const barWidth = Math.min(32, (chartW / data.length) * 0.55);
  const gap = chartW / data.length;

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y = padY + (chartH / 4) * i;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - 16, y);
    ctx.stroke();
    const val = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillStyle = 'rgba(136,146,164,0.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, padX - 8, y + 3);
  }

  data.forEach((d, i) => {
    const x = padX + gap * i + (gap - barWidth) / 2;
    const barH = (d.value / maxVal) * chartH;
    const y = padY + chartH - barH;

    // Bar with rounded top
    const radius = Math.min(6, barWidth / 2);
    ctx.beginPath();
    ctx.moveTo(x, padY + chartH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, padY + chartH);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, y, 0, padY + chartH);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '60');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(136,146,164,0.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, h - 10);
  });
}

/* ── Date helpers ───────────────────────────────────────────────────────── */

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }
  return months;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/* ── Component ──────────────────────────────────────────────────────────── */

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
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);
        const list = apptRes.data?.data ?? apptRes.data;
        setAppointments(Array.isArray(list) ? list : []);
      } catch { navigate('/login', { replace: true }); }
      finally { setLoading(false); }
    }
    load();
  }, [navigate]);

  // Draw charts when data is ready
  const drawCharts = useCallback(() => {
    if (!appointments.length) return;

    // Line chart: appointments per day (last 7 days)
    if (lineChartRef.current) {
      const last7 = getLast7Days();
      const lineData = last7.map(day => {
        const count = appointments.filter(a => {
          const dt = a.appointmentAt || a.createdAt;
          return dt && isSameDay(new Date(dt), day);
        }).length;
        return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), value: count };
      });
      drawLineChart(lineChartRef.current, lineData, '#2EC4B6');
    }

    // Bar chart: appointments per month (last 6 months)
    if (barChartRef.current) {
      const last6 = getLast6Months();
      const barData = last6.map(month => {
        const count = appointments.filter(a => {
          const dt = a.appointmentAt || a.createdAt;
          return dt && isSameMonth(new Date(dt), month);
        }).length;
        return { label: month.toLocaleDateString('en-US', { month: 'short' }), value: count };
      });
      drawBarChart(barChartRef.current, barData, '#9B8CFF');
    }
  }, [appointments]);

  useEffect(() => {
    drawCharts();
    window.addEventListener('resize', drawCharts);
    return () => window.removeEventListener('resize', drawCharts);
  }, [drawCharts]);

  // Stats
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length;
  const pending = appointments.filter(a => a.status === 'PENDING_DOCTOR_APPROVAL').length;
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
  const rejected = appointments.filter(a => a.status === 'REJECTED').length;
  const attendanceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Unique patients
  const patientMap = {};
  appointments.forEach(a => {
    if (a.patientName && !patientMap[a.patientName]) {
      patientMap[a.patientName] = { name: a.patientName, lastVisit: a.appointmentAt || a.createdAt, status: a.status };
    }
  });
  const recentPatients = Object.values(patientMap).sort((a, b) => {
    const ta = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
    const tb = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
    return tb - ta;
  }).slice(0, 8);

  const statCards = [
    { label: 'Total Appointments', value: total,     icon: CalendarCheck, color: '#9B8CFF', bg: 'rgba(155,140,255,0.08)', border: 'rgba(155,140,255,0.2)' },
    { label: 'Completed',          value: completed,  icon: CheckCircle,   color: '#86EFAC', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)' },
    { label: 'Pending',            value: pending,    icon: Clock,         color: '#FCD34D', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
    { label: 'Confirmed',          value: confirmed,  icon: TrendingUp,    color: '#2EC4B6', bg: 'rgba(46,196,182,0.08)',  border: 'rgba(46,196,182,0.2)' },
    { label: 'Cancelled',          value: cancelled,  icon: XCircle,       color: '#8892A4', bg: 'rgba(136,146,164,0.06)', border: 'rgba(136,146,164,0.15)' },
    { label: 'Attendance Rate',    value: `${attendanceRate}%`, icon: Activity, color: '#2EC4B6', bg: 'rgba(46,196,182,0.08)', border: 'rgba(46,196,182,0.2)' },
  ];

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>
            Welcome back, Dr. {user?.fullName?.split(' ')[0] || ''} — here's your performance overview
          </p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
              {statCards.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="card" style={{ padding: '20px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: s.bg, border: `1px solid ${s.border}`,
                    }}>
                      <s.icon size={17} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'rgba(136,146,164,0.6)', margin: 0 }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18, marginBottom: 28 }}>

              {/* Line chart — weekly trend */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="card" style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TrendingUp size={15} style={{ color: '#2EC4B6' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>Weekly Appointments</p>
                </div>
                <div style={{ width: '100%', height: 220, position: 'relative' }}>
                  <canvas ref={lineChartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
              </motion.div>

              {/* Bar chart — monthly performance */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card" style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BarChart3 size={15} style={{ color: '#9B8CFF' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>Monthly Performance</p>
                </div>
                <div style={{ width: '100%', height: 220, position: 'relative' }}>
                  <canvas ref={barChartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
              </motion.div>
            </div>

            {/* Recent patients */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Users size={15} style={{ color: '#9B8CFF' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#F7F8FA', margin: 0 }}>Recent Patients</p>
                <span style={{ fontSize: 11, color: 'rgba(136,146,164,0.4)', marginLeft: 'auto' }}>
                  {Object.keys(patientMap).length} unique patient{Object.keys(patientMap).length !== 1 ? 's' : ''}
                </span>
              </div>
              {recentPatients.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(136,146,164,0.5)', textAlign: 'center', padding: '24px 0' }}>
                  No patient data yet
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {recentPatients.map((p, i) => (
                    <div key={p.name + i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(155,140,255,0.1)', border: '1px solid rgba(155,140,255,0.2)',
                        fontSize: 12, fontWeight: 700, color: '#9B8CFF', flexShrink: 0,
                      }}>
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#F7F8FA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(136,146,164,0.45)', margin: '2px 0 0' }}>
                          {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </p>
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
