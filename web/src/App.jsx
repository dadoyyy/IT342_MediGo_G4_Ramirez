import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// ── Auth feature ──────────────────────────────────────────────────────────
import Login        from './features/auth/pages/Login';
import Register     from './features/auth/pages/Register';
import AuthCallback from './features/auth/pages/AuthCallback';
import SelectRole   from './features/auth/pages/SelectRole';
import { authSession } from './features/auth/authSession';
import { authEvents } from './features/auth/authEventBus';
import { ToastProvider, useToast } from './shared/ui/ToastProvider';

// ── Dashboard feature ─────────────────────────────────────────────────────
import Dashboard   from './features/dashboard/pages/Dashboard';
import PatientHome from './features/dashboard/pages/PatientHome';

// ── Appointment feature ───────────────────────────────────────────────────
import MyAppointments from './features/appointment/pages/MyAppointments';
import DoctorSchedule from './features/appointment/pages/DoctorSchedule';

// ── Chat feature ──────────────────────────────────────────────────────────
import ChatInterface from './features/chat/pages/ChatInterface';

// ── Doctor feature ────────────────────────────────────────────────────────
import DoctorDetail       from './features/doctor/pages/DoctorDetail';
import DoctorRegistration from './features/doctor/pages/DoctorRegistration';
import DoctorProfile      from './features/doctor/pages/DoctorProfile';
import DoctorDashboard    from './features/doctor/pages/DoctorDashboard';
import DoctorAppointments from './features/doctor/pages/DoctorAppointments';
import PendingApproval    from './features/doctor/pages/PendingApproval';
import { DoctorProfileProvider, ProfileCompletionGuard } from './features/doctor/context/DoctorProfileContext';

// ── Admin feature ─────────────────────────────────────────────────────────
import AdminDashboard    from './features/admin/pages/AdminDashboard';
import AdminVerification from './features/admin/pages/AdminVerification';
import AdminDoctors      from './features/admin/pages/AdminDoctors';
import AdminPatients     from './features/admin/pages/AdminPatients';
import AdminSpecializationRequests from './features/admin/pages/AdminSpecializationRequests';

function ProtectedRoute({ children }) {
  return authSession.getToken() ? children : <Navigate to="/login" replace />;
}

function AuthToastListener() {
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = authEvents.subscribe(authEvents.names.sessionExpired, () => {
      addToast('Your session expired. Please sign in again.', 'warning');
    });
    return unsubscribe;
  }, [addToast]);

  return null;
}

function ChatRouteWrapper() {
  const role = authSession.getUser()?.role;
  if (role === 'DOCTOR') {
    return (
      <DoctorProfileProvider>
        <ProfileCompletionGuard>
          <ChatInterface />
        </ProfileCompletionGuard>
      </DoctorProfileProvider>
    );
  }
  return <ChatInterface />;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthToastListener />
        <Routes>
          <Route path="/"                element={<Navigate to="/login" replace />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/doctor/register" element={<DoctorRegistration />} />
          <Route path="/doctor/profile"  element={<ProtectedRoute><DoctorProfileProvider><DoctorProfile /></DoctorProfileProvider></ProtectedRoute>} />
          <Route path="/login"           element={<Login />} />
          <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/home"            element={<ProtectedRoute><PatientHome /></ProtectedRoute>} />
          <Route path="/doctor/:doctorId" element={<ProtectedRoute><DoctorDetail /></ProtectedRoute>} />
          <Route path="/appointments"    element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/verification" element={<ProtectedRoute><AdminVerification /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute><AdminDoctors /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute><AdminPatients /></ProtectedRoute>} />
          <Route path="/admin/specialization-requests" element={<ProtectedRoute><AdminSpecializationRequests /></ProtectedRoute>} />
          <Route path="/chat"            element={<ProtectedRoute><ChatRouteWrapper /></ProtectedRoute>} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><DoctorDashboard /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><DoctorAppointments /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>} />
          <Route path="/doctor/schedule" element={<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><DoctorSchedule /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>} />
          <Route path="/auth/callback"   element={<AuthCallback />} />
          <Route path="/auth/select-role" element={<SelectRole />} />
          <Route path="*"                element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
