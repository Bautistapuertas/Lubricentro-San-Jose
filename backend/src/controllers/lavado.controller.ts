import { Request, Response } from "express";
import * as lavadoService from "../services/lavado.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { lavadoCreateSchema, lavadoUpdateSchema, idParamSchema } from "../validations/lavado.validation.js";
import { validateBody, validateParams } from "../middlewares/validate.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const lavados = await lavadoService.getAllLavados();
    res.json(lavados);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al listar lavados";
    res.status(500).json({ error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const lavado = await lavadoService.getLavadoById(Number(req.params.id));
    if (!lavado) {
      res.status(404).json({ error: "Lavado no encontrado" });
      return;
    }
    res.json(lavado);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener el lavado";
    res.status(500).json({ error: message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const lavado = await lavadoService.createLavado(req.body);
    res.status(201).json(lavado);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear el lavado";
    const status = error instanceof Error && "status" in error ? (error as NodeJS.ErrnoException).status : 400;
    res.status(status).json({ error: message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const lavado = await lavadoService.updateLavado(Number(req.params.id), req.body);
    if (!lavado) {
      res.status(404).json({ error: "Lavado no encontrado" });
      return;
    }
    res.json(lavado);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar el lavado";
    res.status(500).json({ error: message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await lavadoService.deleteLavado(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Lavado no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar el lavado";
    res.status(500).json({ error: message });
  }
}
