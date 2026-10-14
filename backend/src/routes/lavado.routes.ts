import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import * as lavadoService from "../services/lavado.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { lavadoCreateSchema, lavadoUpdateSchema, idParamSchema } from "../validations/lavado.validation.js";

const router = Router();

router.get("/", auth, authorize("ADMIN", "EMPLEADO"), async (req, res, next) => {
  try {
    const lavados = await lavadoService.getAllLavados();
    res.json(lavados);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const lavado = await lavadoService.getLavadoById(req.params.id);
    if (!lavado) {
      res.status(404).json({ error: "Lavado no encontrado" });
      return;
    }
    res.json(lavado);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  auth,
  authorize("ADMIN", "EMPLEADO"),
  validateBody(lavadoCreateSchema),
  async (req, res, next) => {
    try {
      const lavado = await lavadoService.createLavado(req.body);
      res.status(201).json(lavado);
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
  validateBody(lavadoUpdateSchema),
  async (req, res, next) => {
    try {
      const lavado = await lavadoService.updateLavado(req.params.id, req.body);
      if (!lavado) {
        res.status(404).json({ error: "Lavado no encontrado" });
        return;
      }
      res.json(lavado);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await lavadoService.deleteLavado(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Lavado no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
