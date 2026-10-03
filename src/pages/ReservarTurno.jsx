import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, getUser, logout } from '../api.js'
import logoIcon from '../assets/logo-icon.svg'
import serviceOil from '../assets/service-oil.svg'
import serviceCar from '../assets/service-car.svg'
import serviceSettings from '../assets/service-settings.svg'
import serviceEye from '../assets/service-eye.svg'
import serviceCar2 from '../assets/service-car2.svg'
import serviceSparkles from '../assets/service-sparkles.svg'

const SERVICES = [
  { id: 'aceite', nombre: 'Cambio de Aceite', duracion: 60, precio: 28000, icon: serviceOil },
  { id: 'lavado', nombre: 'Lavado Completo', duracion: 45, precio: 4500, icon: serviceCar },
  { id: 'alineacion', nombre: 'Alineación y Balanceo', duracion: 40, precio: 15000, icon: serviceSettings },
  { id: 'revision', nombre: 'Revisión General', duracion: 50, precio: 12000, icon: serviceEye },
  { id: 'premium', nombre: 'Lavado Premium', duracion: 90, precio: 8500, icon: serviceCar2 },
  { id: 'pulido', nombre: 'Tratamiento de Pulido', duracion: 120, precio: 18000, icon: serviceSparkles },
]

const DAYS = [
  { id: 'lunes', label: 'Lunes 18' },
  { id: 'martes', label: 'Martes 19' },
  { id: 'miercoles', label: 'Miércoles 20' },
]

const SLOTS = ['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM']

const formatPrice = (n) => '$ ' + n.toLocaleString('es-AR')

export default function ReservarTurno() {
  const user = getUser()
  const [patente, setPatente] = useState('AB 123 CD')
  const [marca, setMarca] = useState('Volkswagen')
  const [modelo, setModelo] = useState('Gol Trend 1.6 MSI')
  const [day, setDay] = useState('martes')
  const [time, setTime] = useState('11:00 AM')
  const [services, setServices] = useState(SERVICES)
  const [selected, setSelected] = useState(['aceite'])
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/servicios')
      .then((data) => {
        if (data?.length) {
          setServices(
            data.map((s, i) => ({
              id: s.nombre.includes('aceite') ? 'aceite' : `s${s.id}`,
              nombre: s.nombre,
              duracion: s.duracion,
              precio: s.precio,
              icon: SERVICES[i]?.icon || SERVICES[0].icon,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const toggleService = (id) => {
    setConfirmed(false)
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const chosen = services.filter((s) => selected.includes(s.id))
  const total = chosen.reduce((acc, s) => acc + s.precio, 0)
  const duration = chosen.reduce((acc, s) => acc + s.duracion, 0)
  const dayLabel = DAYS.find((d) => d.id === day)?.label

  const confirmar = async () => {
    if (chosen.length === 0) return
    try {
      await api('/turnos', {
        method: 'POST',
        body: {
          cliente: user?.nombre || 'Cliente',
          vehiculo: `${marca} ${modelo} · ${patente}`,
          servicios: chosen.map((c) => c.nombre),
          fecha: dayLabel,
          hora: time,
        },
      })
      setConfirmed(true)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={logoIcon} alt="" width="18" height="18" />
          </div>
          <span className="heading resp-topbar-title resp-brand" style={{ fontSize: '20px', color: 'var(--ink)' }}>
            Gestión San José
          </span>
        </div>

        <div className="resp-header-group" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span className="resp-hide-sm" style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
            Portal de Clientes
          </span>
          {/* Único acceso al historial desde este flujo: sin él el cliente
              que entra por el login queda encerrado en la pantalla de reserva. */}
          <Link
            to="/historial"
            className="resp-noshrink"
            style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', background: 'var(--teal-soft)', borderRadius: '999px', padding: '9px 16px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Mis turnos
          </Link>
          <div className="resp-divider" style={{ width: '1.5px', height: '20px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="resp-hide-sm" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Cliente activo</span>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{getUser()?.nombre || 'Cliente'}</span>
            </div>
            <div
              className="resp-avatar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '18px',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {(getUser()?.nombre || 'CL').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="resp-row" style={{ padding: '40px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
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
              <div style={{ display: 'flex', gap: '10px' }}>
                {DAYS.map((d) => {
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
                      <span style={{ fontSize: '11px', color: active ? 'var(--teal)' : 'var(--muted)' }}>Mayo</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="label">Horarios Disponibles para {dayLabel}</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {SLOTS.map((slot) => {
                  const active = time === slot
                  return (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: active ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: active ? 'var(--teal-soft)' : 'var(--bg)',
                        color: active ? 'var(--teal)' : 'var(--ink)',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      {slot}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                {dayLabel} de Mayo • {time} • Duración: ~{duration} min
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

            <div className="resp-stack-sm" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <div className="resp-unfix" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--teal-muted)', fontSize: '13px' }}>Costo Total Estimado</span>
                <span className="heading" style={{ color: 'white', fontSize: '32px' }}>
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
