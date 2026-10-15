import { Request, Response } from "express";
import * as usuarioService from "../services/usuario.service.js";
import { enviarMail, smtpConfigurado } from "../services/mails.service.js";

export async function registrar(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await usuarioService.registro(req.body);
    res.status(201).json(usuario);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Error al registrar usuario";
    const status = error && typeof error.status === "number" ? error.status : 400;
    res.status(status).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const esAdminRoute = req.path.includes("admin");
    const result = await usuarioService.login({
      email,
      password,
      rolRequerido: esAdminRoute ? "admin" : undefined,
    });
    res.json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Error al iniciar sesión";
    const status = error && typeof error.status === "number" ? error.status : 401;
    res.status(status).json({ error: message });
  }
}

export async function yo(req: Request, res: Response): Promise<void> {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const usuario = await usuarioService.obtenerUsuarioPorEmail(userEmail);
    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.toLowerCase(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener la sesión" });
  }
}

export async function recuperar(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ error: "Ingresá un email válido" });
      return;
    }
    const usuario = await usuarioService.clienteValido(email);
    if (!usuario) {
      // No revelar si el email existe por seguridad
      res.json({ ok: true });
      return;
    }
    const token = await usuarioService.crearRestablecimiento(usuario.id);
    if (smtpConfigurado()) {
      await enviarMail(
        usuario.email,
        "Recuperar contraseña — Gestión San José",
        `Tu token para restablecer la contraseña es: ${token}\nVence en 1 hora.`
      );
      res.json({ ok: true });
      return;
    }
    // Demo sin SMTP
    res.json({ ok: true, token, demo: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al solicitar recuperación" });
  }
}

export async function restablecer(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      res.status(400).json({ error: "Token y contraseña son obligatorios" });
      return;
    }
    const usuarioId = await usuarioService.consumirRestablecimiento(token);
    if (!usuarioId) {
      res.status(400).json({ error: "El enlace es inválido o expiró" });
      return;
    }
    await usuarioService.aplicarRestablecimiento(usuarioId, password);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al restablecer contraseña" });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");
    if (token) {
      await usuarioService.cerrarSesion(token);
    }
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al cerrar sesión" });
  }
}
