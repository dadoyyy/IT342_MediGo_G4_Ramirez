import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Stethoscope, Users, ShieldCheck, TrendingUp, Clock, 
  FileCheck, UserPlus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { adminApi, authApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import AppShell from '../../../shared/ui/AppShell';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await authApi.me();
        const u = meRes.data?.data ?? meRes.data;
        setUser(u); authSession.setUser(u);
        
        const [docs, pats] = await Promise.all([
          adminApi.getAllDoctors(),
          adminApi.getAllPatients()
        ]);
        const dList = (docs.data?.data ?? docs.data) || [];
        const pList = (pats.data?.data ?? pats.data) || [];
        
        const doctorsWithRole = (Array.isArray(dList) ? dList : []).map(d => ({ ...d, role: 'DOCTOR' }));
        const patientsWithRole = (Array.isArray(pList) ? pList : []).map(p => ({ ...p, role: 'PATIENT' }));
        
        setAllUsers([...doctorsWithRole, ...patientsWithRole]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const getRegDate = (u) => u.createdAt || u.dateRegistered || u.registeredAt || u.joinedAt || u.registrationDate;

  const parseDate = (val) => {
    if (!val) return new Date(0);
    if (val instanceof Date) return val;
    if (Array.isArray(val)) {
      // Spring Boot style array: [year, month, day, hour, min, sec]
      return new Date(val[0], val[1] - 1, val[2] || 1, val[3] || 0, val[4] || 0);
    }
    return new Date(val);
  };

  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const docs = allUsers.filter(u => u.role === 'DOCTOR');
    const pats = allUsers.filter(u => u.role === 'PATIENT');

    const docsThisMonth = docs.filter(u => {
      const d = parseDate(getRegDate(u));
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const docsLastMonth = docs.filter(u => {
      const d = parseDate(getRegDate(u));
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    const patsThisMonth = pats.filter(u => {
      const d = parseDate(getRegDate(u));
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const patsLastMonth = pats.filter(u => {
      const d = parseDate(getRegDate(u));
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    const calcTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    };

    const verifiedDocs = docs.filter(d => d.verified).length;
    const verificationRate = docs.length > 0 ? ((verifiedDocs / docs.length) * 100).toFixed(1) : '0';

    return {
      totalDoctors: docs.length,
      totalPatients: pats.length,
      pendingVerifications: docs.filter(d => !d.verified).length,
      doctorTrend: calcTrend(docsThisMonth, docsLastMonth),
      patientTrend: calcTrend(patsThisMonth, patsLastMonth),
      verificationRate: verificationRate + '%'
    };
  }, [allUsers]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      
      const count = allUsers.filter(u => {
        const cDate = parseDate(getRegDate(u));
        return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear();
      }).length;
      
      months.push({ name: label, value: count });
    }
    return months;
  }, [allUsers]);

  const recentActivity = useMemo(() => allUsers
    .filter(u => (u.firstName || u.lastName) && u.role)
    .sort((a, b) => parseDate(getRegDate(b)).getTime() - parseDate(getRegDate(a)).getTime())
    .slice(0, 5), [allUsers]);

  if (loading && !user) {
    return (
      <AppShell user={user}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(239,35,60,0.1)', borderTopColor: '#EF233C' }} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px 28px 40px' }}>
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: 'rgba(239,35,60,0.06)', border: '1px solid rgba(239,35,60,0.1)', marginBottom: 12 }}>
              <ShieldCheck size={14} color="#EF233C" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#EF233C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Command Center</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2B2D42', margin: 0, letterSpacing: '-0.02em' }}>
              System Overview
            </h1>
            <p style={{ fontSize: 14, color: '#8D99AE', margin: '4px 0 0' }}>Monitor growth, verify credentials, and manage the clinical ecosystem.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/admin/verification')} className="mg-btn" style={{ padding: '10px 24px' }}>
              <FileCheck size={18} /> Manage Verifications
            </button>
          </div>
        </motion.div>

        {/* Analytics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { label: 'Total Doctors', value: analytics.totalDoctors, icon: Stethoscope, color: '#EF233C', trend: `${analytics.doctorTrend} this month` },
            { label: 'Active Patients', value: analytics.totalPatients, icon: Users, color: '#8D99AE', trend: `${analytics.patientTrend} growth` },
            { label: 'Pending Verifications', value: analytics.pendingVerifications, icon: Clock, color: '#D97706', alert: analytics.pendingVerifications > 0 },
            { label: 'Verification Rate', value: analytics.verificationRate, icon: TrendingUp, color: '#34A853', trend: 'Compliance rate' }
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ 
                padding: 24, borderRadius: 20, background: '#2B2D42', 
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(43,45,66,0.15)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)` }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={22} style={{ color: stat.color }} />
                </div>
                {stat.alert && (
                  <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: stat.color, boxShadow: `0 0 12px ${stat.color}66` }} />
                )}
              </div>
              
              <p style={{ fontSize: 32, fontWeight: 800, color: '#EDF2F4', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#8D99AE', margin: '0 0 12px' }}>{stat.label}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#EDF2F4', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.trend || 'Action Required'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: recentActivity.length > 0 ? '2fr 1fr' : '1fr', gap: 32 }}>
          {/* Main Chart Card */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="card" style={{ padding: 32 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Registration Velocity</h2>
              <p style={{ fontSize: 14, color: '#8D99AE', margin: '4px 0 0' }}>Platform adoption trends over the last 6 months.</p>
            </div>
            
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF233C" stopOpacity={1} />
                      <stop offset="100%" stopColor="#D90429" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43,45,66,0.06)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#8D99AE' }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(43,45,66,0.02)' }}
                    contentStyle={{ 
                      background: '#2B2D42', 
                      border: 'none', 
                      borderRadius: 12, 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                      padding: '10px 14px'
                    }}
                    itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 700 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fill: '#2B2D42', fontSize: 12, fontWeight: 800 }} 
                      offset={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {recentActivity.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2B2D42', margin: 0 }}>Live Activity</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                {recentActivity.map((activity, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(43,45,66,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {activity.role === 'DOCTOR' ? <UserPlus size={18} color="#EF233C" /> : <Users size={18} color="#2B2D42" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#2B2D42', margin: 0 }}>
                        New {activity.role === 'DOCTOR' ? 'Doctor' : 'Patient'} Joined
                      </p>
                      <p style={{ fontSize: 12, color: '#8D99AE', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activity.firstName} {activity.lastName}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#8D99AE', margin: 0 }}>
                      {new Date(activity.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
