import { Router } from 'express'
import * as auth from '../controllers/auth.controller.js'

const router = Router()

router.post('/login', auth.loginCliente)
router.post('/admin/login', auth.loginAdmin)
router.post('/logout', auth.logout)
router.post('/registro', auth.registro)
router.post('/recuperar', auth.recuperar)
router.post('/restablecer', auth.restablecer)

export default router
