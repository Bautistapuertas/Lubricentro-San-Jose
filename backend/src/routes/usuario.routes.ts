import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get("/", auth, authorize("ADMIN"), usuarioController.getAll);

router.get("/:id", auth, authorize("ADMIN"), usuarioController.getById);

router.post("/", auth, authorize("ADMIN"), usuarioController.create);

router.put("/:id", auth, authorize("ADMIN"), usuarioController.update);

router.delete("/:id", auth, authorize("ADMIN"), usuarioController.remove);

export default router;
