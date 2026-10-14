import { Request, Response } from "express";
import * as clienteService from "../services/cliente.service.js";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const clientes = await clienteService.getAllClientes();
    res.json(clientes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al listar clientes";
    res.status(500).json({ error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const cliente = await clienteService.getClienteById(Number(req.params.id));
    if (!cliente) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.json(cliente);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener el cliente";
    res.status(500).json({ error: message });
  }
}

export async function getByDni(req: Request, res: Response): Promise<void> {
  try {
    const clientes = await clienteService.getClientesByDniOrNombre(req.query.dni as string, req.query.nombre as string);
    res.json(clientes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al buscar cliente";
    res.status(500).json({ error: message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const cliente = await clienteService.createCliente(req.body);
    res.status(201).json(cliente);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear el cliente";
    const status = error instanceof Error && "status" in error ? (error as NodeJS.ErrnoException).status : 400;
    res.status(status).json({ error: message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const cliente = await clienteService.updateCliente(Number(req.params.id), req.body);
    if (!cliente) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.json(cliente);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar el cliente";
    res.status(500).json({ error: message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await clienteService.deleteCliente(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar el cliente";
    res.status(500).json({ error: message });
  }
}
