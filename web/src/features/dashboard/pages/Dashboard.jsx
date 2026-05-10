import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { authApi, doctorApi } from '../../../shared/api/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function redirect() {
      try {
        const res = await authApi.me();
        const user = res.data?.data ?? res.data;

        if (user?.role === 'PATIENT') {
          navigate('/home', { replace: true });
          return;
        }

        if (user?.role === 'DOCTOR') {
          // Check if doctor has already set up their profile
          try {
            const profileRes = await doctorApi.getMyProfile();
            const profile = profileRes.data?.data ?? profileRes.data;
            if (profile?.specialization) {
              // Profile complete — go to schedule
              navigate('/doctor/schedule', { replace: true });
            } else {
              // Profile incomplete — go to profile setup
              navigate('/doctor/profile', { replace: true });
            }
          } catch {
            // No profile yet — go to profile setup
            navigate('/doctor/profile', { replace: true });
          }
          return;
        }

        if (user?.role === 'ADMIN') {
          navigate('/admin/verification', { replace: true });
          return;
        }
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setDone(true);
      }
    }
    redirect();
  }, [navigate]);

  if (done) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2EC4B6, #9B8CFF)', boxShadow: '0 0 28px rgba(46,196,182,0.4)' }}>
          <Stethoscope size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
        <p style={{ fontSize: 14, color: '#8892A4' }}>Loading…</p>
      </div>
    </div>
  );
}
