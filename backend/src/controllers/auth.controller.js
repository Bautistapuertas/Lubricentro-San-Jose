import db from '../config/db.js'
import { isEmail } from '../validations/credenciales.js'
import { login, registrar, clienteValido, aplicarRestablecimiento } from '../services/usuarios.service.js'
import { crearRestablecimiento, consumirRestablecimiento, cerrarSesion, usuarioDeSesion } from '../services/sesiones.js'
import { validarPassword } from '../validations/credenciales.js'
import { enviarMail, smtpConfigurado } from '../services/mails.js'

const responder = (res, r) => {
  if (r.error) return res.status(r.status).json({ error: r.error })
  return res.json(r)
}

export function loginCliente(req, res) { return responder(res, login('cliente', req.body || {})) }
export function loginAdmin(req, res) { return responder(res, login('admin', req.body || {})) }

export function logout(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (token) cerrarSesion(token)
  res.json({ ok: true })
}

export async function registro(req, res) {
  const r = registrar(req.body || {})
  if (r.error) return res.status(r.status).json({ error: r.error })
  res.status(201).json({ ok: true })
}

export async function recuperar(req, res) {
  const { email } = req.body || {}
  if (!email || !isEmail(email)) return res.status(400).json({ error: 'Ingresá un email válido' })
  const usuario = clienteValido(email)
  if (!usuario) return res.json({ ok: true }) // no revelar si el email existe
  const token = crearRestablecimiento(usuario.id)
  if (smtpConfigurado()) {
    // Con SMTP real el token viaja solo por email: nunca en la respuesta HTTP
    // (cualquiera que sepa el email podría restablecer la contraseña).
    await enviarMail(usuario.email, 'Recuperar contraseña', `Tu token para restablecer la contraseña es: ${token}\nVence en 1 hora.`)
    return res.json({ ok: true })
  }
  // Demo sin SMTP: se devuelve para poder completar el flujo en la UI.
  res.json({ ok: true, token, demo: true })
}

export function restablecer(req, res) {
  const { token, password } = req.body || {}
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son obligatorios' })
  const errorPass = validarPassword(password)
  if (errorPass) return res.status(400).json({ error: errorPass })
  const r = consumirRestablecimiento(token)
  if (!r) return res.status(400).json({ error: 'El enlace es inválido o expiró' })
  aplicarRestablecimiento(r, password)
  res.json({ ok: true })
}

export function quienSoy(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const usuario = usuarioDeSesion(token)
  if (!usuario) return res.status(401).json({ error: 'No autorizado' })
  res.json({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
}
