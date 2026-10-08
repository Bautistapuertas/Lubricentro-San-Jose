import nodemailer from 'nodemailer'
import db from '../config/db.js'

// notificar(): avisos internos para el panel (campana), sin SMTP externo.
export function notificar(email, tipo, texto, turnoId) {
  db.prepare('INSERT INTO notificaciones (destinatario_email, tipo, texto, turno_id) VALUES (?, ?, ?, ?)')
    .run(email, tipo, texto, turnoId ?? null)
}

const transporter = process.env.MAIL_SIMULADO === '1' || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD
  ? null
  : nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })

// MAIL_SIMULADO=1 fuerza el modo simulado aunque Gmail esté configurado:
// smoke tests y demos no llenan la bandeja real.

export const smtpConfigurado = () => !!transporter

// enviarMail(): cada envío queda registrado con resultado ('enviado' |
// 'simulado' | 'error' + motivo) para diagnosticar desde el panel sin logs.
export async function enviarMail(para, asunto, cuerpo) {
  const info = db.prepare('INSERT INTO mails (para, asunto, cuerpo, estado) VALUES (?, ?, ?, ?)').run(para, asunto, cuerpo, 'pendiente')
  const id = info.lastInsertRowid
  const marcar = (estado, error = null) => {
    try {
      db.prepare('UPDATE mails SET estado = ?, error = ? WHERE id = ?').run(estado, error, id)
    } catch (e) {
      console.error('[MAIL] No se pudo registrar el estado del envío:', e.message)
    }
    return { id, estado, error }
  }
  if (!transporter) {
    console.log(`[MAIL-SIMULADO] Para: ${para} | Asunto: ${asunto} (configurá GMAIL_USER y GMAIL_APP_PASSWORD para envío real)`)
    return marcar('simulado')
  }
  try {
    await transporter.sendMail({ from: `"Gestión San José" <${process.env.GMAIL_USER}>`, to: para, subject: asunto, text: cuerpo })
    console.log(`[MAIL] Enviado a ${para} | ${asunto}`)
    return marcar('enviado')
  } catch (err) {
    console.error(`[MAIL] Error enviando a ${para}:`, err.message)
    return marcar('error', err.message)
  }
}

export function estadoMails() {
  const mails = db.prepare('SELECT * FROM mails ORDER BY id DESC LIMIT 100').all()
  const resumen = db.prepare('SELECT estado, COUNT(*) n FROM mails GROUP BY estado').all()
  return {
    configurado: smtpConfigurado(),
    remitente: transporter ? process.env.GMAIL_USER : null,
    resumen: Object.fromEntries(resumen.map((r) => [r.estado, r.n])),
    mails,
  }
}
