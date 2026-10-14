import { z } from "zod";

export const clienteCreateSchema = z.object({
  nombre: z.string().min(1).max(120),
  email: z.string().email().max(160),
  telefono: z.string().max(40).optional(),
  dni: z.string().max(20).optional(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.number().int().positive(),
});
