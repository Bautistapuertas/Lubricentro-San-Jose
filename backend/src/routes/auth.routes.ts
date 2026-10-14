import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { auth } from "../middleware/auth.js";
import { registroSchema, loginSchema, adminLoginSchema, recuperarSchema, restablecerSchema } from "../validations/auth.validation.js";

const router = Router();

router.post(
  "/registro",
  validateBody(registroSchema),
  authController.registrar
);

router.post(
  "/login",
  validateBody(loginSchema),
  authController.login
);

router.post(
  "/admin/login",
  validateBody(adminLoginSchema),
  authController.login
);

router.get("/yo", auth, authController.yo);

router.post(
  "/recuperar",
  validateBody(recuperarSchema),
  authController.recuperar
);

router.post(
  "/restablecer",
  validateBody(restablecerSchema),
  authController.restablecer
);

router.post("/logout", auth, authController.logout);

export default router;
