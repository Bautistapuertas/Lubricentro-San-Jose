import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
import logOutM from '../assets/log-out-muted.svg'
import mapPin from '../assets/map-pin.svg'
import chevronDown from '../assets/chevron-down.svg'
import bell from '../assets/bell.svg'

const MODULES = [
  { id: 'resumen', label: 'Resumen', to: '/admin/dashboard', icon: layoutDashboard, iconM: layoutDashboardM },
  { id: 'turnos', label: 'Turnos', to: '/admin/turnos', icon: calendarDays, iconM: calendarDaysM },
  { id: 'clientes', label: 'Clientes', to: '/admin/clientes', icon: users, iconM: usersM },
  { id: 'vehiculos', label: 'Vehículos', to: '/admin/vehiculos', icon: carFront, iconM: carFrontM },
  { id: 'servicios', label: 'Servicios y contenidos', to: '/admin/servicios', icon: panelsTopLeft, iconM: panelsTopLeftM },
  { id: 'reportes', label: 'Reportes', to: '/admin/reportes', icon: chartNoAxes, iconM: chartNoAxesM },
]

export default function AdminLayout({ active, title, subtitle, children }) {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [openNotifs, setOpenNotifs] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    api('/notificaciones').then((d) => { if (Array.isArray(d)) setNotifs(d) }).catch(() => {})
  }, [])

  useEffect(() => setMenuAbierto(false), [active])

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
        className={`resp-aside ${menuAbierto ? 'resp-aside-abierto' : ''}`}
        style={{
          width: '272px',
          flexShrink: 0,
          background: 'var(--ink)',
          padding: '26px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
              }}
            >
              <img src={carFront} alt="" width="20" height="20" />
            </div>
            <span className="heading" style={{ color: 'white', fontSize: '22px' }}>
              Gestión San José
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
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
                  <span style={{ flex: 1 }}>{m.label}</span>
                  {m.badge && (
                    <span
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '1px', background: '#594A43' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{getUser()?.nombre || 'Administrador'}</span>
              <span style={{ color: '#B8AEA8', fontSize: '11px' }}>Administrador</span>
            </div>
            <button aria-label="Cerrar sesión" onClick={async () => { await logout(); navigate('/admin') }} style={{ background: 'transparent', padding: 0 }}>
              <img src={logOutM} alt="" width="17" height="17" />
            </button>
          </div>
        </div>
      </aside>

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
            <button className="resp-burger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú" style={{ background: '#F7F1EA', borderRadius: '12px', padding: '10px 12px', display: 'none', alignItems: 'center', gap: '6px', flexDirection: 'column' }}>
              <span style={{ width: '16px', height: '2px', background: 'var(--ink)' }} />
              <span style={{ width: '16px', height: '2px', background: 'var(--ink)' }} />
              <span style={{ width: '16px', height: '2px', background: 'var(--ink)' }} />
            </button>
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
              <div className="resp-anchored" style={{ position: 'absolute', top: 70, right: 36, width: '360px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0px 16px 40px rgba(46,37,32,0.12)', zIndex: 50, maxHeight: '420px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 800 }}>Notificaciones</span>
                  <button onClick={marcarLeidas} style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 700 }}>Marcar leídas</button>
                </div>
                {notifs.length === 0 && <p style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px' }}>Sin notificaciones.</p>}
                {notifs.map((n) => (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.leida ? 'white' : '#FFF8F1' }}>
                    <p style={{ fontSize: '13px', lineHeight: 1.4 }}>{n.texto}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      {n.tipo === 'nuevo_turno' && !n.leida && (
                        <button onClick={() => confirmarTurno(n)} style={{ background: 'var(--teal)', color: 'white', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>Confirmar turno</button>
                      )}
                      <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{n.creado}</span>
                    </div>
                  </div>
                ))}
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
