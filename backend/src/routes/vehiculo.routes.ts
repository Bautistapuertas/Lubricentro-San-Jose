import { Router } from "express";
import * as vehiculosService from "../services/vehiculos.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { vehiculoCreateSchema, vehiculoUpdateSchema, idParamSchema } from "../validations/vehiculo.validation.js";
import { prisma } from "../config/prisma.js";

const router = Router();

// GET /api/vehiculos?q=...
router.get("/", auth, authorize("ADMIN", "EMPLEADO"), async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString();
    const vehiculos = await vehiculosService.listar(q);
    res.json(vehiculos);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id: Number(req.params.id) },
      include: { cliente: true, turnos: true },
    });
    if (!vehiculo) {
      res.status(404).json({ error: "Vehículo no encontrado" });
      return;
    }
    const p = vehiculosService.proximoService(vehiculo, vehiculo.km);
    res.json({
      ...vehiculo,
      estado_service: vehiculosService.estadoService(vehiculo, vehiculo.km),
      proximo_km_en: p.vencimientoKm,
      vencimiento_fecha: p.vencimientoFecha,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  auth,
  authorize("ADMIN", "EMPLEADO"),
  validateBody(vehiculoCreateSchema),
  async (req, res, next) => {
    try {
      const { cliente_id, clienteId, patente, marca, modelo, km } = req.body || {};
      const cId = cliente_id || clienteId || null;
      if (cId) {
        const existeCliente = await prisma.cliente.findUnique({ where: { id: Number(cId) } });
        if (!existeCliente) {
          res.status(400).json({ error: "El cliente indicado no existe" });
          return;
        }
      }
      const v = await vehiculosService.altaOActualizacion(cId ? Number(cId) : null, {
        patente,
        marca,
        modelo,
        km,
      });
      res.status(201).json(v);
    } catch (error) {
      next(error);
    }
  }
);

const updateHandler = async (req: any, res: any, next: any) => {
  try {
    const { marca, modelo, km } = req.body || {};
    const v = await vehiculosService.editar(req.params.id, { marca, modelo, km });
    if (!v) {
      res.status(404).json({ error: "Vehículo no encontrado" });
      return;
    }
    res.json(v);
  } catch (error) {
    next(error);
  }
};

router.put("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(vehiculoUpdateSchema), updateHandler);
router.patch("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(vehiculoUpdateSchema), updateHandler);

// POST /api/vehiculos/:id/service
router.post("/:id/service", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const v = await vehiculosService.registrarService(req.params.id, req.body || {});
    if (!v) {
      res.status(404).json({ error: "Vehículo no encontrado" });
      return;
    }
    res.json({
      ok: true,
      vehiculo: v,
      estado: vehiculosService.estadoService(v, v.km),
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await vehiculosService.eliminar(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Vehículo no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
