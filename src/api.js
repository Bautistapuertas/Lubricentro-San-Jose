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
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Error de servidor')
    err.status = res.status
    throw err
  }
  return data
}
