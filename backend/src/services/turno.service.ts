import { prisma } from "../config/prisma.js";
import { z } from "zod";

const turnoCreateSchema = z
  .object({
    fecha: z.string(),
    hora: z.string(),
    clienteId: z.number().positive(),
    servicioId: z.number().positive(),
  })
  .strict();

export async function createTurno(input: z.infer<typeof turnoCreateSchema>) {
  const parsed = turnoCreateSchema.parse(input);

  const servicio = await prisma.servicio.findUnique({
    where: { id: parsed.servicioId },
  });
  if (!servicio) {
    throw new Error("Servicio no encontrado");
  }

  const turno = await prisma.turno.findFirst({
    where: {
      fecha: parsed.fecha,
      hora: parsed.hora,
      OR: [
        { estado: { in: ["Pendiente", "Confirmado", "EnTaller"] } },
        { estado: { notIn: ["Cancelado"] } },
      ],
    },
  });

  if (turno) {
    throw new Error("El horario indicado ya está ocupado");
  }

  return prisma.turno.create({
    data: {
      fecha: parsed.fecha,
      hora: parsed.hora,
      clienteId: parsed.clienteId,
      servicioId: parsed.servicioId,
      estado: "Pendiente",
      importe: 0,
      recordatorio: 0,
    },
  });
}

export async function getTurnosByCliente(clienteId: number) {
  return prisma.turno.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTurnoById(id: number) {
  return prisma.turno.findUnique({ where: { id } });
}
