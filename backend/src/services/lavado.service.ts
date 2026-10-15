import { prisma } from "../config/prisma.js";

export async function getAllLavados() {
  return prisma.lavado.findMany({
    orderBy: { id: "desc" },
    include: { empleado: { select: { id: true, nombre: true, email: true } } },
  });
}

export async function getLavadoById(id: number | string) {
  return prisma.lavado.findUnique({
    where: { id: Number(id) },
    include: { empleado: { select: { id: true, nombre: true, email: true } } },
  });
}

export async function createLavado(datos: {
  patente: string;
  modelo?: string;
  tipoLavado: string;
  empleadoId: number;
}) {
  return prisma.lavado.create({
    data: {
      patente: datos.patente.toUpperCase().trim(),
      modelo: datos.modelo || null,
      tipoLavado: datos.tipoLavado,
      empleadoId: Number(datos.empleadoId),
    },
  });
}

export async function updateLavado(
  id: number | string,
  cambios: { patente?: string; modelo?: string; tipoLavado?: string }
) {
  const numId = Number(id);
  const data: any = {};
  if (cambios.patente) data.patente = cambios.patente.toUpperCase().trim();
  if (cambios.modelo !== undefined) data.modelo = cambios.modelo;
  if (cambios.tipoLavado) data.tipoLavado = cambios.tipoLavado;

  return prisma.lavado.update({
    where: { id: numId },
    data,
  });
}

export async function deleteLavado(id: number | string) {
  const numId = Number(id);
  await prisma.lavado.delete({ where: { id: numId } });
  return true;
}
