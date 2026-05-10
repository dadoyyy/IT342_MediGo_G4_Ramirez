import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, doctorApi } from '../../../shared/api/api';
import { authSession } from '../../auth/authSession';
import { authEvents } from '../../auth/authEventBus';

export default function PatientHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => {});
  }, []);

  const searchDoctors = useCallback(async (q) => {
    setSearching(true);
    try {
      const res = await doctorApi.search(q);
      setDoctors(res.data || []);
    } catch {
      setDoctors([]);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchDoctors('');
  }, [searchDoctors]);

  useEffect(() => {
    const timer = setTimeout(() => searchDoctors(query), 400);
    return () => clearTimeout(timer);
  }, [query, searchDoctors]);

  function handleLogout() {
    authApi.logout().catch(() => {});
    authSession.clearSession();
    authEvents.emit(authEvents.names.logout);
    navigate('/login', { replace: true });
  }

  const specialties = ['All', 'General', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics'];
  const [activeSpecialty, setActiveSpecialty] = useState('All');

  const filtered = activeSpecialty === 'All'
    ? doctors
    : doctors.filter(d => d.specialty?.toLowerCase().includes(activeSpecialty.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-sm">⚕</span>
          </div>
          <span className="text-lg font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/appointments')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            My Appointments
          </button>
          <button onClick={() => navigate('/chat')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Messages
          </button>
        </nav>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600 hidden sm:block">{user.firstName} {user.lastName}</span>}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Find a Doctor
          </h1>
          <p className="text-gray-500 mt-1">Search from our network of verified healthcare professionals.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or specialty…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all shadow-sm"
          />
        </div>

        {/* Specialty filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {specialties.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSpecialty(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeSpecialty === s
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={activeSpecialty === s ? { backgroundColor: '#7C2327' } : {}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Doctor list */}
        {loading || searching ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">No doctors found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doctor) => (
              <button
                key={doctor.userId}
                onClick={() => navigate(`/doctor/${doctor.userId}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl mb-4">
                  👨‍⚕️
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  Dr. {doctor.firstName} {doctor.lastName}
                </p>
                {doctor.specialty && (
                  <p className="text-xs text-gray-500 mt-0.5">{doctor.specialty}</p>
                )}
                {doctor.hospital && (
                  <p className="text-xs text-gray-400 mt-1">🏥 {doctor.hospital}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: '#FEF2F2', color: '#B4232A' }}
                  >
                    Book Appointment
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
