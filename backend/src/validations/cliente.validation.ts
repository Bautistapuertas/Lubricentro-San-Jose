import { z } from "zod";

export const clienteCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  email: z.string().email("El formato del email no es válido").max(160),
  telefono: z.string().max(40).optional().nullable(),
  dni: z.string().max(20).optional().nullable(),
  vehiculo: z.string().optional().nullable(),
  patente: z.string().optional().nullable(),
}).passthrough();

export const clienteUpdateSchema = clienteCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
