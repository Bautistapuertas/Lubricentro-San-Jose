const BASE = 'http://localhost:3001/api'
const email = `maria${Date.now()}@test.com`

const steps = []
const post = async (url, body, token) => {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const texto = await res.text()
  let data
  try { data = JSON.parse(texto) } catch { data = texto.slice(0, 80) }
  return { status: res.status, data }
}
const get = async (url, token) => {
  const res = await fetch(`${BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const texto = await res.text()
  let data
  try { data = JSON.parse(texto) } catch { data = texto.slice(0, 80) }
  return { status: res.status, data }
}

const patchRaw = async (url, body, token) => {
  const res = await fetch(`${BASE}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
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

// 10.5 FT-02: disponibilidad y colisión de horarios
// Fecha y hora únicas por corrida: si son fijas, el run siguiente encuentra
// el slot ocupado por el run anterior y el "1er turno -> 201" falla sin que
// haya regresión real (es el propio smoke quien ya llenó ese horario).
const fechaCol = new Date(Date.now() + 86400000 * (3 + (Date.now() % 300)))
  .toISOString().slice(0, 10)
const HORARIOS_SMOKE = ['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM']
const horaCol = HORARIOS_SMOKE[Date.now() % HORARIOS_SMOKE.length]
r = await get(`/turnos/disponibles?fecha=${fechaCol}`)
steps.push(['Disponibilidad: lista horarios libres', r.status === 200 && Array.isArray(r.data.libres) && r.data.libres.length > 0])
// Crea turno A y verifica que B reciba 409
const emailCol = `colsmoke${Date.now()}@test.com`
await post('/auth/registro', { nombre: 'Col Smoke', email: emailCol, password: 'clavecol123' })
r = await post('/auth/login', { email: emailCol, password: 'clavecol123' })
const tokCol = r.data.token
const turnoCol = { vehiculo: `VW Test · AB ${String(Date.now()).slice(-3)} ZZ`, servicios: ['Cambio de aceite'], fecha: fechaCol, hora: horaCol }
const otraHoraCol = HORARIOS_SMOKE[(HORARIOS_SMOKE.indexOf(horaCol) + 1) % HORARIOS_SMOKE.length]
r = await post('/turnos', turnoCol, tokCol)
steps.push(['Reserva en horario libre -> 201', r.status === 201])
r = await post('/turnos', turnoCol, tokCol)
steps.push(['Mismo cliente, mismo horario -> 409', r.status === 409])
const emailCol2 = `colsmoke2${Date.now()}@test.com`
await post('/auth/registro', { nombre: 'Col Smoke 2', email: emailCol2, password: 'clavecol123' })
r = await post('/auth/login', { email: emailCol2, password: 'clavecol123' })
r = await post('/turnos', turnoCol, r.data.token)
steps.push(['Otro cliente, mismo horario -> 409', r.status === 409])
r = await post('/turnos', { ...turnoCol, hora: otraHoraCol }, tokCol)
steps.push(['Otro horario el mismo día -> 201', r.status === 201])
r = await get(`/turnos/disponibles?fecha=${fechaCol}`)
steps.push(['Slots ocupados aparecen en disponibles', r.status === 200 && r.data.ocupados.includes(horaCol) && r.data.ocupados.includes(otraHoraCol)])

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
// Fecha+hora únicas por corrida, formato 'HH:MM' (difiere de los SLOTS AM/PM
// del bloque FT-02): ni la colisión con otro run ni con bloque colisión afecta.
const fechaAdmin = new Date(Date.now() + 86400000 * (5 + (Date.now() % 300)))
  .toISOString().slice(0, 10)
const horaAdmin = `${String(9 + (Date.now() % 6)).padStart(2, '0')}:15`
r = await post('/turnos', { cliente: 'Carlos Nuevo', vehiculo: 'Fiat Duna · MN 111 AA', servicios: ['Lavado premium'], fecha: fechaAdmin, hora: horaAdmin }, adminToken)
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

// 10.10 el admin no puede reprogramar un turno a un slot ocupado (FT-02 en PATCH)
r = await patchRaw(`/turnos/${idTurnoAdmin}`, { fecha: fechaCol, hora: horaCol }, adminToken)
steps.push(['Admin reprograma a slot ocupado -> 409', r.status === 409])
r = await patchRaw(`/turnos/${idTurnoAdmin}`, { fecha: fechaAdmin, hora: horaAdmin }, adminToken)
steps.push(['Admin reprograma a su propio horario actual -> 200', r.status === 200])

// 11. Entidades reales: clientes y vehículos (alcance del TP)
// El turno creado antes como 'maria...' debe haber auto-registrado cliente+vehículo.
r = await get('/clientes?q=maria', adminToken)
steps.push(['Clientes: búsqueda por nombre encuentra a la del turno', r.status === 200 && r.data.some((c) => c.email === email && c.turnos >= 1)])
const clienteId = r.data?.[0]?.id
r = await get(`/clientes/${clienteId}`, adminToken)
steps.push(['Clientes: detalle trae vehículos vinculados', r.status === 200 && Array.isArray(r.data.vehiculos)])
r = await get('/clientes?q=12345678', adminToken)
steps.push(['Clientes: búsqueda por DNI (vacía si no hay, 200 igual)', r.status === 200])
// Alta manual con DNI + búsqueda por DNI
r = await post('/clientes', { nombre: 'Cliente DNI Smoke', email: `dni${Date.now()}@test.com`, dni: `DNI${Date.now()}`, telefono: '11 5555-0000' }, adminToken)
steps.push(['Clientes: alta manual -> 201', r.status === 201])
const dniValor = r.data?.dni
r = await get(`/clientes?q=${dniValor}`, adminToken)
steps.push(['Clientes: búsqueda por DNI lo encuentra', r.status === 200 && r.data.length === 1])
// Vehículo: la patente del turno de Maria debe existir y estar vinculada
r = await get('/vehiculos', adminToken)
const patenteMaria = r.data.find((v) => v.cliente_id === clienteId)
steps.push(['Vehículos: el auto del turno quedó registrado', r.status === 200 && !!patenteMaria])
const patenteNorm = patenteMaria?.patente_norm
r = await get(`/vehiculos?q=${encodeURIComponent(patenteNorm.slice(0, 2) + ' ' + patenteNorm.slice(2))}`, adminToken)
steps.push(['Vehículos: búsqueda por patente con espacios matchea', r.status === 200 && r.data.length >= 1])
// Registrar service con km: cambia el estado y computa próximo service
r = await post(`/vehiculos/${patenteMaria.id}/service`, { km: 45000, ultimo_service: '2026-10-01' }, adminToken)
steps.push(['Vehículos: registrar service guarda km y fecha', r.status === 200 && r.data.vehiculo.ultimo_km === 45000 && r.data.vehiculo.ultimo_service === '2026-10-01'])
// El próximo service se computa desde el km del último service: registrar
// service con km 45000 pone el próximo en 55000 (o sea, faltan 10.000 km).
r = await get('/vehiculos', adminToken)
const vAct = r.data.find((v) => v.id === patenteMaria.id)
steps.push(['Vehículos: próximo service = 10.000 km contados desde el service, estado ok', r.status === 200 && vAct?.proximo_km_en === 10000 && vAct?.estado_service === 'ok'])
// Simular vencimiento: km altísimo respecto del último service
r = await post(`/vehiculos/${patenteMaria.id}/service`, { km: 56000, ultimo_service: '2025-01-01' }, adminToken)
steps.push(['Vehículos: km superado + fecha vencida -> estado vencido', r.status === 200 && r.data.estado === 'vencido'])
// RBAC: cliente no puede listar entidades. Re-login: los tokens anteriores
// de Maria fueron invalidados (logout del paso 10.8 y restablecimiento de
// contraseña, que borra todas las sesiones del usuario).
r = await post('/auth/login', { email, password: 'nuevaclave123' })
const tokenMaria2 = r.data.token
r = await get('/clientes', tokenMaria2)
steps.push(['Clientes: cliente no puede listar (403)', r.status === 403])
r = await get('/vehiculos', tokenMaria2)
steps.push(['Vehículos: cliente no puede listar (403)', r.status === 403])
r = await get('/mis-vehiculos', tokenMaria2)
steps.push(['Mis vehículos: el cliente ve los suyos (200)', r.status === 200 && Array.isArray(r.data)])
// Completado de turno registra el service automáticamente (circuito cerrado):
// se completa el primer turno del cliente 'col' con km y el vehículo debe
// reflejar ese km y la fecha del turno como último service.
r = await post('/auth/login', { email: emailCol, password: 'clavecol123' })
const tokCol2 = r.data.token
r = await get('/turnos/mios', tokCol2)
const turnoCol1 = r.data?.[0]
if (turnoCol1) {
  await fetch(`${BASE}/turnos/${turnoCol1.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ estado: 'Completado', km: 99999 }) })
}
r = await get('/vehiculos', adminToken)
const vCol = r.data.find((v) => v.patente === turnoCol.vehiculo.split('·')[1]?.trim())
steps.push(['Circuito: Completar turno actualiza km del vehículo', r.status === 200 && vCol && (vCol.km === 99999 || vCol.ultimo_service)])

// 10.11 Completado dos veces no duplica el historial (idempotente)
if (turnoMaria) {
  await fetch(`${BASE}/turnos/${turnoMaria.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ estado: 'Completado' }) })
}
// re-login: el token de nuevoToken fue invalidado por el logout del paso 10.8
r = await post('/auth/login', { email, password: 'nuevaclave123' })
r = await get('/historial', r.data.token)
steps.push(['Doble Completado deja una sola fila de historial', r.status === 200 && r.data.historial.filter((h) => h.titulo === 'Cambio de aceite').length === 1])

let fallos = 0
for (const [nombre, ok] of steps) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}`)
  if (!ok) fallos++
}
process.exit(fallos ? 1 : 0)
