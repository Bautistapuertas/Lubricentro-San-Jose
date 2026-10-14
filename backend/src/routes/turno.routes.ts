import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import * as turnoService from "../services/turno.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { turnoCreateSchema, turnoUpdateSchema, idParamSchema } from "../validations/turno.validation.js";

const router = Router();

router.get("/", auth, authorize("ADMIN", "EMPLEADO", "CLIENTE"), async (req, res, next) => {
  try {
    const turnos = await turnoService.getTurnosByCliente(req.user!.sub);
    res.json(turnos);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  auth,
  authorize("ADMIN", "EMPLEADO", "CLIENTE"),
  validateBody(turnoCreateSchema),
  async (req, res, next) => {
    try {
      const turno = await turnoService.createTurno(req.body);
      res.status(201).json(turno);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  auth,
  authorize("ADMIN", "EMPLEADO"),
  validateParams(idParamSchema),
  validateBody(turnoUpdateSchema),
  async (req, res, next) => {
    try {
      const turno = await turnoService.updateTurno(req.params.id, req.body);
      if (!turno) {
        res.status(404).json({ error: "Turno no encontrado" });
        return;
      }
      res.json(turno);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    const deleted = await turnoService.deleteTurno(req.params.id);
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
