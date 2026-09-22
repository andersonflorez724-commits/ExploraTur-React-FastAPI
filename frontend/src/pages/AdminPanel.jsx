import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import DashboardLayout from '../components/DashboardLayout'
import StatsCard from '../components/StatsCard'
import { VentasBarChart, VentasLineChart, MensualBarChart, ProductoPieChart } from '../components/charts/DashboardCharts'
import VentasPage from './VentasPage'
import ReportesPage from './ReportesPage'
import FacturacionPage from './FacturacionPage'
import PQRPage from './PQRPage'
import {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiToggleUserStatus,
  apiDeleteUser,
  apiGetRoles,
  apiGetProducts,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiGetCategories,
  apiGetServices,
  apiCreateService,
  apiUpdateService,
  apiDeleteService,
  apiGetFlights,
  apiCreateFlight,
  apiUpdateFlight,
  apiToggleFlightStatus,
  apiDeleteFlight,
  apiGetDashboardStats,
  apiGetSalesByPeriod,
  apiGetMonthlySales,
  apiGetSalesByProduct,
} from '../utils/api'
import { getSession } from '../utils/storage'
import {
  validateRequired, validateEmail, validatePhone, validatePassword,
  validateLettersOnly, validateMinLength, validateMaxLength,
  validateDigits, validateForm,
} from '../utils/validators'

const INITIAL_USER = {
  nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '',
  direccion: '', telefono: '', email: '', password: '', rol_id: 3,
}
const INITIAL_PRODUCT = { nombre: '', descripcion: '', precio: '', categoria_id: '', stock: 0 }
const INITIAL_SERVICE = { nombre: '', descripcion: '', precio: '' }
const INITIAL_FLIGHT = {
  aerolinea: '', numero_vuelo: '', origen: '', codigo_origen: '',
  destino: '', codigo_destino: '', fecha: '', hora_salida: '',
  hora_llegada: '', duracion: '', escalas: 'Directo', precio: '',
  clase: 'Económica', asientos_disponibles: 50,
}

const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

function AdminPanel() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getSession())
  const [tab, setTab] = useState('dashboard')

  // Usuarios
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [userModal, setUserModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [userForm, setUserForm] = useState(INITIAL_USER)
  const [userSearch, setUserSearch] = useState('')

  // Productos
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [productForm, setProductForm] = useState(INITIAL_PRODUCT)

  // Servicios
  const [services, setServices] = useState([])
  const [serviceModal, setServiceModal] = useState(false)
  const [editService, setEditService] = useState(null)
  const [serviceForm, setServiceForm] = useState(INITIAL_SERVICE)

  // Vuelos
  const [flights, setFlights] = useState([])
  const [flightModal, setFlightModal] = useState(false)
  const [editFlight, setEditFlight] = useState(null)
  const [flightForm, setFlightForm] = useState(INITIAL_FLIGHT)
  const [flightSearch, setFlightSearch] = useState('')

  // Dashboard stats
  const [dashStats, setDashStats] = useState(null)
  const [periodData, setPeriodData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [productSalesData, setProductSalesData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('diario')
  const [chartFechaInicio, setChartFechaInicio] = useState('')
  const [chartFechaFin, setChartFechaFin] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  useEffect(() => {
    if (!user || user.rol !== 'Administrador') navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!user || user.rol !== 'Administrador') return
    loadUsers(); loadRoles(); loadProducts(); loadCategories(); loadServices(); loadFlights(); loadDashStats(); loadChartData()
  }, [user])

  useEffect(() => {
    if (!user || user.rol !== 'Administrador') return
    if (tab === 'usuarios') { loadUsers(); loadRoles() }
    if (tab === 'productos') { loadProducts(); loadCategories() }
    if (tab === 'servicios') loadServices()
    if (tab === 'vuelos') loadFlights()
    if (tab === 'dashboard') { loadDashStats(); loadChartData() }
  }, [tab, user])

  const clearMessages = () => { setError(''); setSuccess('') }

  // Validation rules per form
  const userRules = {
    nombre: (v) => validateRequired(v, 'Nombre') || validateLettersOnly(v, 'Nombre') || validateMinLength(v, 2, 'Nombre'),
    apellido: (v) => validateRequired(v, 'Apellido') || validateLettersOnly(v, 'Apellido') || validateMinLength(v, 2, 'Apellido'),
    numero_documento: (v) => validateRequired(v, 'Nº Documento') || validateDigits(v, 6, 15, 'Nº Documento'),
    direccion: (v) => validateRequired(v, 'Dirección') || validateMinLength(v, 5, 'Dirección') || validateMaxLength(v, 200, 'Dirección'),
    telefono: (v) => validateRequired(v, 'Teléfono') || validatePhone(v),
    email: (v) => validateRequired(v, 'Email') || validateEmail(v),
    password: (v, form) => {
      if (!form._editing && !v) return 'La contraseña es obligatoria.'
      if (v) return validatePassword(v)
      return null
    },
  }

  const productRules = {
    nombre: (v) => validateRequired(v, 'Nombre') || validateMinLength(v, 2, 'Nombre') || validateMaxLength(v, 200, 'Nombre'),
    precio: (v) => {
      const n = parseFloat(v)
      if (isNaN(n) || n < 0) return 'El precio debe ser un número positivo.'
      return null
    },
  }

  const serviceRules = {
    nombre: (v) => validateRequired(v, 'Nombre') || validateMinLength(v, 2, 'Nombre') || validateMaxLength(v, 200, 'Nombre'),
    precio: (v) => {
      const n = parseFloat(v)
      if (isNaN(n) || n < 0) return 'El precio debe ser un número positivo.'
      return null
    },
  }

  const flightRules = {
    aerolinea: (v) => validateRequired(v, 'Aerolínea') || validateLettersOnly(v, 'Aerolínea'),
    numero_vuelo: (v) => validateRequired(v, 'Nº Vuelo') || validateMinLength(v, 3, 'Nº Vuelo'),
    origen: (v) => validateRequired(v, 'Origen') || validateLettersOnly(v, 'Origen'),
    codigo_origen: (v) => validateRequired(v, 'Cód. Origen') || validateMinLength(v, 3, 'Cód. Origen') || validateMaxLength(v, 5, 'Cód. Origen'),
    destino: (v) => validateRequired(v, 'Destino') || validateLettersOnly(v, 'Destino'),
    codigo_destino: (v) => validateRequired(v, 'Cód. Destino') || validateMinLength(v, 3, 'Cód. Destino') || validateMaxLength(v, 5, 'Cód. Destino'),
    fecha: (v) => validateRequired(v, 'Fecha'),
    hora_salida: (v) => validateRequired(v, 'Hora Salida'),
    hora_llegada: (v) => validateRequired(v, 'Hora Llegada'),
    duracion: (v) => validateRequired(v, 'Duración'),
    precio: (v) => {
      const n = parseFloat(v)
      if (isNaN(n) || n < 0) return 'El precio debe ser un número positivo.'
      return null
    },
  }

  const validateField = (field, value, rules, formState) => {
    const rule = rules[field]
    if (!rule) return
    const msg = rule(value, { ...formState, _editing: !!editUser })
    setFormErrors((prev) => ({ ...prev, [field]: msg || '' }))
  }

  // DASHBOARD STATS
  const loadDashStats = async () => {
    try {
      const d = await apiGetDashboardStats()
      setDashStats(d)
    } catch (err) {
      console.error('Error al cargar estadísticas del dashboard:', err)
      setError(err.message)
    }
  }
  const loadChartData = async () => {
    try {
      const params = { periodo: chartPeriod }
      if (chartFechaInicio) params.fecha_inicio = chartFechaInicio
      if (chartFechaFin) params.fecha_fin = chartFechaFin
      const period = await apiGetSalesByPeriod(params)
      setPeriodData(period.datos || [])
    } catch (err) {
      console.error('Error al cargar ventas por período:', err)
    }
    try {
      const monthly = await apiGetMonthlySales()
      setMonthlyData(monthly.datos || [])
    } catch (err) {
      console.error('Error al cargar ventas mensuales:', err)
    }
    try {
      const prodData = await apiGetSalesByProduct()
      setProductSalesData(prodData.productos || [])
    } catch (err) {
      console.error('Error al cargar productos vendidos:', err)
    }
  }

  // USUARIOS
  const loadUsers = async () => {
    try { const params = userSearch ? { busqueda: userSearch } : {}; const data = await apiGetUsers(params); setUsers(data.usuarios) }
    catch (err) { setError(err.message) }
  }
  const loadRoles = async () => { try { const data = await apiGetRoles(); setRoles(data.roles) } catch {} }
  const handleUserSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const errors = validateForm(userForm, userRules)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setError('Corrige los errores antes de continuar.'); return }
    setFormErrors({})
    try {
      if (editUser) { await apiUpdateUser(editUser.id, userForm); setSuccess('Usuario actualizado.') }
      else { await apiCreateUser(userForm); setSuccess('Usuario creado.') }
      setUserModal(false); setEditUser(null); setUserForm(INITIAL_USER); loadUsers()
    } catch (err) { setError(err.message) }
  }
  const handleEditUser = (u) => {
    setEditUser(u)
    setUserForm({ nombre: u.nombre, apellido: u.apellido, tipo_documento: u.tipo_documento, numero_documento: u.numero_documento, direccion: u.direccion, telefono: u.telefono, email: u.email, password: '', rol_id: u.rol_id })
    setUserModal(true)
  }
  const handleToggleUserStatus = async (id, estado) => {
    clearMessages()
    try { await apiToggleUserStatus(id, estado === 'Activo' ? 'Inactivo' : 'Activo'); setSuccess(`Usuario ${estado === 'Activo' ? 'desactivado' : 'activado'}.`); loadUsers() }
    catch (err) { setError(err.message) }
  }
  const handleDeleteUser = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return; clearMessages()
    try { await apiDeleteUser(id); setSuccess('Usuario eliminado.'); loadUsers() }
    catch (err) { setError(err.message) }
  }

  // PRODUCTOS
  const loadProducts = async () => {
    try { const data = await apiGetProducts(); setProducts(data.productos) } catch (err) { setError(err.message) }
  }
  const loadCategories = async () => { try { const data = await apiGetCategories(); setCategories(data.categorias) } catch {} }
  const handleProductSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const errors = validateForm(productForm, productRules)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setError('Corrige los errores antes de continuar.'); return }
    setFormErrors({})
    const payload = { ...productForm, precio: parseFloat(productForm.precio) || 0, stock: parseInt(productForm.stock) || 0 }
    try {
      if (editProduct) { await apiUpdateProduct(editProduct.id, payload); setSuccess('Producto actualizado.') }
      else { await apiCreateProduct(payload); setSuccess('Producto creado.') }
      setProductModal(false); setEditProduct(null); setProductForm(INITIAL_PRODUCT); loadProducts()
    } catch (err) { setError(err.message) }
  }
  const handleEditProduct = (p) => {
    setEditProduct(p)
    setProductForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', stock: p.stock || 0 })
    setProductModal(true)
  }
  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return; clearMessages()
    try { await apiDeleteProduct(id); setSuccess('Producto eliminado.'); loadProducts() }
    catch (err) { setError(err.message) }
  }

  // SERVICIOS
  const loadServices = async () => {
    try { const data = await apiGetServices({ estado: '' }); setServices(data.servicios) } catch (err) { setError(err.message) }
  }
  const handleServiceSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const errors = validateForm(serviceForm, serviceRules)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setError('Corrige los errores antes de continuar.'); return }
    setFormErrors({})
    const payload = { ...serviceForm, precio: parseFloat(serviceForm.precio) || 0 }
    try {
      if (editService) { await apiUpdateService(editService.id, payload); setSuccess('Servicio actualizado.') }
      else { await apiCreateService(payload); setSuccess('Servicio creado.') }
      setServiceModal(false); setEditService(null); setServiceForm(INITIAL_SERVICE); loadServices()
    } catch (err) { setError(err.message) }
  }
  const handleEditService = (s) => {
    setEditService(s)
    setServiceForm({ nombre: s.nombre, descripcion: s.descripcion || '', precio: s.precio })
    setServiceModal(true)
  }
  const handleDeleteService = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return; clearMessages()
    try { await apiDeleteService(id); setSuccess('Servicio eliminado.'); loadServices() }
    catch (err) { setError(err.message) }
  }

  // VUELOS
  const loadFlights = async () => {
    try { const params = flightSearch ? { busqueda: flightSearch } : {}; const data = await apiGetFlights(params); setFlights(data.vuelos) }
    catch (err) { setError(err.message) }
  }
  const handleFlightSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const errors = validateForm(flightForm, flightRules)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setError('Corrige los errores antes de continuar.'); return }
    setFormErrors({})
    const payload = { ...flightForm, precio: parseFloat(flightForm.precio) || 0, asientos_disponibles: parseInt(flightForm.asientos_disponibles) || 50 }
    try {
      if (editFlight) { await apiUpdateFlight(editFlight.id, payload); setSuccess('Vuelo actualizado.') }
      else { await apiCreateFlight(payload); setSuccess('Vuelo creado.') }
      setFlightModal(false); setEditFlight(null); setFlightForm(INITIAL_FLIGHT); loadFlights()
    } catch (err) { setError(err.message) }
  }
  const handleEditFlight = (f) => {
    setEditFlight(f)
    setFlightForm({
      aerolinea: f.aerolinea, numero_vuelo: f.numero_vuelo, origen: f.origen, codigo_origen: f.codigo_origen,
      destino: f.destino, codigo_destino: f.codigo_destino, fecha: f.fecha ? f.fecha.split('T')[0] : '',
      hora_salida: f.hora_salida, hora_llegada: f.hora_llegada, duracion: f.duracion, escalas: f.escalas || 'Directo',
      precio: f.precio, clase: f.clase || 'Económica', asientos_disponibles: f.asientos_disponibles || 50,
    })
    setFlightModal(true)
  }
  const handleDeleteFlight = async (id) => {
    if (!confirm('¿Eliminar este vuelo?')) return; clearMessages()
    try { await apiDeleteFlight(id); setSuccess('Vuelo eliminado.'); loadFlights() }
    catch (err) { setError(err.message) }
  }
  const handleToggleFlightStatus = async (id, estado) => {
    clearMessages()
    try { await apiToggleFlightStatus(id, estado === 'Activo' ? 'Inactivo' : 'Activo'); setSuccess(`Vuelo ${estado === 'Activo' ? 'desactivado' : 'activado'}.`); loadFlights() }
    catch (err) { setError(err.message) }
  }

  if (!user || user.rol !== 'Administrador') return null

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'productos', label: 'Productos', icon: '📦' },
    { id: 'servicios', label: 'Servicios', icon: '🛎️' },
    { id: 'vuelos', label: 'Vuelos', icon: '✈️' },
    { id: 'ventas', label: 'Ventas', icon: '💰' },
    { id: 'facturacion', label: 'Facturación', icon: '📄' },
    { id: 'reportes', label: 'Reportes', icon: '📋' },
    { id: 'pqr', label: 'PQR', icon: '📨' },
  ]

  const activeUsers = users.filter((u) => u.estado === 'Activo').length
  const activeProducts = products.filter((p) => p.estado === 'Activo').length
  const activeServices = services.filter((s) => s.estado === 'Activo').length
  const activeFlights = flights.filter((f) => f.estado === 'Activo').length

  const sectionTitle = {
    dashboard: 'Dashboard',
    usuarios: 'Gestión de Usuarios',
    productos: 'Gestión de Productos',
    servicios: 'Gestión de Servicios',
    vuelos: 'Gestión de Vuelos',
    ventas: 'Gestión de Ventas',
    facturacion: 'Facturación',
    reportes: 'Reportes Diarios',
    pqr: 'PQR (Peticiones, Quejas, Reclamos)',
  }

  return (
    <DashboardLayout
      navItems={navItems}
      activeSection={tab}
      onSectionChange={(id) => { setTab(id); clearMessages() }}
      title={sectionTitle[tab]}
      subtitle="Administra usuarios, productos, servicios y vuelos de la plataforma."
      accentColor="brand"
    >
      {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 animate-fade-in dark:bg-rose-500/15 dark:text-rose-400">⚠️ {error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 animate-fade-in dark:bg-emerald-500/15 dark:text-emerald-400">✅ {success}</div>}

      {/* ========== DASHBOARD ========== */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard icon="👥" label="Total Usuarios" value={dashStats?.total_usuarios || users.length} color="brand" subtitle={`${dashStats?.usuarios_activos || activeUsers} activos`} />
            <StatsCard icon="📦" label="Total Productos" value={dashStats?.total_productos || products.length} color="cyan" subtitle={`${dashStats?.productos_activos || activeProducts} activos`} />
            <StatsCard icon="🛎️" label="Total Servicios" value={dashStats?.total_servicios || services.length} color="emerald" subtitle={`${dashStats?.servicios_activos || activeServices} activos`} />
            <StatsCard icon="✈️" label="Total Vuelos" value={dashStats?.total_vuelos || flights.length} color="amber" subtitle={`${dashStats?.vuelos_activos || activeFlights} activos`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard icon="💰" label="Total Ventas" value={dashStats?.total_ventas || 0} color="violet" subtitle={`${formatPrice(dashStats?.ingresos_totales || 0)}`} />
            <StatsCard icon="📄" label="Facturación" value={formatPrice(dashStats?.facturacion_total || 0)} color="sky" />
            <StatsCard icon="📨" label="PQR Totales" value={dashStats?.total_pqr || 0} color="rose" subtitle={`${dashStats?.pqr_pendientes || 0} pendientes`} />
            <StatsCard icon="⏳" label="Ventas Pendientes" value={dashStats?.ventas_pendientes || 0} color="amber" />
          </div>

          {/* Filtros de gráficos */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Período</label>
              <select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha Inicio</label>
              <input type="date" value={chartFechaInicio} onChange={(e) => setChartFechaInicio(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha Fin</label>
              <input type="date" value={chartFechaFin} onChange={(e) => setChartFechaFin(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <Button onClick={loadChartData}>Aplicar filtros</Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <VentasBarChart data={periodData} title={`Ventas por período (${chartPeriod === 'diario' ? 'Diario' : chartPeriod === 'semanal' ? 'Semanal' : 'Mensual'})`} />
            <VentasLineChart data={periodData} title="Tendencia de ventas" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MensualBarChart data={monthlyData} title="Ventas mensuales del año" />
            <ProductoPieChart data={productSalesData} title="Productos más vendidos" />
          </div>
        </div>
      )}

      {/* ========== TAB USUARIOS ========== */}
      {tab === 'usuarios' && (
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input name="userSearch" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar usuario..." maxLength={50} className="sm:w-72" />
            <div className="flex gap-2">
              <Button onClick={() => { setEditUser(null); setUserForm(INITIAL_USER); setUserModal(true) }}>+ Agregar usuario</Button>
              <Button variant="ghost" onClick={loadUsers}>Actualizar</Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{u.nombre} {u.apellido}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.tipo_documento} · {u.numero_documento}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{u.rol_nombre}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>{u.estado}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditUser(u)} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer dark:text-brand-400 dark:hover:bg-brand-500/15">✏️ Editar</button>
                        <button onClick={() => handleToggleUserStatus(u.id, u.estado)} className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 cursor-pointer dark:text-amber-400 dark:hover:bg-amber-500/15">{u.estado === 'Activo' ? '🔒 Desactivar' : '🔓 Activar'}</button>
                        <button onClick={() => handleDeleteUser(u.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-500/15">🗑️ Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay usuarios registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== TAB PRODUCTOS ========== */}
      {tab === 'productos' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm text-slate-500">{products.length} productos</p>
            <div className="flex gap-2">
              <Button onClick={() => { setEditProduct(null); setProductForm(INITIAL_PRODUCT); setProductModal(true) }}>+ Agregar producto</Button>
              <Button variant="ghost" onClick={loadProducts}>Actualizar</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{p.nombre}</h3>
                    <p className="mt-1 text-xs text-slate-400">{p.categoria_nombre || 'Sin categoría'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{p.estado}</span>
                </div>
                <p className="mt-2 font-display text-lg font-bold text-brand-600 dark:text-brand-400">{formatPrice(p.precio)}</p>
                <p className="mt-1 text-xs text-slate-400">Stock: {p.stock}</p>
                <div className="mt-3 flex gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button onClick={() => handleEditProduct(p)} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer">✏️ Editar</button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer">🗑️ Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ========== TAB VUELOS ========== */}
      {tab === 'vuelos' && (
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input name="flightSearch" value={flightSearch} onChange={(e) => setFlightSearch(e.target.value)} placeholder="Buscar vuelo..." maxLength={50} className="sm:w-72" />
            <div className="flex gap-2">
              <Button onClick={() => { setEditFlight(null); setFlightForm(INITIAL_FLIGHT); setFlightModal(true) }}>+ Agregar vuelo</Button>
              <Button variant="ghost" onClick={loadFlights}>Actualizar</Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">Aerolínea</th>
                  <th className="px-4 py-3">Vuelo</th>
                  <th className="px-4 py-3">Ruta</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {flights.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{f.aerolinea}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{f.numero_vuelo}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{f.origen} ({f.codigo_origen}) → {f.destino} ({f.codigo_destino})</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{f.fecha ? new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-CO') : ''}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{f.hora_salida} – {f.hora_llegada}</td>
                    <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{formatPrice(f.precio)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>{f.estado}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditFlight(f)} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer dark:text-brand-400 dark:hover:bg-brand-500/15">✏️ Editar</button>
                        <button onClick={() => handleToggleFlightStatus(f.id, f.estado)} className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 cursor-pointer dark:text-amber-400 dark:hover:bg-amber-500/15">{f.estado === 'Activo' ? '🔒 Desactivar' : '🔓 Activar'}</button>
                        <button onClick={() => handleDeleteFlight(f.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-500/15">🗑️ Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {flights.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No hay vuelos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== TAB SERVICIOS ========== */}
      {tab === 'servicios' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm text-slate-500">{services.length} servicios</p>
            <div className="flex gap-2">
              <Button onClick={() => { setEditService(null); setServiceForm(INITIAL_SERVICE); setServiceModal(true) }}>+ Agregar servicio</Button>
              <Button variant="ghost" onClick={loadServices}>Actualizar</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{s.nombre}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{s.estado}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.descripcion}</p>
                <p className="mt-2 font-display text-lg font-bold text-brand-600 dark:text-brand-400">{formatPrice(s.precio)}</p>
                <div className="mt-3 flex gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button onClick={() => handleEditService(s)} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer">✏️ Editar</button>
                  <button onClick={() => handleDeleteService(s.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer">🗑️ Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ========== TAB VENTAS ========== */}
      {tab === 'ventas' && <VentasPage />}

      {/* ========== TAB FACTURACIÓN ========== */}
      {tab === 'facturacion' && <FacturacionPage />}

      {/* ========== TAB REPORTES ========== */}
      {tab === 'reportes' && <ReportesPage />}

      {/* ========== TAB PQR ========== */}
      {tab === 'pqr' && <PQRPage />}

      {/* MODAL USUARIO */}
      <Modal open={userModal} onClose={() => { setUserModal(false); setEditUser(null); setFormErrors({}) }} title={editUser ? 'Editar usuario' : 'Crear usuario'} wide>
        <form onSubmit={handleUserSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
          <Input label="Nombre" name="nombre" value={userForm.nombre} onChange={(e) => { setUserForm({ ...userForm, nombre: e.target.value }); validateField('nombre', e.target.value, userRules, userForm) }} required maxLength={100} error={formErrors.nombre} />
          <Input label="Apellido" name="apellido" value={userForm.apellido} onChange={(e) => { setUserForm({ ...userForm, apellido: e.target.value }); validateField('apellido', e.target.value, userRules, userForm) }} required maxLength={100} error={formErrors.apellido} />
          <Select label="Tipo de documento" name="tipo_documento" value={userForm.tipo_documento} onChange={(e) => setUserForm({ ...userForm, tipo_documento: e.target.value })} options={[{ value: 'CC', label: 'CC' }, { value: 'TI', label: 'TI' }, { value: 'CE', label: 'CE' }, { value: 'NIT', label: 'NIT' }, { value: 'PA', label: 'Pasaporte' }]} />
          <Input label="Nº Documento" name="numero_documento" value={userForm.numero_documento} onChange={(e) => { setUserForm({ ...userForm, numero_documento: e.target.value }); validateField('numero_documento', e.target.value, userRules, userForm) }} required maxLength={15} error={formErrors.numero_documento} />
          <Input label="Dirección" name="direccion" value={userForm.direccion} onChange={(e) => { setUserForm({ ...userForm, direccion: e.target.value }); validateField('direccion', e.target.value, userRules, userForm) }} required maxLength={200} className="sm:col-span-2" error={formErrors.direccion} />
          <Input label="Teléfono" name="telefono" value={userForm.telefono} onChange={(e) => { setUserForm({ ...userForm, telefono: e.target.value }); validateField('telefono', e.target.value, userRules, userForm) }} required maxLength={15} error={formErrors.telefono} />
          <Input label="Email" name="email" type="email" value={userForm.email} onChange={(e) => { setUserForm({ ...userForm, email: e.target.value }); validateField('email', e.target.value, userRules, userForm) }} required maxLength={150} error={formErrors.email} />
          <Input label="Contraseña" name="password" type="password" value={userForm.password} onChange={(e) => { setUserForm({ ...userForm, password: e.target.value }); validateField('password', e.target.value, userRules, userForm) }} maxLength={20} placeholder={editUser ? 'Dejar vacío para no cambiar' : 'Mín. 8 caracteres'} error={formErrors.password} />
          <Select label="Rol" name="rol_id" value={userForm.rol_id} onChange={(e) => setUserForm({ ...userForm, rol_id: parseInt(e.target.value) })} options={roles.map((r) => ({ value: r.id, label: r.nombre }))} />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" fullWidth>{editUser ? 'Guardar cambios' : 'Crear usuario'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setUserModal(false); setEditUser(null); setFormErrors({}) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL PRODUCTO */}
      <Modal open={productModal} onClose={() => { setProductModal(false); setEditProduct(null); setFormErrors({}) }} title={editProduct ? 'Editar producto' : 'Crear producto'} wide>
        <form onSubmit={handleProductSubmit} className="space-y-3" noValidate>
          <Input label="Nombre" name="nombre" value={productForm.nombre} onChange={(e) => { setProductForm({ ...productForm, nombre: e.target.value }); validateField('nombre', e.target.value, productRules, productForm) }} required maxLength={200} error={formErrors.nombre} />
          <Input label="Descripción" name="descripcion" value={productForm.descripcion} onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })} maxLength={1000} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Precio (COP)" name="precio" type="number" value={productForm.precio} onChange={(e) => { setProductForm({ ...productForm, precio: e.target.value }); validateField('precio', e.target.value, productRules, productForm) }} required error={formErrors.precio} />
            <Select label="Categoría" name="categoria_id" value={productForm.categoria_id} onChange={(e) => setProductForm({ ...productForm, categoria_id: e.target.value })} options={[{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c.id, label: c.nombre }))]} />
            <Input label="Stock" name="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editProduct ? 'Guardar cambios' : 'Crear producto'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setProductModal(false); setEditProduct(null); setFormErrors({}) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL SERVICIO */}
      <Modal open={serviceModal} onClose={() => { setServiceModal(false); setEditService(null); setFormErrors({}) }} title={editService ? 'Editar servicio' : 'Crear servicio'}>
        <form onSubmit={handleServiceSubmit} className="space-y-3" noValidate>
          <Input label="Nombre" name="nombre" value={serviceForm.nombre} onChange={(e) => { setServiceForm({ ...serviceForm, nombre: e.target.value }); validateField('nombre', e.target.value, serviceRules, serviceForm) }} required maxLength={200} error={formErrors.nombre} />
          <Input label="Descripción" name="descripcion" value={serviceForm.descripcion} onChange={(e) => setServiceForm({ ...serviceForm, descripcion: e.target.value })} maxLength={1000} />
          <Input label="Precio (COP)" name="precio" type="number" value={serviceForm.precio} onChange={(e) => { setServiceForm({ ...serviceForm, precio: e.target.value }); validateField('precio', e.target.value, serviceRules, serviceForm) }} required error={formErrors.precio} />
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editService ? 'Guardar cambios' : 'Crear servicio'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setServiceModal(false); setEditService(null); setFormErrors({}) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL VUELO */}
      <Modal open={flightModal} onClose={() => { setFlightModal(false); setEditFlight(null); setFormErrors({}) }} title={editFlight ? 'Editar vuelo' : 'Crear vuelo'} wide>
        <form onSubmit={handleFlightSubmit} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Aerolínea" name="aerolinea" value={flightForm.aerolinea} onChange={(e) => { setFlightForm({ ...flightForm, aerolinea: e.target.value }); validateField('aerolinea', e.target.value, flightRules, flightForm) }} required maxLength={100} placeholder="Ej. Avianca" error={formErrors.aerolinea} />
            <Input label="Nº Vuelo" name="numero_vuelo" value={flightForm.numero_vuelo} onChange={(e) => { setFlightForm({ ...flightForm, numero_vuelo: e.target.value }); validateField('numero_vuelo', e.target.value, flightRules, flightForm) }} required maxLength={20} placeholder="Ej. AV 123" error={formErrors.numero_vuelo} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input label="Origen" name="origen" value={flightForm.origen} onChange={(e) => { setFlightForm({ ...flightForm, origen: e.target.value }); validateField('origen', e.target.value, flightRules, flightForm) }} required maxLength={100} placeholder="Ej. Bogotá" error={formErrors.origen} />
            <Input label="Cód. Origen" name="codigo_origen" value={flightForm.codigo_origen} onChange={(e) => { setFlightForm({ ...flightForm, codigo_origen: e.target.value }); validateField('codigo_origen', e.target.value, flightRules, flightForm) }} required maxLength={10} placeholder="Ej. BOG" error={formErrors.codigo_origen} />
            <Input label="Destino" name="destino" value={flightForm.destino} onChange={(e) => { setFlightForm({ ...flightForm, destino: e.target.value }); validateField('destino', e.target.value, flightRules, flightForm) }} required maxLength={100} placeholder="Ej. Cartagena" error={formErrors.destino} />
            <Input label="Cód. Destino" name="codigo_destino" value={flightForm.codigo_destino} onChange={(e) => { setFlightForm({ ...flightForm, codigo_destino: e.target.value }); validateField('codigo_destino', e.target.value, flightRules, flightForm) }} required maxLength={10} placeholder="Ej. CTG" error={formErrors.codigo_destino} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input label="Fecha" name="fecha" type="date" value={flightForm.fecha} onChange={(e) => { setFlightForm({ ...flightForm, fecha: e.target.value }); validateField('fecha', e.target.value, flightRules, flightForm) }} required error={formErrors.fecha} />
            <Input label="Hora Salida" name="hora_salida" value={flightForm.hora_salida} onChange={(e) => { setFlightForm({ ...flightForm, hora_salida: e.target.value }); validateField('hora_salida', e.target.value, flightRules, flightForm) }} required maxLength={10} placeholder="Ej. 08:15" error={formErrors.hora_salida} />
            <Input label="Hora Llegada" name="hora_llegada" value={flightForm.hora_llegada} onChange={(e) => { setFlightForm({ ...flightForm, hora_llegada: e.target.value }); validateField('hora_llegada', e.target.value, flightRules, flightForm) }} required maxLength={10} placeholder="Ej. 09:40" error={formErrors.hora_llegada} />
            <Input label="Duración" name="duracion" value={flightForm.duracion} onChange={(e) => { setFlightForm({ ...flightForm, duracion: e.target.value }); validateField('duracion', e.target.value, flightRules, flightForm) }} required maxLength={20} placeholder="Ej. 1h 25m" error={formErrors.duracion} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Select label="Escalas" name="escalas" value={flightForm.escalas} onChange={(e) => setFlightForm({ ...flightForm, escalas: e.target.value })} options={[{ value: 'Directo', label: 'Directo' }, { value: '1 escala', label: '1 escala' }, { value: '2 escalas', label: '2 escalas' }, { value: '3+ escalas', label: '3+ escalas' }]} />
            <Select label="Clase" name="clase" value={flightForm.clase} onChange={(e) => setFlightForm({ ...flightForm, clase: e.target.value })} options={[{ value: 'Económica', label: 'Económica' }, { value: 'Ejecutiva', label: 'Ejecutiva' }, { value: 'Primera Clase', label: 'Primera Clase' }]} />
            <Input label="Precio (COP)" name="precio" type="number" value={flightForm.precio} onChange={(e) => { setFlightForm({ ...flightForm, precio: e.target.value }); validateField('precio', e.target.value, flightRules, flightForm) }} required error={formErrors.precio} />
            <Input label="Asientos" name="asientos_disponibles" type="number" value={flightForm.asientos_disponibles} onChange={(e) => setFlightForm({ ...flightForm, asientos_disponibles: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editFlight ? 'Guardar cambios' : 'Crear vuelo'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setFlightModal(false); setEditFlight(null); setFormErrors({}) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default AdminPanel
