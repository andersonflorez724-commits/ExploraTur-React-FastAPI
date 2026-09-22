/**
 * Servicio API para conectar el Frontend con el Backend.
 * Maneja autenticación JWT, interceptores y errores.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Obtiene el token JWT almacenado.
 */
function getToken() {
  try {
    return localStorage.getItem('exploratur_token')
  } catch {
    return null
  }
}

/**
 * Guarda el token JWT.
 */
function setToken(token) {
  localStorage.setItem('exploratur_token', token)
}

/**
 * Elimina el token JWT.
 */
function removeToken() {
  localStorage.removeItem('exploratur_token')
}

/**
 * Realiza una petición HTTP a la API del Backend.
 * @param {string} endpoint - Ruta relativa (ej. '/auth/login')
 * @param {object} options - Opciones de fetch
 * @returns {Promise<object>} Respuesta JSON
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      // Token expirado o inválido
      if (response.status === 401) {
        removeToken()
        localStorage.removeItem('exploratur_session')
        window.dispatchEvent(new Event('session-changed'))
      }
      throw new Error(data.error || `Error ${response.status}`)
    }

    return data
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. Verifica que el Backend esté ejecutándose.')
    }
    throw error
  }
}

// =====================================================
// Funciones de autenticación
// =====================================================

export async function apiRegister(userData) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
  return data
}

export async function apiLogin(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (data.token) {
    setToken(data.token)
  }

  return data
}

export async function apiGetProfile() {
  return apiRequest('/auth/me')
}

export function apiLogout() {
  removeToken()
}

// =====================================================
// Funciones de usuarios (Admin)
// =====================================================

export async function apiGetUsers(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/users${query ? `?${query}` : ''}`)
}

export async function apiGetUserById(id) {
  return apiRequest(`/users/${id}`)
}

export async function apiCreateUser(userData) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function apiUpdateUser(id, userData) {
  return apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  })
}

export async function apiToggleUserStatus(id, estado) {
  return apiRequest(`/users/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function apiDeleteUser(id) {
  return apiRequest(`/users/${id}`, {
    method: 'DELETE',
  })
}

export async function apiGetRoles() {
  return apiRequest('/users/roles')
}

// =====================================================
// Funciones de productos
// =====================================================

export async function apiGetProducts(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/products${query ? `?${query}` : ''}`)
}

export async function apiGetProductById(id) {
  return apiRequest(`/products/${id}`)
}

export async function apiCreateProduct(productData) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  })
}

export async function apiUpdateProduct(id, productData) {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  })
}

export async function apiToggleProductStatus(id, estado) {
  return apiRequest(`/products/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function apiDeleteProduct(id) {
  return apiRequest(`/products/${id}`, {
    method: 'DELETE',
  })
}

export async function apiGetCategories() {
  return apiRequest('/products/categories')
}

// =====================================================
// Funciones de servicios
// =====================================================

export async function apiGetServices(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/services${query ? `?${query}` : ''}`)
}

export async function apiGetServiceById(id) {
  return apiRequest(`/services/${id}`)
}

export async function apiCreateService(serviceData) {
  return apiRequest('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  })
}

export async function apiUpdateService(id, serviceData) {
  return apiRequest(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData),
  })
}

export async function apiToggleServiceStatus(id, estado) {
  return apiRequest(`/services/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function apiDeleteService(id) {
  return apiRequest(`/services/${id}`, {
    method: 'DELETE',
  })
}

// =====================================================
// Funciones de vuelos
// =====================================================

export async function apiGetFlights(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/flights${query ? `?${query}` : ''}`)
}

export async function apiGetFlightById(id) {
  return apiRequest(`/flights/${id}`)
}

export async function apiCreateFlight(flightData) {
  return apiRequest('/flights', {
    method: 'POST',
    body: JSON.stringify(flightData),
  })
}

export async function apiUpdateFlight(id, flightData) {
  return apiRequest(`/flights/${id}`, {
    method: 'PUT',
    body: JSON.stringify(flightData),
  })
}

export async function apiToggleFlightStatus(id, estado) {
  return apiRequest(`/flights/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function apiDeleteFlight(id) {
  return apiRequest(`/flights/${id}`, {
    method: 'DELETE',
  })
}

// =====================================================
// Funciones de ventas
// =====================================================

export async function apiCreateSale(saleData) {
  return apiRequest('/ventas', {
    method: 'POST',
    body: JSON.stringify(saleData),
  })
}

export async function apiComprarVuelo({ vuelo_id, cantidad }) {
  return apiRequest('/ventas/comprar-vuelo', {
    method: 'POST',
    body: JSON.stringify({ vuelo_id, cantidad }),
  })
}

export async function apiGetSales(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/ventas${query ? `?${query}` : ''}`)
}

export async function apiGetSaleById(id) {
  return apiRequest(`/ventas/${id}`)
}

export async function apiUpdateSaleStatus(id, estado) {
  return apiRequest(`/ventas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function apiGetDailyReport(fecha) {
  return apiRequest(`/ventas/reporte-diario?fecha=${fecha}`)
}

// =====================================================
// Funciones de facturación
// =====================================================

export async function apiCreateInvoice(invoiceData) {
  return apiRequest('/facturas', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  })
}

export async function apiGetInvoices(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/facturas${query ? `?${query}` : ''}`)
}

export async function apiGetInvoiceById(id) {
  return apiRequest(`/facturas/${id}`)
}

export async function apiGetInvoiceByNumber(numero) {
  return apiRequest(`/facturas/por-numero/${numero}`)
}

export async function apiUpdateInvoiceStatus(id, estado) {
  return apiRequest(`/facturas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

// =====================================================
// Funciones de PQR
// =====================================================

export async function apiCreatePQR(pqrData) {
  return apiRequest('/pqr', {
    method: 'POST',
    body: JSON.stringify(pqrData),
  })
}

export async function apiGetPQRs(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/pqr${query ? `?${query}` : ''}`)
}

export async function apiGetPQRById(id) {
  return apiRequest(`/pqr/${id}`)
}

export async function apiUpdatePQRStatus(id, data) {
  return apiRequest(`/pqr/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function apiAssignPQR(id, usuario_asignado_id) {
  return apiRequest(`/pqr/${id}/asignar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_asignado_id }),
  })
}

export async function apiGetPQRStats() {
  return apiRequest('/pqr/estadisticas')
}

// =====================================================
// Funciones de estadísticas / dashboard
// =====================================================

export async function apiGetDashboardStats() {
  return apiRequest('/stats/dashboard')
}

export async function apiGetSalesByPeriod(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiRequest(`/stats/ventas-por-periodo${query ? `?${query}` : ''}`)
}

export async function apiGetSalesByProduct() {
  return apiRequest('/stats/ventas-por-producto')
}

export async function apiGetSalesByService() {
  return apiRequest('/stats/ventas-por-servicio')
}

export async function apiGetMonthlySales(year) {
  const query = year ? `?year=${year}` : ''
  return apiRequest(`/stats/ventas-mensuales${query}`)
}

export async function apiGetTodaySummary() {
  return apiRequest('/stats/resumen-ventas-hoy')
}

// =====================================================
// Funciones de chatbot
// =====================================================

export async function apiChatbot(mensaje, session_id) {
  return apiRequest('/chatbot', {
    method: 'POST',
    body: JSON.stringify({ mensaje, session_id }),
  })
}

export async function apiGetChatHistory(sessionId) {
  return apiRequest(`/chatbot/historial/${sessionId}`)
}

export { getToken, setToken, removeToken }
