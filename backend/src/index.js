import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import authRoutes from './routes/auth.routes.js'
import turnosRoutes from './routes/turnos.routes.js'
import serviciosRoutes from './routes/servicios.routes.js'
import entidadesRoutes from './routes/entidades.routes.js'
import panelRoutes from './routes/panel.routes.js'
import './config/db.js'

const app = express()

app.use(cors())
app.use(express.json())

// En producción servimos el build del frontend desde el mismo servidor:
// una sola URL (Render) sirve la app de React y la API juntas.
const distDir = path.join(process.cwd(), 'frontend', 'dist')
app.use(express.static(distDir))

app.use('/api/auth', authRoutes)
app.use('/api/turnos', turnosRoutes)
app.use('/api/servicios', serviciosRoutes)
app.use('/api', entidadesRoutes)
app.use('/api', panelRoutes)

// Cualquier ruta no-API devuelve la app de React (SPA).
app.get(/^\/(?!api\/).*/, (req, res) => {
  const index = path.join(distDir, 'index.html')
  if (!fs.existsSync(index)) {
    return res
      .status(503)
      .send('Frontend no compilado: ejecutá `npm run build` (genera frontend/dist) y recargá.')
  }
  res.sendFile(index)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor Lubricentro San José corriendo en puerto ${PORT}`)
})

export default app
