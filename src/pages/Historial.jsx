import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import carFront from '../assets/car-front.svg'
import { api } from '../api.js'
import wrench from '../assets/wrench.svg'
import calendarCheck from '../assets/calendar-check.svg'
import gauge from '../assets/gauge.svg'
import chevronDown from '../assets/chevron-down.svg'
import arrowRight from '../assets/arrow-right.svg'
import fileDown from '../assets/file-down.svg'
import plus from '../assets/plus.svg'

const INDICADORES = [
  { icon: wrench, label: 'Servicios realizados', value: '8', sub: 'Desde diciembre de 2024' },
  { icon: calendarCheck, label: 'Última visita', value: '18 sep.', sub: 'Cambio de aceite y filtros' },
  { icon: gauge, label: 'Próximo control', value: '7.500 km', sub: 'Estimado para enero de 2027' },
  { icon: carFront, label: 'Vehículo activo', value: 'AB 123 CD', sub: 'VW Gol Trend 1.6' },
]

const SERVICIOS = [
  {
    fecha: '18 SEP 2026', hora: '10:30 hs', titulo: 'Cambio de aceite y filtros',
    estado: 'Completado', pillBg: '#EAF5EF', pillColor: '#2E7D5B',
    vehiculo: 'Volkswagen Gol Trend 1.6 · AB 123 CD',
    detalle: 'Aceite 5W-40 · Filtro de aceite · Control de 12 puntos',
    importe: '$ 42.800', comprobante: '#GSJ-02481',
  },
  {
    fecha: '02 JUL 2026', hora: '09:00 hs', titulo: 'Lavado premium',
    estado: 'Completado', pillBg: '#EAF5EF', pillColor: '#2E7D5B',
    vehiculo: 'Volkswagen Gol Trend 1.6 · AB 123 CD',
    detalle: 'Lavado exterior · Aspirado · Encerado rápido',
    importe: '$ 12.500', comprobante: '#GSJ-02197',
  },
  {
    fecha: '14 MAR 2026', hora: '15:30 hs', titulo: 'Alineación y balanceo',
    estado: 'Completado', pillBg: '#EAF5EF', pillColor: '#2E7D5B',
    vehiculo: 'Volkswagen Gol Trend 1.6 · AB 123 CD',
    detalle: 'Alineación computarizada · Balanceo 4 ruedas',
    importe: '$ 21.000', comprobante: '#GSJ-01744',
  },
  {
    fecha: '08 DIC 2025', hora: '11:00 hs', titulo: 'Revisión general',
    estado: 'Con observaciones', pillBg: '#FFF3D9', pillColor: '#A56A16',
    vehiculo: 'Volkswagen Gol Trend 1.6 · AB 123 CD',
    detalle: 'Diagnóstico · Frenos · Fluidos · Presión de neumáticos',
    importe: '$ 18.900', comprobante: '#GSJ-01209',
  },
]

export default function Historial() {
  const [queryCoche, setQueryCoche] = useState('Todos los vehículos')
  const [periodo, setPeriodo] = useState('Últimos 12 meses')
  const [servicios, setServicios] = useState(SERVICIOS)
  const [misTurnos, setMisTurnos] = useState([])

  useEffect(() => {
    api('/turnos/mios')
      .then((data) => {
        if (Array.isArray(data) && data.length) setMisTurnos(data)
      })
      .catch(() => {})
  }, [])

  const [paginaH, setPaginaH] = useState(1)
  const [totalH, setTotalH] = useState(0)
  const [paginasH, setPaginasH] = useState(1)

  useEffect(() => {
    api(`/historial?pagina=${paginaH}&porPagina=5`)
      .then((data) => {
        const lista = data?.historial
        if (lista) {
          setTotalH(data.total)
          setPaginasH(data.paginas)
          if (lista.length) {
            setServicios(
              lista.map((s) => ({
              fecha: s.fecha,
              hora: '',
              titulo: s.titulo,
              estado: s.estado,
              pillBg: s.estado === 'Completado' ? '#EAF5EF' : '#FFF3D9',
              pillColor: s.estado === 'Completado' ? '#2E7D5B' : '#A56A16',
              vehiculo: s.vehiculo,
              detalle: s.detalle,
              importe: '$ ' + s.importe.toLocaleString('es-AR'),
              comprobante: s.comprobante,
            }))
            )
          }
        }
      })
      .catch(() => {})
  }, [paginaH])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navegación */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', height: '72px', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={carFront} alt="" width="20" height="20" />
          </div>
          <span className="heading" style={{ fontSize: '22px' }}>Gestión San José</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/reservar-turno" style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>Reservar turno</Link>
          <Link to="/historial" style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>Mis turnos</Link>
          <Link to="/historial" style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--teal)', background: 'var(--teal-soft)', borderRadius: '999px', textDecoration: 'none' }}>Historial</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--teal)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Portal de clientes</span>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Juan Pérez</span>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '19px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>JP</div>
        </div>
      </header>

      <main style={{ padding: '42px 180px 64px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Mi cuenta</span>
            <h1 className="heading" style={{ fontSize: '32px' }}>Historial de servicios</h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>Revisá los trabajos realizados, importes y comprobantes de tus vehículos.</p>
          </div>
          <Link to="/reservar-turno" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '13px 22px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0px 6px 16px 0px rgba(217, 90, 62, 0.14)' }}>
            <img src={plus} alt="" width="16" height="16" /> Reservar nuevo turno
          </Link>
        </div>

        {/* Resumen */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {INDICADORES.map((ind) => (
            <div key={ind.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '21px', background: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={ind.icon} alt="" width="20" height="20" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{ind.label}</span>
                <span className="heading" style={{ fontSize: '23px' }}>{ind.value}</span>
                <span style={{ color: 'var(--ink-2)', fontSize: '12px' }}>{ind.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mis turnos */}
        {misTurnos.length > 0 && (
          <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 className="heading" style={{ fontSize: '21px' }}>Mis turnos</h2>
            {misTurnos.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{t.servicio}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{t.vehiculo} · {t.fecha} · {t.hora}</span>
                </div>
                <span style={{ background: t.estado === 'Completado' ? '#EAF5EF' : t.estado === 'Pendiente' ? 'var(--primary-soft)' : 'var(--teal-soft)', color: t.estado === 'Completado' ? '#2E7D5B' : t.estado === 'Pendiente' ? 'var(--primary)' : 'var(--teal)', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}>{t.estado}</span>
              </div>
            ))}
          </section>
        )}

        {/* Filtros */}
        <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Mostrar:</span>
              <button onClick={() => setQueryCoche(queryCoche === 'Todos los vehículos' ? 'VW Gol Trend 1.6' : 'Todos los vehículos')} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: '#F7F1EA', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                {queryCoche} <img src={chevronDown} alt="" width="15" height="15" />
              </button>
              <button onClick={() => setPeriodo(periodo === 'Últimos 12 meses' ? 'Todo el historial' : 'Últimos 12 meses')} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: '#F7F1EA', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                {periodo} <img src={chevronDown} alt="" width="15" height="15" />
              </button>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>4 de 8 servicios</span>
          </div>
        </section>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {servicios.map((s) => (
            <div key={s.comprobante} style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ width: '112px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 800 }}>{s.fecha}</span>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{s.hora}</span>
              </div>
              <div style={{ width: '1.2px', alignSelf: 'stretch', background: 'var(--border)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="heading" style={{ fontSize: '19px' }}>{s.titulo}</span>
                  <span style={{ background: s.pillBg, color: s.pillColor, borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>{s.estado}</span>
                </div>
                <span style={{ color: 'var(--ink-2)', fontSize: '13px', fontWeight: 700 }}>{s.vehiculo}</span>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{s.detalle}</span>
              </div>
              <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Importe final</span>
                <span className="heading" style={{ fontSize: '22px' }}>{s.importe}</span>
              </div>
              <div style={{ width: '210px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--teal)', color: 'white', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}>
                  <img src={arrowRight} alt="" width="16" height="16" /> Ver detalle
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={fileDown} alt="" width="14" height="14" />
                  <span style={{ color: 'var(--teal)', fontSize: '11px', fontWeight: 700 }}>Comprobante {s.comprobante}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Mostrando {totalH === 0 ? 0 : (paginaH - 1) * 5 + 1}–{(paginaH - 1) * 5 + servicios.length} de {totalH}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={paginaH <= 1} onClick={() => setPaginaH((p) => Math.max(1, p - 1))} style={{ border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px', background: 'white', opacity: paginaH <= 1 ? 0.5 : 1 }}>Anterior</button>
            <button disabled={paginaH >= paginasH} onClick={() => setPaginaH((p) => Math.min(paginasH, p + 1))} style={{ border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px', background: 'white', opacity: paginaH >= paginasH ? 0.5 : 1 }}>Siguiente</button>
          </div>
        </div>
      </main>
    </div>
  )
}
