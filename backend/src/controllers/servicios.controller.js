import * as servicios from '../services/servicios.service.js'
import db from '../config/db.js'
import { enviarMail, estadoMails, smtpConfigurado } from '../services/mails.js'

export function listarPublicos(_req, res) { res.json(servicios.listarPublicos()) }
export function listarTodos(_req, res) { res.json(servicios.listarTodos()) }

export function crear(req, res) {
  const { nombre, categoria, precio, duracion } = req.body || {}
  if (!nombre || !categoria || !precio || !duracion) return res.status(400).json({ error: 'Nombre, categoría, precio y duración son obligatorios' })
  const id = servicios.crear({ nombre, categoria, precio, duracion })
  res.status(201).json({ ok: true, id })
}

export function editar(req, res) {
  const r = servicios.editar(req.params.id, req.body || {})
  if (!r) return res.status(404).json({ error: 'Servicio no encontrado' })
  res.json({ ok: true })
}

export function notificaciones(req, res) {
  res.json(db.prepare('SELECT * FROM notificaciones WHERE destinatario_email = ? ORDER BY id DESC LIMIT 20').all(req.usuario.email))
}

export function notificacionesLeidas(req, res) {
  const { ids } = req.body || {}
  if (Array.isArray(ids) && ids.length) {
    db.prepare(`UPDATE notificaciones SET leida = 1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids)
  }
  res.json({ ok: true })
}

export function mails(req, res) {
  res.json({ ...estadoMails(), db: { ruta: process.env.DB_PATH, persistente: !!process.env.DB_PATH } })
}

export async function mailPrueba(req, res) {
  const resultado = await enviarMail(
    req.usuario.email,
    'Prueba de envío — Gestión San José',
    `Este es un correo de prueba generado desde el panel de administración el ${new Date().toISOString()}. Si lo estás leyendo, el envío real funciona.`
  )
  res.json({ ok: true, para: req.usuario.email, ...resultado })
}

export { smtpConfigurado }
