import db from '../config/db.js'
import { notificar, enviarMail } from './mails.js'
import * as clientesService from './clientes.service.js'
import * as vehiculosService from './vehiculos.service.js'

// Horarios estándar del taller (SLOTS de la UI deben coincidir con esto).
export const HORARIOS = ['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM']

// Estados que ocupan el horario: un Cancelado libera el slot para otro cliente.
const OCUPA = "('Pendiente','Confirmado','En taller')"

export function listar(filtros = {}) {
  const pagina = Math.max(1, parseInt(filtros.pagina) || 1)
  const porPagina = Math.min(50, Math.max(1, parseInt(filtros.porPagina) || 10))
  const q = (filtros.q || '').toString().trim().toLowerCase()
  const where = q ? 'WHERE LOWER(cliente) LIKE ? OR LOWER(vehiculo) LIKE ? OR LOWER(servicio) LIKE ?' : ''
  const args = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []
  const total = db.prepare(`SELECT COUNT(*) AS n FROM turnos ${where}`).get(...args).n
  const turnos = db
    .prepare(`SELECT * FROM turnos ${where} ORDER BY id LIMIT ? OFFSET ?`)
    .all(...args, porPagina, (pagina - 1) * porPagina)
  return { turnos, total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)) }
}

// FT-02 (disponibilidad): un slot quedó tomado si hay cualquier turno no
// cancelado con la misma fecha+hora. El 409 se construye con texto de la UI.
export function ocupados(fecha) {
  return db.prepare(`SELECT hora FROM turnos WHERE fecha = ? AND estado IN ${OCUPA}`).all(fecha).map((r) => r.hora)
}

export function horarioLibre(fecha, hora) {
  const r = db.prepare(`SELECT COUNT(*) AS n FROM turnos WHERE fecha = ? AND hora = ? AND estado IN ${OCUPA}`).get(fecha, hora)
  return r.n === 0
}

export function misTurnos(usuario) {
  return db.prepare('SELECT * FROM turnos WHERE usuario_id = ? ORDER BY id DESC').all(usuario.id)
}

// Creación con importe calculado a partir del catálogo real (no del UI).
// Además del turno, se auto-registran el cliente (por email) y el vehículo
// (por patente normalizada): así el panel de Clientes/Vehículos queda vivo
// sin carga manual, y el turno queda vinculado a entidades reales.
export function crear(usuario, datos) {
  const { cliente, vehiculo, servicios, fecha, hora, nota, dni, telefono, km } = datos
  const importes = db.prepare(`SELECT nombre, precio FROM servicios WHERE nombre IN (${servicios.map(() => '?').join(',')})`).all(...servicios)
  const importe = importes.reduce((acc, s) => acc + s.precio, 0)

  // Entidades: para el cliente, el admin puede mandar email/dni (alta manual);
  // si no, sale de la cuenta que reserva. Para el vehículo, parseamos el
  // string "Marca Modelo · PATENTE" que manda la UI.
  let emailCliente = null
  let nombreCliente = usuario.rol === 'admin' ? cliente : usuario.nombre
  if (usuario.rol === 'admin') {
    emailCliente = datos.email || null
  } else {
    emailCliente = usuario.email
  }
  const cli = clientesService.altaOActualizacion({ nombre: nombreCliente, email: emailCliente, telefono, dni })
  const [marcaModelo, patente] = (vehiculo || '').split('·').map((p) => p.trim())
  const [marca, ...restoModelo] = marcaModelo.split(' ')
  const veh = vehiculosService.altaOActualizacion(cli?.id ?? null, { patente, marca, modelo: restoModelo.join(' '), km })

  const info = db.prepare('INSERT INTO turnos (cliente, vehiculo, servicio, fecha, hora, estado, nota, usuario_id, importe, cliente_id, vehiculo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(nombreCliente, vehiculo, servicios.join(' + '), fecha, hora, 'Pendiente', nota || '', usuario.rol === 'cliente' ? usuario.id : null, importe, cli?.id ?? null, veh?.id ?? null)

  // Avisos: al cliente (resumen del turno) y al admin (panel de notificaciones)
  if (usuario.rol === 'cliente') {
    enviarMail(usuario.email, 'Turno registrado', `Hola ${usuario.nombre}, registramos tu turno de ${servicios.join(' + ')} el ${fecha} a las ${hora}. Te avisaremos cuando el taller lo confirme.`)
  }
  for (const admin of db.prepare("SELECT email FROM usuarios WHERE rol = 'admin'").all()) {
    notificar(admin.email, 'nuevo_turno', `Nuevo turno de ${usuario.rol === 'admin' ? cliente : usuario.nombre}: ${servicios.join(' + ')} el ${fecha} ${hora}`, info.lastInsertRowid)
  }
  return info.lastInsertRowid
}

function turnoConCliente(id) {
  const t = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id)
  if (!t) return null
  if (t.usuario_id) {
      const u = db.prepare('SELECT email, nombre FROM usuarios WHERE id = ?').get(t.usuario_id)
    t.email_cliente = u?.email || null
    t.nombre_cliente = u?.nombre || t.cliente
  }
  return t
}

export function cambiarEstado(id, estado, datosKm) {
  const validos = ['Pendiente', 'Confirmado', 'En taller', 'Completado', 'Cancelado']
  if (!validos.includes(estado)) return { error: 'invalido' }
  const info = db.prepare('UPDATE turnos SET estado = ? WHERE id = ?').run(estado, id)
  if (info.changes === 0) return { error: 'no_encontrado' }
  const t = turnoConCliente(id)
  if (estado === 'Confirmado' && t.email_cliente) {
    enviarMail(t.email_cliente, 'Turno confirmado', `Hola, confirmamos tu turno de ${t.servicio} el ${t.fecha} a las ${t.hora}. ¡Te esperamos!`)
    notificar(t.email_cliente, 'confirmado', `Tu turno del ${t.fecha} a las ${t.hora} fue confirmado por el taller.`, t.id)
  }
  if (estado === 'Cancelado' && t.email_cliente) {
    enviarMail(t.email_cliente, 'Turno cancelado', `Te informamos que tu turno de ${t.servicio} del ${t.fecha} fue cancelado.`)
  }
  if (estado === 'Completado') {
    // Cierre del circuito vehículos: el turno completado cuenta como service
    // hecho. Con el km informado (o el último conocido) se actualiza el
    // vehículo y se recalcula el próximo service (10.000 km / 12 meses).
    if (t.vehiculo_id) {
      vehiculosService.registrarService(t.vehiculo_id, { km: datosKm, ultimo_service: t.fecha })
    }
    // Idempotente: el comprobante se deriva del id del turno, así que un
    // doble click en "Completado" no duplica la fila del historial.
    const comprobante = `#GSJ-${String(10000 + Number(t.id)).padStart(5, '0')}`
    const yaRegistrado = db.prepare('SELECT COUNT(*) AS n FROM historial WHERE comprobante = ?').get(comprobante).n
    if (!yaRegistrado) {
      db.prepare('INSERT INTO historial (fecha, titulo, vehiculo, detalle, estado, importe, comprobante, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(t.fecha, t.servicio, t.vehiculo, `Turno completado en taller`, 'Completado', t.importe || 0, comprobante, t.usuario_id ?? null)
    }
  }
  return { ok: true }
}

// Reprogramación (admin): mismo chequeo de FT-02 que el alta, excluyendo el
// propio turno para que moverlo dentro de su horario actual no dé falso 409.
export function editar(id, { fecha, hora, nota }) {
  const t = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id)
  if (!t) return null
  const nuevaFecha = fecha ?? t.fecha
  const nuevaHora = hora ?? t.hora
  const choque = db.prepare(`SELECT COUNT(*) AS n FROM turnos WHERE fecha = ? AND hora = ? AND id != ? AND estado IN ${OCUPA}`).get(nuevaFecha, nuevaHora, id)
  if (choque.n > 0) return { error: 'ocupado', fecha: nuevaFecha, hora: nuevaHora }
  db.prepare('UPDATE turnos SET fecha = ?, hora = ?, nota = ? WHERE id = ?')
    .run(nuevaFecha, nuevaHora, nota ?? t.nota, id)
  return { ok: true }
}

export function enviarRecordatorio(id) {
  const info = db.prepare('UPDATE turnos SET recordatorio = 1 WHERE id = ?').run(id)
  if (info.changes === 0) return null
  const t = turnoConCliente(id)
  if (t?.email_cliente) {
    enviarMail(t.email_cliente, 'Recordatorio de turno', `Recordatorio: tenés turno de ${t.servicio} el ${t.fecha} a las ${t.hora}.`)
  }
  return t
}
