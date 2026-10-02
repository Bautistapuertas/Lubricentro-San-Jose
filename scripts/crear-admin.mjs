// Uso: node scripts/crear-admin.mjs <email> <password> [nombre]
// Ejemplo: node scripts/crear-admin.mjs dueno@sanjose.com mipass123 "Martín San José"
// Si el email ya existe, actualiza su contraseña y lo deja como admin.
import db, { hashPassword } from '../server/db.js'

const [, , email, password, nombre = 'Administrador'] = process.argv
if (!email || !password) {
  console.error('Uso: node scripts/crear-admin.mjs <email> <password> [nombre]')
  process.exit(1)
}
if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres')
  process.exit(1)
}

const existente = db.prepare('SELECT id, rol FROM usuarios WHERE email = ?').get(email.toLowerCase().trim())
if (existente) {
  db.prepare("UPDATE usuarios SET password_hash = ?, rol = 'admin', nombre = ? WHERE id = ?")
    .run(hashPassword(password), nombre, existente.id)
  console.log(`✓ Admin actualizado: ${email}`)
} else {
  db.prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
    .run(nombre, email.toLowerCase().trim(), hashPassword(password), 'admin')
  console.log(`✓ Admin creado: ${email}`)
}
