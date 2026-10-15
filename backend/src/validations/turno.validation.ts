import { z } from "zod";

export const turnoCreateSchema = z.object({
  fecha: z.string().min(1, "La fecha es obligatoria"),
  hora: z.string().min(1, "La hora es obligatoria"),
  // Acepta tanto el formato del TP (clienteId, servicioId) como el del frontend (vehiculo, servicios, cliente)
  clienteId: z.coerce.number().int().positive().optional(),
  servicioId: z.coerce.number().int().positive().optional(),
  cliente: z.string().optional(),
  vehiculo: z.string().optional(),
  servicio: z.string().optional(),
  tipoServicio: z.string().optional(),
  servicios: z.array(z.string()).optional(),
  nota: z.string().optional(),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  km: z.coerce.number().optional(),
  email: z.string().email().optional(),
}).passthrough();

export const turnoUpdateSchema = turnoCreateSchema.partial();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
