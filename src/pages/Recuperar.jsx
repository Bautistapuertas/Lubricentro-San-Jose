import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  const pedirToken = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    if (!email.trim()) return setError('Ingresá tu email.')
    try {
      const data = await api('/auth/recuperar', { method: 'POST', body: { email } })
      setMensaje('Si el email existe, te enviamos las instrucciones.')
      if (data.token) setToken(data.token) // demo: sin servicio de mail real
    } catch (err) {
      setError(err.message)
    }
  }

  const restablecer = async (e) => {
    e.preventDefault()
    setError('')
    if (!token.trim() || !password.trim()) return setError('Completá el token y la nueva contraseña.')
    try {
      await api('/auth/restablecer', { method: 'POST', body: { token, password } })
      setListo(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '480px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '24px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0px 12px 32px 0px rgba(46, 37, 32, 0.03)' }}>
        <h2 className="heading" style={{ fontSize: '28px' }}>Recuperar contraseña</h2>

        {listo ? (
          <>
            <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>Tu contraseña fue actualizada. Ya podés iniciar sesión.</p>
            <Link to="/" style={{ color: 'var(--teal)', fontWeight: 700, textDecoration: 'underline' }}>Ir al login</Link>
          </>
        ) : (
          <>
            <form onSubmit={pedirToken} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="label" htmlFor="rec-email">Email de tu cuenta</label>
              <div className="input-box">
                <input id="rec-email" type="email" placeholder="juan.perez@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '13px 22px', fontWeight: 700, fontSize: '14px' }}>
                Enviar instrucciones
              </button>
            </form>

            {mensaje && <p style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{mensaje}{token ? ` (demo: token ${token})` : ''}</p>}

            <form onSubmit={restablecer} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <label className="label" htmlFor="rec-token">Token de restablecimiento</label>
              <div className="input-box">
                <input id="rec-token" placeholder="Pegá el token recibido" value={token} onChange={(e) => setToken(e.target.value)} />
              </div>
              <label className="label" htmlFor="rec-pass">Nueva contraseña</label>
              <div className="input-box">
                <input id="rec-pass" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', background: 'var(--teal)', color: 'white', borderRadius: '999px', padding: '13px 22px', fontWeight: 700, fontSize: '14px' }}>
                Restablecer contraseña
              </button>
            </form>

            {error && <p style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{error}</p>}
            <Link to="/" style={{ color: 'var(--muted)', fontSize: '13px', textDecoration: 'underline' }}>Volver al login</Link>
          </>
        )}
      </div>
    </div>
  )
}
