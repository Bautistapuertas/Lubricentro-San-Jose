import { z } from "zod";

export const lavadoCreateSchema = z.object({
  fecha: z.string().optional(),
  patente: z.string().min(1, "La patente es obligatoria").max(40),
  modelo: z.string().max(80).optional().nullable(),
  tipoLavado: z.string().min(1, "El tipo de lavado es obligatorio").max(40),
  empleado: z.string().optional(),
  empleadoId: z.coerce.number().int().positive().optional(),
}).passthrough();

export const lavadoUpdateSchema = lavadoCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
