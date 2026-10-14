import { z } from "zod";

export const turnoCreateSchema = z
  .object({
    fecha: z.string().min(1),
    hora: z.string().min(1),
    clienteId: z.number().int().positive(),
    servicioId: z.number().int().positive(),
  })
  .strict();

export const turnoUpdateSchema = turnoCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.number().int().positive(),
});
