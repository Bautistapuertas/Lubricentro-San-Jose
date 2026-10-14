import { z } from "zod";

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(1).max(120),
  email: z.string().email().max(160),
  password: z.string().min(6).max(120),
  rol: z.enum(["ADMIN", "CLIENTE"]).default("CLIENTE"),
});

export const usuarioUpdateSchema = usuarioCreateSchema.partial().refine(
  (data) => {
    if (data.password && !data.email) {
      return false;
    }
    return true;
  },
  {
    message: "Si se incluye la contraseña, también se requiere email",
    path: ["password"],
  }
);

export const idParamSchema = z.object({
  id: z.number().int().positive(),
});
