import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { usuarioCreateSchema, usuarioUpdateSchema, idParamSchema } from "../validations/usuario.validation.js";

const router = Router();

router.get("/", auth, authorize("ADMIN"), usuarioController.getAll);

router.get("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), usuarioController.getById);

router.post("/", auth, authorize("ADMIN"), validateBody(usuarioCreateSchema), usuarioController.create);

router.put("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), validateBody(usuarioUpdateSchema), usuarioController.update);
router.patch("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), validateBody(usuarioUpdateSchema), usuarioController.update);

router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), usuarioController.remove);

export default router;
