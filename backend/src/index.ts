import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import servicioRoutes from "./routes/servicio.routes.js";
import turnoRoutes from "./routes/turno.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import lavadoRoutes from "./routes/lavado.routes.js";
import panelRoutes from "./routes/panel.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { PORT, FRONTEND_URL } from "./config/env.js";

const app = express();

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ mensaje: "API Hello Rubicentro 🐳" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/turnos", turnoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/lavados", lavadoRoutes);
app.use("/api", panelRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
