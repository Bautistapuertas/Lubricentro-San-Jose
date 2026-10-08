import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { api } from '../../api.js'
import search from '../../assets/search.svg'

// Clientes como entidades reales (alcance del TP): la búsqueda la hace el
// SERVIDOR (con query `q`), no un filter en memoria del frontend. Así puede
// buscar por DNI y por patente de los vehículos del cliente, cosas que el
// cliente apenas ve en pantalla.
export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', telefono: '', dni: '' })
  const [feedback, setFeedback] = useState('')
  const [detalle, setDetalle] = useState(null)

  const cargar = (q = '') => {
    api(`/clientes?q=${encodeURIComponent(q)}`).then(setClientes).catch((err) => setError(err.message))
  }
  useEffect(() => { cargar() }, [])

  // Búsqueda con debounce: dispara la búsqueda server-side 300ms después de
  // que el usuario deja de tipear (en vez de disparar un request por tecla).
  useEffect(() => {
    if (query === '' && !form) return
    const t = setTimeout(() => cargar(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const crearCliente = async (e) => {
    e.preventDefault()
    if (!nuevo.nombre || !nuevo.email) return setFeedback('Nombre y email son obligatorios')
    try {
      await api('/clientes', { method: 'POST', body: nuevo })
      setForm(false)
      setNuevo({ nombre: '', email: '', telefono: '', dni: '' })
      setFeedback('Cliente creado')
      setTimeout(() => setFeedback(''), 3000)
      cargar(query)
    } catch (err) {
      setFeedback(err.message)
    }
  }

  const abrirDetalle = async (id) => {
    try {
      setDetalle(await api(`/clientes/${id}`))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AdminLayout active="clientes" title="Clientes" subtitle="Clientes registrados con DNI, contacto y vehículos">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '12px 16px', flex: 1, maxWidth: '420px' }}>
            <img src={search} alt="" width="18" height="18" />
            <input placeholder="Buscar por nombre, email, DNI o patente..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ fontSize: '14px', flex: 1 }} />
          </div>
          <button onClick={() => setForm(!form)} style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '12px 22px', fontWeight: 700, fontSize: '14px' }}>+ Nuevo cliente</button>
        </div>

        {feedback && <p style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{feedback}</p>}
        {error && <p style={{ color: 'var(--primary)', fontSize: '13px' }}>{error}</p>}

        {form && (
          <form onSubmit={crearCliente} style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { k: 'nombre', p: 'Nombre completo' },
              { k: 'email', p: 'Email' },
              { k: 'telefono', p: 'Teléfono' },
              { k: 'dni', p: 'DNI' },
            ].map((f) => (
              <input key={f.k} placeholder={f.p} value={nuevo[f.k]} onChange={(e) => setNuevo({ ...nuevo, [f.k]: e.target.value })} style={{ flex: 1, minWidth: '150px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '11px 13px', fontSize: '13px' }} />
            ))}
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '11px 18px', fontWeight: 700, fontSize: '13px' }}>Guardar cliente</button>
          </form>
        )}

        {detalle && (
          <section data-testid="detalle-cliente" style={{ background: 'white', border: '1.2px solid var(--teal)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="heading" style={{ fontSize: '19px' }}>{detalle.nombre}</span>
              <button onClick={() => setDetalle(null)} style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 700 }}>Cerrar</button>
            </div>
            <span style={{ color: 'var(--ink-2)', fontSize: '13px' }}>DNI: {detalle.dni || '—'} · Tel: {detalle.telefono || '—'} · {detalle.email}</span>
            <span style={{ color: 'var(--ink-2)', fontSize: '13px' }}>{detalle.turnos} turnos · {detalle.vehiculos.length} vehículo(s)</span>
            {detalle.vehiculos.map((v) => (
              <span key={v.id} style={{ color: 'var(--muted)', fontSize: '12px' }}>{v.marca} {v.modelo} · {v.patente} · {v.km ?? '—'} km</span>
            ))}
          </section>
        )}

        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '8px 0' }}>
          {clientes.map((c) => (
            <div key={c.id} onClick={() => abrirDetalle(c.id)} className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '14px 22px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div className="resp-fill" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="resp-break" style={{ fontWeight: 700, fontSize: '14px' }}>{c.nombre}</span>
                <span className="resp-break" style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.email} · DNI {c.dni || '—'}</span>
              </div>
              <span className="resp-noshrink" style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}>{c.turnos} turnos · {c.vehiculos} vehículos</span>
            </div>
          ))}
          {clientes.length === 0 && <p style={{ padding: '18px 22px', color: 'var(--muted)', fontSize: '13px' }}>No hay clientes que coincidan con la búsqueda.</p>}
        </section>
      </div>
    </AdminLayout>
  )
}
