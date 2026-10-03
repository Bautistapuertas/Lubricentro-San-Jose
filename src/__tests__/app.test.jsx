import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'

beforeEach(() => localStorage.clear())

const loginComo = (rol) => {
  localStorage.setItem('token', 'tok')
  localStorage.setItem('user', JSON.stringify({ nombre: 'Test', email: 't@t.com', rol }))
}

const renderRoute = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  )

describe('Pantalla de login de cliente', () => {
  it('muestra error si se intenta ingresar sin completar los campos', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(screen.getByText(/ingresá tu email y contraseña/i)).toBeInTheDocument()
  })

  it('informa qué hacer si el cliente no tiene cuenta', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: /no tenés cuenta/i }))
    expect(screen.getAllByText('Crear cuenta').length).toBeGreaterThan(0)
  })

  it('navega a reservar turno con campos completos', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.type(screen.getByLabelText(/dirección de email/i), 'juan@test.com')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreto123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(screen.getByText(/tu vehículo/i)).toBeInTheDocument()
  })
})

describe('Reservar turno', () => {
  it('actualiza el total al seleccionar servicios', async () => {
    const user = userEvent.setup()
    loginComo('cliente')
    renderRoute('/reservar-turno')
    expect((await screen.findAllByText('$ 28.000')).length).toBeGreaterThan(0)
    await user.click(await screen.findByRole('button', { name: /lavado completo/i }))
    expect(screen.getByText('$ 32.500')).toBeInTheDocument()
  })

  it('permite cambiar el día seleccionado', async () => {
    const user = userEvent.setup()
    loginComo('cliente')
    renderRoute('/reservar-turno')
    await user.click(screen.getByRole('button', { name: /lunes 18/i }))
    expect(screen.getByText(/horarios disponibles para lunes 18/i)).toBeInTheDocument()
  })

  it('confirma el turno y cambia el estado del botón', async () => {
    const user = userEvent.setup()
    loginComo('cliente')
    renderRoute('/reservar-turno')
    await user.click(screen.getByRole('button', { name: /confirmar turno/i }))
    expect(screen.getByRole('button', { name: /turno confirmado/i })).toBeInTheDocument()
  })

  it('Verifica el panel de notificaciones del admin: badge, despliegue y confirmar turno', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/turnos')
    const campana = screen.getByRole('button', { name: /notificaciones/i })
    await user.click(campana)
    expect(await screen.findByText('Nuevo turno de Mariana López')).toBeInTheDocument()
    const botonConfirmar = screen.getByRole('button', { name: /confirmar turno/i })
    await user.click(botonConfirmar)
    expect(botonConfirmar).not.toBeInTheDocument()
    expect(screen.getByText('Nuevo turno de Sofía García')).toBeInTheDocument()
  })

  it('Valida la accesibilidad básica de las pantallas críticas cuando el backend falla', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/turnos')
    expect(await screen.findByText('Gestión de turnos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear turno/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument()
  })

  it('arranca plegado y se despliega con la hamburguesa del encabezado', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/dashboard')
    const aside = document.querySelector('.resp-aside')
    await screen.findByText('Resumen operativo')

    // Al entrar a una sección el menú viene plegado: la pantalla es completa.
    expect(aside).toHaveClass('resp-rail-plegado')
    expect(aside).toHaveAttribute('aria-hidden', 'true')
    const burger = screen.getByRole('button', { name: /desplegar el menú/i })
    expect(burger).toBeVisible()

    // Desplegar desde la hamburguesa.
    await user.click(burger)
    expect(aside).not.toHaveClass('resp-rail-plegado')
    expect(aside).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByText('Turnos')).toBeInTheDocument()

    // Y volver a sacarlo.
    await user.click(screen.getByRole('button', { name: /plegar el menú/i }))
    expect(aside).toHaveClass('resp-rail-plegado')
    expect(screen.getByRole('button', { name: /desplegar el menú/i })).toBeVisible()
  })

  it('el menú no queda visible pero inservible: plegado no atrapa los clicks', async () => {
    // Regresión: el aside llevaba `pointer-events: none` cuando estaba
    // plegado, pero el CSS lo dejaba con ancho, así que en móvil el rail se
    // veía y los links de sección no respondían. Ahora plegado = ancho 0.
    loginComo('admin')
    renderRoute('/admin/dashboard')
    await screen.findByText('Resumen operativo')
    const aside = document.querySelector('.resp-aside')
    expect(aside).toHaveClass('resp-rail-plegado')
    expect(aside.style.width).toBe('0px')
    expect(aside.style.pointerEvents).toBe('none')

    // Al abrir, vuelve a ser interactivo.
    await userEvent.setup().click(screen.getByRole('button', { name: /desplegar el menú/i }))
    expect(aside.style.pointerEvents).toBe('auto')
    expect(aside.style.width).toBe('272px')
  })

  it('el menú se anima con transición de ancho en vez de aparecer de golpe', async () => {
    loginComo('admin')
    renderRoute('/admin/dashboard')
    await screen.findByText('Resumen operativo')
    const aside = document.querySelector('.resp-aside')

    // Sin `display: none`: el panel queda en el flujo y puede transitioned.
    expect(aside.style.display).toBe('flex')
    expect(aside.style.transition).toMatch(/width/)
    // El contenido interno tiene su propia transición de opacidad/desplazamiento.
    const inner = document.querySelector('.resp-rail-inner')
    expect(inner).toBeTruthy()
    expect(inner.style.transition).toMatch(/opacity/)
    expect(inner.style.opacity).toBe('0')
  })

  it('el menú vuelve a 0 al entrar a otra sección', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/dashboard')
    await screen.findByText('Resumen operativo')

    // Abrir el menú y navegar a otra sección.
    await user.click(screen.getByRole('button', { name: /desplegar el menú/i }))
    expect(document.querySelector('.resp-aside')).toHaveAttribute('aria-hidden', 'false')
    await user.click(screen.getByRole('link', { name: 'Turnos' }))

    // La sección nueva entra con el menú plegado.
    await screen.findByText('Gestión de turnos')
    const aside = document.querySelector('.resp-aside')
    expect(aside).toHaveClass('resp-rail-plegado')
    expect(aside).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: /desplegar el menú/i })).toBeVisible()
  })

  it('mantiene el encabezado del panel visible con muchas notificaciones y lo cierra con Escape', async () => {
    const user = userEvent.setup()
    // El reporte original: con muchas notificaciones el panel "no se
    // desplegaba". La causa era que el scroll estaba en el panel entero,
    // así que el título y "Marcar leídas" desaparecían al hacer scroll.
    const fetchMock = global.fetch
    const original = fetchMock.getMockImplementation()
    fetchMock.mockImplementation((url, opts) => {
      if (String(url).includes('/api/notificaciones') && !(opts && opts.method === 'POST')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            turno_id: i + 1,
            tipo: 'nuevo_turno',
            texto: `Nuevo turno de Cliente ${i + 1}: Lavado premium el 2026-10-03 10:00`,
            creado: 'Hace 2 min',
            leida: 0,
          }))),
        })
      }
      return original(url, opts)
    })

    loginComo('admin')
    renderRoute('/admin/turnos')
    await user.click(await screen.findByRole('button', { name: /notificaciones/i }))

    const panel = document.querySelector('.resp-anchored')
    expect(panel).toBeInTheDocument()
    // El encabezado vive fuera de la lista scrolleable.
    const cabecera = screen.getByText('Notificaciones').closest('div')
    const lista = document.querySelector('.resp-notif-lista')
    expect(lista).toBeInTheDocument()
    expect(lista.contains(cabecera)).toBe(false)
    // Con 25 avisos el título y "Marcar leídas" siguen en pantalla.
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar leídas/i })).toBeInTheDocument()
    // Y el panel se cierra con Escape.
    await user.keyboard('{Escape}')
    expect(document.querySelector('.resp-anchored')).not.toBeInTheDocument()
  })
})

describe('Historial del cliente', () => {
  it('lista los servicios anteriores', async () => {
    loginComo('cliente')
    renderRoute('/historial')
    expect(screen.getByText('Historial de servicios')).toBeInTheDocument()
    expect((await screen.findAllByText(/comprobante/i)).length).toBeGreaterThan(0)
  })
})

describe('Login de administrador', () => {
  it('bloquea el ingreso sin credenciales', async () => {
    const user = userEvent.setup()
    renderRoute('/admin')
    await user.click(screen.getByRole('button', { name: /ingresar al panel/i }))
    expect(screen.getByText(/ingresá tu correo electrónico/i)).toBeInTheDocument()
    expect(screen.queryByText('Resumen operativo')).not.toBeInTheDocument()
  })

  it('ingresa al dashboard con credenciales', async () => {
    const user = userEvent.setup()
    renderRoute('/admin')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'segura123')
    await user.click(screen.getByRole('button', { name: /ingresar al panel/i }))
    expect(screen.getByText('Buen día, Martín')).toBeInTheDocument()
  })
})

describe('Dashboard, turnos y servicios', () => {
  it('dashboard muestra métricas', () => {
    loginComo('admin')
    renderRoute('/admin/dashboard')
    expect(screen.getByText('Turnos de hoy')).toBeInTheDocument()
    expect(screen.getByText('+12,8%')).toBeInTheDocument()
  })

  it('turnos permite cambiar el estado', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/turnos')
    await user.click(await screen.findByRole('button', { name: /^completado$/i }))
    expect(screen.getAllByText('Completado').length).toBeGreaterThan(0)
  })

  it('turnos filtra por búsqueda', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/turnos')
    await user.type(await screen.findByPlaceholderText(/buscar cliente/i), 'mariana')
    expect((await screen.findAllByText('Mariana López')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Sofía García')).not.toBeInTheDocument()
  })

  it('servicios muestra el catálogo y el editor', async () => {
    loginComo('admin')
    renderRoute('/admin/servicios')
    expect(await screen.findByText('Lavado completo')).toBeInTheDocument()
    expect(screen.getByText('Editando servicio')).toBeInTheDocument()
  })

  it('servicios publica un servicio', async () => {
    const user = userEvent.setup()
    loginComo('admin')
    renderRoute('/admin/servicios')
    await user.click(screen.getByRole('button', { name: /guardar y publicar/i }))
    expect(screen.getByRole('button', { name: /¡publicado!/i })).toBeInTheDocument()
  })
})
