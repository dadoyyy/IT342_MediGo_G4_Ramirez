import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';

// ── Auth feature ──────────────────────────────────────────────────────────
import Login        from './features/auth/pages/Login';
import Register     from './features/auth/pages/Register';
import AuthCallback from './features/auth/pages/AuthCallback';
import VerifyEmail  from './features/auth/pages/VerifyEmail';
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

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <DoctorProfileProvider>
        <Outlet />
      </DoctorProfileProvider>
    </ProtectedRoute>
  );
}

function DoctorRoutes() {
  return (
    <ProfileCompletionGuard>
      <Outlet />
    </ProfileCompletionGuard>
  );
}

function ChatRouteWrapper() {
  const role = authSession.getUser()?.role;
  if (role === 'DOCTOR') {
    return (
      <ProfileCompletionGuard>
        <ChatInterface />
      </ProfileCompletionGuard>
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
          
          {/* All protected routes share the same persistent provider if doctor */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard"       element={<Dashboard />} />
            <Route path="/home"            element={<PatientHome />} />
            <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
            <Route path="/appointments"    element={<MyAppointments />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
            <Route path="/admin/specialization-requests" element={<AdminSpecializationRequests />} />
            
            <Route path="/chat" element={<ChatRouteWrapper />} />

            {/* Doctor-only routes that require completion/verification */}
            <Route element={<DoctorRoutes />}>
              <Route path="/doctor/dashboard"    element={<DoctorDashboard />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/schedule"     element={<DoctorSchedule />} />
            </Route>
          </Route>
          
          <Route path="/auth/callback"   element={<AuthCallback />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="*"                element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
