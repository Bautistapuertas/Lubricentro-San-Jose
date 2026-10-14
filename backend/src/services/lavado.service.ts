import { prisma } from "../config/prisma.js";

export async function getAllLavados() {
  return prisma.lavado.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getLavadoById(id: number) {
  return prisma.lavado.findUnique({ where: { id } });
}

export async function createLavado(
  fecha: string,
  patente: string,
  modelo: string,
  tipoLavado: string,
  empleadoId: number
) {
  return prisma.lavado.create({
    data: {
      fecha,
      patente,
      modelo,
      tipoLavado,
      empleadoId,
    },
  });
}
