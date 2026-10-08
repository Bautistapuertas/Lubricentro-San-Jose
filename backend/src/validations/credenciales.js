// La contraseña no puede tener espacios al principio o al final: invisible
// en el formulario, pero después ningún ingreso con la contraseña "limpia"
// coincide. El alta es el único momento en que se puede ver y corregir.
export function validarPassword(password) {
  if (typeof password !== 'string') return 'La contraseña no es válida'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (password !== password.trim()) return 'La contraseña no puede empezar ni terminar con espacios'
  return null
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
