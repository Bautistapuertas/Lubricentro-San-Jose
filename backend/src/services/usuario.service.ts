import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

export function generarToken(payload: Record<string, unknown>, expiresIn = JWT_EXPIRES_IN) {
   return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export async function getAll() {
  return prisma.usuario.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getById(id: number | string) {
  return prisma.usuario.findUnique({ where: { id: Number(id) } });
}

export async function obtenerUsuarioPorEmail(email: string) {
  return prisma.usuario.findUnique({ where: { email } });
}

export async function registro(data: any) {
   const passwordHash = bcrypt.hashSync(data.password, SALT_ROUNDS);
   return prisma.usuario.create({
      data: {
         nombre: data.nombre,
         email: data.email,
         passwordHash,
         rol: data.rol ?? "Cliente",
      },
   });
}

export async function login(data: { email: string; password: string }) {
   const usuario = await obtenerUsuarioPorEmail(data.email);
   if (!usuario || !bcrypt.compareSync(data.password, usuario.passwordHash)) {
      const err: any = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
   }
   const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });
   return { usuario, token };
}

export async function update(id: number | string, data: any) {
   const numId = Number(id);
   const updates: any = { ...data };
   if (data.password) {
      updates.passwordHash = bcrypt.hashSync(data.password, SALT_ROUNDS);
      delete updates.password;
   }
   return prisma.usuario.update({ where: { id: numId }, data: updates });
}

export async function remove(id: number | string) {
   await prisma.usuario.delete({ where: { id: Number(id) } });
   return true;
}

// Alias por compatibilidad
export const getAllUsuarios = getAll;
export const getUsuarioById = getById;
export const createUsuario = registro;
export const updateUsuario = update;
export const deleteUsuario = remove;