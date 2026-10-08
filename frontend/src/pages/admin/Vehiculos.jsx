import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { api } from '../../api.js'
import search from '../../assets/search.svg'
import carFront from '../../assets/car-front.svg'

// Colores de la alerta de próximo service: vencido (rojo), próximo (ámbar)
// y al día (verde). La regla del taller es 10.000 km o 12 meses.
const ESTADO_PILL = {
  vencido: { bg: 'var(--primary-soft)', color: 'var(--primary)', texto: 'Service vencido' },
  proximo: { bg: '#FFF3D9', color: '#A56A16', texto: 'Service próximo' },
  ok: { bg: '#EAF5EF', color: '#2E7D5B', texto: 'Al día' },
}

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const cargar = (q = '') => {
    api(`/vehiculos?q=${encodeURIComponent(q)}`).then(setVehiculos).catch((err) => setError(err.message))
  }
  useEffect(() => { cargar() }, [])

  // Igual que en Clientes: debounce y búsqueda server-side por patente
  // (tolerante a espacios y guiones), marca o modelo.
  useEffect(() => {
    if (query === '') return
    const t = setTimeout(() => cargar(query), 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <AdminLayout active="vehiculos" title="Vehículos" subtitle="Kilometraje y control de próximo service">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '12px 16px', maxWidth: '420px' }}>
          <img src={search} alt="" width="18" height="18" />
          <input placeholder="Buscar por patente, marca o modelo..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ fontSize: '14px', flex: 1 }} />
        </div>
        {error && <p style={{ color: 'var(--primary)', fontSize: '13px' }}>{error}</p>}
        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '8px 0' }}>
          {vehiculos.map((v) => {
            const pill = ESTADO_PILL[v.estado_service] || ESTADO_PILL.ok
            return (
              <div key={v.id} className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#F7F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={carFront} alt="" width="19" height="19" />
                </div>
                <div className="resp-fill" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="resp-break" style={{ fontWeight: 700, fontSize: '14px' }}>{v.marca} {v.modelo}</span>
                  <span className="resp-break" style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    {v.patente} · {v.km ?? '—'} km · {v.cliente_nombre || 'sin cliente'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="resp-noshrink" style={{ background: pill.bg, color: pill.color, borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}>{pill.texto}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '11px' }}>
                    Próximo: {(v.km ?? 0) + v.proximo_km_en} km{v.vencimiento_fecha ? ` o ${v.vencimiento_fecha}` : ''}
                  </span>
                </div>
              </div>
            )
          })}
          {vehiculos.length === 0 && <p style={{ padding: '18px 22px', color: 'var(--muted)', fontSize: '13px' }}>Todavía no hay vehículos registrados.</p>}
        </section>
      </div>
    </AdminLayout>
  )
}
