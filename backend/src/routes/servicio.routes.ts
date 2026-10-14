import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import * as servicioService from "../services/servicio.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { servicioCreateSchema, servicioUpdateSchema, idParamSchema } from "../validations/servicio.validation.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const servicios = servicioService.getAllServicios();
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

router.get("/publicos", async (_req, res, next) => {
  try {
    const servicios = servicioService.getServiciosPublicos();
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const servicio = servicioService.getServicioById(req.params.id);
    if (!servicio) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.json(servicio);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  auth,
  authorize("ADMIN"),
  validateBody(servicioCreateSchema),
  async (req, res, next) => {
    try {
      const servicio = await servicioService.createServicio(req.body);
      res.status(201).json(servicio);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  auth,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  validateBody(servicioUpdateSchema),
  async (req, res, next) => {
    try {
      const servicio = await servicioService.updateServicio(req.params.id, req.body);
      if (!servicio) {
        res.status(404).json({ error: "Servicio no encontrado" });
        return;
      }
      res.json(servicio);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await servicioService.deleteServicio(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
