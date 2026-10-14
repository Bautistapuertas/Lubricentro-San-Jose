import { Request, Response } from "express";
import * as usuarioService from "../services/usuario.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const usuarios = await usuarioService.getAll();
    res.json(usuarios);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al listar usuarios";
    res.status(500).json({ error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuarioService.getById(Number(req.params.id));
    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(usuario);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener el usuario";
    res.status(500).json({ error: message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuarioService.registro(req.body);
    delete (usuario as Record<string, unknown>).passwordHash;
    res.status(201).json(usuario);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear el usuario";
    const status = error instanceof Error && "status" in error ? (error as NodeJS.ErrnoException).status : 400;
    res.status(status).json({ error: message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuarioService.update(Number(req.params.id), req.body);
    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    delete (usuario as Record<string, unknown>).passwordHash;
    res.json(usuario);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar el usuario";
    res.status(500).json({ error: message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await usuarioService.remove(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar el usuario";
    res.status(500).json({ error: message });
  }
}
