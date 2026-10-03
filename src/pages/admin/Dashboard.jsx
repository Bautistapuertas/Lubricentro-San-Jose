import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import plus from '../../assets/plus.svg'
import { api, getUser } from '../../api.js'
import { useNavigate } from 'react-router-dom'
import calendarCheck from '../../assets/calendar-check.svg'
import carFront from '../../assets/car-front.svg'
import circleDollar from '../../assets/circle-dollar-sign.svg'
import circleCheckBig from '../../assets/circle-check-big.svg'
import ellipsis from '../../assets/ellipsis.svg'
import checkCircle from '../../assets/check-circle.svg'
import userPlus from '../../assets/user-plus.svg'
import filePenLine from '../../assets/file-pen-line.svg'

const METRICS = [
  { label: 'Turnos de hoy', value: '12', delta: '+2 vs. ayer', icon: calendarCheck, bg: 'var(--teal-soft)' },
  { label: 'Vehículos en taller', value: '3', delta: 'Capacidad 60%', icon: carFront, bg: 'var(--primary-soft)' },
  { label: 'Ingresos del día', value: '$ 418.500', delta: '+18,4%', icon: circleDollar, bg: 'var(--teal-soft)' },
  { label: 'Servicios completados', value: '7', delta: '58% del día', icon: circleCheckBig, bg: 'var(--primary-soft)' },
]

const TURNOS = [
  { hora: '08:00', cliente: 'Lucía Fernández', vehiculo: 'Toyota Etios · AE 456 RT', servicio: 'Cambio de aceite', estado: 'Confirmado', pillBg: 'var(--teal-soft)', pillColor: 'var(--teal)' },
  { hora: '09:30', cliente: 'Diego Martínez', vehiculo: 'Ford Ranger · AC 980 KL', servicio: 'Lavado premium', estado: 'En taller', pillBg: '#FFF3D9', pillColor: '#A56A16' },
  { hora: '11:00', cliente: 'Juan Pérez', vehiculo: 'VW Gol Trend · AB 123 CD', servicio: 'Revisión general', estado: 'Confirmado', pillBg: 'var(--teal-soft)', pillColor: 'var(--teal)' },
  { hora: '13:30', cliente: 'Mariana López', vehiculo: 'Chevrolet Onix · AF 221 NM', servicio: 'Alineación y balanceo', estado: 'Pendiente', pillBg: 'var(--primary-soft)', pillColor: 'var(--primary)' },
]

const ESTADOS = [
  { label: 'Confirmados', count: 5, color: 'var(--teal)', pct: '42%' },
  { label: 'En taller', count: 3, color: '#A56A16', pct: '25%' },
  { label: 'Completados', count: 3, color: '#2E7D5B', pct: '25%' },
  { label: 'Cancelados', count: 1, color: 'var(--primary)', pct: '8%' },
]

const INGRESOS = [
  { dia: 'LUN', h: 42 },
  { dia: 'MAR', h: 58 },
  { dia: 'MIÉ', h: 51 },
  { dia: 'JUE', h: 74 },
  { dia: 'VIE', h: 62 },
  { dia: 'SÁB', h: 88 },
  { dia: 'HOY', h: 78, highlight: true },
]

const ACTIVIDAD = [
  { icon: checkCircle, title: 'Servicio completado', sub: 'Cambio de aceite · Lucía Fernández', time: '10:18' },
  { icon: userPlus, title: 'Nuevo cliente registrado', sub: 'Sofía García', time: '09:52' },
  { icon: filePenLine, title: 'Turno reprogramado', sub: 'Ford Ranger · 01 oct., 08:00', time: '09:21' },
  { icon: circleDollar, title: 'Pago registrado', sub: '$ 42.800 · Juan Pérez', time: '08:46' },
]

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api('/dashboard').then(setDashboard).catch(() => {})
  }, [])

  const metricas = [
    { label: 'Turnos de hoy', value: String(dashboard?.total ?? 12), delta: '+2 vs. ayer', icon: calendarCheck, bg: 'var(--teal-soft)' },
    { label: 'Vehículos en taller', value: String(dashboard?.enTaller ?? 3), delta: 'Capacidad 60%', icon: carFront, bg: 'var(--primary-soft)' },
    { label: 'Ingresos del día', value: '$ ' + (dashboard?.ingresos ?? 418500).toLocaleString('es-AR'), delta: '+18,4%', icon: circleDollar, bg: 'var(--teal-soft)' },
    { label: 'Servicios completados', value: String(dashboard?.completados ?? 7), delta: '58% del día', icon: circleCheckBig, bg: 'var(--primary-soft)' },
  ]
  const keyEstado = { Confirmados: 'Confirmado', 'En taller': 'En taller', Completados: 'Completado', Cancelados: 'Cancelado' }
  const estados = ESTADOS.map((e) => ({ ...e, count: dashboard?.porEstado?.[keyEstado[e.label]] ?? 0 }))
  const totalEstados = Math.max(estados.reduce((acc, e) => acc + e.count, 0), 1)
  const estadosConPct = estados.map((e) => ({ ...e, pct: Math.round((e.count / totalEstados) * 100) + '%' }))
  const proximos = dashboard?.proximos?.length ? dashboard.proximos.map((t) => ({ hora: t.hora, cliente: t.cliente, vehiculo: t.vehiculo, servicio: t.servicio, estado: t.estado, pillBg: t.estado === 'Confirmado' ? 'var(--teal-soft)' : t.estado === 'En taller' ? '#FFF3D9' : t.estado === 'Pendiente' ? 'var(--primary-soft)' : '#EAF5EF', pillColor: t.estado === 'Confirmado' ? 'var(--teal)' : t.estado === 'En taller' ? '#A56A16' : t.estado === 'Pendiente' ? 'var(--primary)' : '#2E7D5B' })) : TURNOS
  const maxEstado = Math.max(...estados.map((e) => e.count), 1)

  return (
    <AdminLayout active="resumen" title="Resumen operativo" subtitle="Estado general de Gestión San José">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Encabezado */}
        <div className="resp-stack-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Hoy · Miércoles 30 de septiembre</span>
            <h1 className="heading" style={{ fontSize: '32px' }}>{`Buen día, ${getUser()?.nombre?.split(' ')[0] || 'Martín'}`}</h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
              Tenés {dashboard?.total ?? 12} turnos programados y 3 vehículos actualmente en taller.
            </p>
          </div>
          <button onClick={() => navigate('/admin/turnos')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '13px 22px', fontWeight: 700, fontSize: '14px', boxShadow: '0px 6px 16px 0px rgba(217, 90, 62, 0.14)' }}>
            <img src={plus} alt="" width="16" height="16" /> Nuevo turno
          </button>
        </div>

        {/* Métricas */}
        <div className="resp-grid-2" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {metricas.map((m) => (
            <div key={m.label} style={{ flex: 1, background: 'white', border: '1.2px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '19px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={m.icon} alt="" width="18" height="18" />
                </div>
                <span style={{ color: '#2E7D5B', fontSize: '11px', fontWeight: 700 }}>{m.delta}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</span>
                <span className="heading resp-val-sm" style={{ fontSize: '29px' }}>{m.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Operación principal */}
        <div className="resp-row" style={{ display: 'flex', gap: '20px' }}>
          <section className="resp-fill" style={{ flex: 1, background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
            <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span className="heading" style={{ fontSize: '21px' }}>Próximos turnos</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Agenda de las próximas horas</span>
              </div>
              <button onClick={() => navigate('/admin/turnos')} style={{ border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}>Ver agenda</button>
            </div>
            <div>
              {proximos.map((t, i) => (
                <div key={i} className="resp-stack-sm" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 0', borderBottom: i < proximos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="resp-unfix" style={{ width: '58px', height: '40px', borderRadius: '8px', background: '#F7F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{t.hora}</span>
                  </div>
                  <div className="resp-unfix" style={{ width: '190px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{t.cliente}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{t.vehiculo}</span>
                  </div>
                  <span style={{ flex: 1, color: 'var(--ink-2)', fontSize: '12px', fontWeight: 600 }}>{t.servicio}</span>
                  <span style={{ background: t.pillBg, color: t.pillColor, borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>{t.estado}</span>
                  <img src={ellipsis} alt="" width="18" height="18" />
                </div>
              ))}
            </div>
          </section>

          <div className="resp-sidecol" style={{ width: '440px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="heading" style={{ fontSize: '20px' }}>Estados de hoy</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>12 turnos</span>
              </div>
              {estadosConPct.map((e) => (
                <div key={e.label} style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-2)', fontSize: '12px', fontWeight: 700 }}>{e.label}</span>
                    <span style={{ color: e.color, fontSize: '12px', fontWeight: 800 }}>{e.count}</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '999px', background: '#F7F1EA' }}>
                    <div style={{ height: '7px', borderRadius: '999px', background: e.color, width: e.pct }} />
                  </div>
                </div>
              ))}
            </section>

            <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="heading" style={{ fontSize: '20px' }}>Ocupación del taller</span>
                <span style={{ background: '#EAF5EF', color: '#2E7D5B', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>Normal</span>
              </div>
              <span className="heading" style={{ fontSize: '34px', color: 'var(--teal)' }}>60%</span>
              <p style={{ color: 'var(--ink-2)', fontSize: '12px', lineHeight: 1.45 }}>3 de 5 puestos activos. Próxima liberación estimada a las 11:45 hs.</p>
            </section>
          </div>
        </div>

        {/* Análisis inferior */}
        <div className="resp-row" style={{ display: 'flex', gap: '20px' }}>
          <section style={{ flex: 1, background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span className="heading" style={{ fontSize: '20px' }}>Ingresos semanales</span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>$ {(dashboard?.ingresos ?? 2184900).toLocaleString('es-AR')} acumulados</span>
              </div>
              <span style={{ background: '#EAF5EF', color: '#2E7D5B', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>+12,8%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px' }}>
              {INGRESOS.map((d) => (
                <div key={d.dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '42px', height: `${d.h}px`, borderRadius: '8px 8px 2px 2px', background: d.highlight ? 'var(--primary)' : 'var(--teal-soft)' }} />
                  <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 700 }}>{d.dia}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ flex: 1, background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
            <span className="heading" style={{ fontSize: '20px' }}>Actividad reciente</span>
            {ACTIVIDAD.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#F7F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={a.icon} alt="" width="15" height="15" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{a.title}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{a.sub}</span>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 700 }}>{a.time}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
