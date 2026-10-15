import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import * as usuarioService from "../services/usuario.service.js";
import * as vehiculosService from "../services/vehiculos.service.js";
import * as mailsService from "../services/mails.service.js";
import * as clientesService from "../services/clientes.service.js";
import { prisma } from "../config/prisma.js";

const router = Router();

// GET /api/dashboard
router.get("/dashboard", auth, authorize("ADMIN", "EMPLEADO"), async (_req, res, next) => {
  try {
    const data = await usuarioService.dashboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/historial
router.get("/historial", auth, async (req, res, next) => {
  try {
    const user = { id: req.user!.sub || req.user!.id, email: req.user!.email };
    const data = await usuarioService.historial(user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/notificaciones
router.get("/notificaciones", auth, async (req, res, next) => {
  try {
    const notifs = await mailsService.listarNotificaciones(req.user!.email);
    res.json(notifs);
  } catch (error) {
    next(error);
  }
});

// POST /api/notificaciones/leer
router.post("/notificaciones/leer", auth, async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    await mailsService.marcarNotificacionesLeidas(ids);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/mails
router.get("/mails", auth, authorize("ADMIN", "EMPLEADO"), async (_req, res, next) => {
  try {
    const mails = await mailsService.listarMails();
    res.json({
      mails,
      db: { ruta: "PostgreSQL (Prisma)", persistente: true },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/mails/prueba
router.post("/mails/prueba", auth, authorize("ADMIN", "EMPLEADO"), async (req, res, next) => {
  try {
    const email = req.user!.email;
    const resultado = await mailsService.enviarMail(
      email,
      "Prueba de envío — Gestión San José",
      `Este es un correo de prueba generado desde el panel de administración el ${new Date().toISOString()}. Si lo estás leyendo, el envío real funciona.`
    );
    res.json({ ok: true, para: email, ...resultado });
  } catch (error) {
    next(error);
  }
});

// GET /api/mis-vehiculos (cliente autenticado)
router.get("/mis-vehiculos", auth, async (req, res, next) => {
  try {
    const cli = await clientesService.porEmail(req.user!.email);
    if (!cli) {
      res.json([]);
      return;
    }
    const vehiculos = await vehiculosService.deCliente(cli.id);
    res.json(vehiculos);
  } catch (error) {
    next(error);
  }
});

export default router;
