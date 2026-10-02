const BASE = 'http://localhost:3001/api'
const email = `maria${Date.now()}@test.com`

const steps = []
const post = async (url, body, token) => {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}
const get = async (url, token) => {
  const res = await fetch(`${BASE}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  return { status: res.status, data: await res.json() }
}

// 1. intento de login sin cuenta -> debe fallar
let r = await post('/auth/login', { email: 'random@x.com', password: 'cualquiera123' })
steps.push(['Login con email inexistente -> 401', r.status === 401])

// 2. registro
r = await post('/auth/registro', { nombre: 'Maria Lopez', email, password: 'miclave123' })
steps.push(['Registro -> 201', r.status === 201])

// 3. registro duplicado -> 409
r = await post('/auth/registro', { nombre: 'Maria Lopez', email, password: 'miclave123' })
steps.push(['Registro duplicado -> 409', r.status === 409])

// 4. login con la cuenta nueva
r = await post('/auth/login', { email, password: 'miclave123' })
const token = r.data.token
steps.push(['Login con cuenta registrada -> 200 + token', r.status === 200 && !!token])

// 5. contraseña incorrecta -> 401
r = await post('/auth/login', { email, password: 'incorrecta1' })
steps.push(['Login con contraseña incorrecta -> 401', r.status === 401])

// 6. historial requiere token
r = await get('/historial')
steps.push(['Historial sin token -> 401', r.status === 401])
r = await get('/historial', token)
steps.push(['Historial con token de cliente -> 200', r.status === 200])

// 7. crear turno como cliente y leerlo como admin
r = await post('/turnos', { cliente: 'Maria Lopez', vehiculo: 'VW Gol · AB 123 CD', servicios: ['Cambio de aceite'], fecha: 'Martes 19', hora: '11:00 AM' }, token)
steps.push(['Cliente crea turno -> 201', r.status === 201])
const turnoCreado = r.status === 201 ? { id: r.data.id } : null

const adminLogin = await post('/auth/admin/login', { email: 'admin@sanjose.com', password: 'admin123' })
const adminToken = adminLogin.data.token
steps.push(['Login admin con credenciales semilla -> 200', adminLogin.status === 200])

r = await get('/turnos', token)
steps.push(['Cliente no puede ver turnos de admin (403)', r.status === 403])

r = await get('/turnos', adminToken)
steps.push(['Admin lista turnos -> 200', r.status === 200 && Array.isArray(r.data.turnos) && typeof r.data.total === 'number'])
const primerTurno = r.data?.turnos?.[0]

// 8. cliente intenta cambiar estado de turno (endpoint de admin)
r = await fetch(`${BASE}/turnos/${primerTurno.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ estado: 'Completado' }) })
steps.push(['Cliente no puede cambiar estado (403)', r.status === 403])

// 9. admin cambia estado
r = await fetch(`${BASE}/turnos/${primerTurno.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ estado: 'Completado' }) })
steps.push(['Admin cambia estado -> 200', r.status === 200])

// 10. estado inválido
r = await fetch(`${BASE}/turnos/${primerTurno.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ estado: 'Volando' }) })
steps.push(['Estado inválido -> 400', r.status === 400])

// 10.5 paginación de turnos
r = await get('/turnos?pagina=2&porPagina=2', adminToken)
steps.push(['Paginación de turnos (página 2)', r.status === 200 && r.data.turnos.length <= 2 && r.data.pagina === 2])
r = await get('/turnos?q=maria', adminToken)
steps.push(['Búsqueda server-side de turnos (q=maria)', r.status === 200 && r.data.turnos.length > 0 && r.data.turnos.every((t) => t.cliente.toLowerCase().includes('maria'))])

// 11. recuperación de contraseña
r = await post('/auth/recuperar', { email })
steps.push(['Recuperar contraseña -> 200 + token demo', r.status === 200 && !!r.data.token])
r = await post('/auth/restablecer', { token: r.data.token, password: 'nuevaclave123' })
steps.push(['Restablecer contraseña -> 200', r.status === 200])
r = await post('/auth/login', { email, password: 'nuevaclave123' })
steps.push(['Login con nueva contraseña -> 200', r.status === 200 && !!r.data.token])
const nuevoToken = r.data.token
r = await post('/auth/restablecer', { token: 'tokenfalso', password: 'nuevaclave123' })
steps.push(['Token inválido -> 400', r.status === 400])

// 10.6 turno completado aparece en el historial del cliente dueño
r = await get('/turnos', adminToken)
const turnoMaria = turnoCreado || r.data.turnos.find((t) => t.cliente === 'Maria Lopez' && t.estado === 'Pendiente' && t.usuario_id)
if (turnoMaria) {
  await fetch(`${BASE}/turnos/${turnoMaria.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ estado: 'Completado' }) })
}
r = await get('/historial', nuevoToken)
steps.push(['Turno completado aparece en el historial del cliente', r.status === 200 && r.data.historial.some((h) => h.titulo === 'Cambio de aceite')])

// 10.7 mis turnos solo del cliente autenticado
r = await get('/turnos/mios', nuevoToken)
steps.push(['Mis turnos -> 200 solo del cliente', r.status === 200 && Array.isArray(r.data) && r.data.every((t) => t.cliente === 'Maria Lopez')])

// 10.8 logout invalida el token en el servidor
await fetch(`${BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${nuevoToken}` } })
r = await get('/turnos/mios', nuevoToken)
steps.push(['Token inválido después de logout -> 401', r.status === 401])

// 10.9 admin crea turno, envía recordatorio, edita servicio
r = await post('/turnos', { cliente: 'Carlos Nuevo', vehiculo: 'Fiat Duna · MN 111 AA', servicios: ['Lavado premium'], fecha: '2026-10-03', hora: '10:00' }, adminToken)
steps.push(['Admin crea turno -> 201', r.status === 201 && !!r.data.id])
const idTurnoAdmin = r.data.id
r = await post(`/turnos/${idTurnoAdmin}/recordatorio`, {}, adminToken)
steps.push(['Admin envía recordatorio -> 200', r.status === 200])
r = await post('/servicios', { nombre: 'Sanitización', categoria: 'Lavado', precio: 6000, duracion: 30 }, adminToken)
steps.push(['Admin crea servicio (borrador) -> 201', r.status === 201])
const idServicio = r.data.id
await fetch(`${BASE}/servicios/${idServicio}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ publico: 1 }) })
r = await get('/servicios')
steps.push(['Servicio publicado aparece al público', r.status === 200 && r.data.some((s) => s.nombre === 'Sanitización')])
r = await get('/dashboard', adminToken)
steps.push(['Dashboard trae ingresos reales', r.status === 200 && typeof r.data.ingresos === 'number' && r.data.completados > 0])

let fallos = 0
for (const [nombre, ok] of steps) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}`)
  if (!ok) fallos++
}
process.exit(fallos ? 1 : 0)
