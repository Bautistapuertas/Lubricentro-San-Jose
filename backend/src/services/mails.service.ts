import { prisma } from "../config/prisma.js";

export type MailState = "pendiente" | "simulado" | "enviado" | "error";

export async function registrarMail(data: {
  para: string;
  asunto: string;
  cuerpo: string;
  estado?: MailState;
  error?: string;
}) {
  return prisma.mail.create({
    data: {
      para: data.para,
      asunto: data.asunto,
      cuerpo: data.cuerpo,
      estado: data.estado ?? "pendiente",
      error: data.error,
    },
  });
}

export async function enviarRecordatorio(turnoId: number, clienteEmail: string, mensaje: string) {
  const ahora = new Date().toISOString().slice(0, 19).replace("T", " ");
  await registrarMail({
    para: clienteEmail,
    asunto: `Recordatorio de turno - ${ahora}`,
    cuerpo: mensaje,
    estado: "simulado",
  });

  await prisma.turno.update({
    where: { id: turnoId },
    data: { recordatorio: 1 },
  });
}
