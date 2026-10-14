import { prisma } from "../config/prisma.js";

export async function getAllServicios() {
  return prisma.servicio.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getServicioById(id: number) {
  return prisma.servicio.findUnique({ where: { id } });
}

export async function getServiciosPublicos() {
  return prisma.servicio.findMany({
    where: { publico: 1 },
    orderBy: { createdAt: "desc" },
  });
}
