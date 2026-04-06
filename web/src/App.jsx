import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register    from './pages/Register';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import SelectRole  from './pages/SelectRole';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Navigate to="/login" replace />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/auth/select-role" element={<SelectRole />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
