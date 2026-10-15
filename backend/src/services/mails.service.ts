import { prisma } from "../config/prisma.js";

const simula = !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.MAIL_SIMULADO === "1";

export async function notificar(email: string, tipo: string, texto: string, turnoId?: number | null) {
  try {
    return await prisma.notificacion.create({
      data: {
        destinatarioEmail: email.toLowerCase().trim(),
        tipo,
        texto,
        turnoId: turnoId ?? null,
      },
    });
  } catch (e) {
    console.warn("No se pudo guardar notificación:", e);
    return null;
  }
}

export async function enviarMail(para: string, asunto: string, cuerpo: string) {
  let mailRecord: any = null;
  try {
    mailRecord = await prisma.mail.create({
      data: {
        para: para.toLowerCase().trim(),
        asunto,
        cuerpo,
        estado: "simulado",
      },
    });
  } catch (e) {
    console.warn("No se pudo guardar registro de mail:", e);
  }

  const id = mailRecord?.id ?? 1;

  if (simula) {
    console.log(`[MAIL-SIMULADO] Para: ${para} | Asunto: ${asunto} | ID: ${id}`);
    return { id, estado: "simulado", error: null };
  }

  try {
    // Dynamic import to avoid crash if nodemailer isn't installed
    const nodemailerModule = await import("nodemailer" as any).catch(() => null);
    if (!nodemailerModule) {
      return { id, estado: "simulado", error: null };
    }
    const nodemailer = nodemailerModule.default || nodemailerModule;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Gestión San José" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: asunto,
      text: cuerpo,
    });
    if (mailRecord) {
      await prisma.mail.update({
        where: { id: mailRecord.id },
        data: { estado: "enviado", error: null },
      });
    }
    return { id, estado: "enviado", error: null };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (mailRecord) {
      await prisma.mail.update({
        where: { id: mailRecord.id },
        data: { estado: "error", error: msg },
      });
    }
    return { id, estado: "error", error: msg };
  }
}

export function smtpConfigurado(): boolean {
  return !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD && !simula;
}

export async function listarNotificaciones(email: string) {
  const notifs = await prisma.notificacion.findMany({
    where: { destinatarioEmail: email.toLowerCase().trim() },
    orderBy: { id: "desc" },
    take: 20,
  });
  return notifs.map((n) => ({
    id: n.id,
    destinatario_email: n.destinatarioEmail,
    tipo: n.tipo,
    texto: n.texto,
    turno_id: n.turnoId,
    leida: n.leida,
    creado: n.createdAt.toISOString(),
  }));
}

export async function marcarNotificacionesLeidas(ids: number[]) {
  if (ids && ids.length > 0) {
    await prisma.notificacion.updateMany({
      where: { id: { in: ids } },
      data: { leida: 1 },
    });
  }
  return { ok: true };
}

export async function listarMails() {
  const rows = await prisma.mail.findMany({
    orderBy: { id: "desc" },
    take: 50,
  });
  return rows.map((m) => ({
    id: m.id,
    para: m.para,
    asunto: m.asunto,
    cuerpo: m.cuerpo,
    estado: m.estado,
    error: m.error,
    creado: m.createdAt.toISOString(),
  }));
}
