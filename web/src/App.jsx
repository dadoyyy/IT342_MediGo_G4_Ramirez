import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register    from './pages/Register';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import SelectRole  from './pages/SelectRole';
import PatientHome from './pages/PatientHome';
import DoctorDetail from './pages/DoctorDetail';
import MyAppointments from './pages/MyAppointments';
import DoctorRegistration from './pages/DoctorRegistration';
import PendingApproval from './pages/PendingApproval';
import AdminVerification from './pages/AdminVerification';
import ChatInterface from './pages/ChatInterface';
import DoctorSchedule from './pages/DoctorSchedule';
import { authSession } from './session/authSession';

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
        <Route path="/login"           element={<Login />} />
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/home"            element={<ProtectedRoute><PatientHome /></ProtectedRoute>} />
        <Route path="/doctor/:doctorId" element={<ProtectedRoute><DoctorDetail /></ProtectedRoute>} />
        <Route path="/appointments"    element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/admin/verification" element={<ProtectedRoute><AdminVerification /></ProtectedRoute>} />
        <Route path="/chat"            element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute><DoctorSchedule /></ProtectedRoute>} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/auth/select-role" element={<SelectRole />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
