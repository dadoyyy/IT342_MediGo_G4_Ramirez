import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doctorApi } from '../../../shared/api/api';

// ─── Context ──────────────────────────────────────────────────────────────────

export const DoctorProfileContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DoctorProfileProvider({ children }) {
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await doctorApi.getMyProfile();
        const profile = res.data?.data ?? res.data;
        const specialization = profile?.specialization;
        const complete = typeof specialization === 'string' && specialization.trim().length > 0;
        setIsProfileComplete(complete);
        setIsVerified(!!profile?.verified);
      } catch {
        setIsProfileComplete(false);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function markProfileComplete() {
    setIsProfileComplete(true);
    // verified stays false until admin approves
  }

  return (
    <DoctorProfileContext.Provider value={{ isProfileComplete, isVerified, isLoading, markProfileComplete }}>
      {children}
    </DoctorProfileContext.Provider>
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export function ProfileCompletionGuard({ children }) {
  const { isProfileComplete, isVerified, isLoading } = useContext(DoctorProfileContext);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(46,196,182,0.2)', borderTopColor: '#2EC4B6' }}
        />
      </div>
    );
  }

  // Not filled in yet → go to profile setup
  if (!isProfileComplete) {
    return <Navigate to="/doctor/profile" replace />;
  }

  // Filled in but awaiting admin approval → go to pending page
  if (!isVerified) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDoctorProfile() {
  const ctx = useContext(DoctorProfileContext);
  if (!ctx) throw new Error('useDoctorProfile must be used within DoctorProfileProvider');
  return ctx;
}
