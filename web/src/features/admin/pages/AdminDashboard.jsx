import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Stethoscope, Clock, TrendingUp, Activity, ChevronRight } from 'lucide-react';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';

const cardItem = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

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
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const logicalWidth = Math.max(rect.width, 1000);
      const logicalHeight = 340;

      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const padding = { top: 30, right: 30, bottom: 40, left: 50 };

      // Group by month
      const monthlyCounts = {};
      const now = new Date();
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('default', { month: 'short' }) + " '" + d.getFullYear().toString().slice(2);
        monthlyCounts[label] = 0;
      }

      allUsers.forEach(u => {
        if (!u.createdAt) return;
        const d = new Date(u.createdAt);
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diffMonths >= 0 && diffMonths <= 5) {
          const label = d.toLocaleString('default', { month: 'short' }) + " '" + d.getFullYear().toString().slice(2);
          if (monthlyCounts[label] !== undefined) {
            monthlyCounts[label]++;
          }
        }
      });

      const labels = Object.keys(monthlyCounts);
      const data = Object.values(monthlyCounts);
      const maxVal = Math.max(...data, 10); 

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Draw grid & Y axis
      ctx.strokeStyle = 'rgba(43,45,66,0.06)';
      ctx.fillStyle = '#8D99AE';
      ctx.font = '600 12px Inter, sans-serif';
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

        ctx.fillText(val.toString(), padding.left - 12, y);
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

        ctx.fillText(label, x, logicalHeight - padding.bottom + 12);
      });

      ctx.strokeStyle = '#EF233C';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw points and fill
      const grad = ctx.createLinearGradient(0, padding.top, 0, logicalHeight - padding.bottom);
      grad.addColorStop(0, 'rgba(239,35,60,0.2)');
      grad.addColorStop(1, 'rgba(239,35,60,0.01)');
      
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
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#D90429';
        ctx.stroke();
      });

      chartDataRef.current = { points, width: logicalWidth };
    };

    draw();

    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(draw));
    resizeObserver.observe(wrapper);

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const { points } = chartDataRef.current;
      let hovered = null;
      for (const p of points) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          hovered = p;
          break;
        }
      }
      setHoveredPoint(hovered);
    }
    
    function handleMouseLeave() { setHoveredPoint(null); }

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
      <div style={{ padding: '32px 40px 60px', maxWidth: 1400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
             <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.15)', borderTopColor: '#EF233C' }} />
          </div>
        ) : (
          <>
            {/* ── Dashboard Header ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.08)', border: '1px solid rgba(239,35,60,0.15)', marginBottom: 12 }}>
                  <TrendingUp size={14} style={{ color: '#EF233C' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#D90429', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise Analytics</span>
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Platform Overview
                </h1>
                <p style={{ fontSize: 15, color: '#6B7280', margin: 0, fontWeight: 500 }}>Monitor system health, user acquisition, and pending actions.</p>
              </div>
            </motion.div>

            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
              <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.1 }}
                className="card" style={{ padding: '32px', borderRadius: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(141,153,174,0.1), rgba(141,153,174,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={24} style={{ color: '#2B2D42' }} />
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(141,153,174,0.1)', fontSize: 12, fontWeight: 600, color: '#2B2D42' }}>Total</div>
                </div>
                <p style={{ fontSize: 40, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', lineHeight: 1 }}>{analytics.totalDoctors}</p>
                <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Registered Providers</p>
              </motion.div>

              <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.2 }}
                className="card" style={{ padding: '32px', borderRadius: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(239,35,60,0.1), rgba(217,4,41,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} style={{ color: '#EF233C' }} />
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.08)', fontSize: 12, fontWeight: 600, color: '#EF233C' }}>Total</div>
                </div>
                <p style={{ fontSize: 40, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', lineHeight: 1 }}>{analytics.totalPatients}</p>
                <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Registered Patients</p>
              </motion.div>

              <motion.div variants={cardItem} initial="initial" animate="animate" transition={{ delay: 0.3 }}
                className="card" style={{ padding: '32px', borderRadius: 24, border: analytics.pendingVerifications > 0 ? '1px solid rgba(245,158,11,0.4)' : undefined, boxShadow: analytics.pendingVerifications > 0 ? '0 8px 32px rgba(245,158,11,0.1)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={24} style={{ color: '#D97706' }} />
                  </div>
                  {analytics.pendingVerifications > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>
                      Action Required
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 40, fontWeight: 800, color: '#2B2D42', margin: '0 0 8px', lineHeight: 1 }}>{analytics.pendingVerifications}</p>
                <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Pending Verifications</p>
              </motion.div>
            </div>

            {/* ── Chart ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="card" style={{ padding: '32px', borderRadius: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2B2D42', margin: '0 0 6px', letterSpacing: '-0.01em' }}>User Growth</h2>
                  <p style={{ fontSize: 14, color: '#8D99AE', margin: 0, fontWeight: 500 }}>Monthly registrations across all roles</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(237,242,244,0.6)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#2B2D42' }}>
                  Last 6 Months <ChevronRight size={14} style={{ color: '#8D99AE' }} />
                </div>
              </div>
              <div className="chart-scrollbar" style={{ width: '100%', overflowX: 'auto', paddingBottom: 16 }}>
                <div style={{ position: 'relative', minWidth: 1000, paddingRight: 40 }}>
                  <canvas ref={canvasRef} style={{ display: 'block', cursor: hoveredPoint ? 'pointer' : 'default', width: '100%' }} />
                  
                  <AnimatePresence>
                    {hoveredPoint && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute',
                          left: hoveredPoint.x,
                          top: hoveredPoint.y - 56,
                          transform: hoveredPoint.x > (chartDataRef.current.width - 150) ? 'translateX(-100%)' : hoveredPoint.x < 150 ? 'translateX(0)' : 'translateX(-50%)',
                          marginLeft: hoveredPoint.x > (chartDataRef.current.width - 150) ? -16 : hoveredPoint.x < 150 ? 16 : 0,
                          background: '#2B2D42',
                          padding: '10px 16px',
                          borderRadius: 12,
                          pointerEvents: 'none',
                          color: '#EDF2F4',
                          fontSize: 14,
                          fontWeight: 600,
                          boxShadow: '0 12px 32px rgba(43,45,66,0.3)',
                          whiteSpace: 'nowrap',
                          zIndex: 20
                        }}
                      >
                        <span style={{ color: '#8D99AE', fontWeight: 500, marginRight: 8 }}>{hoveredPoint.label}</span>
                        {hoveredPoint.value} Users
                        {/* Little triangle pointer */}
                        <div style={{ position: 'absolute', bottom: -6, left: hoveredPoint.x > (chartDataRef.current.width - 150) ? 'calc(100% - 24px)' : hoveredPoint.x < 150 ? '24px' : '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #2B2D42' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
