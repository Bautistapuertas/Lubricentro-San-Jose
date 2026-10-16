const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const REG_CACHE_KEY = 'gsj_registered_users'

function getCachedUsers() {
  try { return JSON.parse(localStorage.getItem(REG_CACHE_KEY) || '{}') } catch { return {} }
}

function saveCachedUser(nombre, email, password) {
  if (!email || !password) return
  try {
    const map = getCachedUsers()
    const key = email.toLowerCase().trim()
    map[key] = { nombre: nombre || key, email: key, password }
    localStorage.setItem(REG_CACHE_KEY, JSON.stringify(map))
  } catch {}
}

export const getToken = () => localStorage.getItem('token')
export const setToken = (t) => localStorage.setItem('token', t)
export const clearToken = () => localStorage.removeItem('token')
export const clearUser = () => localStorage.removeItem('user')
export const logout = async () => {
  try { await api('/auth/logout', { method: 'POST' }) } catch {}
  clearToken()
  clearUser()
}
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}
export const setUser = (u) => localStorage.setItem('user', JSON.stringify(u))

export async function api(path, { method = 'GET', body } = {}) {
  const url = `${BASE_URL}/api${path}`
  const buildOpts = () => ({
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  let res = await fetch(url, buildOpts())

  // Si es login y el contenedor gratuito en la nube se reinició por inactividad,
  // re-sincronizar automáticamente la cuenta registrada previamente en este navegador
  if (
    res.status === 401 &&
    method === 'POST' &&
    path === '/auth/login' &&
    body?.email &&
    body?.password
  ) {
    const cached = getCachedUsers()[body.email.toLowerCase().trim()]
    if (cached && cached.password === body.password) {
      try {
        await fetch(`${BASE_URL}/api/auth/registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cached),
        })
        res = await fetch(url, buildOpts())
      } catch {}
    }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Error de servidor')
    err.status = res.status
    throw err
  }

  if (method === 'POST' && path === '/auth/registro' && body?.email && body?.password) {
    saveCachedUser(body.nombre, body.email, body.password)
  }
  if (method === 'POST' && path === '/auth/restablecer' && body?.password) {
    const current = getUser()
    if (current?.email) {
      saveCachedUser(current.nombre, current.email, body.password)
    }
  }

  return data
}
