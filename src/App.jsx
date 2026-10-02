import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import ReservarTurno from './pages/ReservarTurno.jsx'
import Historial from './pages/Historial.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Turnos from './pages/admin/Turnos.jsx'
import Servicios from './pages/admin/Servicios.jsx'
import Registro from './pages/Registro.jsx'
import Recuperar from './pages/Recuperar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/historial" element={<ProtectedRoute rol="cliente"><Historial /></ProtectedRoute>} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute rol="admin"><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/turnos" element={<ProtectedRoute rol="admin"><Turnos /></ProtectedRoute>} />
      <Route path="/admin/servicios" element={<ProtectedRoute rol="admin"><Servicios /></ProtectedRoute>} />
      <Route path="/reservar-turno" element={<ProtectedRoute rol="cliente"><ReservarTurno /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
