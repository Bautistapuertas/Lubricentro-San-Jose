import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import vehiculoRoutes from "./routes/vehiculo.routes.js";
import servicioRoutes from "./routes/servicio.routes.js";
import turnoRoutes from "./routes/turno.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import lavadoRoutes from "./routes/lavado.routes.js";
import panelRoutes from "./routes/panel.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { PORT, FRONTEND_URL } from "./config/env.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === FRONTEND_URL ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/turnos", turnoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/lavados", lavadoRoutes);
app.use("/api", panelRoutes);

// Servir frontend compilado si existe (para deploy unificado o Docker)
const candidateDirs = [
  path.resolve(process.cwd(), "..", "frontend", "dist"),
  path.resolve(process.cwd(), "frontend", "dist"),
  path.resolve(process.cwd(), "public"),
];
const distDir = candidateDirs.find((d) => fs.existsSync(d) && fs.existsSync(path.join(d, "index.html")));

if (distDir) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({ mensaje: "API Lubricentro San José 🐳 (PostgreSQL + Prisma)" });
  });
}

// 404 para endpoints de API no encontrados
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "Ruta de API no encontrada" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor Lubricentro corriendo en puerto ${PORT}`);
});

export default app;
