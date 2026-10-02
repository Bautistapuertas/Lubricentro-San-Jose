const BASE = 'http://localhost:3001/api'
const email = 'puertasbauti7@gmail.com'
const post = async (u, b, t) => { const r = await fetch(`${BASE}${u}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(b) }); return { status: r.status, data: await r.json().catch(() => ({})) } }
const patch = async (u, b, t) => { const r = await fetch(`${BASE}${u}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(b) }); return { status: r.status, data: await r.json().catch(() => ({})) } }
const get = async (u, t) => { const r = await fetch(`${BASE}${u}`, { headers: { Authorization: `Bearer ${t}` } }); return { status: r.status, data: await r.json().catch(() => ({})) } }

console.log('1. Login cliente...')
let r = await post('/auth/login', { email, password: 'clientepuertas123' })
console.log('   →', r.status, r.data.usuario?.nombre, r.data.usuario?.rol)
const tokenC = r.data.token

console.log('2. Cliente crea turno...')
r = await post('/turnos', { vehiculo: 'Toyota Yaris · CD 555 AB', servicios: ['Lavado premium'], fecha: '2026-10-05', hora: '10:00' }, tokenC)
console.log('   →', r.status, r.data)
const idTurno = r.data.id

console.log('3. Admin login y ver notificaciones...')
const a = await post('/auth/admin/login', { email: 'admin@sanjose.com', password: 'admin123' })
const tokenA = a.data.token
r = await get('/notificaciones', tokenA)
console.log('   → notificaciones:', r.data.length > 0 ? r.data[0].texto : '(ninguna)')

console.log('4. Admin confirma el turno (email al cliente)...')
r = await patch(`/turnos/${idTurno}/estado`, { estado: 'Confirmado' }, tokenA)
console.log('   →', r.status, r.data)

console.log('5. Admin envía recordatorio (email al cliente)...')
r = await post(`/turnos/${idTurno}/recordatorio`, {}, tokenA)
console.log('   →', r.status, r.data)

console.log('6. Mails salientes registrados:')
r = await get('/mails', tokenA)
r.data.slice(0, 3).forEach((m) => console.log(`   Para: ${m.para} | Asunto: ${m.asunto} | ${m.creado}`))
console.log('--- FIN ---')
