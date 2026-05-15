import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, Clock, TrendingUp } from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totalDoctors: 0, totalPatients: 0, pendingVerifications: 0 });
  
  // For the chart
  const [allUsers, setAllUsers] = useState([]);
  const canvasRef = useRef(null);
  const chartDataRef = useRef({ points: [] });
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u);
        authSession.setUser(u);

        const [analyticsRes, docsRes, patsRes] = await Promise.all([
          adminApi.getAnalytics(),
          adminApi.getAllDoctors(),
          adminApi.getAllPatients(),
        ]);

        setAnalytics(analyticsRes.data?.data || analyticsRes.data);
        
        const docs = docsRes.data?.data || docsRes.data || [];
        const pats = patsRes.data?.data || patsRes.data || [];
        setAllUsers([...docs, ...pats]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Draw chart
  useEffect(() => {
    if (loading || !canvasRef.current || allUsers.length === 0) return;

    const canvas = canvasRef.current;
    const wrapper = canvas.parentElement;

    const draw = () => {
      // Setup high-DPI canvas
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Minimum width to ensure it always scrolls nicely
      const logicalWidth = Math.max(rect.width, 1000);
      const logicalHeight = 300;

      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const padding = { top: 20, right: 20, bottom: 30, left: 40 };

      // Group by month
      const monthlyCounts = {};
      const now = new Date();
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('default', { month: 'short' });
        monthlyCounts[label] = 0;
      }

      allUsers.forEach(u => {
        if (!u.createdAt) return;
        const d = new Date(u.createdAt);
        // Only count if within last 6 months
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diffMonths >= 0 && diffMonths <= 5) {
          const label = d.toLocaleString('default', { month: 'short' });
          if (monthlyCounts[label] !== undefined) {
            monthlyCounts[label]++;
          }
        }
      });

      const labels = Object.keys(monthlyCounts);
      const data = Object.values(monthlyCounts);
      const maxVal = Math.max(...data, 10); // at least 10 for Y axis scale

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Draw grid & Y axis
      ctx.strokeStyle = 'rgba(43,45,66,0.08)';
      ctx.fillStyle = '#8D99AE';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const ySteps = 4;
      for (let i = 0; i <= ySteps; i++) {
        const val = Math.round(maxVal * (i / ySteps));
        const y = logicalHeight - padding.bottom - (i / ySteps) * (logicalHeight - padding.top - padding.bottom);
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(logicalWidth - padding.right, y);
        ctx.stroke();

        ctx.fillText(val.toString(), padding.left - 8, y);
      }

      // Draw X axis & Line
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xStep = (logicalWidth - padding.left - padding.right) / (labels.length - 1 || 1);

      ctx.beginPath();
      labels.forEach((label, i) => {
        const x = padding.left + i * xStep;
        const y = logicalHeight - padding.bottom - (data[i] / maxVal) * (logicalHeight - padding.top - padding.bottom);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        ctx.fillText(label, x, logicalHeight - padding.bottom + 8);
      });

      ctx.strokeStyle = '#EF233C';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw points and fill
      const grad = ctx.createLinearGradient(0, padding.top, 0, logicalHeight - padding.bottom);
      grad.addColorStop(0, 'rgba(239,35,60,0.15)');
      grad.addColorStop(1, 'rgba(239,35,60,0)');
      
      ctx.lineTo(logicalWidth - padding.right, logicalHeight - padding.bottom);
      ctx.lineTo(padding.left, logicalHeight - padding.bottom);
      ctx.fillStyle = grad;
      ctx.fill();

      const points = [];
      labels.forEach((label, i) => {
        const x = padding.left + i * xStep;
        const y = logicalHeight - padding.bottom - (data[i] / maxVal) * (logicalHeight - padding.top - padding.bottom);
        points.push({ x, y, label, value: data[i] });

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#EF233C';
        ctx.stroke();
      });

      chartDataRef.current = { points, width: logicalWidth };
    };

    draw();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });
    resizeObserver.observe(wrapper);

    // Mouse events for tooltip
    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const { points } = chartDataRef.current;
      let hovered = null;
      for (const p of points) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          hovered = p;
          break;
        }
      }
      setHoveredPoint(hovered);
    }
    
    function handleMouseLeave() {
      setHoveredPoint(null);
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [loading, allUsers]);

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.2)', borderTopColor: '#EF233C' }} />
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
              <p style={{ fontSize: 13, color: '#8D99AE', margin: 0 }}>Here's what's happening across the platform today</p>
            </motion.div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(141,153,174,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={20} style={{ color: '#8D99AE' }} />
                  </div>
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>{analytics.totalDoctors}</p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Registered Doctors</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,35,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} style={{ color: '#EF233C' }} />
                  </div>
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>{analytics.totalPatients}</p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Registered Patients</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="card" style={{ padding: 24, border: analytics.pendingVerifications > 0 ? '1px solid rgba(245,158,11,0.25)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} style={{ color: '#D97706' }} />
                  </div>
                  {analytics.pendingVerifications > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.08)', color: '#D97706' }}>
                      Action Needed
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#2B2D42', margin: '0 0 4px' }}>{analytics.pendingVerifications}</p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Pending Verifications</p>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#2B2D42', margin: '0 0 4px' }}>User Registrations</h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Last 6 months activity</p>
              </div>
              <div className="chart-scrollbar" style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{ position: 'relative', minWidth: 1000, paddingRight: 32 }}>
                  <canvas ref={canvasRef} style={{ display: 'block', cursor: hoveredPoint ? 'pointer' : 'default' }} />
                  
                  {hoveredPoint && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        left: hoveredPoint.x,
                        top: hoveredPoint.y - 45,
                        transform: hoveredPoint.x > (chartDataRef.current.width - 150) ? 'translateX(-100%)' : hoveredPoint.x < 150 ? 'translateX(0)' : 'translateX(-50%)',
                        marginLeft: hoveredPoint.x > (chartDataRef.current.width - 150) ? -12 : hoveredPoint.x < 150 ? 12 : 0,
                        background: '#FFFFFF',
                        border: '1px solid rgba(239,35,60,0.2)',
                        padding: '8px 12px',
                        borderRadius: 8,
                        pointerEvents: 'none',
                        color: '#2B2D42',
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(43,45,66,0.1)',
                        whiteSpace: 'nowrap',
                        zIndex: 10
                      }}
                    >
                      <span style={{ color: '#8D99AE', fontWeight: 500, marginRight: 6 }}>{hoveredPoint.label}</span>
                      {hoveredPoint.value} Registrations
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
