import { z } from "zod";

export const lavadoCreateSchema = z.object({
  fecha: z.string().min(1),
  patente: z.string().min(1).max(40),
  modelo: z.string().max(80).optional(),
  tipoLavado: z.string().min(1).max(40),
  empleadoId: z.number().int().positive(),
});

export const lavadoUpdateSchema = lavadoCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.number().int().positive(),
});
