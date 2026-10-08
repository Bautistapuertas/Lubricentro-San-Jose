import { useState, useEffect } from 'react'
import { api, getUser, logout } from '../api.js'
import ClienteHeader from '../components/ClienteHeader.jsx'
import serviceOil from '../assets/service-oil.svg'
import serviceCar from '../assets/service-car.svg'
import serviceSettings from '../assets/service-settings.svg'
import serviceEye from '../assets/service-eye.svg'
import serviceCar2 from '../assets/service-car2.svg'
import serviceSparkles from '../assets/service-sparkles.svg'

// Los ids tienen que ser estables entre el fallback y lo que responde
// `/api/servicios` (`s${id}`): si no, un click antes de que cargue el catálogo
// dejaba la selección rota (todos los servicios compartían id `undefined`).
const SERVICIOS_FIJA = [
  { id: 's1', nombre: 'Cambio de Aceite', duracion: 60, precio: 28000, icon: serviceOil },
  { id: 's2', nombre: 'Lavado Completo', duracion: 45, precio: 4500, icon: serviceCar },
  { id: 's3', nombre: 'Alineación y Balanceo', duracion: 40, precio: 15000, icon: serviceSettings },
  { id: 's4', nombre: 'Revisión General', duracion: 50, precio: 12000, icon: serviceEye },
  { id: 's5', nombre: 'Lavado Premium', duracion: 90, precio: 8500, icon: serviceCar2 },
  { id: 's6', nombre: 'Tratamiento de Pulido', duracion: 120, precio: 18000, icon: serviceSparkles },
]

// Días reales a partir de hoy (el catálogo de días del mock era dinámico:
// el backend necesita fechas reales para validar disponibles).
const hoy = new Date()
const dias = Array.from({ length: 3 }, (_, i) => {
  const d = new Date(hoy)
  d.setDate(d.getDate() + i + 1)
  return d
})
const DIAS = dias.map((d, i) => ({
  id: d.toISOString().slice(0, 10),
  label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }).toUpperCase(),
}))

const formatPrice = (n) => '$ ' + n.toLocaleString('es-AR')
const MES = new Date().toLocaleDateString('es-AR', { month: 'long' })

export default function ReservarTurno() {
  const user = getUser()
  const [patente, setPatente] = useState('AB 123 CD')
  const [marca, setMarca] = useState('Volkswagen')
  const [modelo, setModelo] = useState('Gol Trend 1.6 MSI')
  const [day, setDay] = useState(DIAS[0].id)
  const [time, setTime] = useState('11:00 AM')
  const [services, setServices] = useState(SERVICIOS_FIJA)
  const [selected, setSelected] = useState([])
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [ocupados, setOcupados] = useState([])

  useEffect(() => {
    api('/servicios')
      .then((data) => {
        if (data?.length) {
          setServices(
            data.map((s, i) => ({
              id: `s${s.id}`,
              nombre: s.nombre,
              duracion: s.duracion,
              precio: s.precio,
              icon: SERVICIOS_FIJA[i]?.icon || SERVICIOS_FIJA[0].icon,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  // FT-02: consultamos los horarios ocupados cada vez que cambia el día para
  // que el usuario vea slots 'Reservado' en tiempo real, no una lista estática.
  useEffect(() => {
    if (!day) return
    setOcupados([])
    api(`/turnos/disponibles?fecha=${day}`)
      .then((data) => setOcupados(data.ocupados || []))
      .catch(() => {
        setOcupados([])
      })
  }, [day])

  const toggleService = (id) => {
    setConfirmed(false)
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const chosen = services.filter((s) => selected.includes(s.id))
  const total = chosen.reduce((acc, s) => acc + s.precio, 0)
  const duration = chosen.reduce((acc, s) => acc + s.duracion, 0)
  const dayLabel = DIAS.find((d) => d.id === day)?.label

  const confirmar = async () => {
    if (chosen.length === 0) return
    try {
      await api('/turnos', {
        method: 'POST',
        body: {
          cliente: user?.nombre || 'Cliente',
          vehiculo: `${marca} ${modelo} · ${patente}`,
          servicios: chosen.map((c) => c.nombre),
          fecha: day,
          hora: time,
        },
      })
      setConfirmed(true)
      setError('')
      // refrescar slots ocupados tras la reserva
      api(`/turnos/disponibles?fecha=${day}`).then((data) => setOcupados(data.ocupados || [])).catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header compartido con el historial: marca, navegación y usuario */}
      <ClienteHeader activo="reservar" />

      {/* Contenido */}
      <main className="resp-row resp-booking" style={{ padding: '40px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {/* Columna izquierda */}
        <div className="resp-fill" style={{ width: '580px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Vehículo */}
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="step-badge">1</div>
              <h3 className="section-title">Tu Vehículo</h3>
            </div>
            {[
              { label: 'Patente', value: patente, set: setPatente },
              { label: 'Marca', value: marca, set: setMarca },
              { label: 'Modelo', value: modelo, set: setModelo },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="label">{f.label}</label>
                <div className="input-box">
                  <input value={f.value} onChange={(e) => f.set(e.target.value)} />
                </div>
              </div>
            ))}
          </section>

          {/* Fecha y hora */}
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="step-badge">3</div>
              <h3 className="section-title">Fecha y Hora del Turno</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="label">Seleccionar Día</span>
              <div className="resp-days" style={{ display: 'flex', gap: '10px' }}>
                {DIAS.map((d) => {
                  const active = day === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDay(d.id)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: active ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: active ? 'var(--teal-soft)' : 'var(--bg)',
                        color: active ? 'var(--teal)' : 'var(--ink)',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{d.label}</span>
                      <span style={{ fontSize: '11px', color: active ? 'var(--teal)' : 'var(--muted)' }}>{d.id}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="label">Horarios Disponibles para {dayLabel}</span>
              <div className="resp-cols-slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Lista de slots con servicio nuevo: los marcados como ocupados
                    aparecen deshabilitados con un pill "Reservado" para evitar
                    doble reserva. */}
                {['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM'].map((slot) => {
                  const active = time === slot
                  const ocupado = ocupados.includes(slot)
                  return (
                    <button
                      key={slot}
                      onClick={() => !ocupado && setTime(slot)}
                      disabled={ocupado}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: active ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: ocupado ? '#f4f0ea' : active ? 'var(--teal-soft)' : 'var(--bg)',
                        color: ocupado ? 'var(--muted)' : active ? 'var(--teal)' : 'var(--ink)',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: ocupado ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{slot}</span>
                      {ocupado && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)' }}>Reservado</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Columna derecha */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section className="card">
            <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="step-badge">2</div>
                <h3 className="section-title">Seleccione el Servicio</h3>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                Podes elegir uno o más servicios
              </span>
            </div>

            <div className="resp-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {services.map((s) => {
                const active = selected.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: '16px',
                      padding: '24px',
                      textAlign: 'left',
                      background: 'var(--white)',
                      border: active ? '2px solid var(--teal)' : '1.5px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: active ? '0px 4px 12px 0px rgba(31, 110, 108, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '20px',
                          background: active ? 'var(--teal-soft)' : 'var(--bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img src={s.icon} alt="" width="20" height="20" />
                      </div>
                      {active && (
                        <span
                          style={{
                            background: 'var(--teal-soft)',
                            border: '1px solid var(--teal)',
                            color: 'var(--teal)',
                            borderRadius: '100px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="section-title">{s.nombre}</span>
                      <span style={{ color: 'var(--ink-2)', fontSize: '13px' }}>
                        Duración est.: {s.duracion} min
                      </span>
                    </div>
                    <span
                      className="heading"
                      style={{ fontSize: '22px', color: active ? 'var(--teal)' : 'var(--ink)' }}
                    >
                      {formatPrice(s.precio)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Resumen */}
          <section
            className="resp-stack-sm"
            style={{
              background: 'var(--teal)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0px 8px 24px 0px rgba(31, 110, 108, 0.15)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--teal-muted)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Resumen del Turno
              </span>
              <span className="heading" style={{ color: 'white', fontSize: '20px' }}>
                {chosen.length > 0
                  ? `${chosen.map((c) => c.nombre).join(' + ')} — ${marca} ${modelo} (${patente})`
                  : 'Seleccioná al menos un servicio'}
              </span>
              <span style={{ color: 'var(--teal-soft)', opacity: 0.9, fontSize: '14px' }}>
                {dayLabel} de {MES} • {time} • Duración: ~{duration} min
              </span>
              {user && (
                <button
                  onClick={() => { logout(); window.location.href = '/' }}
                  style={{ color: 'var(--teal-muted)', fontSize: '12px', textDecoration: 'underline' }}
                >
                  Cerrar sesión de {user.nombre}
                </button>
              )}
            </div>

            {/* `flexShrink: 0`: el bloque del total se comprimía a 78px dentro de
                una fila de 723px y el precio se partía en tres renglones
                ("$" / "28.0" / "00"). */}
            <div className="resp-stack-sm" style={{ display: 'flex', alignItems: 'center', gap: '40px', flexShrink: 0 }}>
              <div className="resp-unfix" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--teal-muted)', fontSize: '13px' }}>Costo Total Estimado</span>
                <span className="heading" style={{ color: 'white', fontSize: '32px', whiteSpace: 'nowrap' }}>
                  {formatPrice(total)}
                </span>
              </div>
              <button
                onClick={confirmar}
                style={{
                  background: confirmed ? '#155a58' : 'var(--primary)',
                  color: 'white',
                  borderRadius: '30px',
                  padding: '14px 32px',
                  fontWeight: 700,
                  fontSize: '15px',
                  boxShadow: '0px 4px 12px 0px rgba(217, 90, 62, 0.2)',
                }}
              >
                {confirmed ? '¡Turno Confirmado!' : 'Confirmar Turno'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
