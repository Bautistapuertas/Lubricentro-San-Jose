import { Request, Response } from "express";
import * as usuarioService from "../services/usuario.service.js";
import { auth } from "../middleware/auth.js";

export async function registrar(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuarioService.registro(req.body);
    delete (usuario as Record<string, unknown>).passwordHash;
    res.status(201).json(usuario);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al registrar usuario";
    const status = error instanceof Error && "status" in error ? (error as NodeJS.ErrnoException).status : 400;
    res.status(status).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await usuarioService.login({ email, password });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al iniciar sesión";
    const status = error instanceof Error && "status" in error ? (error as NodeJS.ErrnoException).status : 401;
    res.status(status).json({ error: message });
  }
}

export async function yo(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuarioService.obtenerUsuarioPorEmail(req.user!.email);
    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    const { passwordHash, ...usuarioPublico } = usuario;
    res.json(usuarioPublico);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener la sesión";
    res.status(500).json({ error: message });
  }
}

export async function recuperar(req: Request, res: Response): Promise<void> {
  try {
    const token = "token-demo-recuperacion";
    res.json({ token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al solicitar recuperación";
    res.status(500).json({ error: message });
  }
}

export async function restablecer(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body;
    res.json({ token, mensaje: "Contraseña actualizada (simulada)" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al restablecer la contraseña";
    res.status(500).json({ error: message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al cerrar sesión";
    res.status(500).json({ error: message });
  }
}
