import { prisma } from "../config/prisma.js";
import { normalizarPatente } from "./clientes.service.js";

const KM_POR_SERVICE = 10000;
const MESES_POR_SERVICE = 12;

function diasHasta(fecha: string): number {
  return Math.round((new Date(fecha).getTime() - Date.now()) / 86400000);
}

export function proximoService(vehiculo: any, kmActuales?: number | null) {
  const kmProximo = (vehiculo.ultimoKm || vehiculo.ultimo_km || 0) + KM_POR_SERVICE;
  const km = kmActuales != null ? kmActuales : vehiculo.km;
  const vencimientoKm = km != null ? kmProximo - km : null;
  let vencimientoFecha: string | null = null;
  const ultService = vehiculo.ultimoService || vehiculo.ultimo_service;
  if (ultService) {
    const limite = new Date(ultService);
    limite.setMonth(limite.getMonth() + MESES_POR_SERVICE);
    vencimientoFecha = limite.toISOString().slice(0, 10);
  }
  return { kmProximo, vencimientoKm, vencimientoFecha };
}

export function estadoService(vehiculo: any, kmActuales?: number | null): "vencido" | "proximo" | "ok" {
  const { vencimientoKm, vencimientoFecha } = proximoService(vehiculo, kmActuales);
  const hoy = new Date().toISOString().slice(0, 10);
  const porFecha = vencimientoFecha && vencimientoFecha <= hoy;
  const porKm = vencimientoKm != null && vencimientoKm <= 0;
  if (porKm || porFecha) return "vencido";
  if ((vencimientoKm != null && vencimientoKm <= 1500) || (vencimientoFecha && diasHasta(vencimientoFecha) <= 30)) {
    return "proximo";
  }
  return "ok";
}

export async function altaOActualizacion(
  clienteId: number | null,
  datos: { patente: string; marca?: string | null; modelo?: string | null; km?: number | string | null }
) {
  if (!datos.patente) return null;
  const patenteNorm = normalizarPatente(datos.patente);
  const kmNum = datos.km != null && datos.km !== "" ? Number(datos.km) : 0;

  const existente = await prisma.vehiculo.findUnique({
    where: { patenteNorm },
  });

  if (existente) {
    return prisma.vehiculo.update({
      where: { id: existente.id },
      data: {
        clienteId: clienteId || existente.clienteId,
        marca: datos.marca ?? existente.marca,
        modelo: datos.modelo ?? existente.modelo,
        km: kmNum !== null ? kmNum : existente.km,
      },
    });
  }

  return prisma.vehiculo.create({
    data: {
      clienteId: clienteId || null,
      patente: datos.patente.toUpperCase().trim(),
      patenteNorm,
      marca: datos.marca || null,
      modelo: datos.modelo || null,
      km: kmNum,
    },
  });
}

export async function listar(q: string = "") {
  const query = q.toString().trim().toLowerCase();
  const norm = normalizarPatente(query);

  const vehiculos = await prisma.vehiculo.findMany({
    orderBy: { id: "desc" },
    include: {
      cliente: true,
      turnos: true,
    },
  });

  const filtrados = query
    ? vehiculos.filter((v) => {
        const pNorm = v.patenteNorm.toLowerCase();
        const p = v.patente.toLowerCase();
        const marca = (v.marca || "").toLowerCase();
        const modelo = (v.modelo || "").toLowerCase();
        const cliNom = (v.cliente?.nombre || "").toLowerCase();
        return (
          pNorm.includes(norm) ||
          p.includes(query) ||
          marca.includes(query) ||
          modelo.includes(query) ||
          cliNom.includes(query)
        );
      })
    : vehiculos;

  return filtrados.map((v) => {
    const p = proximoService(v, v.km);
    return {
      id: v.id,
      cliente_id: v.clienteId,
      patente: v.patente,
      patente_norm: v.patenteNorm,
      marca: v.marca,
      modelo: v.modelo,
      km: v.km,
      ultimo_km: v.ultimoKm,
      ultimo_service: v.ultimoService,
      cliente_nombre: v.cliente?.nombre || null,
      cliente_email: v.cliente?.email || null,
      cliente_telefono: v.cliente?.telefono || null,
      turnos: v.turnos.length,
      estado_service: estadoService(v, v.km),
      proximo_km_en: p.vencimientoKm,
      vencimiento_fecha: p.vencimientoFecha,
    };
  });
}

export async function deCliente(clienteId: number) {
  const vehiculos = await prisma.vehiculo.findMany({
    where: { clienteId },
    orderBy: { id: "desc" },
  });

  return vehiculos.map((v) => {
    const p = proximoService(v, v.km);
    return {
      id: v.id,
      patente: v.patente,
      marca: v.marca,
      modelo: v.modelo,
      km: v.km,
      estado_service: estadoService(v, v.km),
      proximo_km_en: p.vencimientoKm,
      vencimiento_fecha: p.vencimientoFecha,
    };
  });
}

export async function registrarService(id: number | string, datos: { km?: number | string; ultimo_service?: string }) {
  const numId = Number(id);
  const v = await prisma.vehiculo.findUnique({ where: { id: numId } });
  if (!v) return null;

  const kmNum = datos.km != null && datos.km !== "" ? Number(datos.km) : v.km;
  const fecha = datos.ultimo_service || new Date().toISOString().slice(0, 10);

  return prisma.vehiculo.update({
    where: { id: numId },
    data: {
      km: kmNum,
      ultimoKm: kmNum,
      ultimoService: fecha,
    },
  });
}

export async function editar(
  id: number | string,
  cambios: { marca?: string; modelo?: string; km?: number | string | null }
) {
  const numId = Number(id);
  const v = await prisma.vehiculo.findUnique({ where: { id: numId } });
  if (!v) return null;

  const kmNum = cambios.km != null && cambios.km !== "" ? Number(cambios.km) : undefined;

  return prisma.vehiculo.update({
    where: { id: numId },
    data: {
      ...(cambios.marca !== undefined ? { marca: cambios.marca } : {}),
      ...(cambios.modelo !== undefined ? { modelo: cambios.modelo } : {}),
      ...(kmNum !== undefined ? { km: kmNum } : {}),
    },
  });
}

export async function eliminar(id: number | string) {
  const numId = Number(id);
  await prisma.vehiculo.delete({ where: { id: numId } });
  return true;
}
