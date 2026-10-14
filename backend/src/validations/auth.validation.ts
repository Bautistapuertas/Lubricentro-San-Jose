import { z } from "zod";

export const registroSchema = z.object({
  nombre: z.string().min(1).max(120),
  email: z.string().email().max(160),
  password: z.string().min(6).max(120),
});

export const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1),
});

export const adminLoginSchema = loginSchema;

export const recuperarSchema = z.object({
  email: z.string().email().max(160),
});

export const restablecerSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(120),
});
