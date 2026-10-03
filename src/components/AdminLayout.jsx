import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { logout, getUser, api } from '../api.js'
import carFront from '../assets/car-front.svg'
import layoutDashboard from '../assets/layout-dashboard.svg'
import layoutDashboardM from '../assets/layout-dashboard-muted.svg'
import calendarDays from '../assets/calendar-days.svg'
import calendarDaysM from '../assets/calendar-days-muted.svg'
import users from '../assets/users.svg'
import usersM from '../assets/users-muted.svg'
import carFrontM from '../assets/car-front-muted.svg'
import panelsTopLeft from '../assets/panels-top-left.svg'
import panelsTopLeftM from '../assets/panels-top-left-muted.svg'
import chartNoAxes from '../assets/chart-no-axes-combined.svg'
import chartNoAxesM from '../assets/chart-no-axes-combined-muted.svg'
import mail from '../assets/mail-menu.svg'
import mailM from '../assets/mail-menu-muted.svg'
import logOutM from '../assets/log-out-muted.svg'
import mapPin from '../assets/map-pin.svg'
import chevronDown from '../assets/chevron-down.svg'
import bell from '../assets/bell.svg'
import list from '../assets/list.svg'

const MODULES = [
  { id: 'resumen', label: 'Resumen', to: '/admin/dashboard', icon: layoutDashboard, iconM: layoutDashboardM },
  { id: 'turnos', label: 'Turnos', to: '/admin/turnos', icon: calendarDays, iconM: calendarDaysM },
  { id: 'clientes', label: 'Clientes', to: '/admin/clientes', icon: users, iconM: usersM },
  { id: 'vehiculos', label: 'Vehículos', to: '/admin/vehiculos', icon: carFront, iconM: carFrontM },
  { id: 'servicios', label: 'Servicios y contenidos', to: '/admin/servicios', icon: panelsTopLeft, iconM: panelsTopLeftM },
  { id: 'reportes', label: 'Reportes', to: '/admin/reportes', icon: chartNoAxes, iconM: chartNoAxesM },
  { id: 'correos', label: 'Correos', to: '/admin/correos', icon: mail, iconM: mailM },
]

export default function AdminLayout({ active, title, subtitle, children }) {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [openNotifs, setOpenNotifs] = useState(false)
  // Menú lateral plegable. AdminLayout se remonta en cada ruta, así que
  // arrancar plegado hace que cada sección entre con la pantalla completa
  // y el usuario abra el menú solo cuando lo necesita.
  const [railAbierto, setRailAbierto] = useState(false)
  // El panel se cierra al clickear afuera o presionar Escape: es lo que se
  // espera de un desplegable y antes no había forma de cerrarlo sin volver
  // a apretar la campana.
  const notifsRef = useRef(null)

  useEffect(() => {
    // Se consulta también cada 15s: si sólo se carga al montar, los turnos
    // que entran mientras el admin ya tiene la pantalla abierta nunca
    // aparecen (reporte: "no aparecen las notificaciones de los turnos").
    let vivo = true
    const cargar = () => api('/notificaciones').then((d) => { if (vivo && Array.isArray(d)) setNotifs(d) }).catch(() => {})
    cargar()
    const t = setInterval(cargar, 15000)
    return () => { vivo = false; clearInterval(t) }
  }, [])

  // Cierre del panel: click afuera o Escape.
  useEffect(() => {
    if (!openNotifs) return
    const fuera = (e) => { if (notifsRef.current && !notifsRef.current.contains(e.target)) setOpenNotifs(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpenNotifs(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', esc)
    }
  }, [openNotifs])

  const noLeidas = notifs.filter((n) => !n.leida).length
  const marcarLeidas = async () => {
    const ids = notifs.filter((n) => !n.leida).map((n) => n.id)
    if (ids.length) {
      await api('/notificaciones/leer', { method: 'POST', body: { ids } }).catch(() => {})
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: 1 })))
    }
  }
  const confirmarTurno = async (n) => {
    try {
      await api(`/turnos/${n.turno_id}/estado`, { method: 'PATCH', body: { estado: 'Confirmado' } })
      await api('/notificaciones/leer', { method: 'POST', body: { ids: [n.id] } }).catch(() => {})
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: 1 } : x)))
      alert('Turno confirmado y mail enviado al cliente.')
    } catch (err) {
      alert(err.message)
    }
  }
  return (
    <div className="resp-admin" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className={`resp-aside${railAbierto ? '' : ' resp-rail-plegado'}`}
        aria-hidden={!railAbierto}
        style={{
          width: railAbierto ? '272px' : '0px',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'var(--ink)',
          padding: railAbierto ? '26px 20px 24px' : '26px 0 24px',
          position: 'relative',
          zIndex: railAbierto ? 60 : 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: railAbierto ? 'auto' : 'none',
          // La animación va por `width` (no por display): si se usara
          // `display: none` el panel aparecería de golpe, sin transición.
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="resp-rail-inner"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            // Ancho fijo para que los rótulos no se aplasten mientras el
            // panel se estira: se revelan con un barrido limpio.
            width: '232px',
            flexShrink: 0,
            opacity: railAbierto ? 1 : 0,
            transform: railAbierto ? 'translateX(0)' : 'translateX(-14px)',
            transition: railAbierto
              ? 'opacity 220ms ease 120ms, transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              : 'opacity 130ms ease, transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img src={carFront} alt="" width="20" height="20" />
            </div>
            <span className="heading resp-rail-hide" style={{ color: 'white', fontSize: '22px' }}>
              Gestión San José
            </span>
          </div>

          {/* Plegar / desplegar el menú */}
          <button
            className="resp-rail-toggle"
            onClick={() => setRailAbierto(false)}
            aria-label="Plegar el menú"
            title="Plegar el menú"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '9px 14px',
              borderRadius: '12px',
              background: '#3A2F29',
              color: '#D8CEC8',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <img src={list} alt="" width="16" height="16" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Plegar menú</span>
          </button>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              className="resp-rail-hide"
              style={{
                color: '#B8AEA8',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Operación
            </span>
            {MODULES.map((m) => {
              const isActive = active === m.id
              return (
                <Link
                  key={m.id}
                  to={m.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'white' : '#D8CEC8',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  <img src={isActive ? m.icon : m.iconM} alt="" width="18" height="18" />
                  <span className="resp-rail-hide" style={{ flex: 1 }}>{m.label}</span>
                  {m.badge && (
                    <span
                      className="resp-rail-badge"
                      style={{
                        background: isActive ? 'white' : '#493B34',
                        color: isActive ? 'var(--primary)' : 'white',
                        borderRadius: '999px',
                        padding: '3px 7px',
                        fontSize: '10px',
                        fontWeight: 800,
                      }}
                    >
                      {m.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div
          className="resp-rail-inner"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '232px',
            flexShrink: 0,
            opacity: railAbierto ? 1 : 0,
            transform: railAbierto ? 'translateX(0)' : 'translateX(-14px)',
            transition: railAbierto
              ? 'opacity 220ms ease 120ms, transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              : 'opacity 130ms ease, transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ height: '1px', background: '#594A43' }} />
          <div className="resp-rail-stack" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '19px',
                background: 'var(--teal)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
              }}
            >
              {(getUser()?.nombre || 'AD').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="resp-rail-hide" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{getUser()?.nombre || 'Administrador'}</span>
              <span style={{ color: '#B8AEA8', fontSize: '11px' }}>Administrador</span>
            </div>
            <button aria-label="Cerrar sesión" onClick={async () => { await logout(); navigate('/admin') }} style={{ background: 'transparent', padding: 0 }}>
              <img src={logOutM} alt="" width="17" height="17" />
            </button>
          </div>
        </div>
      </aside>

      {/* Velo que atenúa el contenido mientras el panel entra */}
      <div
        className="resp-rail-velo"
        aria-hidden="true"
        onClick={() => setRailAbierto(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(46, 37, 32, 0.28)',
          opacity: railAbierto ? 1 : 0,
          pointerEvents: railAbierto ? 'auto' : 'none',
          zIndex: 55,
          transition: 'opacity 260ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Área principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            background: 'var(--white)',
            borderBottom: '1px solid var(--border)',
            height: '76px',
            padding: '0 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburguesa: solo cuando el menú está oculto, para que la
                sección use todo el ancho y aun así se pueda volver a abrir. */}
            {!railAbierto && (
            <button
              className="resp-burger-open"
              onClick={() => setRailAbierto(true)}
              aria-label="Desplegar el menú"
              aria-expanded={false}
              title="Desplegar el menú"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#F7F1EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                zIndex: 60,
              }}
            >
              <img src={list} alt="" width="18" height="18" />
            </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="heading resp-topbar-title" style={{ fontSize: '23px' }}>{title}</span>
              <span className="resp-hide-sm" style={{ color: 'var(--muted)', fontSize: '12px' }}>{subtitle}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
            <div
              className="resp-hide-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F7F1EA',
                borderRadius: '12px',
                padding: '9px 12px',
              }}
            >
              <img src={mapPin} alt="" width="15" height="15" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-2)' }}>Casa central</span>
              <img src={chevronDown} alt="" width="14" height="14" />
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '19px',
                background: '#F7F1EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
            <button onClick={() => setOpenNotifs(!openNotifs)} style={{ width: '38px', height: '38px', borderRadius: '19px', background: '#F7F1EA', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <img src={bell} alt="Notificaciones" width="18" height="18" />
              {noLeidas > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--primary)', color: 'white', borderRadius: '999px', minWidth: '18px', height: '18px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{noLeidas}</span>}
            </button>
            </div>
            {openNotifs && (
              <div ref={notifsRef} className="resp-anchored" style={{ position: 'absolute', top: 70, right: 36, width: '360px', maxHeight: '420px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0px 16px 40px rgba(46,37,32,0.12)', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  <span style={{ fontWeight: 800 }}>Notificaciones</span>
                  <button onClick={marcarLeidas} style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>Marcar leídas</button>
                </div>
                <div className="resp-notif-lista" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                  {notifs.length === 0 && <p style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px' }}>Sin notificaciones.</p>}
                  {notifs.map((n) => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.leida ? 'white' : '#FFF8F1' }}>
                      <p style={{ fontSize: '13px', lineHeight: 1.4 }}>{n.texto}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {n.tipo === 'nuevo_turno' && !n.leida && (
                          <button onClick={() => confirmarTurno(n)} style={{ background: 'var(--teal)', color: 'white', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>Confirmar turno</button>
                        )}
                        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{n.creado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <span className="resp-hide-sm" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Mié. 30 sep. 2026</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: '30px 36px 44px' }}>{children}</main>
      </div>
    </div>
  )
}
