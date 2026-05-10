import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../../shared/api/api';
import { authSession } from '../authSession';
import { authResponseAdapter } from '../authResponseAdapter';
import { authEvents } from '../authEventBus';
import axios from 'axios';

export default function SelectRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const pendingToken = params.get('pendingToken') || '';

  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.completeOAuth2(pendingToken, selected);
      const token = authResponseAdapter.extractToken(res);
      authSession.setToken(token);
      authEvents.emit(authEvents.names.login, { source: 'oauth2' });
      if (selected === 'DOCTOR') {
        navigate('/doctor/register', { replace: true });
      } else {
        navigate('/dashboard', { replace: true, state: { justLoggedIn: true } });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data.message || 'Something went wrong. Please try again.');
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    {
      id: 'PATIENT',
      icon: '🧑‍⚕️',
      title: 'Patient',
      description: 'Book appointments and consult with doctors',
    },
    {
      id: 'DOCTOR',
      icon: '👨‍⚕️',
      title: 'Doctor',
      description: 'Manage your schedule and see patients',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7C2327' }}>
            <span className="text-white text-xl">⚕</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: '#7C2327' }}>MediGo</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-2 mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Choose your role</h1>
            <p className="text-gray-500 text-sm">How will you be using MediGo?</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="text-base mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 mb-8">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selected === role.id
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected === role.id ? 'bg-rose-100' : 'bg-gray-100'
                }`}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${selected === role.id ? 'text-rose-700' : 'text-gray-800'}`}>
                    {role.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === role.id ? 'border-rose-500 bg-rose-500' : 'border-gray-300'
                }`}>
                  {selected === role.id && <span className="w-2 h-2 rounded-full bg-white block" />}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full min-h-[46px] rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: '#7C2327' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Setting up…
              </span>
            ) : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
