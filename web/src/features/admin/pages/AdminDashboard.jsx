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
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
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

    ctx.clearRect(0, 0, width, height);

    // Draw grid & Y axis
    ctx.strokeStyle = 'rgba(136,146,164,0.1)';
    ctx.fillStyle = 'rgba(136,146,164,0.6)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round(maxVal * (i / ySteps));
      const y = height - padding.bottom - (i / ySteps) * (height - padding.top - padding.bottom);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(val.toString(), padding.left - 8, y);
    }

    // Draw X axis & Line
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xStep = (width - padding.left - padding.right) / (labels.length - 1 || 1);

    ctx.beginPath();
    labels.forEach((label, i) => {
      const x = padding.left + i * xStep;
      const y = height - padding.bottom - (data[i] / maxVal) * (height - padding.top - padding.bottom);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      ctx.fillText(label, x, height - padding.bottom + 8);
    });

    ctx.strokeStyle = '#2EC4B6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw points and fill
    const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    grad.addColorStop(0, 'rgba(46,196,182,0.2)');
    grad.addColorStop(1, 'rgba(46,196,182,0)');
    
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.fillStyle = grad;
    ctx.fill();

    labels.forEach((_, i) => {
      const x = padding.left + i * xStep;
      const y = height - padding.bottom - (data[i] / maxVal) * (height - padding.top - padding.bottom);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0B1020';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2EC4B6';
      ctx.stroke();
    });

  }, [loading, allUsers]);

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(46,196,182,0.1), rgba(155,140,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(46,196,182,0.2)' }}>
                <TrendingUp size={20} style={{ color: '#2EC4B6' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>System Overview</h1>
                <p style={{ fontSize: 14, color: '#8892A4', margin: 0 }}>Analytics and platform performance metrics</p>
              </div>
            </motion.div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(155,140,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={20} style={{ color: '#9B8CFF' }} />
                  </div>
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>{analytics.totalDoctors}</p>
                <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>Registered Doctors</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(46,196,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} style={{ color: '#2EC4B6' }} />
                  </div>
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>{analytics.totalPatients}</p>
                <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>Registered Patients</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="card" style={{ padding: 24, border: analytics.pendingVerifications > 0 ? '1px solid rgba(252,211,77,0.3)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(252,211,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} style={{ color: '#FCD34D' }} />
                  </div>
                  {analytics.pendingVerifications > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: 'rgba(252,211,77,0.1)', color: '#FCD34D' }}>
                      Action Needed
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#F7F8FA', margin: '0 0 4px' }}>{analytics.pendingVerifications}</p>
                <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>Pending Verifications</p>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F7F8FA', margin: '0 0 4px' }}>User Registrations</h2>
                <p style={{ fontSize: 13, color: '#8892A4', margin: 0 }}>Last 6 months activity</p>
              </div>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <canvas ref={canvasRef} width={800} height={300} style={{ width: '100%', minWidth: 600, height: 300, display: 'block' }} />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
