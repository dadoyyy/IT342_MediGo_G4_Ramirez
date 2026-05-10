import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, appointmentApi } from '../../../shared/api/api';

// Dashboard is a pure redirect hub — no UI needed
export default function Dashboard() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function redirect() {
      try {
        const res = await authApi.me();
        const user = res.data?.data ?? res.data;
        if (user?.role === 'PATIENT') { navigate('/home', { replace: true }); return; }
        if (user?.role === 'DOCTOR')  { navigate('/doctor/schedule', { replace: true }); return; }
        if (user?.role === 'ADMIN')   { navigate('/admin/verification', { replace: true }); return; }
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1020' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }} />
        <p className="text-sm" style={{ color: 'rgba(247,248,250,0.4)' }}>Loading…</p>
      </div>
    </div>
  );
}
