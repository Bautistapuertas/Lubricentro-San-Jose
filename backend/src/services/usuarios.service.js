import { validarPassword, isEmail } from '../validations/credenciales.js'
import { crearSesion } from './sesiones.js'

// LOGIN por portal: el mismo handler sirve cliente y admin (evita duplicar
// la validación de credenciales). El rol define a qué portal puede entrar.
export function login(rol, { email, password }) {
  if (!email || !password) return { error: 'Email y contraseña son obligatorios', status: 400 }
  if (!isEmail(email)) return { error: 'El email no tiene un formato válido', status: 400 }
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim())
  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    return { error: 'Credenciales incorrectas', status: 401 }
  }
  if (usuario.rol !== rol) return { error: 'Esta cuenta no tiene acceso a este portal', status: 403 }
  return { token: crearSesion(usuario.id), usuario: { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } }
}

export function registrar({ nombre, email, password }) {
  if (!nombre || !email || !password) return { error: 'Todos los campos son obligatorios', status: 400 }
  const errorPass = validarPassword(password)
  if (errorPass) return { error: errorPass, status: 400 }
  if (!isEmail(email)) return { error: 'El email no tiene un formato válido', status: 400 }
  try {
    db.prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(nombre.trim(), email.toLowerCase().trim(), hashPassword(password), 'cliente')
    return { ok: true }
  } catch {
    return { error: 'Ya existe una cuenta con ese email', status: 409 }
  }
}

export function aplicarRestablecimiento(token, password) {
  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashPassword(password), token.usuario_id)
  // por seguridad eliminamos también las sesiones activas del usuario
  db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(token.usuario_id)
}

export function clienteValido(email) {
  if (!email || !isEmail(email)) return null
  return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim())
}

export function listarClientes() {
  const clientes = db.prepare("SELECT id, nombre, email FROM usuarios WHERE rol = 'cliente' ORDER BY id DESC").all()
  return clientes.map((c) => ({ ...c, turnos: db.prepare('SELECT COUNT(*) AS n FROM turnos WHERE cliente = ?').get(c.nombre).n }))
}

export function listarVehiculos() {
  return db.prepare('SELECT vehiculo, COUNT(*) AS visitas, MAX(fecha) AS ultima FROM turnos GROUP BY vehiculo ORDER BY visitas DESC').all()
}

export function dashboard() {
  const turnos = db.prepare('SELECT * FROM turnos').all()
  const completados = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(importe), 0) AS total FROM historial WHERE estado = 'Completado'").get()
  return {
    total: turnos.length,
    porEstado: turnos.reduce((acc, t) => ({ ...acc, [t.estado]: (acc[t.estado] || 0) + 1 }), {}),
    proximos: turnos.slice(0, 4),
    enTaller: turnos.filter((t) => t.estado === 'En taller').length,
    completados: completados.n,
    ingresos: completados.total,
  }
}

export function historial(usuario, query = {}) {
  const pagina = Math.max(1, parseInt(query.pagina) || 1)
  const porPagina = Math.min(50, Math.max(1, parseInt(query.porPagina) || 10))
  const total = db.prepare('SELECT COUNT(*) AS n FROM historial WHERE usuario_id = ?').get(usuario.id).n
  const historial = db.prepare('SELECT * FROM historial WHERE usuario_id = ? ORDER BY id DESC LIMIT ? OFFSET ?')
    .all(usuario.id, porPagina, (pagina - 1) * porPagina)
  return { historial, total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)) }
}
