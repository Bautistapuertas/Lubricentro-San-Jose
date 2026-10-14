import { Request, Response, NextFunction } from "express";

export interface UsuarioPayload {
  sub: number;
  email: string;
  rol: string;
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user as UsuarioPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    if (!roles.includes(user.rol)) {
      res.status(403).json({ error: "No tenés permiso para esta operación" });
      return;
    }

    next();
  };
}
