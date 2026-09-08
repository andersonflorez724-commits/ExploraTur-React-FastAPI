/**
 * Almacenamiento local de usuarios y sesión.
 * Simula un backend sencillo para el avance académico:
 * el registro guarda clientes y el inicio de sesión valida contra ellos.
 *
 * NOTA: las contraseñas se guardan en texto plano solo con fines
 * académicos/demostrativos. En producción siempre deben cifrarse
 * (p. ej. bcrypt) en un backend real.
 */

const USERS_KEY = 'exploratur_users'
const SESSION_KEY = 'exploratur_session'
const FAVORITES_KEY = 'exploratur_favorites'
const PURCHASES_KEY = 'exploratur_purchases'

/** Devuelve una clave de almacenamiento exclusiva para un cliente. */
const userKey = (base, userEmail) => `${base}_${String(userEmail).toLowerCase()}`

/** Devuelve la lista de usuarios registrados (siempre un array). */
export const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

/** Registra un nuevo cliente y devuelve el usuario creado. */
export const registerUser = (data) => {
  const users = getUsers()
  const exists = users.some(
    (u) => u.email.toLowerCase() === data.email.toLowerCase(),
  )
  if (exists) {
    throw new Error('Ya existe una cuenta con este correo electrónico.')
  }

  const user = {
    id: Date.now(),
    firstName: data.firstName,
    lastName: data.lastName,
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    address: data.address,
    phone: data.phone,
    email: data.email,
    password: data.password,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  return user
}

/** Valida credenciales contra los usuarios registrados. */
export const loginUser = (email, password) => {
  const users = getUsers()
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  )
  if (!user || user.password !== password) {
    return null
  }
  return user
}

/** Guarda la sesión activa (remember = false usa sessionStorage). */
export const saveSession = (user, remember = true) => {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(SESSION_KEY, JSON.stringify(user))
}

export const getSession = () => {
  try {
    const local = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (local) return local
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

/* ---------- Vuelos: favoritos y compras por cliente ---------- */

/** Devuelve los ids de vuelos favoritos del cliente (siempre un array). */
export const getFavorites = (userEmail) => {
  if (!userEmail) return []
  try {
    return JSON.parse(localStorage.getItem(userKey(FAVORITES_KEY, userEmail))) || []
  } catch {
    return []
  }
}

/** Agrega o quita un vuelo de los favoritos y devuelve la lista actualizada. */
export const toggleFavorite = (userEmail, flightId) => {
  const list = getFavorites(userEmail)
  const index = list.indexOf(flightId)
  if (index >= 0) list.splice(index, 1)
  else list.push(flightId)
  localStorage.setItem(userKey(FAVORITES_KEY, userEmail), JSON.stringify(list))
  return list
}

/** Devuelve las compras de vuelos del cliente (siempre un array). */
export const getPurchases = (userEmail) => {
  if (!userEmail) return []
  try {
    return JSON.parse(localStorage.getItem(userKey(PURCHASES_KEY, userEmail))) || []
  } catch {
    return []
  }
}

/** Registra la compra de un vuelo y devuelve la lista actualizada. */
export const addPurchase = (userEmail, flight) => {
  const list = getPurchases(userEmail)
  list.push({ ...flight, purchasedAt: new Date().toISOString() })
  localStorage.setItem(userKey(PURCHASES_KEY, userEmail), JSON.stringify(list))
  return list
}
