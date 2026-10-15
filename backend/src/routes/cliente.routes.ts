import { Router } from "express";
import * as clienteService from "../services/clientes.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { clienteCreateSchema, clienteUpdateSchema, idParamSchema } from "../validations/cliente.validation.js";

const router = Router();

// GET /api/clientes?q=...
router.get("/", auth, authorize("ADMIN", "EMPLEADO"), async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString();
    const clientes = await clienteService.listar(q);
    res.json(clientes);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const cliente = await clienteService.detalle(req.params.id);
    if (!cliente) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  auth,
  authorize("ADMIN", "EMPLEADO"),
  validateBody(clienteCreateSchema),
  async (req, res, next) => {
    try {
      const { nombre, email, telefono, dni } = req.body;
      const existente = await clienteService.porEmail(email);
      if (existente) {
        res.status(409).json({ error: "Ya existe un cliente con ese email" });
        return;
      }
      const cliente = await clienteService.altaOActualizacion({ nombre, email, telefono, dni });
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  }
);

const updateHandler = async (req: any, res: any, next: any) => {
  try {
    const { nombre, telefono, dni } = req.body;
    const cliente = await clienteService.editar(req.params.id, { nombre, telefono, dni });
    if (!cliente) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    const det = await clienteService.detalle(req.params.id);
    res.json(det);
  } catch (error) {
    next(error);
  }
};

router.put("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(clienteUpdateSchema), updateHandler);
router.patch("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(clienteUpdateSchema), updateHandler);

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await clienteService.eliminar(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
