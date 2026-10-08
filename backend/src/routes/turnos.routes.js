import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import * as turnos from '../controllers/turnos.controller.js'

const router = Router()

// Agenda admin
router.get('/', authMiddleware('admin'), turnos.listar)
router.patch('/:id', authMiddleware('admin'), turnos.editar)
router.post('/:id/recordatorio', authMiddleware('admin'), turnos.recordatorio)
router.patch('/:id/estado', authMiddleware('admin'), turnos.cambiarEstado)

// Mis turnos del cliente
router.get('/mios', authMiddleware('cliente'), turnos.misTurnos)

// Reserva (cliente o admin): el 409 de horario ocupado es server-side.
router.post('/', authMiddleware(['cliente', 'admin']), turnos.crear)

// Disponibilidad: el formulario consulta qué horarios quedan libres.
router.get('/disponibles', turnos.disponibles)

export default router
