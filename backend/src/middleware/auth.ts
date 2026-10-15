import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export interface UsuarioPayload {
  sub: number;
  id: number;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioPayload;
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Falta el token de autenticación" });
    return;
  }

  const token = header.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      sub: payload.sub || payload.id,
      id: payload.id || payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
