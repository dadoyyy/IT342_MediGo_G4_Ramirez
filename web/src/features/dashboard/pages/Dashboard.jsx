import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, appointmentApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, apptRes] = await Promise.all([
          authApi.me(),
          appointmentApi.listMine(),
        ]);
        const userData = meRes.data?.data ?? meRes.data;
        setUser(userData);

        // Redirect based on role
        if (userData.role === 'PATIENT') {
          navigate('/home', { replace: true });
          return;
        }
        if (userData.role === 'DOCTOR') {
          navigate('/doctor/schedule', { replace: true });
          return;
        }
        if (userData.role === 'ADMIN') {
          navigate('/admin/verification', { replace: true });
          return;
        }

        setAppointments(apptRes.data || []);
      } catch {
        // Token missing, expired, or API unreachable — send to login
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-sm">⚕</span>
          </div>
          <span className="text-lg font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.fullName}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user ? `, ${user.fullName}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's an overview of your activity.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Appointments', value: appointments.length, icon: '📅' },
            { label: 'Upcoming', value: appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length, icon: '⏰' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: '✅' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: '#7C2327' }}
          >
            Find Doctors
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            My Appointments
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            Messages
          </button>
        </div>
      </main>
    </div>
  );
}
