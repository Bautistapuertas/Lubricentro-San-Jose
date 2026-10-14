import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get(
  "/",
  auth,
  authorize("ADMIN", "EMPLEADO", "CLIENTE"),
  async (req, res, next) => {
    try {
      const [clientes, servicios, turnos, historial] = await Promise.all([
        prisma.cliente.count(),
        prisma.servicio.count(),
        prisma.turno.count(),
        prisma.historial.count(),
      ]);

      res.json({
        clientes,
        servicios,
        turnos,
        historial,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
