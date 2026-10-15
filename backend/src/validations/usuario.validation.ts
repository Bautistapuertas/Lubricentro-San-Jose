import { z } from "zod";

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  email: z.string().email("El formato del email no es válido").max(160),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(120),
  rol: z.enum(["ADMIN", "EMPLEADO", "CLIENTE"]).or(z.string()).default("CLIENTE"),
}).passthrough();

export const usuarioUpdateSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  email: z.string().email().max(160).optional(),
  password: z.string().min(6).max(120).optional(),
  rol: z.enum(["ADMIN", "EMPLEADO", "CLIENTE"]).or(z.string()).optional(),
  activo: z.boolean().optional(),
}).passthrough();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
