import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { authApi } from '../../../shared/api/api';

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
      } finally { setDone(true); }
    }
    redirect();
  }, [navigate]);

  if (done) return null;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F9FC' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #14B8A6, #8B93FF)', boxShadow: '0 0 20px rgba(20,184,166,0.25)' }}>
          <Stethoscope size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(20,184,166,0.2)', borderTopColor: '#14B8A6' }} />
        <p className="text-sm" style={{ color: '#6B7280' }}>Loading…</p>
      </div>
    </div>
  );
}
