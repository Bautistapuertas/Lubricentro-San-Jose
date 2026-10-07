import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import db, { hashPassword, verifyPassword, dbPath, dbPersistente } from './db.js'
import fs from 'node:fs'

// Cargar .env simple si existe (GMAIL_USER, GMAIL_APP_PASSWORD, etc.)
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const linea of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const app = express()
app.use(cors())
app.use(express.json())

// En producción servimos el build del frontend desde el mismo servidor:
// una sola URL (Render) sirve la app de React y la API juntas.
const distDir = path.join(process.cwd(), 'frontend', 'dist')
app.use(express.static(distDir))

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// --- Auth ---
function crearSesion(usuarioId) {
  const token = randomBytes(24).toString('hex')
  db.prepare('INSERT INTO sesiones (token, usuario_id) VALUES (?, ?)').run(token, usuarioId)
  return token
}

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

const loginHandler = (rol) => (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' })
  if (!isEmail(email)) return res.status(400).json({ error: 'El email no tiene un formato válido' })
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim())
  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' })
  }
  if (usuario.rol !== rol) return res.status(403).json({ error: 'Esta cuenta no tiene acceso a este portal' })
  const token = crearSesion(usuario.id)
  res.json({ token, usuario: { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } })
}

app.post('/api/auth/login', loginHandler('cliente'))
app.post('/api/auth/admin/login', loginHandler('admin'))

app.post('/api/auth/logout', (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.replace('Bearer ', '')
  if (token) db.prepare('DELETE FROM sesiones WHERE token = ?').run(token)
  res.json({ ok: true })
})

app.post('/api/auth/registro', (req, res) => {  const { nombre, email, password } = req.body || {}
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  if (typeof password !== 'string') return res.status(400).json({ error: 'La contraseña no es válida' })
  if (!isEmail(email)) return res.status(400).json({ error: 'El email no tiene un formato válido' })
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  // Un espacio al principio o al final es invisible en el formulario pero
  // queda guardado: después ningún ingreso con la contraseña "limpia" va a
  // coincidir. Se rechaza acá, que es el único momento en que se puede ver.
  if (password !== password.trim()) {
    return res.status(400).json({ error: 'La contraseña no puede empezar ni terminar con espacios' })
  }
  try {
    db.prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(nombre.trim(), email.toLowerCase().trim(), hashPassword(password), 'cliente')
    res.status(201).json({ ok: true })
  } catch {
    res.status(409).json({ error: 'Ya existe una cuenta con ese email' })
  }
})

app.post('/api/auth/recuperar', (req, res) => {
  const { email } = req.body || {}
  if (!email || !isEmail(email)) return res.status(400).json({ error: 'Ingresá un email válido' })
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim())
  if (!usuario) return res.json({ ok: true }) // no revelar si el email existe
  const token = randomBytes(20).toString('hex')
  db.prepare('INSERT INTO restablecimientos (token, usuario_id, expira) VALUES (?, ?, ?)')
    .run(token, usuario.id, Date.now() + 60 * 60 * 1000)
  // En producción acá se enviaría el email. En demo devolvemos el token para probar el flujo.
  res.json({ ok: true, token, demo: true })
})

app.post('/api/auth/restablecer', (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son obligatorios' })
  if (typeof password !== 'string') return res.status(400).json({ error: 'La contraseña no es válida' })
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  if (password !== password.trim()) {
    return res.status(400).json({ error: 'La contraseña no puede empezar ni terminar con espacios' })
  }
  const r = db.prepare('SELECT * FROM restablecimientos WHERE token = ?').get(token)
  if (!r || r.expira < Date.now()) return res.status(400).json({ error: 'El enlace es inválido o expiró' })
  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashPassword(password), r.usuario_id)
  db.prepare('DELETE FROM restablecimientos WHERE token = ?').run(token)
  db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(r.usuario_id)
  res.json({ ok: true })
})

// --- Notificaciones y mails (simulados) ---
function notificar(email, tipo, texto, turnoId) {
  db.prepare('INSERT INTO notificaciones (destinatario_email, tipo, texto, turno_id) VALUES (?, ?, ?, ?)').run(email, tipo, texto, turnoId ?? null)
}
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })
  : null

async function enviarMail(para, asunto, cuerpo) {
  const info = db.prepare('INSERT INTO mails (para, asunto, cuerpo, estado) VALUES (?, ?, ?, ?)').run(para, asunto, cuerpo, 'pendiente')
  const id = info.lastInsertRowid
  // El resultado queda guardado para poder verlo desde el panel: enviarMail
  // se dispara sin await, así que el error nunca llega a la respuesta HTTP.
  const marcar = (estado, error = null) => {
    try {
      db.prepare('UPDATE mails SET estado = ?, error = ? WHERE id = ?').run(estado, error, id)
    } catch (e) {
      console.error('[MAIL] No se pudo registrar el estado del envío:', e.message)
    }
    return { id, estado, error }
  }
  if (!transporter) {
    console.log(`[MAIL-SIMULADO] Para: ${para} | Asunto: ${asunto} (configurá GMAIL_USER y GMAIL_APP_PASSWORD para envío real)`)
    return marcar('simulado')
  }
  try {
    await transporter.sendMail({ from: `"Gestión San José" <${process.env.GMAIL_USER}>`, to: para, subject: asunto, text: cuerpo })
    console.log(`[MAIL] Enviado a ${para} | ${asunto}`)
    return marcar('enviado')
  } catch (err) {
    console.error(`[MAIL] Error enviando a ${para}:`, err.message)
    return marcar('error', err.message)
  }
}
function emailCliente(usuarioId) {
  if (!usuarioId) return null
  const u = db.prepare('SELECT email FROM usuarios WHERE id = ?').get(usuarioId)
  return u?.email || null
}

// --- Servicios (público) ---
app.get('/api/servicios', (req, res) => {
  res.json(db.prepare('SELECT * FROM servicios WHERE publico = 1').all())
})

app.get('/api/servicios/todos', authMiddleware('admin'), (req, res) => {
  res.json(db.prepare('SELECT * FROM servicios').all())
})

app.post('/api/servicios', authMiddleware('admin'), (req, res) => {
  const { nombre, categoria, precio, duracion } = req.body || {}
  if (!nombre || !categoria || !precio || !duracion) return res.status(400).json({ error: 'Nombre, categoría, precio y duración son obligatorios' })
  const info = db.prepare('INSERT INTO servicios (nombre, categoria, precio, duracion, publico) VALUES (?, ?, ?, ?, 0)')
    .run(nombre.trim(), categoria.trim(), Number(precio), Number(duracion))
  res.status(201).json({ ok: true, id: info.lastInsertRowid })
})

app.patch('/api/servicios/:id', authMiddleware('admin'), (req, res) => {
  const actual = db.prepare('SELECT * FROM servicios WHERE id = ?').get(req.params.id)
  if (!actual) return res.status(404).json({ error: 'Servicio no encontrado' })
  const { nombre, categoria, precio, duracion, publico } = req.body || {}
  db.prepare('UPDATE servicios SET nombre = ?, categoria = ?, precio = ?, duracion = ?, publico = ? WHERE id = ?')
    .run(nombre ?? actual.nombre, categoria ?? actual.categoria, precio ?? actual.precio, duracion ?? actual.duracion, publico ?? actual.publico, req.params.id)
  res.json({ ok: true })
})

app.patch('/api/turnos/:id', authMiddleware('admin'), (req, res) => {
  const t = db.prepare('SELECT * FROM turnos WHERE id = ?').get(req.params.id)
  if (!t) return res.status(404).json({ error: 'Turno no encontrado' })
  const { fecha, hora, nota } = req.body || {}
  db.prepare('UPDATE turnos SET fecha = ?, hora = ?, nota = ? WHERE id = ?')
    .run(fecha ?? t.fecha, hora ?? t.hora, nota ?? t.nota, req.params.id)
  res.json({ ok: true })
})

app.post('/api/turnos/:id/recordatorio', authMiddleware('admin'), (req, res) => {
  const info = db.prepare('UPDATE turnos SET recordatorio = 1 WHERE id = ?').run(req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Turno no encontrado' })
  const t = db.prepare('SELECT * FROM turnos WHERE id = ?').get(req.params.id)
  const clienteEmail = emailCliente(t.usuario_id)
  if (clienteEmail) enviarMail(clienteEmail, 'Recordatorio de turno', `Recordatorio: tenés turno de ${t.servicio} el ${t.fecha} a las ${t.hora}.`)
  res.json({ ok: true })
})

app.get('/api/notificaciones', authMiddleware(['cliente', 'admin']), (req, res) => {
  res.json(db.prepare('SELECT * FROM notificaciones WHERE destinatario_email = ? ORDER BY id DESC LIMIT 20').all(req.usuario.email))
})

app.post('/api/notificaciones/leer', authMiddleware(['cliente', 'admin']), (req, res) => {
  const { ids } = req.body || {}
  if (Array.isArray(ids) && ids.length) {
    db.prepare(`UPDATE notificaciones SET leida = 1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids)
  }
  res.json({ ok: true })
})

app.get('/api/mails', authMiddleware('admin'), (req, res) => {
  const mails = db.prepare('SELECT * FROM mails ORDER BY id DESC LIMIT 100').all()
  const resumen = db.prepare("SELECT estado, COUNT(*) n FROM mails GROUP BY estado").all()
  res.json({
    // Si `configurado` es false, los correos no salen: quedan registrados
    // como 'simulado' y nadie recibe nada.
    configurado: !!transporter,
    remitente: transporter ? process.env.GMAIL_USER : null,
    // Dónde viven los datos: si `persistente` es false, cada redeploy borra
    // los clientes, los turnos y el historial.
    db: { ruta: dbPath, persistente: dbPersistente },
    resumen: Object.fromEntries(resumen.map((r) => [r.estado, r.n])),
    mails,
  })
})

// Envío de prueba: responde si el correo sale de verdad o por qué no, sin
// depender de los logs y sin tener que armar un turno sólo para probar.
app.post('/api/mails/prueba', authMiddleware('admin'), async (req, res) => {
  const resultado = await enviarMail(
    req.usuario.email,
    'Prueba de envío — Gestión San José',
    `Este es un correo de prueba generado desde el panel de administración el ${new Date().toISOString()}. Si lo estás leyendo, el envío real funciona.`
  )
  res.json({ ok: true, para: req.usuario.email, ...resultado })
})

// --- Clientes (admin) ---
app.get('/api/clientes', authMiddleware('admin'), (req, res) => {
  const clientes = db.prepare("SELECT id, nombre, email FROM usuarios WHERE rol = 'cliente' ORDER BY id DESC").all()
  res.json(clientes.map((c) => ({ ...c, turnos: db.prepare('SELECT COUNT(*) AS n FROM turnos WHERE cliente = ?').get(c.nombre).n })))
})

// --- Vehículos (admin) ---
app.get('/api/vehiculos', authMiddleware('admin'), (req, res) => {
  const rows = db.prepare('SELECT vehiculo, COUNT(*) AS visitas, MAX(fecha) AS ultima FROM turnos GROUP BY vehiculo ORDER BY visitas DESC').all()
  res.json(rows)
})

// --- Historial ---
app.get('/api/historial', authMiddleware('cliente'), (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1)
  const porPagina = Math.min(50, Math.max(1, parseInt(req.query.porPagina) || 10))
  const total = db.prepare('SELECT COUNT(*) AS n FROM historial WHERE usuario_id = ?').get(req.usuario.id).n
  const historial = db.prepare('SELECT * FROM historial WHERE usuario_id = ? ORDER BY id DESC LIMIT ? OFFSET ?')
    .all(req.usuario.id, porPagina, (pagina - 1) * porPagina)
  res.json({ historial, total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)) })
})

// --- Mis turnos (cliente) ---
app.get('/api/turnos/mios', authMiddleware('cliente'), (req, res) => {
  res.json(db.prepare('SELECT * FROM turnos WHERE usuario_id = ? ORDER BY id DESC').all(req.usuario.id))
})

// --- Turnos ---
app.get('/api/turnos', authMiddleware('admin'), (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1)
  const porPagina = Math.min(50, Math.max(1, parseInt(req.query.porPagina) || 10))
  const q = (req.query.q || '').toString().trim().toLowerCase()
  const where = q ? 'WHERE LOWER(cliente) LIKE ? OR LOWER(vehiculo) LIKE ? OR LOWER(servicio) LIKE ?' : ''
  const args = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []
  const total = db.prepare(`SELECT COUNT(*) AS n FROM turnos ${where}`).get(...args).n
  const turnos = db
    .prepare(`SELECT * FROM turnos ${where} ORDER BY id LIMIT ? OFFSET ?`)
    .all(...args, porPagina, (pagina - 1) * porPagina)
  res.json({ turnos, total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)) })
})

app.post('/api/turnos', authMiddleware(['cliente', 'admin']), (req, res) => {
  const { cliente, vehiculo, servicios, fecha, hora, nota } = req.body || {}
  if (!vehiculo || !servicios?.length || !fecha || !hora) {
    return res.status(400).json({ error: 'Vehículo, servicios, fecha y hora son obligatorios' })
  }
  if (req.usuario.rol === 'admin' && !cliente) {
    return res.status(400).json({ error: 'Indicá el nombre del cliente' })
  }
  const importes = db.prepare(`SELECT nombre, precio FROM servicios WHERE nombre IN (${servicios.map(() => '?').join(',')})`).all(...servicios)
  const importe = importes.reduce((acc, s) => acc + s.precio, 0)
  const info = db.prepare('INSERT INTO turnos (cliente, vehiculo, servicio, fecha, hora, estado, nota, usuario_id, importe) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.usuario.rol === 'admin' ? cliente : req.usuario.nombre, vehiculo, servicios.join(' + '), fecha, hora, 'Pendiente', nota || '', req.usuario.rol === 'cliente' ? req.usuario.id : null, importe)
  res.status(201).json({ ok: true, id: info.lastInsertRowid })

  // Avisos: al cliente (resumen del turno) y al admin (panel de notificaciones)
  const creador = req.usuario.email
  if (req.usuario.rol === 'cliente') {
    enviarMail(creador, 'Turno registrado', `Hola ${req.usuario.nombre}, registramos tu turno de ${servicios.join(' + ')} el ${fecha} a las ${hora}. Te avisaremos cuando el taller lo confirme.`)
  }
  for (const admin of db.prepare("SELECT email FROM usuarios WHERE rol = 'admin'").all()) {
    notificar(admin.email, 'nuevo_turno', `Nuevo turno de ${req.usuario.rol === 'admin' ? cliente : req.usuario.nombre}: ${servicios.join(' + ')} el ${fecha} ${hora}`, info.lastInsertRowid)
  }
})

app.patch('/api/turnos/:id/estado', authMiddleware('admin'), (req, res) => {  const { estado } = req.body || {}
  const validos = ['Pendiente', 'Confirmado', 'En taller', 'Completado', 'Cancelado']
  if (!validos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' })
  const info = db.prepare('UPDATE turnos SET estado = ? WHERE id = ?').run(estado, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Turno no encontrado' })
  const t = db.prepare('SELECT * FROM turnos WHERE id = ?').get(req.params.id)
  const clienteEmail = emailCliente(t.usuario_id)
  if (estado === 'Confirmado') {
    if (clienteEmail) enviarMail(clienteEmail, 'Turno confirmado', `Hola, confirmamos tu turno de ${t.servicio} el ${t.fecha} a las ${t.hora}. ¡Te esperamos!`)
    if (clienteEmail) notificar(clienteEmail, 'confirmado', `Tu turno del ${t.fecha} a las ${t.hora} fue confirmado por el taller.`, t.id)
  }
  if (estado === 'Cancelado' && clienteEmail) {
    enviarMail(clienteEmail, 'Turno cancelado', `Te informamos que tu turno de ${t.servicio} del ${t.fecha} fue cancelado.`)
  }
  if (estado === 'Completado') {
    db.prepare('INSERT INTO historial (fecha, titulo, vehiculo, detalle, estado, importe, comprobante, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(t.fecha, t.servicio, t.vehiculo, `Turno completado en taller`, 'Completado', t.importe || 0, `#GSJ-${String(10000 + Number(t.id)).padStart(5, '0')}`, t.usuario_id ?? null)
  }
  res.json({ ok: true })
})

// --- Dashboard (resumen admin) ---
app.get('/api/dashboard', authMiddleware('admin'), (req, res) => {
  const turnos = db.prepare('SELECT * FROM turnos').all()
  const completados = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(importe), 0) AS total FROM historial WHERE estado = 'Completado'").get()
  res.json({
    total: turnos.length,
    porEstado: turnos.reduce((acc, t) => ({ ...acc, [t.estado]: (acc[t.estado] || 0) + 1 }), {}),
    proximos: turnos.slice(0, 4),
    enTaller: turnos.filter((t) => t.estado === 'En taller').length,
    completados: completados.n,
    ingresos: completados.total,
  })
})

// Cualquier ruta no-API devuelve la app de React (SPA). Si el build del
// frontend todavía no existe (ej: `npm run dev` sin compilar), avisamos en
// claro en vez de devolver un 404 que parece "la página no carga".
app.get(/^\/(?!api\/).*/, (req, res) => {
  const index = path.join(distDir, 'index.html')
  if (!fs.existsSync(index)) {
    return res
      .status(503)
      .send('Frontend no compilado: ejecutá `npm run build` (genera frontend/dist) y recargá.')
  }
  res.sendFile(index)
})

// Number() + || 3001: si PORT viene vacío o en 0 (lo exportan algunos entornos
// de desarrollo), caemos al puerto documentado en vez de escuchar en un puerto random.
const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`[DB] ${dbPath} (${dbPersistente ? 'disco persistente' : 'EFÍMERA: se pierde en cada redeploy'})`)
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})
