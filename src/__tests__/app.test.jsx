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
