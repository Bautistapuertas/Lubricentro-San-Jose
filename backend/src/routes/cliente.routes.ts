import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import * as clienteService from "../services/cliente.service";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { clienteCreateSchema, clienteUpdateSchema, idParamSchema } from "../validations/cliente.validation.js";

const router = Router();

router.get("/", auth, authorize("ADMIN", "EMPLEADO"), async (_req, res, next) => {
  try {
    const clientes = await clienteService.getAllClientes();
    res.json(clientes);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);
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
      const cliente = await clienteService.createCliente(req.body);
      res.status(201).json(cliente);
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
  validateBody(clienteUpdateSchema),
  async (req, res, next) => {
    try {
      const cliente = await clienteService.updateCliente(req.params.id, req.body);
      if (!cliente) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await clienteService.deleteCliente(req.params.id);
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
