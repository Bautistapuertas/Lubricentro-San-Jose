import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { api } from '../../api.js'

export default function Reportes() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard').then(setData).catch((err) => setError(err.message))
  }, [])

  const states = Object.entries(data?.porEstado || {})

  return (
    <AdminLayout active="reportes" title="Reportes" subtitle="Resumen operativo acumulado">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {error && <p style={{ color: 'var(--primary)', fontSize: '13px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: 'Ingresos totales', value: '$ ' + (data?.ingresos ?? 0).toLocaleString('es-AR') },
            { label: 'Servicios completados', value: String(data?.completados ?? 0) },
            { label: 'Turnos en el sistema', value: String(data?.total ?? 0) },
            { label: 'Actualmente en taller', value: String(data?.enTaller ?? 0) },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1, background: 'white', border: '1.2px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</span>
              <span className="heading" style={{ fontSize: '28px' }}>{m.value}</span>
            </div>
          ))}
        </div>
        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 className="heading" style={{ fontSize: '20px' }}>Turnos por estado</h2>
          {states.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Sin datos todavía.</p>}
          {states.map(([estado, n]) => (
            <div key={estado} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>{estado}</span>
              <span style={{ color: 'var(--teal)', fontWeight: 800, fontSize: '13px' }}>{n}</span>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  )
}
