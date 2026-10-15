import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate.js";
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
      const empleadoId = req.body.empleadoId || req.user?.id || req.user?.sub;
      const lavado = await lavadoService.createLavado({
        ...req.body,
        empleadoId,
      });
      res.status(201).json(lavado);
    } catch (error) {
      next(error);
    }
  }
);

const updateHandler = async (req: any, res: any, next: any) => {
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
};

router.put("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), validateBody(lavadoUpdateSchema), updateHandler);
router.patch("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), validateBody(lavadoUpdateSchema), updateHandler);

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
