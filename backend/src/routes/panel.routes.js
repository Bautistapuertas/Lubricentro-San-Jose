import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import '../config/db.js'
import * as turnos from '../controllers/turnos.controller.js'
import * as servicios from '../controllers/servicios.controller.js'
import * as usuarios from '../services/usuarios.service.js'
import * as vehiculosService from '../services/vehiculos.service.js'

const router = Router()

router.get('/historial', authMiddleware('cliente'), (req, res) => {
  res.json(usuarios.historial(req.usuario, req.query))
})

router.get('/notificaciones', authMiddleware(['cliente', 'admin']), servicios.notificaciones)
router.post('/notificaciones/leer', authMiddleware(['cliente', 'admin']), servicios.notificacionesLeidas)
router.get('/dashboard', authMiddleware('admin'), turnos.dashboard)
router.get('/mails', authMiddleware('admin'), servicios.mails)
router.post('/mails/prueba', authMiddleware('admin'), servicios.mailPrueba)
// Mis vehículos: para el selector de ReservarTurno. Devuelve los vehículos
// vinculados a la cuenta cliente autenticada (con km y próximo service).
router.get('/mis-vehiculos', authMiddleware('cliente'), (req, res) => {
  const cli = db.prepare('SELECT id FROM clientes WHERE email = ?').get(req.usuario.email)
  if (!cli) return res.json([])
  res.json(vehiculosService.deCliente(cli.id))
})

router.get('/clientes', authMiddleware('admin'), turnos.clientes)
router.get('/vehiculos', authMiddleware('admin'), turnos.vehiculos)

export default router
