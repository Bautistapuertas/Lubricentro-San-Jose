import * as turnos from '../services/turnos.service.js'
import * as usuarios from '../services/usuarios.service.js'
import { isEmail } from '../validations/credenciales.js'

// Para el administrador: agenda paginada con búsqueda server-side.
export function listar(req, res) {
  res.json(turnos.listar(req.query))
}

// Disponibilidad de slots para una fecha (público autenticado da igual:
// la lista de horarios ocupados no es información sensible).
export function disponibles(req, res) {
  const fecha = (req.query.fecha || '').toString().trim()
  if (!fecha) return res.status(400).json({ error: 'Indicá la fecha para consultar los horarios' })
  const ocupadas = turnos.ocupados(fecha)
  res.json({
    fecha,
    horarios: turnos.HORARIOS,
    ocupados: ocupadas,
    libres: turnos.HORARIOS.filter((h) => !ocupadas.includes(h)),
  })
}

// Crear turno (cliente o admin). FT-02: rechaza el horario ya ocupado.
export async function crear(req, res) {
  const { cliente, vehiculo, servicios, fecha, hora, nota } = req.body || {}
  if (!vehiculo || !servicios?.length || !fecha || !hora) {
    return res.status(400).json({ error: 'Vehículo, servicios, fecha y hora son obligatorios' })
  }
  if (req.usuario.rol === 'admin' && !cliente) {
    return res.status(400).json({ error: 'Indicá el nombre del cliente' })
  }
  // FT-02: el slot puede haber sido tomado mientras el cliente llenaba el
  // formulario. Un turno no-cancelado con esa fecha+hora bloquea el alta.
  if (!turnos.horarioLibre(fecha, hora)) {
    return res.status(409).json({ error: `El horario de las ${hora} para el día ${fecha} ya está reservado. Elegí otro horario.` })
  }
  if (req.usuario.rol === 'cliente' && !isEmail(req.usuario.email)) {
    return res.status(400).json({ error: 'El email del cliente no es válido' })
  }
  const id = turnos.crear(req.usuario, { cliente, vehiculo, servicios, fecha, hora, nota })
  res.status(201).json({ ok: true, id })
}

export function misTurnos(req, res) {
  res.json(turnos.misTurnos(req.usuario))
}

export function cambiarEstado(req, res) {
  const { estado, km } = req.body || {}
  // km (opcional): al marcar Completado se registra el service con ese km y
  // se recalcula el próximo service del vehículo.
  const r = turnos.cambiarEstado(req.params.id, estado, km)
  if (r.error === 'invalido') return res.status(400).json({ error: 'Estado inválido' })
  if (r.error === 'no_encontrado') return res.status(404).json({ error: 'Turno no encontrado' })
  res.json({ ok: true })
}

export function editar(req, res) {
  const r = turnos.editar(req.params.id, req.body || {})
  if (!r) return res.status(404).json({ error: 'Turno no encontrado' })
  if (r.error === 'ocupado') {
    return res.status(409).json({ error: `El horario de las ${r.hora} para el día ${r.fecha} ya está reservado. Elegí otro horario.` })
  }
  res.json({ ok: true })
}

export function recordatorio(req, res) {
  const t = turnos.enviarRecordatorio(req.params.id)
  if (!t) return res.status(404).json({ error: 'Turno no encontrado' })
  res.json({ ok: true })
}

export function clientes(req, res) { res.json(usuarios.listarClientes()) }
export function vehiculos(req, res) { res.json(usuarios.listarVehiculos()) }
export function dashboard(req, res) { res.json(usuarios.dashboard()) }
