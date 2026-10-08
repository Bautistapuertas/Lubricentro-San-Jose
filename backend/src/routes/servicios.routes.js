import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import * as servicios from '../controllers/servicios.controller.js'

const router = Router()

// Catálogo público
router.get('/', servicios.listarPublicos)

// Gestión admin
router.get('/todos', authMiddleware('admin'), servicios.listarTodos)
router.post('/', authMiddleware('admin'), servicios.crear)
router.patch('/:id', authMiddleware('admin'), servicios.editar)

export default router
