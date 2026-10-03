import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { api } from '../../api.js'
import mail from '../../assets/mail.svg'
import send from '../../assets/send.svg'

// 'simulado' = sin GMAIL_USER/PASSWORD configurados: no salió a nadie.
// 'enviado'  = entregado por Gmail. 'error' = falló, `error` trae el motivo.
// 'sin_dato' = enviado antes de instrumentar el resultado: no se sabe cómo terminó.
const ESTADOS = {
  enviado: { label: 'Enviado', bg: 'var(--teal-soft)', color: 'var(--teal)' },
  error: { label: 'Falló', bg: 'var(--primary-soft)', color: 'var(--primary)' },
  simulado: { label: 'Simulado', bg: '#FFF3D9', color: '#A56A16' },
  sin_dato: { label: 'Sin dato', bg: '#F1EFEA', color: 'var(--muted)' },
  pendiente: { label: 'Enviando', bg: '#F1EFEA', color: 'var(--muted)' },
}

export default function Correos() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [prueba, setPrueba] = useState(null)

  const cargar = () =>
    api('/mails')
      .then(setDatos)
      .catch((e) => setError(e.message))

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 15000)
    return () => clearInterval(t)
  }, [])

  // Prueba de envío: responde qué pasó sin tener que mirar los logs de Render
  // ni armar un turno sólo para probar el SMTP.
  const enviarPrueba = async () => {
    setEnviando(true)
    setPrueba(null)
    try {
      const r = await api('/mails/prueba', { method: 'POST' })
      setPrueba({
        ok: r.estado === 'enviado',
        texto:
          r.estado === 'enviado' ? `Salió un correo de prueba a ${r.para}.`
          : r.estado === 'error' ? `No se pudo enviar a ${r.para}: ${r.error}`
          : `No salió nada: el envío real sigue sin configurar (${r.para}).`,
      })
      cargar()
    } catch (e) {
      setPrueba({ ok: false, texto: e.message })
    } finally {
      setEnviando(false)
    }
  }

  const resumen = datos?.resumen || {}
  const total = Object.values(resumen).reduce((a, b) => a + b, 0)
  const fallidos = resumen.error || 0
  const enviados = resumen.enviado || 0

  const metricas = [
    { label: 'Correos registrados', valor: String(total), delta: 'Histórico completo', icon: mail, bg: 'var(--teal-soft)' },
    { label: 'Enviados', valor: String(enviados), delta: 'Entregados por Gmail', icon: send, bg: 'var(--teal-soft)' },
    { label: 'Fallidos', valor: String(fallidos), delta: fallidos ? 'Revisar el motivo' : 'Sin errores', icon: send, bg: fallidos ? 'var(--primary-soft)' : 'var(--teal-soft)' },
  ]

  return (
    <AdminLayout active="correos" title="Correos" subtitle="Salida de emails a clientes">
      <div className="resp-stack-sm" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Estado de la configuración: si está apagado, nada sale. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px 18px',
            borderRadius: '16px',
            border: '1.2px solid var(--border)',
            background: datos?.configurado ? 'var(--teal-soft)' : 'var(--primary-soft)',
          }}
        >
          <img src={mail} alt="" width="20" height="20" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: datos?.configurado ? 'var(--teal)' : 'var(--primary)' }}>
              {datos?.configurado ? 'Envío real activo' : 'Correo sin configurar — no se envía nada'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>
              {datos?.configurado
                ? `Los correos salen desde ${datos.remitente}.`
                : 'Faltan GMAIL_USER y GMAIL_APP_PASSWORD en las variables de entorno de Render. Mientras tanto quedan registrados como simulados.'}
            </span>
          </div>
        </div>

        {/* Métricas */}
        <div className="resp-grid-2 resp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {metricas.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={m.icon} alt="" width="16" height="16" />
                </span>
                <span className="label" style={{ color: 'var(--muted)' }}>{m.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="heading resp-val-sm" style={{ fontSize: '30px' }}>{m.valor}</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{m.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {error && <p style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{error}</p>}
        {prueba && (
          <p style={{ background: prueba.ok ? 'var(--teal-soft)' : 'var(--primary-soft)', color: prueba.ok ? 'var(--teal)' : 'var(--primary)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>
            {prueba.texto}
          </p>
        )}

        {/* Listado */}
        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="resp-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="heading" style={{ fontSize: '19px' }}>Envíos recientes</span>
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Viene al correo con el que iniciás sesión.</span>
            </div>
            <button
              onClick={enviarPrueba}
              disabled={enviando}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '12px 20px', fontWeight: 700, fontSize: '14px', opacity: enviando ? 0.7 : 1 }}
            >
              <img src={send} alt="" width="16" height="16" />
              {enviando ? 'Enviando…' : 'Enviar correo de prueba'}
            </button>
          </div>
          {!datos?.mails?.length && <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Todavía no se intentó enviar ningún correo.</p>}
          {!!resumen.sin_dato && (
            <span style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '-6px' }}>
              Los marcados “Sin dato” se registraron antes de instrumentar el resultado del envío.
            </span>
          )}
          {datos?.mails?.map((m) => {
            const est = ESTADOS[m.estado] || ESTADOS.sin_dato
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="resp-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="resp-noshrink" style={{ background: est.bg, color: est.color, borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}>{est.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{m.asunto}</span>
                </div>
                <span className="resp-break" style={{ color: 'var(--ink-2)', fontSize: '13px' }}>{m.para}</span>
                {m.error && (
                  <span className="resp-break" style={{ color: 'var(--primary)', fontSize: '12px' }}>Motivo: {m.error}</span>
                )}
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{m.creado}</span>
              </div>
            )
          })}
        </section>
      </div>
    </AdminLayout>
  )
}
