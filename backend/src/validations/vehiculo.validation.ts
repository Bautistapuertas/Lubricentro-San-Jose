import { z } from "zod";

export const vehiculoCreateSchema = z.object({
  patente: z.string().min(1, "La patente es obligatoria").max(30),
  marca: z.string().max(80).optional().nullable(),
  modelo: z.string().max(80).optional().nullable(),
  km: z.coerce.number().optional().nullable(),
  cliente_id: z.coerce.number().int().positive().optional().nullable(),
  clienteId: z.coerce.number().int().positive().optional().nullable(),
}).passthrough();

export const vehiculoUpdateSchema = vehiculoCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
