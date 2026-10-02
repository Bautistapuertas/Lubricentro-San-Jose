import { Navigate } from 'react-router-dom'
import { getToken, getUser } from '../api.js'

export default function ProtectedRoute({ rol, children }) {
  const token = getToken()
  const user = getUser()
  if (!token) return <Navigate to={rol === 'admin' ? '/admin' : '/'} replace />
  if (rol && user?.rol !== rol) return <Navigate to="/" replace />
  return children
}
