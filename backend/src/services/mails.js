// Notificaciones y envíos de email para el taller.
// El emisor real (Gmail) solamente se crea si están las credenciales, y
// sin ellas todo el flujo queda en modo SIMULADO: cada 'mail' se registra
// en la tabla mails con estado 'simulado', y el panel de correos lo muestra
// en vez de dejar al admin a ciegas esperando algo que no llegará.
//
// Esto evita el error de deploy típico:
//   ERR_MODULE_NOT_FOUND: Cannot find package 'nodemailer'
// porque se deja de importar una dependencia que no existe en el repo.

import db from '../config/db.js'

// notificar(): avisos internos para el panel (campana), sin SMTP externo.
export function notificar(email, tipo, texto, turnoId) {
  db.prepare('INSERT INTO notificaciones (destinatario_email, tipo, texto, turno_id) VALUES (?, ?, ?, ?)')
    .run(email, tipo, texto, turnoId ?? null)
}

// En simulado se resuelve a null antes de tocar nodemailer.
const simula = !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.MAIL_SIMULADO === '1'

// Enviar un correo real. Si no hay transporter, devuelve un 'mail'
// simulado (estado 'simulado') y el panel puede mostrarlo sin esperar a un
// SMTP que no existe.
export async function enviarMail(para, asunto, cuerpo) {
  const info = db.prepare('INSERT INTO mails (para, asunto, cuerpo, estado) VALUES (?, ?, ?, ?)').run(para, asunto, cuerpo, 'simulado')
  const id = info.lastInsertRowid

  if (simula) {
    console.log(`[MAIL-SIMULADO] Para: ${para} | Asunto: ${asunto} | ID: ${id} (configurá GMAIL_USER y GMAIL_APP_PASSWORD para envío real)`)
    return { id, estado: 'simulado', error: null }
  }

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
    await transporter.sendMail({
      from: `"Gestión San José" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: asunto,
      text: cuerpo,
    })
    db.prepare('UPDATE mails SET estado = ?, error = NULL WHERE id = ?').run('enviado', id)
    console.log(`[MAIL] Enviado a ${para} | Asunto: ${asunto} | ID: ${id}`)
    return { id, estado: 'enviado', error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    db.prepare('UPDATE mails SET estado = ?, error = ? WHERE id = ?').run('error', msg, id)
    console.error(`[MAIL-FALLÓ] Para: ${para} | Asunto: ${asunto} | ID: ${id} | error: ${msg}`)
    return { id, estado: 'error', error: msg }
  }
}

// El panel usa esta función para saber si hay SMS/Gmail configurado.
// No importa nodemailer en tiempo de arranque, así que el starter
// Render no muere con ERR_MODULE_NOT_FOUND.
export const smtpConfigurado = () => {
  return !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD && !simula
}
