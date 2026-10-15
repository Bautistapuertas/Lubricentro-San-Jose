import { Router } from "express";
import * as servicioService from "../services/servicios.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { servicioCreateSchema, servicioUpdateSchema, idParamSchema } from "../validations/servicio.validation.js";

const router = Router();

// GET /servicios (catálogo público)
router.get("/", async (_req, res, next) => {
  try {
    const servicios = await servicioService.listarPublicos();
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

// GET /servicios/todos (administración: incluye no públicos)
router.get("/todos", auth, authorize("ADMIN", "EMPLEADO"), async (_req, res, next) => {
  try {
    const servicios = await servicioService.listarTodos();
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

router.get("/publicos", async (_req, res, next) => {
  try {
    const servicios = await servicioService.listarPublicos();
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const servicio = await servicioService.getById(req.params.id);
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
  authorize("ADMIN", "EMPLEADO"),
  validateBody(servicioCreateSchema),
  async (req, res, next) => {
    try {
      const nuevo = await servicioService.crear(req.body);
      res.status(201).json({ ok: true, id: nuevo.id, servicio: nuevo });
    } catch (error) {
      next(error);
    }
  }
);

const updateHandler = async (req: any, res: any, next: any) => {
  try {
    const editado = await servicioService.editar(req.params.id, req.body);
    if (!editado) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.json({ ok: true, servicio: editado });
  } catch (error) {
    next(error);
  }
};

router.put("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(servicioUpdateSchema), updateHandler);
router.patch("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(servicioUpdateSchema), updateHandler);

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    await servicioService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
