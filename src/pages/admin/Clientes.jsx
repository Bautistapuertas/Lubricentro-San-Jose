import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { api } from '../../api.js'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api('/clientes').then(setClientes).catch((err) => setError(err.message))
  }, [])

  const filtrados = clientes.filter((c) => (c.nombre + c.email).toLowerCase().includes(query.toLowerCase()))

  return (
    <AdminLayout active="clientes" title="Clientes" subtitle="Cuentas registradas en el portal">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <input placeholder="Buscar cliente..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: '360px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }} />
        {error && <p style={{ color: 'var(--primary)', fontSize: '13px' }}>{error}</p>}
        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '8px 0' }}>
          {filtrados.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{c.nombre}</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{c.email}</span>
              </div>
              <span style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}>{c.turnos} turnos</span>
            </div>
          ))}
          {filtrados.length === 0 && <p style={{ padding: '18px 22px', color: 'var(--muted)', fontSize: '13px' }}>No hay clientes registrados todavía.</p>}
        </section>
      </div>
    </AdminLayout>
  )
}
