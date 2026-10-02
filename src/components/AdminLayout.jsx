import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api.js'
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
  { id: 'turnos', label: 'Turnos', to: '/admin/turnos', icon: calendarDays, iconM: calendarDaysM, badge: '12' },
  { id: 'clientes', label: 'Clientes', to: '/admin/dashboard', icon: users, iconM: usersM },
  { id: 'vehiculos', label: 'Vehículos', to: '/admin/dashboard', icon: carFront, iconM: carFrontM },
  { id: 'servicios', label: 'Servicios y contenidos', to: '/admin/servicios', icon: panelsTopLeft, iconM: panelsTopLeftM },
  { id: 'reportes', label: 'Reportes', to: '/admin/dashboard', icon: chartNoAxes, iconM: chartNoAxesM },
]

export default function AdminLayout({ active, title, subtitle, children }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
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
              MS
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>Martín San José</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="heading" style={{ fontSize: '23px' }}>{title}</span>
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{subtitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
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
              <img src={bell} alt="" width="18" height="18" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>Mié. 30 sep. 2026</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: '30px 36px 44px' }}>{children}</main>
      </div>
    </div>
  )
}
