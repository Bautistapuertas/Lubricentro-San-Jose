import { z } from "zod";

export const servicioCreateSchema = z.object({
  nombre: z.string().min(1).max(120),
  categoria: z.string().min(1).max(80),
  precio: z.number().int().positive(),
  duracion: z.number().int().positive(),
  publico: z.boolean().default(true),
});

export const servicioUpdateSchema = servicioCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.number().int().positive(),
});
