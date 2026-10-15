import { z } from "zod";

export const servicioCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  categoria: z.string().min(1, "La categoría es obligatoria").max(80).or(z.string().min(1)),
  tipo: z.string().optional(),
  desc: z.string().optional(),
  precio: z.coerce.number().positive("El precio debe ser un número positivo"),
  duracion: z.coerce.number().positive("La duración debe ser un número positivo").optional().default(60),
  publico: z.coerce.number().or(z.boolean()).optional().default(1),
}).passthrough();

export const servicioUpdateSchema = servicioCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
