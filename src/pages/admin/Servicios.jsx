import { useState, useEffect } from 'react'
import { api } from '../../api.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import plus from '../../assets/plus.svg'
import search from '../../assets/search.svg'
import chevronDown from '../../assets/chevron-down.svg'
import listRestart from '../../assets/list-restart.svg'
import circleX from '../../assets/circle-x.svg'
import carFront from '../../assets/car-front.svg'
import settings from '../../assets/settings.svg'
import scanSearch from '../../assets/scan-search.svg'
import sparkles from '../../assets/sparkles.svg'
import wandSparkles from '../../assets/wand-sparkles.svg'
import clock from '../../assets/clock.svg'
import pencil from '../../assets/pencil.svg'
import panelsTopLeft from '../../assets/panels-top-left.svg'
import imageIcon from '../../assets/image-icon.svg'
import fileText from '../../assets/file-text.svg'
import megaphone from '../../assets/megaphone.svg'
import uploadCloud from '../../assets/upload-cloud.svg'
import x from '../../assets/x.svg'
import send from '../../assets/send.svg'
import thumb from '../../assets/thumb.png'

const SERVICIOS = [
  { categoria: 'Mantenimiento', nombre: 'Cambio de aceite', turnos: '48 turnos este mes', precio: '$ 28.000', duracion: '60 min', icon: circleX, publicado: true },
  { categoria: 'Lavado', nombre: 'Lavado completo', turnos: '61 turnos este mes', precio: '$ 4.500', duracion: '45 min', icon: carFront, publicado: true },
  { categoria: 'Neumáticos', nombre: 'Alineación y balanceo', turnos: '22 turnos este mes', precio: '$ 15.000', duracion: '40 min', icon: settings, publicado: true },
  { categoria: 'Diagnóstico', nombre: 'Revisión general', turnos: '31 turnos este mes', precio: '$ 12.000', duracion: '50 min', icon: scanSearch, publicado: true },
  { categoria: 'Lavado', nombre: 'Lavado premium', turnos: '18 turnos este mes', precio: '$ 8.500', duracion: '90 min', icon: sparkles, publicado: true },
  { categoria: 'Estética', nombre: 'Tratamiento de pulido', turnos: 'Borrador sin publicar', precio: '$ 18.000', duracion: '120 min', icon: wandSparkles, publicado: false },
]

const CONTENIDOS = [
  { icon: imageIcon, titulo: 'Promoción de primavera', tipo: 'Banner principal', estado: 'Publicado', bg: '#FCECE6', pillBg: '#EAF5EF', pillColor: '#2E7D5B' },
  { icon: fileText, titulo: 'Consejos para el motor', tipo: 'Artículo', estado: 'Programado', bg: 'var(--teal-soft)', pillBg: 'var(--teal-soft)', pillColor: 'var(--teal)' },
  { icon: megaphone, titulo: 'Horarios de octubre', tipo: 'Aviso', estado: 'Borrador', bg: 'var(--teal-soft)', pillBg: '#FFF3D9', pillColor: '#A56A16' },
]

export default function Servicios() {
  const [tab, setTab] = useState('servicios')
  const [visible, setVisible] = useState(true)
  const [saved, setSaved] = useState(false)
  const [query, setQuery] = useState('')
  const [servicios, setServicios] = useState(SERVICIOS)
  const [editIdx, setEditIdx] = useState(0)
  const [editNombre, setEditNombre] = useState('Cambio de aceite')
  const [editPrecio, setEditPrecio] = useState('28000')
  const [editDuracion, setEditDuracion] = useState('60')

  const seleccionar = (i) => {
    setEditIdx(i)
    const s = servicios[i]
    setEditNombre(s.nombre)
    setEditPrecio(String(s.precioNum ?? ''))
    setEditDuracion(String(s.duracionMin ?? ''))
    setVisible(!!s.publicado)
    setSaved(false)
  }

  const actualizarLocal = (cambios) => {
    setServicios((prev) => prev.map((s, i) => (i === editIdx ? { ...s, ...cambios } : s)))
  }

  useEffect(() => {
    api('/servicios/todos')
      .then((data) => {
        if (data?.length) {
          setServicios(
            data.map((s, i) => ({
              id: s.id,
              categoria: s.categoria,
              nombre: s.nombre,
              turnos: '— turnos registrados',
              precio: '$ ' + s.precio.toLocaleString('es-AR'),
              precioNum: s.precio,
              duracion: `${s.duracion} min`,
              duracionMin: s.duracion,
              icon: SERVICIOS[i]?.icon || SERVICIOS[0].icon,
              publicado: !!s.publico,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  return (
    <AdminLayout active="servicios" title="Servicios y contenidos" subtitle="Catálogo público, precios y material visual">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Encabezado */}
        <div className="resp-stack-sm resp-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Catálogo</span>
            <h1 className="heading" style={{ fontSize: '32px' }}>Servicios y contenidos</h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>Cargá, editá y publicá los servicios que ven tus clientes.</p>
          </div>
          <button onClick={async () => {
            const nombre = window.prompt('Nombre del servicio')
            if (!nombre) return
            const categoria = window.prompt('Categoría', 'Mantenimiento') || 'Mantenimiento'
            const precio = Number(window.prompt('Precio', '10000'))
            const duracion = Number(window.prompt('Duración (min)', '60'))
            try {
              const r = await api('/servicios', { method: 'POST', body: { nombre, categoria, precio, duracion } })
              setServicios((prev) => [...prev, { id: r.id, categoria, nombre, turnos: '— turnos registrados', precio: '$ ' + precio.toLocaleString('es-AR'), precioNum: precio, duracion: `${duracion} min`, duracionMin: duracion, icon: SERVICIOS[0].icon, publicado: false }])
            } catch (err) { alert(err.message) }
          }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '13px 22px', fontWeight: 700, fontSize: '14px', boxShadow: '0px 6px 16px 0px rgba(217, 90, 62, 0.14)' }}>
            <img src={plus} alt="" width="16" height="16" /> Nuevo servicio
          </button>
        </div>

        {/* Pestañas */}
        <div className="resp-wrap" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'servicios', label: 'Servicios' },
            { id: 'contenidos', label: 'Contenidos del portal' },
            { id: 'archivos', label: 'Archivos' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="resp-noshrink"
              style={{
                padding: '12px 4px 18px',
                fontWeight: tab === t.id ? 800 : 700,
                fontSize: '13px',
                color: tab === t.id ? 'var(--primary)' : 'var(--muted)',
                borderBottom: tab === t.id ? '3px solid var(--primary)' : '3px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Herramientas */}
        <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="resp-wrap" style={{ display: 'flex', gap: '10px' }}>
            <div className="resp-fill" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '12px 16px', width: '310px' }}>
              <img src={search} alt="" width="18" height="18" />
              <input placeholder="Buscar servicio" value={query} onChange={(e) => setQuery(e.target.value)} style={{ fontSize: '14px' }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>
              Todas las categorías <img src={chevronDown} alt="" width="14" height="14" />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>
              Publicados y borradores <img src={chevronDown} alt="" width="14" height="14" />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-2)' }}>
              <strong style={{ color: '#2E7D5B', fontWeight: 800 }}>5 publicados</strong> · 1 borrador
            </p>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}>
              <img src={listRestart} alt="" width="16" height="16" /> Ordenar catálogo
            </button>
          </div>
        </div>

        {tab === 'servicios' && (
          <div className="resp-row" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Catálogo */}
            <section className="resp-fill" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {servicios.filter((s) => s.nombre.toLowerCase().includes(query.toLowerCase())).map((s) => {
                  const i = servicios.indexOf(s)
                  return (
                  <div key={s.nombre} onClick={() => seleccionar(i)} style={{ background: 'white', border: i === editIdx ? '1.8px solid var(--teal)' : '1.1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: i === editIdx ? 'var(--teal-soft)' : '#F7F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={s.icon} alt="" width="19" height="19" />
                      </div>
                      <span className="resp-noshrink" style={{ background: s.publicado ? '#EAF5EF' : '#FFF3D9', color: s.publicado ? '#2E7D5B' : '#A56A16', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>
                        {s.publicado ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: 'var(--primary)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{s.categoria}</span>
                      <span className="heading" style={{ fontSize: '18px' }}>{s.nombre}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{s.turnos}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Precio desde</span>
                        <span style={{ fontWeight: 800, fontSize: '18px' }}>{s.precio}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <img src={clock} alt="" width="13" height="13" />
                        <span style={{ color: 'var(--ink-2)', fontSize: '11px', fontWeight: 600 }}>{s.duracion}</span>
                      </div>
                      <button style={{ width: '32px', height: '32px', borderRadius: '16px', background: i === editIdx ? 'var(--teal)' : '#F7F1EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={pencil} alt="Editar" width="14" height="14" style={i === editIdx ? { filter: 'invert(1)' } : undefined} />
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>

              {/* Contenido destacado */}
              <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
                <div className="resp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span className="heading" style={{ fontSize: '20px' }}>Contenido destacado del portal</span>
                    <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Administrá banners, promociones y avisos visibles para clientes.</span>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}>
                    <img src={panelsTopLeft} alt="" width="16" height="16" style={{ filter: 'invert(1)' }} /> Gestionar contenidos
                  </button>
                </div>
                <div className="resp-stack-sm" style={{ display: 'flex', gap: '12px' }}>
                  {CONTENIDOS.map((c) => (
                    <div key={c.titulo} className="resp-stack-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#F7F1EA', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={c.icon} alt="" width="19" height="19" />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontWeight: 800, fontSize: '12px' }}>{c.titulo}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{c.tipo}</span>
                      </div>
                      <span className="resp-noshrink" style={{ background: c.pillBg, color: c.pillColor, borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>{c.estado}</span>
                    </div>
                  ))}
                </div>
              </section>
            </section>

            {/* Editor */}
            <aside className="resp-sidecol" style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ color: 'var(--teal)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Editando servicio</span>
                    <span className="heading" style={{ fontSize: '22px' }}>{servicios[editIdx]?.nombre}</span>
                  </div>
                  <span className="resp-noshrink" style={{ background: servicios[editIdx]?.publicado ? '#EAF5EF' : '#FFF3D9', color: servicios[editIdx]?.publicado ? '#2E7D5B' : '#A56A16', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>{servicios[editIdx]?.publicado ? 'Publicado' : 'Borrador'}</span>
                </div>

                {[
                  { label: 'Nombre del servicio', value: editNombre, onChange: setEditNombre },
                ].map((f) => (
                  <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{f.label}</span>
                    <input value={f.value} onChange={(e) => f.onChange(e.target.value)} style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '11px 13px', fontSize: '12px' }} />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Precio desde</span>
                    <input value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '11px 13px', fontSize: '12px' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Duración (min)</span>
                    <input value={editDuracion} onChange={(e) => setEditDuracion(e.target.value)} style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '11px 13px', fontSize: '12px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Descripción pública</span>
                  <input defaultValue="Renovación de aceite y filtro con control preventivo de 12 puntos." style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '12px', padding: '11px 13px', fontSize: '12px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Imagen destacada</span>
                  <div style={{ border: '1.3px dashed var(--border)', borderRadius: '12px', background: '#F7F1EA', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '19px', background: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={uploadCloud} alt="" width="19" height="19" />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>Arrastrá una imagen o archivo</span>
                    <span style={{ color: 'var(--muted)', fontSize: '10px' }}>JPG, PNG o PDF · Máx. 10 MB</span>
                  </div>
                  <div className="resp-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--teal-soft)', borderRadius: '12px', padding: '11px' }}>
                    <img src={thumb} alt="" width="42" height="42" style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span className="resp-break" style={{ fontSize: '11px', fontWeight: 800 }}>cambio-aceite-portada.jpg</span>
                      <span className="resp-break" style={{ color: 'var(--muted)', fontSize: '10px' }}>2,4 MB · Cargado correctamente</span>
                    </div>
                    <button aria-label="Quitar archivo"><img src={x} alt="" width="15" height="15" /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontWeight: 800, fontSize: '12px' }}>Visible en el portal</span>
                    <span style={{ color: 'var(--muted)', fontSize: '10px' }}>Los clientes pueden reservar este servicio.</span>
                  </div>
                  <button
                    onClick={async () => {
                      const nv = !visible
                      setVisible(nv)
                      const s = servicios[editIdx]
                      if (s?.id) await api(`/servicios/${s.id}`, { method: 'PATCH', body: { publico: nv ? 1 : 0 } }).catch(() => {})
                      actualizarLocal({ publicado: nv })
                    }}
                    aria-label="Cambiar visibilidad"
                    style={{ width: '44px', height: '24px', borderRadius: '999px', background: visible ? 'var(--teal)' : 'var(--border)', padding: '3px', display: 'flex', justifyContent: visible ? 'flex-end' : 'flex-start' }}
                  >
                    <span style={{ width: '18px', height: '18px', borderRadius: '9px', background: 'white' }} />
                  </button>
                </div>

                <div className="resp-stack-sm" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={async () => {
                    const s = servicios[editIdx]
                    try {
                      if (s?.id) await api(`/servicios/${s.id}`, { method: 'PATCH', body: { nombre: editNombre, precio: Number(editPrecio), duracion: Number(editDuracion), publico: 0 } })
                      actualizarLocal({ nombre: editNombre, precioNum: Number(editPrecio), precio: '$ ' + Number(editPrecio).toLocaleString('es-AR'), duracionMin: Number(editDuracion), duracion: `${editDuracion} min`, publicado: false })
                      setVisible(false)
                      setSaved(false)
                    } catch (err) { alert(err.message) }
                  }} style={{ flex: 1, background: 'white', border: '1.2px solid var(--border)', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}>Guardar borrador</button>
                  <button
                    onClick={async () => {
                      const s = servicios[editIdx]
                      try {
                        if (s?.id) await api(`/servicios/${s.id}`, { method: 'PATCH', body: { nombre: editNombre, precio: Number(editPrecio), duracion: Number(editDuracion), publico: 1 } })
                        actualizarLocal({ nombre: editNombre, precioNum: Number(editPrecio), precio: '$ ' + Number(editPrecio).toLocaleString('es-AR'), duracionMin: Number(editDuracion), duracion: `${editDuracion} min`, publicado: true })
                        setVisible(true)
                        setSaved(true)
                      } catch (err) {
                        alert(err.message)
                      }
                    }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, fontSize: '14px' }}
                  >
                    <img src={send} alt="" width="16" height="16" style={{ filter: 'invert(1)' }} /> {saved ? '¡Publicado!' : 'Guardar y publicar'}
                  </button>
                </div>
              </section>

              <section style={{ background: 'white', border: '1.2px solid var(--border)', borderRadius: '20px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0px 10px 28px 0px rgba(46, 37, 32, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="heading" style={{ fontSize: '18px' }}>Últimos cambios</span>
                  <span style={{ color: 'var(--teal)', fontSize: '11px', fontWeight: 700 }}>Ver historial</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#2E7D5B' }} />
                  <p style={{ fontSize: '11px', color: 'var(--ink-2)', lineHeight: 1.4 }}>Precio actualizado por Martín San José · hace 2 días</p>
                </div>
              </section>
            </aside>
          </div>
        )}

        {tab === 'contenidos' && (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Los contenidos del portal se administran desde contenidos destacados.</p>
        )}
        {tab === 'archivos' && (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Archivos subidos al portal.</p>
        )}
      </div>
    </AdminLayout>
  )
}
