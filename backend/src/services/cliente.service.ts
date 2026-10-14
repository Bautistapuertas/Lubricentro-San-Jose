import { prisma } from "../config/prisma.js";

export async function getAllClientes() {
  return prisma.cliente.findMany({
    orderBy: { createdAt: "desc" },
    include: { vehiculos: true },
  });
}

export async function getClienteById(id: number) {
  return prisma.cliente.findUnique({
    where: { id },
    include: { vehiculos: true },
  });
}

export async function getClientesByDniOrNombre(dni: string, nombre: string) {
  const where: Record<string, unknown> = {};
  if (dni) where.dni = dni;
  if (nombre) where.nombre = { contains: nombre, mode: "insensitive" };
  return prisma.cliente.findMany({ where, orderBy: { createdAt: "desc" } });
}
