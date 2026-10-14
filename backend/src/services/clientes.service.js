import '../config/db.js'

// Normaliza la patente para agrupar: acepta 'ab 123 cd', 'AB123CD' o
// 'ab-123-cd' y produce la misma clave. Sin esto, el mismo auto cargado
// con distinto formato aparecería como dos vehículos distintos.
export function normalizarPatente(patente) {
  return (patente || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Da de alta al cliente si no existe (por email) y actualiza sus datos de
// contacto si ya estaba. Devuelve el cliente con id real para vincular turnos.
export function altaOActualizacion({ nombre, email, telefono, dni }) {
  if (!email) return null
  const emailNorm = email.toLowerCase().trim()
  const existente = db.prepare('SELECT * FROM clientes WHERE email = ?').get(emailNorm)
  if (existente) {
    db.prepare('UPDATE clientes SET nombre = ?, telefono = COALESCE(?, telefono), dni = COALESCE(?, dni) WHERE id = ?')
      .run(nombre || existente.nombre, telefono || null, dni || null, existente.id)
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(existente.id)
  }
  const info = db.prepare('INSERT INTO clientes (nombre, email, telefono, dni) VALUES (?, ?, ?, ?)')
    .run(nombre || emailNorm, emailNorm, telefono || null, dni || null)
  return db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid)
}

export function porEmail(email) {
  if (!email) return null
  return db.prepare('SELECT * FROM clientes WHERE email = ?').get(email.toLowerCase().trim()) || null
}

// Listado con buscador por nombre, email, DNI o patente de sus vehículos
// (el alcance pide búsqueda por DNI/patente).
export function listar(q = '') {
  const query = q.toString().trim().toLowerCase()
  if (!query) {
    return db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM turnos t WHERE t.cliente_id = c.id) AS turnos,
        (SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = c.id) AS vehiculos
      FROM clientes c ORDER BY c.id DESC
    `).all()
  }
  return db.prepare(`
    SELECT DISTINCT c.*,
      (SELECT COUNT(*) FROM turnos t WHERE t.cliente_id = c.id) AS turnos,
      (SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = c.id) AS vehiculos
    FROM clientes c
    LEFT JOIN vehiculos v ON v.cliente_id = c.id
    WHERE LOWER(c.nombre) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(COALESCE(c.dni, '')) LIKE ? OR v.patente_norm LIKE ?
    ORDER BY c.id DESC
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`)
}

export function detalle(id) {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id)
  if (!cliente) return null
  return {
    ...cliente,
    turnos: db.prepare('SELECT COUNT(*) AS n FROM turnos WHERE cliente_id = ?').get(id).n,
    vehiculos: db.prepare('SELECT * FROM vehiculos WHERE cliente_id = ? ORDER BY id DESC').all(id),
  }
}
