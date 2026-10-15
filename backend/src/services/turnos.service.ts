import { prisma } from "../config/prisma.js";
import { notificar, enviarMail } from "./mails.service.js";
import * as clientesService from "./clientes.service.js";
import * as vehiculosService from "./vehiculos.service.js";

export const HORARIOS = ["08:00 AM", "09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM"];
const ESTADOS_OCUPA = ["Pendiente", "Confirmado", "En taller", "EnTaller"];

export async function listar(filtros: any = {}) {
  const pagina = Math.max(1, parseInt(filtros.pagina) || 1);
  const porPagina = Math.min(50, Math.max(1, parseInt(filtros.porPagina) || 10));
  const q = (filtros.q || "").toString().trim().toLowerCase();

  const todos = await prisma.turno.findMany({
    orderBy: { id: "desc" },
    include: {
      cliente: true,
      vehiculo: true,
      servicio: true,
    },
  });

  const filtrados = q
    ? todos.filter((t) => {
        const cli = (t.clienteNombre || t.cliente?.nombre || "").toLowerCase();
        const veh = (t.vehiculoDesc || t.vehiculo?.patente || "").toLowerCase();
        const srv = (t.servicioDesc || t.servicio?.nombre || "").toLowerCase();
        return cli.includes(q) || veh.includes(q) || srv.includes(q);
      })
    : todos;

  const total = filtrados.length;
  const start = (pagina - 1) * porPagina;
  const slice = filtrados.slice(start, start + porPagina);

  const turnos = slice.map((t) => ({
    id: t.id,
    cliente: t.clienteNombre || t.cliente?.nombre || "Cliente",
    vehiculo: t.vehiculoDesc || (t.vehiculo ? `${t.vehiculo.marca || ""} ${t.vehiculo.modelo || ""} · ${t.vehiculo.patente}`.trim() : "Vehículo"),
    servicio: t.servicioDesc || t.servicio?.nombre || "Servicio",
    fecha: t.fecha,
    hora: t.hora,
    estado: t.estado,
    nota: t.nota,
    usuario_id: t.usuarioId,
    importe: t.importe,
    recordatorio: t.recordatorio,
    cliente_id: t.clienteId,
    vehiculo_id: t.vehiculoId,
  }));

  return {
    turnos,
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function ocupados(fecha: string) {
  const turnos = await prisma.turno.findMany({
    where: {
      fecha,
      estado: { in: ESTADOS_OCUPA },
    },
    select: { hora: true },
  });
  return turnos.map((t) => t.hora);
}

export async function horarioLibre(fecha: string, hora: string, excludeId?: number) {
  const count = await prisma.turno.count({
    where: {
      fecha,
      hora,
      estado: { in: ESTADOS_OCUPA },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return count === 0;
}

export async function misTurnos(usuario: { id: number; email: string }) {
  const turnos = await prisma.turno.findMany({
    where: {
      OR: [
        { usuarioId: usuario.id },
        { cliente: { email: usuario.email.toLowerCase().trim() } },
      ],
    },
    orderBy: { id: "desc" },
    include: {
      cliente: true,
      vehiculo: true,
      servicio: true,
    },
  });

  return turnos.map((t) => ({
    id: t.id,
    cliente: t.clienteNombre || t.cliente?.nombre || "Cliente",
    vehiculo: t.vehiculoDesc || (t.vehiculo ? `${t.vehiculo.marca || ""} ${t.vehiculo.modelo || ""} · ${t.vehiculo.patente}`.trim() : "Vehículo"),
    servicio: t.servicioDesc || t.servicio?.nombre || "Servicio",
    fecha: t.fecha,
    hora: t.hora,
    estado: t.estado,
    importe: t.importe,
    nota: t.nota,
  }));
}

export async function crear(
  usuario: { id?: number; nombre: string; email: string; rol: string },
  datos: {
    cliente?: string;
    vehiculo: string;
    servicios: string[];
    fecha: string;
    hora: string;
    nota?: string;
    dni?: string;
    telefono?: string;
    km?: number | string;
    email?: string;
  }
) {
  const { cliente, vehiculo, servicios, fecha, hora, nota, dni, telefono, km } = datos;

  // Calcular importe desde servicios reales en DB
  const catalogo = await prisma.servicio.findMany({
    where: { nombre: { in: servicios } },
  });
  const importe = catalogo.reduce((acc, s) => acc + s.precio, 0);

  const esAdmin = usuario.rol?.toLowerCase() === "admin";
  const nombreCliente = esAdmin && cliente ? cliente : usuario.nombre;
  const emailCliente = esAdmin ? (datos.email || null) : usuario.email;

  let cli: any = null;
  if (emailCliente) {
    cli = await clientesService.altaOActualizacion({
      nombre: nombreCliente,
      email: emailCliente,
      telefono,
      dni,
    });
  }

  // Parsear vehículo "Marca Modelo · PATENTE"
  const [marcaModelo, patente] = (vehiculo || "").split("·").map((p) => p.trim());
  const [marca, ...restoModelo] = (marcaModelo || "").split(" ");
  let veh: any = null;
  if (patente) {
    veh = await vehiculosService.altaOActualizacion(cli?.id ?? null, {
      patente,
      marca: marca || null,
      modelo: restoModelo.join(" ") || null,
      km,
    });
  }

  const primerServicio = catalogo[0] || null;

  const nuevoTurno = await prisma.turno.create({
    data: {
      clienteNombre: nombreCliente,
      vehiculoDesc: vehiculo,
      servicioDesc: servicios.join(" + "),
      fecha,
      hora,
      estado: "Pendiente",
      nota: nota || "",
      usuarioId: !esAdmin ? usuario.id : null,
      importe,
      clienteId: cli?.id ?? null,
      vehiculoId: veh?.id ?? null,
      servicioId: primerServicio?.id ?? null,
    },
  });

  if (!esAdmin && usuario.email) {
    enviarMail(
      usuario.email,
      "Turno registrado",
      `Hola ${usuario.nombre}, registramos tu turno de ${servicios.join(" + ")} el ${fecha} a las ${hora}. Te avisaremos cuando el taller lo confirme.`
    );
  }

  // Notificar administradores
  const admins = await prisma.usuario.findMany({ where: { rol: "ADMIN" } });
  for (const adm of admins) {
    notificar(
      adm.email,
      "nuevo_turno",
      `Nuevo turno de ${nombreCliente}: ${servicios.join(" + ")} el ${fecha} ${hora}`,
      nuevoTurno.id
    );
  }

  return nuevoTurno.id;
}

export async function cambiarEstado(id: number | string, nuevoEstado: string, datosKm?: number | string) {
  const numId = Number(id);
  const validos = ["Pendiente", "Confirmado", "En taller", "EnTaller", "Completado", "Cancelado"];
  if (!validos.includes(nuevoEstado)) return { error: "invalido" };

  const turno = await prisma.turno.findUnique({
    where: { id: numId },
    include: { cliente: true, vehiculo: true },
  });
  if (!turno) return { error: "no_encontrado" };

  await prisma.turno.update({
    where: { id: numId },
    data: { estado: nuevoEstado },
  });

  const emailDestino = turno.cliente?.email;

  if (nuevoEstado === "Confirmado" && emailDestino) {
    enviarMail(
      emailDestino,
      "Turno confirmado",
      `Hola, confirmamos tu turno de ${turno.servicioDesc || "servicio"} el ${turno.fecha} a las ${turno.hora}. ¡Te esperamos!`
    );
    notificar(
      emailDestino,
      "confirmado",
      `Tu turno del ${turno.fecha} a las ${turno.hora} fue confirmado por el taller.`,
      turno.id
    );
  }

  if (nuevoEstado === "Cancelado" && emailDestino) {
    enviarMail(
      emailDestino,
      "Turno cancelado",
      `Te informamos que tu turno de ${turno.servicioDesc || "servicio"} del ${turno.fecha} fue cancelado.`
    );
  }

  if (nuevoEstado === "Completado") {
    if (turno.vehiculoId) {
      await vehiculosService.registrarService(turno.vehiculoId, {
        km: datosKm,
        ultimo_service: turno.fecha,
      });
    }

    const comprobante = `#GSJ-${String(10000 + Number(turno.id)).padStart(5, "0")}`;
    const existente = await prisma.historial.findFirst({ where: { comprobante } });
    if (!existente) {
      await prisma.historial.create({
        data: {
          fecha: turno.fecha,
          titulo: turno.servicioDesc || "Servicio en taller",
          vehiculo: turno.vehiculoDesc || (turno.vehiculo ? `${turno.vehiculo.marca || ""} ${turno.vehiculo.modelo || ""}` : "Vehículo"),
          detalle: "Turno completado en taller",
          estado: "Completado",
          importe: turno.importe || 0,
          comprobante,
          usuarioId: turno.usuarioId || null,
        },
      });
    }
  }

  return { ok: true };
}

export async function editar(id: number | string, datos: { fecha?: string; hora?: string; nota?: string }) {
  const numId = Number(id);
  const t = await prisma.turno.findUnique({ where: { id: numId } });
  if (!t) return null;

  const nuevaFecha = datos.fecha ?? t.fecha;
  const nuevaHora = datos.hora ?? t.hora;

  const libre = await horarioLibre(nuevaFecha, nuevaHora, numId);
  if (!libre) {
    return { error: "ocupado", fecha: nuevaFecha, hora: nuevaHora };
  }

  await prisma.turno.update({
    where: { id: numId },
    data: {
      fecha: nuevaFecha,
      hora: nuevaHora,
      nota: datos.nota ?? t.nota,
    },
  });

  return { ok: true };
}

export async function enviarRecordatorio(id: number | string) {
  const numId = Number(id);
  const t = await prisma.turno.findUnique({
    where: { id: numId },
    include: { cliente: true },
  });
  if (!t) return null;

  await prisma.turno.update({
    where: { id: numId },
    data: { recordatorio: 1 },
  });

  const email = t.cliente?.email;
  if (email) {
    enviarMail(
      email,
      "Recordatorio de turno",
      `Recordatorio: tenés turno de ${t.servicioDesc || "servicio"} el ${t.fecha} a las ${t.hora}.`
    );
  }

  return t;
}

export async function eliminar(id: number | string) {
  const numId = Number(id);
  await prisma.turno.delete({ where: { id: numId } });
  return true;
}

export async function getById(id: number | string) {
  return prisma.turno.findUnique({
    where: { id: Number(id) },
    include: { cliente: true, vehiculo: true, servicio: true },
  });
}

// Aliases para compatibilidad con código existente
export const getTurnosByCliente = async (clienteId: number) => {
  return prisma.turno.findMany({
    where: { clienteId },
    orderBy: { id: "desc" },
  });
};
export const getTurnoById = (id: number | string) => getById(id);
export const createTurno = async (data: any) => {
  return crear(
    { id: data.usuarioId, nombre: data.cliente || "Cliente", email: data.email || "", rol: "CLIENTE" },
    {
      cliente: data.cliente,
      vehiculo: data.vehiculo || "",
      servicios: Array.isArray(data.servicios) ? data.servicios : [data.servicio || ""],
      fecha: data.fecha,
      hora: data.hora,
      nota: data.nota,
    }
  );
};
export const updateTurno = (id: number | string, data: any) => editar(id, data);
export const deleteTurno = (id: number | string) => eliminar(id);
