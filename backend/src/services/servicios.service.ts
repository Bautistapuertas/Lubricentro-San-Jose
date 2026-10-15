import { prisma } from "../config/prisma.js";

export async function listarPublicos() {
  return prisma.servicio.findMany({
    where: { publico: 1 },
    orderBy: { id: "asc" },
  });
}

export async function listarTodos() {
  return prisma.servicio.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getById(id: number | string) {
  const numId = Number(id);
  return prisma.servicio.findUnique({ where: { id: numId } });
}

export async function crear(datos: {
  nombre: string;
  categoria: string;
  precio: number | string;
  duracion: number | string;
  publico?: number;
}) {
  return prisma.servicio.create({
    data: {
      nombre: datos.nombre.trim(),
      categoria: datos.categoria.trim(),
      precio: Math.round(Number(datos.precio)),
      duracion: Math.round(Number(datos.duracion)),
      publico: datos.publico !== undefined ? Number(datos.publico) : 0,
    },
  });
}

export async function editar(
  id: number | string,
  cambios: {
    nombre?: string;
    categoria?: string;
    precio?: number | string;
    duracion?: number | string;
    publico?: number;
  }
) {
  const numId = Number(id);
  const data: any = {};
  if (cambios.nombre !== undefined) data.nombre = cambios.nombre.trim();
  if (cambios.categoria !== undefined) data.categoria = cambios.categoria.trim();
  if (cambios.precio !== undefined) data.precio = Math.round(Number(cambios.precio));
  if (cambios.duracion !== undefined) data.duracion = Math.round(Number(cambios.duracion));
  if (cambios.publico !== undefined) data.publico = Number(cambios.publico);

  return prisma.servicio.update({
    where: { id: numId },
    data,
  });
}

export async function eliminar(id: number | string) {
  const numId = Number(id);
  await prisma.servicio.delete({ where: { id: numId } });
  return true;
}

// Aliases para compatibilidad con nombres singulares del TP
export const getAllServicios = () => listarTodos();
export const getServicioById = (id: number | string) => getById(id);
export const createServicio = (data: any) => crear(data);
export const updateServicio = (id: number | string, data: any) => editar(id, data);
export const deleteServicio = (id: number | string) => eliminar(id);
