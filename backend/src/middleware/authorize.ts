import { Request, Response, NextFunction } from "express";

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const rolesUpper = roles.map((r) => r.toUpperCase());
    const userRolUpper = (user.rol || "").toUpperCase();

    if (!rolesUpper.includes(userRolUpper)) {
      res.status(403).json({ error: "No tenés permiso para esta operación" });
      return;
    }

    next();
  };
}
