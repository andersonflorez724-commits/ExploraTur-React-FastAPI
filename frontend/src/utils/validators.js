/**
 * Validadores reutilizables para los formularios.
 * Cada función recibe el valor y devuelve un mensaje de error,
 * o null si el valor es válido.
 */

export const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  lettersAndSpaces: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
  onlyDigits: /^\d+$/,
  // Al menos una mayúscula, una minúscula, un número y un carácter especial
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_+-])[A-Za-z\d@$!%*?&.#_+-]+$/,
  phone: /^[+()\-\s\d]{7,15}$/,
}

export const validateRequired = (value, label = 'Este campo') =>
  !value || !String(value).trim() ? `${label} es obligatorio.` : null

export const validateMinLength = (value, min, label = 'Este campo') =>
  String(value).trim().length < min
    ? `${label} debe tener al menos ${min} caracteres.`
    : null

export const validateMaxLength = (value, max, label = 'Este campo') =>
  String(value).length > max
    ? `${label} no puede superar los ${max} caracteres.`
    : null

export const validateLettersOnly = (value, label = 'Este campo') =>
  !REGEX.lettersAndSpaces.test(String(value).trim())
    ? `${label} solo puede contener letras y espacios.`
    : null

export const validateEmail = (value) =>
  !REGEX.email.test(String(value).trim())
    ? 'Ingresa un correo electrónico válido (ej. nombre@dominio.com).'
    : null

export const validateDigits = (value, min, max, label = 'Este campo') => {
  const clean = String(value).trim()
  if (!REGEX.onlyDigits.test(clean)) {
    return `${label} solo puede contener números.`
  }
  if (clean.length < min || clean.length > max) {
    return `${label} debe tener entre ${min} y ${max} dígitos.`
  }
  return null
}

export const validatePhone = (value) => {
  const clean = String(value).trim()
  if (!REGEX.onlyDigits.test(clean)) {
    return 'El teléfono solo puede contener números.'
  }
  if (clean.length < 7 || clean.length > 15) {
    return 'El teléfono debe tener entre 7 y 15 dígitos.'
  }
  return null
}

export const validatePassword = (value) => {
  if (String(value).length < 8 || String(value).length > 20) {
    return 'La contraseña debe tener entre 8 y 20 caracteres.'
  }
  if (!REGEX.password.test(String(value))) {
    return 'Debe incluir mayúscula, minúscula, número y un símbolo (@$!%*?&.#_+-).'
  }
  return null
}

export const validatePasswordMatch = (password, confirmation) =>
  password !== confirmation ? 'Las contraseñas no coinciden.' : null

/**
 * Valida un objeto de campos y devuelve { values, errors }.
 * Recibe un mapa de reglas: { campo: (value, form) => error|null }
 */
export const validateForm = (form, rules) => {
  const errors = {}
  Object.entries(rules).forEach(([field, rule]) => {
    const message = rule(form[field], form)
    if (message) errors[field] = message
  })
  return errors
}
