import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import carFront from '../../assets/car-front.svg'
import check from '../../assets/check.svg'
import mail from '../../assets/mail.svg'
import lockKeyhole from '../../assets/lock-keyhole.svg'
import eyeAdmin from '../../assets/eye-admin.svg'
import arrowRight from '../../assets/arrow-right.svg'
import shieldCheck from '../../assets/shield-check.svg'
import brandBg from '../../assets/brand-bg.png'
import { api, setToken, setUser } from '../../api.js'

const BENEFITS = ['Agenda en tiempo real', 'Historial centralizado', 'Control de ingresos']

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Ingresá tu correo electrónico y contraseña para continuar.')
      return
    }
    try {
      const data = await api('/auth/admin/login', { method: 'POST', body: { email, password } })
      setToken(data.token)
      setUser(data.usuario)
      setError('')
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Panel de marca */}
      <section
        style={{
          flex: '0 0 50%',
          padding: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: `linear-gradient(rgba(46,37,32,0.72), rgba(46,37,32,0.72)), url(${brandBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={carFront} alt="" width="20" height="20" />
          </div>
          <span className="heading" style={{ color: 'white', fontSize: '22px' }}>Gestión San José</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <span style={{ alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '999px', padding: '6px 13px', color: 'white', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
            Panel operativo
          </span>
          <h1 className="heading" style={{ color: 'white', fontSize: '54px', lineHeight: 1.12, maxWidth: '720px' }}>
            Tu taller, ordenado de punta a punta.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '18px', lineHeight: 1.5, maxWidth: '660px' }}>
            Gestioná turnos, servicios, clientes e ingresos desde un solo lugar, con la operación del día siempre a la vista.
          </p>
          <div style={{ display: 'flex', gap: '28px' }}>
            {BENEFITS.map((b) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={check} alt="" width="13" height="13" />
                <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
          Soporte interno · Lun. a sáb. de 8:00 a 19:00 hs
        </p>
      </section>

      {/* Acceso */}
      <section style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            width: '560px',
            background: 'var(--white)',
            border: '1.5px solid var(--border)',
            borderRadius: '24px',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
            <span style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)', borderRadius: '999px', padding: '5px 12px', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              Acceso administración
            </span>
            <h2 className="heading" style={{ fontSize: '34px' }}>Acceso al panel</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>Ingresá con tu cuenta de dueño o administrador.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="admin-email">Correo electrónico</label>
              <div className="input-box" style={{ gap: '10px' }}>
                <img src={mail} alt="" width="17" height="17" />
                <input id="admin-email" type="email" placeholder="martin@gestionsanjose.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="admin-password">Contraseña</label>
              <div className="input-box" style={{ gap: '10px' }}>
                <img src={lockKeyhole} alt="" width="17" height="17" />
                <input id="admin-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">
                  <img src={eyeAdmin} alt="" width="17" height="17" />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-2)' }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    background: remember ? 'var(--teal)' : 'white',
                    border: remember ? 'none' : '1.5px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {remember && <img src={check} alt="" width="12" height="12" />}
                </span>
                Mantener sesión iniciada
              </button>
              <button type="button" onClick={() => navigate('/recuperar')} style={{ color: 'var(--teal)', fontSize: '13px', fontWeight: 700, textDecoration: 'underline' }}>
                Olvidé mi contraseña
              </button>
            </div>

            {error && (
              <p style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              alignSelf: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '999px',
              padding: '13px 22px',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0px 6px 16px 0px rgba(217, 90, 62, 0.14)',
            }}
          >
            <img src={arrowRight} alt="" width="16" height="16" />
            Ingresar al panel
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--teal-soft)', borderRadius: '12px', padding: '14px' }}>
            <img src={shieldCheck} alt="" width="18" height="18" />
            <p style={{ color: 'var(--teal)', fontSize: '12px', lineHeight: 1.4 }}>
              Acceso protegido. La actividad administrativa queda registrada por seguridad.
            </p>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>
            ¿Problemas para ingresar? Contactá al soporte interno.
          </p>
        </form>
      </section>
    </div>
  )
}
