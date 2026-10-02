import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { api } from '../../api.js'

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/vehiculos').then(setVehiculos).catch((err) => setError(err.message))
  }, [])

  return (
    <AdminLayout active="vehiculos" title="Vehículos" subtitle="Vehículos atendidos en el taller">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {error && <p style={{ color: 'var(--primary)', fontSize: '13px' }}>{error}</p>}
        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '8px 0' }}>
          {vehiculos.map((v) => (
            <div key={v.vehiculo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{v.vehiculo}</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Última visita: {v.ultima}</span>
              </div>
              <span style={{ background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}>{v.visitas} visitas</span>
            </div>
          ))}
          {vehiculos.length === 0 && <p style={{ padding: '18px 22px', color: 'var(--muted)', fontSize: '13px' }}>Todavía no hay vehículos registrados.</p>}
        </section>
      </div>
    </AdminLayout>
  )
}
