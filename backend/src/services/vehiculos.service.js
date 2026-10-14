import '../config/db.js'
import { normalizarPatente } from './clientes.service.js'

// Cálculo de próximo service (objetivo del alcance): el taller usa la regla
// estándar de 10.000 km o 12 meses, lo que ocurra PRIMERO. Guardamos la fecha
// del último service para poder computar ambas cosas.
const KM_POR_SERVICE = 10000
const MESES_POR_SERVICE = 12

export function proximoService(vehiculo, kmActuales) {
  const kmProximo = (vehiculo.ultimo_km || 0) + KM_POR_SERVICE
  const vencimientoKm = kmActuales != null ? kmProximo - kmActuales : null
  let vencimientoFecha = null
  if (vehiculo.ultimo_service) {
    const limite = new Date(vehiculo.ultimo_service)
    limite.setMonth(limite.getMonth() + MESES_POR_SERVICE)
    vencimientoFecha = limite.toISOString().slice(0, 10)
  }
  return { kmProximo, vencimientoKm, vencimientoFecha }
}

// Estado para la UI: ok / proximo / vencido, según cuál de las dos reglas
// dispare primero.
export function estadoService(vehiculo, kmActuales) {
  const { vencimientoKm, vencimientoFecha } = proximoService(vehiculo, kmActuales)
  const hoy = new Date().toISOString().slice(0, 10)
  const porFecha = vencimientoFecha && vencimientoFecha <= hoy
  const porKm = vencimientoKm != null && vencimientoKm <= 0
  if (porKm || porFecha) return 'vencido'
  if ((vencimientoKm != null && vencimientoKm <= 1500) || (vencimientoFecha && diasHasta(vencimientoFecha) <= 30)) return 'proximo'
  return 'ok'
}

function diasHasta(fecha) {
  return Math.round((new Date(fecha) - new Date()) / 86400000)
}

// Registra (o actualiza) el vehículo de un cliente. La clave de unicidad es
// la patente normalizada: si el mismo cliente carga dos veces el mismo auto
// con distinto formato, se actualiza en vez de duplicar.
export function altaOActualizacion(cliente_id, { patente, marca, modelo, km }) {
  if (!patente) return null
  const patente_norm = normalizarPatente(patente)
  const existente = db.prepare('SELECT * FROM vehiculos WHERE patente_norm = ?').get(patente_norm)
  const kmNum = km != null && km !== '' ? Number(km) : null
  if (existente) {
    db.prepare('UPDATE vehiculos SET cliente_id = ?, marca = COALESCE(?, marca), modelo = COALESCE(?, modelo), km = COALESCE(?, km) WHERE id = ?')
      .run(cliente_id || existente.cliente_id, marca || null, modelo || null, kmNum, existente.id)
    return db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(existente.id)
  }
  const info = db.prepare('INSERT INTO vehiculos (cliente_id, patente, patente_norm, marca, modelo, km) VALUES (?, ?, ?, ?, ?, ?)')
    .run(cliente_id, patente.toString().toUpperCase().trim(), patente_norm, marca || null, modelo || null, kmNum)
  return db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(info.lastInsertRowid)
}

// Búsqueda por patente (parcial, tolerante a guiones/espacios) o marca/modelo.
// Cada fila sale decorada con el cálculo de próximo service para que la UI
// no tenga que reimplementar la regla de negocio en el cliente.
export function listar(q = '') {
  const query = q.toString().trim().toLowerCase()
  const norm = normalizarPatente(query)
  const filas = !query
    ? db.prepare(`
      SELECT v.*, c.nombre AS cliente_nombre, c.email AS cliente_email, c.telefono AS cliente_telefono,
        (SELECT COUNT(*) FROM turnos t WHERE t.vehiculo_id = v.id) AS turnos
      FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id ORDER BY v.id DESC
    `).all()
    : db.prepare(`
      SELECT v.*, c.nombre AS cliente_nombre, c.email AS cliente_email, c.telefono AS cliente_telefono,
        (SELECT COUNT(*) FROM turnos t WHERE t.vehiculo_id = v.id) AS turnos
      FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.patente_norm LIKE ? OR LOWER(v.marca) LIKE ? OR LOWER(v.modelo) LIKE ?
        OR LOWER(COALESCE(c.nombre, '')) LIKE ?
      ORDER BY v.id DESC
    `).all(`%${norm}%`, `%${query}%`, `%${query}%`, `%${query}%`)
  return filas.map((v) => {
    const p = proximoService(v, v.km)
    return { ...v, estado_service: estadoService(v, v.km), proximo_km_en: p.vencimientoKm, vencimiento_fecha: p.vencimientoFecha }
  })
}

// Los vehículos del propio cliente (para el selector de ReservarTurno).
export function deCliente(cliente_id) {
  return db.prepare('SELECT * FROM vehiculos WHERE cliente_id = ? ORDER BY id DESC').all(cliente_id)
}

// Anota el service hecho: guarda el km del momento y recalcula el próximo.
export function registrarService(id, { km, ultimo_service }) {
  const v = db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id)
  if (!v) return null
  const kmNum = km != null && km !== '' ? Number(km) : (v.km ?? null)
  db.prepare('UPDATE vehiculos SET km = COALESCE(?, km), ultimo_km = ?, ultimo_service = COALESCE(?, ultimo_service) WHERE id = ?')
    .run(kmNum, kmNum ?? v.ultimo_km ?? 0, ultimo_service || new Date().toISOString().slice(0, 10), id)
  return db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id)
}

export function editar(id, cambios) {
  const v = db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id)
  if (!v) return null
  db.prepare('UPDATE vehiculos SET marca = ?, modelo = ?, km = COALESCE(?, km) WHERE id = ?')
    .run(cambios.marca ?? v.marca, cambios.modelo ?? v.modelo, cambios.km != null && cambios.km !== '' ? Number(cambios.km) : v.km, id)
  return db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id)
}
