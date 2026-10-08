import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

const json = (data) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })

const SERVICIOS = [
  { id: 1, nombre: 'Cambio de aceite', categoria: 'Mantenimiento', precio: 28000, duracion: 60, publico: 1 },
  { id: 2, nombre: 'Lavado completo', categoria: 'Lavado', precio: 4500, duracion: 45, publico: 1 },
]

// FE-02: el formulario consulta los horarios ocupados del día elegido.
const horariosDelDia = (url) => {
  // en el mock ningún día tiene reservas: todos los horarios quedan libres
  return json({ fecha: 'x', horarios: ['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM'], ocupados: [], libres: ['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM'] })
}

const TURNOS = [
  { id: 1, cliente: 'Lucía Fernández', vehiculo: 'Toyota Etios · AE 456 RT', servicio: 'Cambio de aceite', fecha: '2026-09-30', hora: '08:00', estado: 'Confirmado' },
  { id: 2, cliente: 'Diego Martínez', vehiculo: 'Ford Ranger · AC 980 KL', servicio: 'Lavado premium', fecha: '2026-09-30', hora: '09:30', estado: 'En taller' },
  { id: 3, cliente: 'Mariana López', vehiculo: 'Chevrolet Onix · AF 221 NM', servicio: 'Alineación y balanceo', fecha: '2026-09-30', hora: '13:30', estado: 'Pendiente' },
  { id: 4, cliente: 'Sofía García', vehiculo: 'Peugeot 208 · AG 554 BC', servicio: 'Lavado completo', fecha: '2026-09-30', hora: '16:30', estado: 'Confirmado' },
]

vi.stubGlobal('fetch', vi.fn((url, opts = {}) => {
  const u = String(url)
  if (u.includes('/api/auth/register') || u.includes('/api/auth/registro')) return json({ ok: true })
  if (u.includes('/api/auth/admin/login')) return json({ token: 'tok', usuario: { nombre: 'Martín', email: 'a@b.com', rol: 'admin' } })
  if (u.includes('/api/auth/login')) {
    const body = JSON.parse(opts.body || '{}')
    if (body.email?.includes('admin')) return json({ token: 'tok', usuario: { nombre: 'Martín', email: body.email, rol: 'admin' } })
    return json({ token: 'tok', usuario: { nombre: 'Juan', email: body.email, rol: 'cliente' } })
  }
  if (u.includes('/api/dashboard')) return json({ total: 12, porEstado: { Confirmado: 5 }, proximos: [], enTaller: 3, completados: 7, ingresos: 418500 })
  if (u.includes('/api/turnos/') && u.includes('/recordatorio')) return json({ ok: true })
  if (u.includes('/api/turnos') && opts.method === 'PATCH') {
    const b = JSON.parse(opts.body || '{}')
    if (b.estado === 'Confirmado' && u.includes('/api/turnos/3')) {
      return json({ ok: true, estado: 'Confirmado', enviado: true })
    }
    return json({ ok: true })
  }
  if (u.includes('/api/turnos') && opts.method === 'POST') return json({ ok: true, id: 99 })
  if (u.includes('/api/turnos/disponibles')) return horariosDelDia(url)
  if (u.includes('/api/turnos')) return json({ turnos: TURNOS, total: TURNOS.length, pagina: 1, paginas: 1 })
  if (u.includes('/api/servicios')) return json(SERVICIOS)
  if (u.includes('/api/turnos/mios')) return json([])
  if (u.includes('/api/notificaciones')) {
    if (opts.method === 'POST') return json({ ok: true })
    return json([
      { id: 1, turno_id: 3, tipo: 'nuevo_turno', texto: 'Nuevo turno de Mariana López', creado: 'Hace 2 min', leida: 0 },
      { id: 2, turno_id: 4, tipo: 'nuevo_turno', texto: 'Nuevo turno de Sofía García', creado: 'Hace 5 min', leida: 1 },
    ])
  }
  if (u.includes('/api/mails/prueba') && opts.method === 'POST') {
    return json({ ok: true, para: 'a@b.com', estado: 'simulado', error: null })
  }
  if (u.includes('/api/mails')) {
    return json({
      configurado: false,
      remitente: null,
      db: { ruta: '/opt/render/project/src/server/lubricentro.db', persistente: false },
      resumen: { enviado: 1, simulado: 1, error: 1, sin_dato: 1 },
      mails: [
        { id: 4, para: 'juan@test.com', asunto: 'Turno confirmado', cuerpo: '...', estado: 'error', error: '535 Incorrect authentication', creado: '2026-10-03 14:05:00' },
        { id: 3, para: 'juan@test.com', asunto: 'Turno registrado', cuerpo: '...', estado: 'simulado', error: null, creado: '2026-10-03 14:04:00' },
        { id: 2, para: 'lucia@test.com', asunto: 'Recordatorio de turno', cuerpo: '...', estado: 'enviado', error: null, creado: '2026-10-03 14:00:00' },
        { id: 1, para: 'lucia@test.com', asunto: 'Turno cancelado', cuerpo: '...', estado: 'sin_dato', error: null, creado: '2026-09-30 11:00:00' },
      ],
    })
  }
  if (u.includes('/api/clientes')) return json([])
  if (u.includes('/api/vehiculos')) return json([])
  if (u.includes('/api/historial')) return json({ historial: [{ id: 1, fecha: '18 SEP 2026', titulo: 'Cambio de aceite y filtros', vehiculo: 'VW Gol', detalle: 'Aceite 5W-40', estado: 'Completado', importe: 42800, comprobante: '#1' }], total: 1, pagina: 1, paginas: 1 })
  return json({})
}))
