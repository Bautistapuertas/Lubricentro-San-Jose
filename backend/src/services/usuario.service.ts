import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } from "../config/env.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegistroInput {
  nombre: string;
  email: string;
  password: string;
  rol?: "ADMIN" | "CLIENTE";
}

export function generarToken(payload: Record<string, unknown>, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verificarPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function registro(datos: RegistroInput) {
  const { nombre, email, password, rol = "CLIENTE" } = datos;

  const existe = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  if (existe) {
    throw new Error("El email ya está registrado");
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  return prisma.usuario.create({
    data: {
      nombre,
      email: email.toLowerCase(),
      passwordHash,
      rol: rol as "ADMIN" | "CLIENTE",
    },
  });
}

export async function login(datos: LoginInput) {
  const { email, password } = datos;

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!usuario || !verificarPassword(password, usuario.passwordHash)) {
    throw new Error("Credenciales inválidas");
  }

  if (!usuario.activo) {
    throw new Error("La cuenta está inactiva");
  }

  const token = generarToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}

export async function obtenerUsuarioPorEmail(email: string) {
  return prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
}

export async function obtenerUsuarioById(id: number) {
  return prisma.usuario.findUnique({ where: { id } });
}

export async function getAll() {
  return prisma.usuario.findMany({ orderBy: { rol: "asc" } });
}

export async function getById(id: number) {
  return prisma.usuario.findUnique({ where: { id } });
}

export async function update(id: number, datos: Partial<RegistroInput>) {
  const { password, ...resto } = datos;

  const updates: Record<string, unknown> = { ...resto };

  if (password) {
    updates.passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  }

  return prisma.usuario.update({
    where: { id },
    data: updates,
  });
}

export async function remove(id: number) {
  return prisma.usuario.delete({ where: { id } });
}
