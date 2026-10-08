import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import db from '../config/db.js'
import * as clientes from '../services/clientes.service.js'
import * as vehiculos from '../services/vehiculos.service.js'

// Todo el CRUD de clientes/vehículos es de admin: los datos de contacto y
// patentes son PII que un cliente no debería poder listar.
const router = Router()
const admin = authMiddleware('admin')

router.get('/clientes', admin, (req, res) => {
  res.json(clientes.listar(req.query.q))
})

router.get('/clientes/:id', admin, (req, res) => {
  const c = clientes.detalle(req.params.id)
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' })
  res.json(c)
})

// Alta/edición manual desde el panel. El email es la clave de unicidad.
router.post('/clientes', admin, (req, res) => {
  const { nombre, email, telefono, dni } = req.body || {}
  if (!nombre || !email) return res.status(400).json({ error: 'Nombre y email son obligatorios' })
  if (clientes.porEmail(email)) return res.status(409).json({ error: 'Ya existe un cliente con ese email' })
  const c = clientes.altaOActualizacion({ nombre, email, telefono, dni })
  res.status(201).json(c)
})

router.patch('/clientes/:id', admin, (req, res) => {
  const c = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' })
  const { nombre, telefono, dni } = req.body || {}
  db.prepare('UPDATE clientes SET nombre = ?, telefono = ?, dni = ? WHERE id = ?')
    .run(nombre ?? c.nombre, telefono ?? c.telefono, dni ?? c.dni, c.id)
  res.json(clientes.detalle(c.id))
})

router.get('/vehiculos', admin, (req, res) => {
  res.json(vehiculos.listar(req.query.q))
})

router.post('/vehiculos', admin, (req, res) => {
  const { cliente_id, patente, marca, modelo, km } = req.body || {}
  if (!patente) return res.status(400).json({ error: 'La patente es obligatoria' })
  const clienteId = cliente_id || null
  if (clienteId && !db.prepare('SELECT id FROM clientes WHERE id = ?').get(clienteId)) {
    return res.status(400).json({ error: 'El cliente indicado no existe' })
  }
  const v = vehiculos.altaOActualizacion(clienteId, { patente, marca, modelo, km })
  res.status(201).json(v)
})

router.patch('/vehiculos/:id', admin, (req, res) => {
  const { marca, modelo, km } = req.body || {}
  const v = vehiculos.editar(req.params.id, { marca, modelo, km })
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' })
  res.json(v)
})

// Registrar un service: guarda el km del momento y recalcula el próximo.
router.post('/vehiculos/:id/service', admin, (req, res) => {
  const v = vehiculos.registrarService(req.params.id, req.body || {})
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' })
  res.json({ ok: true, vehiculo: v, estado: vehiculos.estadoService(v, v.km) })
})

export default router
