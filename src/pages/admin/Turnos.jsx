import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import plus from '../../assets/plus.svg'
import { api } from '../../api.js'
import search from '../../assets/search.svg'
import calendar from '../../assets/calendar.svg'
import chevronDown from '../../assets/chevron-down.svg'
import list from '../../assets/list.svg'
import calendarDays from '../../assets/calendar-days.svg'
import chevronRight from '../../assets/chevron-right.svg'
import user from '../../assets/user.svg'
import carFront from '../../assets/car-front.svg'
import wrench from '../../assets/wrench.svg'
import messageSquare from '../../assets/message-square-text.svg'
import pencil from '../../assets/pencil.svg'
import send from '../../assets/send.svg'

const TURNOS = [
  { hora: '08:00', cliente: 'Lucía Fernández', vehiculo: 'Toyota Etios · AE 456 RT', servicio: 'Cambio de aceite', estado: 'Confirmado', pillBg: 'var(--teal-soft)', pillColor: 'var(--teal)' },
  { hora: '09:30', cliente: 'Diego Martínez', vehiculo: 'Ford Ranger · AC 980 KL', servicio: 'Lavado premium', estado: 'En taller', pillBg: '#FFF3D9', pillColor: '#A56A16' },
  { hora: '11:00', cliente: 'Juan Pérez', vehiculo: 'VW Gol Trend · AB 123 CD', servicio: 'Revisión general', estado: 'Confirmado', pillBg: 'var(--teal-soft)', pillColor: 'var(--teal)' },
  { hora: '13:30', cliente: 'Mariana López', vehiculo: 'Chevrolet Onix · AF 221 NM', servicio: 'Alineación y balanceo', estado: 'Pendiente', pillBg: 'var(--primary-soft)', pillColor: 'var(--primary)' },
  { hora: '15:00', cliente: 'Carlos Giménez', vehiculo: 'Renault Sandero · AD 782 PQ', servicio: 'Cambio de filtros', estado: 'Pendiente', pillBg: 'var(--primary-soft)', pillColor: 'var(--primary)' },
  { hora: '16:30', cliente: 'Sofía García', vehiculo: 'Peugeot 208 · AG 554 BC', servicio: 'Lavado completo', estado: 'Confirmado', pillBg: 'var(--teal-soft)', pillColor: 'var(--teal)' },
]

const RESUMEN = [
  { n: '12', label: 'Turnos del día', color: 'var(--ink)' },
  { n: '5', label: 'Confirmados', color: 'var(--teal)' },
  { n: '3', label: 'En taller', color: '#A56A16' },
  { n: '3', label: 'Completados', color: '#2E7D5B' },
  { n: '1', label: 'Cancelado', color: 'var(--primary)' },
]

export default function Turnos() {
  const [selected, setSelected] = useState(2)
  const [estado, setEstado] = useState('Confirmado')
  const [vista, setVista] = useState('lista')
  const [query, setQuery] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [reload, setReload] = useState(0)
  const [form, setForm] = useState(false)
  const [nuevo, setNuevo] = useState({ cliente: '', vehiculo: '', servicio: '', fecha: '', hora: '' })
  const [feedback, setFeedback] = useState('')
  const [turnos, setTurnos] = useState(TURNOS)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const turno = turnos[selected] || turnos[0]

  useEffect(() => {
    api(`/turnos?pagina=${pagina}&porPagina=6&q=${encodeURIComponent(query)}`)
      .then((data) => {
        const lista = data?.turnos
        if (lista) {
          setTurnos(lista.map((t) => ({
            id: t.id,
            hora: t.hora,
            fecha: t.fecha,
            nota: t.nota,
            cliente: t.cliente,
            vehiculo: t.vehiculo,
            servicio: t.servicio,
            estado: t.estado,
            pillBg: t.estado === 'Confirmado' ? 'var(--teal-soft)' : t.estado === 'En taller' ? '#FFF3D9' : t.estado === 'Pendiente' ? 'var(--primary-soft)' : '#EAF5EF',
            pillColor: t.estado === 'Confirmado' ? 'var(--teal)' : t.estado === 'En taller' ? '#A56A16' : t.estado === 'Pendiente' ? 'var(--primary)' : '#2E7D5B',
            recordatorio: !!t.recordatorio,
          })))
          setTotal(data.total)
          setPaginas(data.paginas)
          setSelected(0)
          if (lista.length) setEstado(lista[0].estado)
        }
      })
      .catch(() => {})
  }, [pagina, query, reload])

  const enviarRecordatorio = async () => {
    if (!turno?.id) return
    try {
      await api(`/turnos/${turno.id}/recordatorio`, { method: 'POST' })
      setTurnos((prev) => prev.map((t, i) => (i === selected ? { ...t, recordatorio: true } : t)))
      setFeedback('Recordatorio enviado')
      setTimeout(() => setFeedback(''), 3000)
    } catch (err) {
      alert(err.message)
    }
  }

  const crearTurno = async (e) => {
    e.preventDefault()
    if (!nuevo.cliente || !nuevo.vehiculo || !nuevo.servicio || !nuevo.fecha || !nuevo.hora) return setFeedback('Completá todos los campos del turno')
    try {
      await api('/turnos', { method: 'POST', body: { cliente: nuevo.cliente, vehiculo: nuevo.vehiculo, servicios: [nuevo.servicio], fecha: nuevo.fecha, hora: nuevo.hora } })
      setForm(false)
      setNuevo({ cliente: '', vehiculo: '', servicio: '', fecha: '', hora: '' })
      setFeedback('Turno creado')
      setTimeout(() => setFeedback(''), 3000)
      setPagina(1)
      setReload((r) => r + 1)
    } catch (err) {
      setFeedback(err.message)
    }
  }

  const cambiarEstado = async (nuevo) => {
    if (!turno?.id) return setEstado(nuevo)
    try {
      await api(`/turnos/${turno.id}/estado`, { method: 'PATCH', body: { estado: nuevo } })
      setEstado(nuevo)
      setTurnos((prev) => prev.map((t, i) => (i === selected ? { ...t, estado: nuevo } : t)))
    } catch (err) {
      alert(err.message)
    }
  }

  const filtrados = turnos.map((t, i) => ({ ...t, i })).filter((t) =>
    (t.cliente + t.vehiculo + t.servicio).toLowerCase().includes(query.toLowerCase()) &&
    (estadoFiltro === 'Todos' || t.estado === estadoFiltro)
  )

  return (
    <AdminLayout active="turnos" title="Gestión de turnos" subtitle="Agenda, estados y detalle operativo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Agenda</span>
            <h1 className="heading" style={{ fontSize: '32px' }}>Turnos</h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>Buscá, filtrá y actualizá el estado de cada visita.</p>
          </div>
          <button onClick={() => setForm(!form)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '13px 22px', fontWeight: 700, fontSize: '14px', boxShadow: '0px 6px 16px 0px rgba(217, 90, 62, 0.14)' }}>
            <img src={plus} alt="" width="16" height="16" /> Crear turno
          </button>
        </div>

        {feedback && <p style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{feedback}</p>}
        {form && (
          <form onSubmit={crearTurno} style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { k: 'cliente', p: 'Cliente' },
              { k: 'vehiculo', p: 'Vehículo' },
              { k: 'servicio', p: 'Servicio' },
              { k: 'fecha', p: 'Fecha (ej: 2026-10-03)' },
              { k: 'hora', p: 'Hora (ej: 10:00)' },
            ].map((f) => (
              <input key={f.k} placeholder={f.p} value={nuevo[f.k]} onChange={(e) => setNuevo({ ...nuevo, [f.k]: e.target.value })} style={{ flex: 1, minWidth: '150px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '11px 13px', fontSize: '13px' }} />
            ))}
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '11px 18px', fontWeight: 700, fontSize: '13px' }}>Guardar turno</button>
          </form>
        )}

        {/* Herramientas */}
        <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="resp-wrap" style={{ display: 'flex', gap: '10px' }}>
            <div className="resp-fill" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '12px 16px', width: '350px' }}>
              <img src={search} alt="" width="18" height="18" />
              <input placeholder="Buscar cliente, patente o servicio" value={query} onChange={(e) => { setQuery(e.target.value); setPagina(1) }} style={{ fontSize: '14px' }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--teal-soft)', border: '1.2px solid var(--teal)', borderRadius: '12px', padding: '10px 14px', color: 'var(--teal)', fontSize: '13px', fontWeight: 700 }}>
              <img src={calendar} alt="" width="16" height="16" /> Hoy, 30 sep.
            </button>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>
              {['Todos', 'Pendiente', 'Confirmado', 'En taller', 'Completado', 'Cancelado'].map((e) => (
                <option key={e} value={e}>{e === 'Todos' ? 'Todos los estados' : e}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: '#F7F1EA', borderRadius: '12px', padding: '4px' }}>
            <button onClick={() => setVista('lista')} style={{ padding: '8px', borderRadius: '8px', background: vista === 'lista' ? 'white' : 'transparent' }}>
              <img src={list} alt="Lista" width="17" height="17" />
            </button>
            <button onClick={() => setVista('calendario')} style={{ padding: '8px', borderRadius: '8px', background: vista === 'calendario' ? 'white' : 'transparent' }}>
              <img src={calendarDays} alt="Calendario" width="17" height="17" />
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="resp-stats" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {RESUMEN.map((r) => (
            <div key={r.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              <span className="heading" style={{ fontSize: '22px', color: r.color }}>{r.n}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-2)' }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Agenda y detalle */}
        <div className="resp-row" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <section className="resp-fill" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="heading" style={{ fontSize: '21px' }}>Miércoles 30 de septiembre</span>
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{filtrados.length} de {total || turnos.length} turnos</span>
            </div>
            {filtrados.map((t) => {
              const active = selected === t.i
              return (
                <button
                  key={t.i}
                  onClick={() => { setSelected(t.i); setEstado(t.estado) }}
                  className="resp-stack-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    textAlign: 'left',
                    background: active ? 'var(--teal-soft)' : 'white',
                    border: active ? '1.8px solid var(--teal)' : '1.1px solid var(--border)',
                    borderRadius: '16px',
                  }}
                >
                  <div className="resp-unfix" style={{ width: '62px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="heading" style={{ fontSize: '18px', color: active ? 'var(--teal)' : 'var(--ink)' }}>{t.hora}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '10px' }}>HOY</span>
                  </div>
                  <div className="resp-unfix" style={{ width: '170px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{t.cliente}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{t.vehiculo}</span>
                  </div>
                  <span style={{ flex: 1, color: 'var(--ink-2)', fontSize: '12px', fontWeight: 600 }}>{t.servicio}</span>
                  <span className="resp-noshrink" style={{ background: t.pillBg, color: t.pillColor, borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>{t.estado}</span>
                  <img src={chevronRight} alt="" width="16" height="16" />
                </button>
              )
            })}
            <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Mostrando {total === 0 ? 0 : (pagina - 1) * 6 + 1}–{(pagina - 1) * 6 + filtrados.length} de {total || turnos.length}</span>
              <div className="resp-wrap" style={{ display: 'flex', gap: '8px' }}>
                <button disabled={pagina <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} style={{ border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px', background: 'white', opacity: pagina <= 1 ? 0.5 : 1 }}>Anterior</button>
                <button disabled={pagina >= paginas} onClick={() => setPagina((p) => Math.min(paginas, p + 1))} style={{ border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px', background: 'white', opacity: pagina >= paginas ? 0.5 : 1 }}>Siguiente</button>
              </div>
            </div>
          </section>

          {/* Detalle */}
          <aside className="resp-sidecol" style={{ width: '470px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--primary)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Turno #T-3098</span>
                  <span className="heading" style={{ fontSize: '23px' }}>{turno.cliente}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Hoy · {turno.hora} a {turno.hora} hs</span>
                </div>
                <span className="resp-noshrink" style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>{estado}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              {[
                { icon: user, title: 'Cliente', value: `${turno.cliente} · DNI 28.456.921`, sub: 'juan.perez@gmail.com · 11 4567-8901' },
                { icon: carFront, title: 'Vehículo', value: turno.vehiculo.split('·')[0].trim() === 'VW Gol Trend' ? 'Volkswagen Gol Trend 1.6 MSI' : turno.vehiculo.split('·')[0], sub: `${turno.vehiculo.split('·')[1].trim()} · 86.420 km` },
                { icon: wrench, title: 'Servicio', value: turno.servicio, sub: 'Duración estimada: 50 min · $ 12.000' },
                { icon: messageSquare, title: 'Nota del cliente', value: 'Revisar ruido al frenar en frío.', sub: null },
              ].map((d) => (
                <div key={d.title} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '17px', background: '#F7F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={d.icon} alt="" width="16" height="16" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{d.title}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{d.value}</span>
                    {d.sub && <span className="resp-break" style={{ color: 'var(--muted)', fontSize: '11px' }}>{d.sub}</span>}
                  </div>
                </div>
              ))}
            </section>

            <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
              <span className="heading" style={{ fontSize: '19px' }}>Cambiar estado</span>
              <select value={estado} onChange={(e) => cambiarEstado(e.target.value)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', background: '#F7F1EA', border: '1px solid var(--border)', borderRadius: '12px', padding: '13px', fontSize: '13px', fontWeight: 700, appearance: 'none' }}>
                {['Pendiente', 'Confirmado', 'En taller', 'Completado', 'Cancelado'].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <div className="resp-wrap" style={{ display: 'flex', gap: '8px' }}>
                {['En taller', 'Completado', 'Cancelar'].map((e) => {
                  const activeState = estado === e || (e === 'Cancelar' && estado === 'Cancelado')
                  return (
                    <button
                      key={e}
                      onClick={() => cambiarEstado(e === 'Cancelar' ? 'Cancelado' : e)}
                      className="resp-noshrink"
                      style={{
                        borderRadius: '999px',
                        padding: '10px 16px',
                        fontWeight: 700,
                        fontSize: '14px',
                        background: e === 'Completado' ? 'var(--teal)' : e === 'Cancelar' ? 'var(--primary-soft)' : 'white',
                        color: e === 'Completado' ? 'white' : e === 'Cancelar' ? 'var(--primary)' : 'var(--ink)',
                        border: e === 'En taller' ? '1.2px solid var(--border)' : '1.2px solid transparent',
                      }}
                    >
                      {e}
                    </button>
                  )
                })}
              </div>
            </section>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={async () => {
                if (!turno?.id) return
                const fecha = window.prompt('Nueva fecha', turno.fecha || ''); if (fecha === null) return
                const hora = window.prompt('Nueva hora', turno.hora || ''); if (hora === null) return
                const nota = window.prompt('Nota', turno.nota || '') ?? ''
                try {
                  await api(`/turnos/${turno.id}`, { method: 'PATCH', body: { fecha, hora, nota } })
                  setTurnos((prev) => prev.map((t, i) => (i === selected ? { ...t, fecha, hora, nota } : t)))
                  setFeedback('Turno actualizado'); setTimeout(() => setFeedback(''), 3000)
                } catch (err) { alert(err.message) }
              }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}>
                <img src={pencil} alt="" width="16" height="16" /> Editar turno
              </button>
              <button onClick={enviarRecordatorio} disabled={turno?.recordatorio} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px', opacity: turno?.recordatorio ? 0.5 : 1 }}>
                <img src={send} alt="" width="16" height="16" /> {turno?.recordatorio ? 'Recordatorio enviado' : 'Enviar recordatorio'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  )
}
