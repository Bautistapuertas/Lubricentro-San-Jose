import '../config/db.js'
import { randomToken } from '../services/sesiones.js'

function authMiddleware(rolRequerido) {
  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.replace('Bearer ', '')
    const sesion = db.prepare('SELECT * FROM sesiones WHERE token = ?').get(token)
    if (!sesion) return res.status(401).json({ error: 'No autorizado' })
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(sesion.usuario_id)
    if (!usuario) return res.status(401).json({ error: 'No autorizado' })
    const roles = Array.isArray(rolRequerido) ? rolRequerido : [rolRequerido]
    if (rolRequerido && !roles.includes(usuario.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para acceder a este recurso' })
    }
    req.usuario = usuario
    next()
  }
}

export default authMiddleware
