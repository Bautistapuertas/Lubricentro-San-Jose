import db from '../config/db.js'

export function listarPublicos() {
  return db.prepare('SELECT * FROM servicios WHERE publico = 1').all()
}

export function listarTodos() {
  return db.prepare('SELECT * FROM servicios').all()
}

export function crear({ nombre, categoria, precio, duracion }) {
  const info = db.prepare('INSERT INTO servicios (nombre, categoria, precio, duracion, publico) VALUES (?, ?, ?, ?, 0)')
    .run(nombre.trim(), categoria.trim(), Number(precio), Number(duracion))
  return info.lastInsertRowid
}

export function editar(id, cambios) {
  const actual = db.prepare('SELECT * FROM servicios WHERE id = ?').get(id)
  if (!actual) return null
  db.prepare('UPDATE servicios SET nombre = ?, categoria = ?, precio = ?, duracion = ?, publico = ? WHERE id = ?')
    .run(cambios.nombre ?? actual.nombre, cambios.categoria ?? actual.categoria, cambios.precio ?? actual.precio, cambios.duracion ?? actual.duracion, cambios.publico ?? actual.publico, id)
  return { ok: true }
}
