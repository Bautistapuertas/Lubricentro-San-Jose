import { DatabaseSync } from 'node:sqlite'
import { scryptSync, randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const dbPath = process.env.DB_PATH || path.join(__dirname, 'lubricentro.db')
// Si el archivo cae dentro del repo del contenedor, Render lo borra en cada
// redeploy: se pierden los clientes registrados, los turnos y el historial. Es
// el motivo más común de "me registré y después la cuenta no existe más".
export const dbPersistente = !dbPath.startsWith(__dirname) && !dbPath.startsWith(process.cwd())
const db = new DatabaseSync(dbPath)
if (!dbPersistente) {
  console.warn(`[DB] ATENCIÓN: la base está en ${dbPath}, dentro del proyecto: se pierde en cada redeploy. Definí DB_PATH apuntando al disco montado.`)
}
db.exec('PRAGMA journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente'
);
CREATE TABLE IF NOT EXISTS turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  vehiculo TEXT NOT NULL,
  servicio TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Confirmado',
  nota TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio INTEGER NOT NULL,
  duracion INTEGER NOT NULL,
  publico INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  titulo TEXT NOT NULL,
  vehiculo TEXT NOT NULL,
  detalle TEXT NOT NULL,
  estado TEXT NOT NULL,
  importe INTEGER NOT NULL,
  comprobante TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS restablecimientos (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  expira INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destinatario_email TEXT NOT NULL,
  tipo TEXT NOT NULL,
  texto TEXT NOT NULL,
  turno_id INTEGER,
  leida INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS mails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  para TEXT NOT NULL,
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  error TEXT,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Clientes y vehículos como entidades reales (alcance del TP): el turno ya no
-- apunta a texto libre sino a ids de estas tablas.
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  dni TEXT
);
CREATE TABLE IF NOT EXISTS vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id),
  patente TEXT NOT NULL,
  -- Clave de búsqueda/agrupación sin espacios ni guiones: 'AB123CD'.
  -- Permite buscar 'ab 123 cd' y que matchee igual.
  patente_norm TEXT NOT NULL UNIQUE,
  marca TEXT,
  modelo TEXT,
  km INTEGER,
  ultimo_km INTEGER,
  ultimo_service TEXT
);
`)

try { db.exec('ALTER TABLE historial ADD COLUMN usuario_id INTEGER') } catch {}
try { db.exec('ALTER TABLE turnos ADD COLUMN usuario_id INTEGER') } catch {}
try { db.exec('ALTER TABLE turnos ADD COLUMN importe INTEGER DEFAULT 0') } catch {}
try { db.exec('ALTER TABLE turnos ADD COLUMN recordatorio INTEGER DEFAULT 0') } catch {}
// Resultado del envío: 'pendiente' | 'simulado' | 'enviado' | 'error'.
// Permite ver en el panel si el correo salió de verdad o falló.
try { db.exec("ALTER TABLE mails ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente'") } catch {}
try { db.exec('ALTER TABLE mails ADD COLUMN error TEXT') } catch {}
// Las filas que ya existían sólo dice "pendiente" porque el ALTER les puso el
// valor por omisión: nunca se instrumentó su envío. Se renombran a 'sin_dato'
// para no hacer creer al admin que hay correos atascados esperando salir.
// Es idempotente: al arrancar no hay ningún envío en vuelo.
try { db.exec("UPDATE mails SET estado = 'sin_dato' WHERE estado = 'pendiente'") } catch {}
// Migración de datos existentes: si hay turnos con vehiculo texto libre y sin
// vehiculo_id, se vinculan a las tablas nuevas creando cliente+vehiculo.
// (Se reproducen aquí las mínimas de clientes/vehiculos.services para no
// crear una dependencia circular db.js <-> servicios.)
try { db.exec('ALTER TABLE turnos ADD COLUMN cliente_id INTEGER REFERENCES clientes(id)') } catch {}
try { db.exec('ALTER TABLE turnos ADD COLUMN vehiculo_id INTEGER REFERENCES vehiculos(id)') } catch {}
// Nota: la FK con REFERENCES sobre una columna agregada por ALTER no se aplica
// retroactivamente en SQLite (las FK viejas siguen siendo texto). Es aceptable
// para el TP: la integridad la garantiza el service al crear cada turno.
function migrarTurnosLegados() {
  const sueltos = db.prepare('SELECT * FROM turnos WHERE vehiculo_id IS NULL').all()
  if (!sueltos.length) return
  for (const t of sueltos) {
    const email = t.email_cliente || null
    let clienteId = null
    if (email) {
      db.prepare('INSERT INTO clientes (nombre, email) VALUES (?, ?) ON CONFLICT(email) DO NOTHING').run(t.cliente, email.toLowerCase())
      clienteId = db.prepare('SELECT id FROM clientes WHERE email = ?').get(email.toLowerCase())?.id || null
    }
    const partes = (t.vehiculo || '').split('·')
    const marcaModelo = (partes[0] || 'Sin marca').trim()
    const patente = (partes[1] || `SIN-PATENTE-${t.id}`).trim()
    const patente_norm = patente.toUpperCase().replace(/[^A-Z0-9]/g, '')
    db.prepare('INSERT INTO vehiculos (cliente_id, patente, patente_norm, marca, modelo) VALUES (?, ?, ?, ?, ?) ON CONFLICT(patente_norm) DO NOTHING')
      .run(clienteId, patente, patente_norm, marcaModelo, '')
    const vehiculoId = db.prepare('SELECT id FROM vehiculos WHERE patente_norm = ?').get(patente_norm)?.id
    db.prepare('UPDATE turnos SET cliente_id = ?, vehiculo_id = ? WHERE id = ?').run(clienteId, vehiculoId, t.id)
  }
}

export const hashPassword = (password) => {
  const salt = randomBytes(8).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

export const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':')
  return scryptSync(password, salt, 64).toString('hex') === hash
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n
  if (count === 0) {
    const insertUser = db.prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
    insertUser.run('Martín San José', 'admin@sanjose.com', hashPassword('admin123'), 'admin')
    insertUser.run('Juan Pérez', 'juan@test.com', hashPassword('cliente123'), 'cliente')
  }

  const turnosCount = db.prepare('SELECT COUNT(*) AS n FROM turnos').get().n
  if (turnosCount === 0) {
    const insertTurno = db.prepare('INSERT INTO turnos (cliente, vehiculo, servicio, fecha, hora, estado, nota) VALUES (?, ?, ?, ?, ?, ?, ?)')
    insertTurno.run('Lucía Fernández', 'Toyota Etios · AE 456 RT', 'Cambio de aceite', '2026-09-30', '08:00', 'Confirmado', '')
    insertTurno.run('Diego Martínez', 'Ford Ranger · AC 980 KL', 'Lavado premium', '2026-09-30', '09:30', 'En taller', '')
    insertTurno.run('Juan Pérez', 'VW Gol Trend · AB 123 CD', 'Revisión general', '2026-09-30', '11:00', 'Confirmado', 'Revisar ruido al frenar en frío.')
    insertTurno.run('Mariana López', 'Chevrolet Onix · AF 221 NM', 'Alineación y balanceo', '2026-09-30', '13:30', 'Pendiente', '')
    insertTurno.run('Carlos Giménez', 'Renault Sandero · AD 782 PQ', 'Cambio de filtros', '2026-09-30', '15:00', 'Pendiente', '')
    insertTurno.run('Sofía García', 'Peugeot 208 · AG 554 BC', 'Lavado completo', '2026-09-30', '16:30', 'Confirmado', '')
  }

  const serviciosCount = db.prepare('SELECT COUNT(*) AS n FROM servicios').get().n
  if (serviciosCount === 0) {
    const insertServicio = db.prepare('INSERT INTO servicios (nombre, categoria, precio, duracion, publico) VALUES (?, ?, ?, ?, ?)')
    insertServicio.run('Cambio de aceite', 'Mantenimiento', 28000, 60, 1)
    insertServicio.run('Lavado completo', 'Lavado', 4500, 45, 1)
    insertServicio.run('Alineación y balanceo', 'Neumáticos', 15000, 40, 1)
    insertServicio.run('Revisión general', 'Diagnóstico', 12000, 50, 1)
    insertServicio.run('Lavado premium', 'Lavado', 8500, 90, 1)
    insertServicio.run('Tratamiento de pulido', 'Estética', 18000, 120, 0)
  }

  const historialCount = db.prepare('SELECT COUNT(*) AS n FROM historial').get().n
  if (historialCount === 0) {
    const insertHistorial = db.prepare('INSERT INTO historial (fecha, titulo, vehiculo, detalle, estado, importe, comprobante) VALUES (?, ?, ?, ?, ?, ?, ?)')
    insertHistorial.run('18 SEP 2026', 'Cambio de aceite y filtros', 'Volkswagen Gol Trend 1.6 · AB 123 CD', 'Aceite 5W-40 · Filtro de aceite · Control de 12 puntos', 'Completado', 42800, '#GSJ-02481')
    insertHistorial.run('02 JUL 2026', 'Lavado premium', 'Volkswagen Gol Trend 1.6 · AB 123 CD', 'Lavado exterior · Aspirado · Encerado rápido', 'Completado', 12500, '#GSJ-02197')
    insertHistorial.run('14 MAR 2026', 'Alineación y balanceo', 'Volkswagen Gol Trend 1.6 · AB 123 CD', 'Alineación computarizada · Balanceo 4 ruedas', 'Completado', 21000, '#GSJ-01744')
    insertHistorial.run('08 DIC 2025', 'Revisión general', 'Volkswagen Gol Trend 1.6 · AB 123 CD', 'Diagnóstico · Frenos · Fluidos · Presión de neumáticos', 'Con observaciones', 18900, '#GSJ-01209')
  }
}

seed()
// La migración corre DESPUÉS de seed(): si es una base nueva, los turnos
// sembrados también tienen que quedar vinculados a cliente/vehículo.
migrarTurnosLegados()
// Las filas sembradas de historial pertenecen al cliente semilla Juan
db.prepare("UPDATE historial SET usuario_id = (SELECT id FROM usuarios WHERE email = 'juan@test.com') WHERE usuario_id IS NULL").run()
export default db
