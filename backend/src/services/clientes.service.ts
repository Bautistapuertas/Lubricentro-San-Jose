import { prisma } from "../config/prisma.js";

export function normalizarPatente(patente: string = ""): string {
  return patente.toString().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function porEmail(email: string) {
  if (!email) return null;
  return prisma.cliente.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function altaOActualizacion(datos: {
  nombre: string;
  email: string;
  telefono?: string | null;
  dni?: string | null;
}) {
  if (!datos.email) return null;
  const emailNorm = datos.email.toLowerCase().trim();
  const existente = await prisma.cliente.findUnique({ where: { email: emailNorm } });

  if (existente) {
    return prisma.cliente.update({
      where: { id: existente.id },
      data: {
        nombre: datos.nombre || existente.nombre,
        telefono: datos.telefono ?? existente.telefono,
        dni: datos.dni ?? existente.dni,
      },
    });
  }

  return prisma.cliente.create({
    data: {
      nombre: datos.nombre || emailNorm,
      email: emailNorm,
      telefono: datos.telefono || null,
      dni: datos.dni || null,
    },
  });
}

export async function listar(q: string = "") {
  const query = q.toString().trim().toLowerCase();

  const clientes = await prisma.cliente.findMany({
    orderBy: { id: "desc" },
    include: {
      vehiculos: true,
      turnos: true,
    },
  });

  const filtrados = query
    ? clientes.filter((c) => {
        const nom = c.nombre.toLowerCase();
        const em = c.email.toLowerCase();
        const dni = (c.dni || "").toLowerCase();
        const matchVeh = c.vehiculos.some(
          (v) =>
            v.patenteNorm.toLowerCase().includes(query) ||
            (v.marca && v.marca.toLowerCase().includes(query)) ||
            (v.modelo && v.modelo.toLowerCase().includes(query))
        );
        return nom.includes(query) || em.includes(query) || dni.includes(query) || matchVeh;
      })
    : clientes;

  return filtrados.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    dni: c.dni,
    turnos: c.turnos.length,
    vehiculos: c.vehiculos.length,
  }));
}

export async function detalle(id: number | string) {
  const numId = Number(id);
  const cliente = await prisma.cliente.findUnique({
    where: { id: numId },
    include: {
      vehiculos: {
        orderBy: { id: "desc" },
      },
      turnos: true,
    },
  });

  if (!cliente) return null;

  return {
    id: cliente.id,
    nombre: cliente.nombre,
    email: cliente.email,
    telefono: cliente.telefono,
    dni: cliente.dni,
    turnos: cliente.turnos.length,
    vehiculos: cliente.vehiculos,
  };
}

export async function crear(data: { nombre: string; email: string; telefono?: string; dni?: string }) {
  return altaOActualizacion(data);
}

export async function editar(
  id: number | string,
  cambios: { nombre?: string; telefono?: string | null; dni?: string | null }
) {
  const numId = Number(id);
  return prisma.cliente.update({
    where: { id: numId },
    data: {
      ...(cambios.nombre ? { nombre: cambios.nombre } : {}),
      ...(cambios.telefono !== undefined ? { telefono: cambios.telefono } : {}),
      ...(cambios.dni !== undefined ? { dni: cambios.dni } : {}),
    },
  });
}

export async function eliminar(id: number | string) {
  const numId = Number(id);
  await prisma.cliente.delete({ where: { id: numId } });
  return true;
}

// Aliases para compatibilidad con código existente
export const getAllClientes = () => listar();
export const getClienteById = (id: number | string) => detalle(id);
export const createCliente = (data: any) => crear(data);
export const updateCliente = (id: number | string, data: any) => editar(id, data);
export const deleteCliente = (id: number | string) => eliminar(id);
