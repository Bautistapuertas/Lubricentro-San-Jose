import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Error de validación",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  const status = (err as any)?.status || (err as any)?.statusCode || 500;
  const message = err instanceof Error ? err.message : "Error interno del servidor";

  res.status(status).json({
    error: message,
  });
}
