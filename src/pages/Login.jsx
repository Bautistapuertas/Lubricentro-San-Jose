import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import brandLogo from '../assets/brand-logo.svg'
import eyeIcon from '../assets/eye-icon.svg'
import brandBg from '../assets/brand-bg.png'
import { api, setToken, setUser } from '../api.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setNotice('Ingresá tu email y contraseña para continuar.')
      return
    }
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } })
      setToken(data.token)
      setUser(data.usuario)
      setNotice('')
      navigate('/reservar-turno')
    } catch (err) {
      setNotice(err.message)
    }
  }

  return (
    <div className="resp-auth" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Panel de marca */}
      <section
        className="resp-brand"
        style={{
          flex: '0 0 50%',
          padding: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: `linear-gradient(rgba(46,37,32,0.65), rgba(46,37,32,0.65)), url(${brandBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={brandLogo} alt="Logo" width="22" height="22" />
          </div>
          <span className="heading" style={{ color: 'var(--bg)', fontSize: '24px' }}>
            Gestión San José
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1
            className="heading"
            style={{ color: 'var(--bg)', fontSize: '56px', lineHeight: 1.15 }}
          >
            El cuidado que tu vehículo merece, sin vueltas.
          </h1>
          <p style={{ color: 'var(--bg)', opacity: 0.85, fontSize: '18px', lineHeight: 1.5, maxWidth: '560px' }}>
            Reservá tu turno online en nuestro lubricentro de manera ágil. Historial
            operativo de mantenimiento y lavados, siempre al alcance de tu mano.
          </p>
        </div>

        <p
          style={{
            color: 'var(--bg)',
            opacity: 0.7,
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Lunes a Sábados • 8:00 a 19:00 hs
        </p>
      </section>

      {/* Panel del formulario */}
      <section
        className="resp-form"
        style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: '540px',
            background: 'var(--white)',
            border: '1.5px solid var(--border)',
            borderRadius: '24px',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
            boxShadow: '0px 12px 32px 0px rgba(46, 37, 32, 0.03)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                background: 'var(--primary-soft)',
                border: '1px solid var(--primary)',
                borderRadius: '100px',
                padding: '4px 12px',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Sistema de turnos
            </span>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 className="heading" style={{ fontSize: '32px', lineHeight: 1.2 }}>
                Gestión San José
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: '16px' }}>Reservá tu turno en minutos</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="email">Dirección de Email</label>
              <div className="input-box">
                <input
                  id="email"
                  type="email"
                  placeholder="juan.perez@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="input-box">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="secretpassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">
                  <img src={eyeIcon} alt="" width="16" height="16" />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notice && (
              <p style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>
                {notice}
              </p>
            )}
            <button
              type="submit"
              style={{
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '30px',
                padding: '16px',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0px 6px 16px 0px rgba(217, 90, 62, 0.15)',
              }}
            >
              Iniciar Sesión
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => navigate('/registro')}
                style={{ color: 'var(--teal)', fontSize: '14px', fontWeight: 600, textDecoration: 'underline' }}
              >
                ¿No tenés cuenta? Registrate
              </button>
              <button
                type="button"
                onClick={() => navigate('/recuperar')}
                style={{ color: 'var(--muted)', fontSize: '14px', textDecoration: 'underline' }}
              >
                Olvidé mi contraseña
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
