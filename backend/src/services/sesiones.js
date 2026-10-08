import { randomBytes } from 'node:crypto'
import db from '../config/db.js'

export const randomToken = (bytes = 24) => randomBytes(bytes).toString('hex')

// Sesiones server-side: logout del servidor invalida de verdad el token
// (no solo borra localStorage del cliente).
export function crearSesion(usuarioId) {
  const token = randomToken()
  db.prepare('INSERT INTO sesiones (token, usuario_id) VALUES (?, ?)').run(token, usuarioId)
  return token
}

export function cerrarSesion(token) {
  db.prepare('DELETE FROM sesiones WHERE token = ?').run(token)
}

export function usuarioDeSesion(token) {
  if (!token) return null
  const sesion = db.prepare('SELECT * FROM sesiones WHERE token = ?').get(token)
  if (!sesion) return null
  return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(sesion.usuario_id) || null
}

// RESTABLECIMIENTO de contraseña: token de un solo uso, 1 hora de validez.
export function crearRestablecimiento(usuarioId) {
  const token = randomToken(20)
  db.prepare('INSERT INTO restablecimientos (token, usuario_id, expira) VALUES (?, ?, ?)')
    .run(token, usuarioId, Date.now() + 60 * 60 * 1000)
  return token
}

export function consumirRestablecimiento(token) {
  const r = db.prepare('SELECT * FROM restablecimientos WHERE token = ?').get(token)
  if (!r || r.expira < Date.now()) return null
  db.prepare('DELETE FROM restablecimientos WHERE token = ?').run(token)
  return r
}
