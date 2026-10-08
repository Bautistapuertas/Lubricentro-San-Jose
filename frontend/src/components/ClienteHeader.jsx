import { Link } from 'react-router-dom'
import { getUser } from '../api.js'
import logoIcon from '../assets/logo-icon.svg'

const iniciales = (nombre) =>
  (nombre || 'Cliente')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const ENLACES = [
  { id: 'reservar', to: '/reservar-turno', label: 'Reservar turno' },
  { id: 'turnos', to: '/historial', label: 'Mis turnos' },
]

// Header único del portal de cliente (reserva e historial). Antes cada
// pantalla tenía el suyo: el de la reserva usaba la clase `resp-brand`, que
// en el login es el panel de marca y a ≤1100px le pone `min-height: 300px`,
// así que en el celular el título abría una franja en blanco enorme.
export default function ClienteHeader({ activo }) {
  const nombre = getUser()?.nombre || 'Cliente'

  return (
    <header
      className="resp-header-wrap"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0px 2px 10px 0px rgba(46, 37, 32, 0.04)',
        minHeight: '72px',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      {/* Marca */}
      <Link
        to="/reservar-turno"
        className="resp-header-brand"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, textDecoration: 'none' }}
      >
        <span
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
          <img src={logoIcon} alt="" width="20" height="20" />
        </span>
        <span
          className="heading resp-topbar-name"
          style={{ fontSize: '22px', color: 'var(--ink)', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Gestión San José
        </span>
      </Link>

      {/* Navegación: en el celular pasa a una fila propia debajo de la marca */}
      <nav
        className="resp-nav-row"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
      >
        {ENLACES.map((e) => {
          const activoAhora = activo === e.id
          return (
            <Link
              key={e.id}
              to={e.to}
              aria-current={activoAhora ? 'page' : undefined}
              className="resp-noshrink"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: activoAhora ? 700 : 600,
                color: activoAhora ? 'var(--teal)' : 'var(--ink-2)',
                background: activoAhora ? 'var(--teal-soft)' : 'transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {e.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuario: el avatar nunca se oculta, es el ancla de "con quién estás" */}
      <div className="resp-header-user" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div
          className="resp-hide-md"
          style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}
        >
          <span
            style={{
              color: 'var(--teal)',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Portal de clientes
          </span>
          <span
            className="resp-header-name"
            style={{
              fontWeight: 700,
              fontSize: '14px',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nombre}
          </span>
        </div>
        <div
          className="resp-avatar"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '19px',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {iniciales(nombre)}
        </div>
      </div>
    </header>
  )
}
