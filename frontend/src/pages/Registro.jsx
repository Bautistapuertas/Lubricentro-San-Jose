import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken, setUser } from '../api.js'
import brandBg from '../assets/brand-bg.png'

export default function Registro() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Completá todos los campos.')
      return
    }
    // Sin este control un error de tipeo no se descubre hasta el próximo
    // ingreso, cuando la contraseña ya quedó guardada y no se puede cambiar:
    // el alta es el único momento en que se puede corregir sin vueltas.
    if (password !== repetir) {
      setError('Las contraseñas no coinciden.')
      return
    }
    try {
      await api('/auth/registro', { method: 'POST', body: { nombre, email, password } })
      // Alta + login automático: el cliente entra directo a su portal
      const data = await api('/auth/login', { method: 'POST', body: { email, password } })
      setToken(data.token)
      setUser(data.usuario)
      setError('')
      setNotice('¡Cuenta creada! Ya estás logueado en tu portal.')
      setTimeout(() => navigate('/reservar-turno'), 900)
    } catch (err) {
      setNotice('')
      setError(err.message)
    }
  }

  return (
    <div className="resp-auth" style={{ display: 'flex', minHeight: '100vh' }}>
      <section
        className="resp-brand"
        style={{
          flex: '0 0 50%',
          padding: '80px',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(rgba(46,37,32,0.72), rgba(46,37,32,0.72)), url(${brandBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="heading" style={{ color: 'white', fontSize: '54px', lineHeight: 1.15 }}>
          Creá tu cuenta y reservá en minutos.
        </h1>
      </section>
      <section className="resp-form" style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form
          onSubmit={handleSubmit}
          style={{ width: '540px', background: 'white', border: '1.5px solid var(--border)', borderRadius: '24px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <h2 className="heading" style={{ fontSize: '32px', textAlign: 'center' }}>Crear cuenta</h2>
          {error && <p style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{error}</p>}
          {notice && <p style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{notice}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="reg-nombre">Nombre completo</label>
              <div className="input-box"><input id="reg-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="reg-email">Email</label>
              <div className="input-box"><input id="reg-email" name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@email.com" /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="reg-password">Contraseña</label>
              <div className="input-box"><input id="reg-password" name="new-password" type="password" autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="label" htmlFor="reg-repetir">Repetir contraseña</label>
              <div className="input-box"><input id="reg-repetir" name="new-password" type="password" autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={repetir} onChange={(e) => setRepetir(e.target.value)} placeholder="Escribila de nuevo" /></div>
            </div>
          </div>
          <button type="submit" style={{ background: 'var(--primary)', color: 'white', borderRadius: '30px', padding: '16px', fontWeight: 700, fontSize: '15px' }}>
            Crear cuenta
          </button>
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
            ¿Ya tenés cuenta? <Link to="/" style={{ color: 'var(--teal)', fontWeight: 700 }}>Ingresá</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
