import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Auth feature ──────────────────────────────────────────────────────────
import Login        from './features/auth/pages/Login';
import Register     from './features/auth/pages/Register';
import AuthCallback from './features/auth/pages/AuthCallback';
import SelectRole   from './features/auth/pages/SelectRole';
import { authSession } from './features/auth/authSession';

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
import PendingApproval    from './features/doctor/pages/PendingApproval';
import { DoctorProfileProvider, ProfileCompletionGuard } from './features/doctor/context/DoctorProfileContext';

// ── Admin feature ─────────────────────────────────────────────────────────
import AdminVerification from './features/admin/pages/AdminVerification';

function ProtectedRoute({ children }) {
  return authSession.getToken() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/admin/verification" element={<ProtectedRoute><AdminVerification /></ProtectedRoute>} />
        <Route path="/chat"            element={<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><ChatInterface /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute><DoctorProfileProvider><ProfileCompletionGuard><DoctorSchedule /></ProfileCompletionGuard></DoctorProfileProvider></ProtectedRoute>} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/auth/select-role" element={<SelectRole />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
