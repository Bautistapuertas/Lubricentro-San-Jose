import { Router } from "express";
import * as turnosService from "../services/turnos.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { turnoCreateSchema, turnoUpdateSchema, idParamSchema } from "../validations/turno.validation.js";

const router = Router();

// GET /api/turnos/disponibles?fecha=... (público / cliente)
router.get("/disponibles", async (req, res, next) => {
  try {
    const fecha = (req.query.fecha || "").toString().trim();
    if (!fecha) {
      res.status(400).json({ error: "Indicá la fecha para consultar los horarios" });
      return;
    }
    const ocupadas = await turnosService.ocupados(fecha);
    res.json({
      fecha,
      horarios: turnosService.HORARIOS,
      ocupados: ocupadas,
      libres: turnosService.HORARIOS.filter((h) => !ocupadas.includes(h)),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/turnos/mios (cliente autenticado)
router.get("/mios", auth, async (req, res, next) => {
  try {
    const turnos = await turnosService.misTurnos({
      id: req.user!.sub || req.user!.id,
      email: req.user!.email,
    });
    res.json(turnos);
  } catch (error) {
    next(error);
  }
});

// GET /api/turnos (Admin agenda paginada o lista para empleados)
router.get("/", auth, authorize("ADMIN", "EMPLEADO"), async (req, res, next) => {
  try {
    const resultado = await turnosService.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", auth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const turno = await turnosService.getById(req.params.id);
    if (!turno) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }
    res.json(turno);
  } catch (error) {
    next(error);
  }
});

// POST /api/turnos (crear turno - cliente o admin)
router.post("/", auth, validateBody(turnoCreateSchema), async (req, res, next) => {
  try {
    const { cliente, vehiculo, servicios, fecha, hora, nota, dni, telefono, km, email } = req.body || {};

    const veh = vehiculo || (req.body.patente ? `${req.body.marca || ""} ${req.body.modelo || ""} · ${req.body.patente}`.trim() : "Vehículo sin asignar");
    const srvs = Array.isArray(servicios) && servicios.length > 0
      ? servicios
      : [req.body.servicio || req.body.tipoServicio || "Servicio general"];

    const libre = await turnosService.horarioLibre(fecha, hora);
    if (!libre) {
      res.status(409).json({
        error: `El horario de las ${hora} para el día ${fecha} ya está reservado. Elegí otro horario.`,
      });
      return;
    }

    const user = {
      id: req.user!.sub || req.user!.id,
      nombre: (req.user as any).nombre || cliente || "Cliente",
      email: req.user!.email,
      rol: req.user!.rol,
    };

    const id = await turnosService.crear(user, {
      cliente,
      vehiculo: veh,
      servicios: srvs,
      fecha,
      hora,
      nota,
      dni,
      telefono,
      km,
      email,
    });

    res.status(201).json({ ok: true, id });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/turnos/:id/estado
router.patch("/:id/estado", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const { estado, km } = req.body || {};
    const r = await turnosService.cambiarEstado(req.params.id, estado, km);
    if (r.error === "invalido") {
      res.status(400).json({ error: "Estado inválido" });
      return;
    }
    if (r.error === "no_encontrado") {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/turnos/:id/recordatorio
router.post("/:id/recordatorio", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const t = await turnosService.enviarRecordatorio(req.params.id);
    if (!t) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// PUT y PATCH para editar/reprogramar
const updateHandler = async (req: any, res: any, next: any) => {
  try {
    const r = await turnosService.editar(req.params.id, req.body || {});
    if (!r) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }
    if (r.error === "ocupado") {
      res.status(409).json({
        error: `El horario de las ${r.hora} para el día ${r.fecha} ya está reservado. Elegí otro horario.`,
      });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

router.put("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(turnoUpdateSchema), updateHandler);
router.patch("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(turnoUpdateSchema), updateHandler);

router.delete("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await turnosService.eliminar(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
