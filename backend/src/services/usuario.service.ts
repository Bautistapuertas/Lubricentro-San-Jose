import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { JWT_SECRET } from "../config/env.js";

const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

export const randomToken = (bytes = 24) => randomBytes(bytes).toString("hex");

export function generarToken(payload: Record<string, unknown>, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export async function getAll() {
  return prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
}

export async function getById(id: number | string) {
  return prisma.usuario.findUnique({
    where: { id: Number(id) },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
}

export async function obtenerUsuarioPorEmail(email: string) {
  if (!email) return null;
  return prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function registro(data: { nombre: string; email: string; password?: string; rol?: any }) {
  if (!data.nombre || !data.email || !data.password) {
    const err: any = new Error("Todos los campos son obligatorios");
    err.status = 400;
    throw err;
  }

  const emailNorm = data.email.toLowerCase().trim();
  const existente = await prisma.usuario.findUnique({ where: { email: emailNorm } });
  if (existente) {
    const err: any = new Error("Ya existe una cuenta con ese email");
    err.status = 409;
    throw err;
  }

  const passwordHash = bcrypt.hashSync(data.password, SALT_ROUNDS);
  let rolAsignar: "ADMIN" | "EMPLEADO" | "CLIENTE" = "CLIENTE";
  if (data.rol) {
    const r = String(data.rol).toUpperCase();
    if (r === "ADMIN" || r === "EMPLEADO" || r === "CLIENTE") {
      rolAsignar = r;
    }
  }

  const nuevo = await prisma.usuario.create({
    data: {
      nombre: data.nombre.trim(),
      email: emailNorm,
      passwordHash,
      rol: rolAsignar,
    },
  });

  return {
    id: nuevo.id,
    nombre: nuevo.nombre,
    email: nuevo.email,
    rol: nuevo.rol.toLowerCase(),
  };
}

export async function login(data: { email: string; password: string; rolRequerido?: string }) {
  if (!data.email || !data.password) {
    const err: any = new Error("Email y contraseña son obligatorios");
    err.status = 400;
    throw err;
  }

  const usuario = await obtenerUsuarioPorEmail(data.email);
  if (!usuario || !bcrypt.compareSync(data.password, usuario.passwordHash)) {
    const err: any = new Error("Credenciales incorrectas");
    err.status = 401;
    throw err;
  }

  const rolLower = usuario.rol.toLowerCase();

  if (data.rolRequerido) {
    const reqLower = data.rolRequerido.toLowerCase();
    if (reqLower === "admin" && rolLower !== "admin" && rolLower !== "empleado") {
      const err: any = new Error("Esta cuenta no tiene acceso a este portal");
      err.status = 403;
      throw err;
    }
    if (reqLower === "cliente" && rolLower !== "cliente") {
      // Los admin también pueden probar como cliente si lo desean o restringir
    }
  }

  const token = generarToken({ sub: usuario.id, id: usuario.id, email: usuario.email, rol: usuario.rol });

  // Guardar en sesiones para invalidación real si se usa
  try {
    await prisma.sesion.create({
      data: {
        token,
        usuarioId: usuario.id,
      },
    });
  } catch {}

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: rolLower,
    },
  };
}

export async function cerrarSesion(token: string) {
  if (!token) return;
  try {
    await prisma.sesion.deleteMany({ where: { token } });
  } catch {}
}

export async function crearRestablecimiento(usuarioId: number) {
  const token = randomToken(20);
  const expira = BigInt(Date.now() + 60 * 60 * 1000);
  await prisma.restablecimiento.create({
    data: {
      token,
      usuarioId,
      expira,
    },
  });
  return token;
}

export async function consumirRestablecimiento(token: string) {
  const r = await prisma.restablecimiento.findUnique({ where: { token } });
  if (!r || Number(r.expira) < Date.now()) return null;
  await prisma.restablecimiento.delete({ where: { token } });
  return r.usuarioId;
}

export async function aplicarRestablecimiento(usuarioId: number, passwordNueva: string) {
  const passwordHash = bcrypt.hashSync(passwordNueva, SALT_ROUNDS);
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { passwordHash },
  });
  await prisma.sesion.deleteMany({ where: { usuarioId } });
}

export async function clienteValido(email: string) {
  if (!email) return null;
  return obtenerUsuarioPorEmail(email);
}

export async function listarClientes() {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: "CLIENTE" },
    orderBy: { id: "desc" },
  });

  const turnos = await prisma.turno.findMany();

  return usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    turnos: turnos.filter((t) => t.usuarioId === u.id || t.clienteNombre?.toLowerCase() === u.nombre.toLowerCase()).length,
  }));
}

export async function listarVehiculos() {
  const vehiculos = await prisma.vehiculo.findMany({
    include: { turnos: true },
    orderBy: { id: "desc" },
  });

  return vehiculos.map((v) => ({
    vehiculo: `${v.marca || ""} ${v.modelo || ""} · ${v.patente}`.trim(),
    visitas: v.turnos.length,
    ultima: v.turnos.length > 0 ? v.turnos[0].fecha : null,
  }));
}

export async function dashboard() {
  const turnos = await prisma.turno.findMany({
    orderBy: { id: "desc" },
    include: { cliente: true, vehiculo: true, servicio: true },
  });

  const historial = await prisma.historial.findMany({
    where: { estado: "Completado" },
  });

  const porEstado: Record<string, number> = {
    Pendiente: 0,
    Confirmado: 0,
    "En taller": 0,
    Completado: 0,
    Cancelado: 0,
  };

  for (const t of turnos) {
    const est = t.estado === "EnTaller" ? "En taller" : t.estado;
    porEstado[est] = (porEstado[est] || 0) + 1;
  }

  const enTaller = porEstado["En taller"] || 0;
  const completados = historial.length || porEstado["Completado"] || 0;
  const ingresos = historial.reduce((acc, h) => acc + (h.importe || 0), 0);

  const proximos = turnos.slice(0, 4).map((t) => ({
    id: t.id,
    cliente: t.clienteNombre || t.cliente?.nombre || "Cliente",
    vehiculo: t.vehiculoDesc || (t.vehiculo ? `${t.vehiculo.marca || ""} ${t.vehiculo.modelo || ""} · ${t.vehiculo.patente}`.trim() : "Vehículo"),
    servicio: t.servicioDesc || t.servicio?.nombre || "Servicio",
    fecha: t.fecha,
    hora: t.hora,
    estado: t.estado,
    importe: t.importe,
  }));

  return {
    total: turnos.length,
    porEstado,
    proximos,
    enTaller,
    completados,
    ingresos,
  };
}

export async function historial(usuario: { id: number; email: string }, query: any = {}) {
  const pagina = Math.max(1, parseInt(query.pagina) || 1);
  const porPagina = Math.min(50, Math.max(1, parseInt(query.porPagina) || 10));

  const items = await prisma.historial.findMany({
    where: {
      OR: [
        { usuarioId: usuario.id },
        { usuario: { email: usuario.email.toLowerCase().trim() } },
      ],
    },
    orderBy: { id: "desc" },
  });

  const total = items.length;
  const start = (pagina - 1) * porPagina;
  const slice = items.slice(start, start + porPagina);

  return {
    historial: slice,
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function update(id: number | string, data: any) {
  const numId = Number(id);
  const updates: any = { ...data };
  if (data.password) {
    updates.passwordHash = bcrypt.hashSync(data.password, SALT_ROUNDS);
    delete updates.password;
  }
  return prisma.usuario.update({
    where: { id: numId },
    data: updates,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
}

export async function remove(id: number | string) {
  await prisma.usuario.delete({ where: { id: Number(id) } });
  return true;
}

// Aliases
export const getAllUsuarios = getAll;
export const getUsuarioById = getById;
export const createUsuario = registro;
export const updateUsuario = update;
export const deleteUsuario = remove;