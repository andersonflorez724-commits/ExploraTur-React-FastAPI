import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
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
} from '../utils/api'
import { getSession } from '../utils/storage'

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

/**
 * Panel de Administrador: gestión CRUD de usuarios, productos y servicios.
 * Acceso restringido a usuarios con rol de Administrador.
 */
function AdminPanel() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getSession())
  const [tab, setTab] = useState('usuarios')

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

  // Errores
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  // Redirigir si no es admin
  useEffect(() => {
    if (!user || user.rol !== 'Administrador') {
      navigate('/login')
    }
  }, [user, navigate])

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (!user || user.rol !== 'Administrador') return
    if (tab === 'usuarios') { loadUsers(); loadRoles() }
    if (tab === 'productos') { loadProducts(); loadCategories() }
    if (tab === 'servicios') loadServices()
    if (tab === 'vuelos') loadFlights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user])

  const clearMessages = () => { setError(''); setSuccess('') }

  // ========== USUARIOS ==========
  const loadUsers = async () => {
    try {
      const params = userSearch ? { busqueda: userSearch } : {}
      const data = await apiGetUsers(params)
      setUsers(data.usuarios)
    } catch (err) { setError(err.message) }
  }
  const loadRoles = async () => {
    try { const data = await apiGetRoles(); setRoles(data.roles) } catch {}
  }
  const handleUserSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    try {
      if (editUser) {
        await apiUpdateUser(editUser.id, userForm)
        setSuccess('Usuario actualizado exitosamente.')
      } else {
        await apiCreateUser(userForm)
        setSuccess('Usuario creado exitosamente.')
      }
      setUserModal(false); setEditUser(null); setUserForm(INITIAL_USER); loadUsers()
    } catch (err) { setError(err.message) }
  }
  const handleEditUser = (u) => {
    setEditUser(u)
    setUserForm({
      nombre: u.nombre, apellido: u.apellido, tipo_documento: u.tipo_documento,
      numero_documento: u.numero_documento, direccion: u.direccion, telefono: u.telefono,
      email: u.email, password: '', rol_id: u.rol_id,
    })
    setUserModal(true)
  }
  const handleToggleUserStatus = async (id, estado) => {
    clearMessages()
    try {
      await apiToggleUserStatus(id, estado === 'Activo' ? 'Inactivo' : 'Activo')
      setSuccess(`Usuario ${estado === 'Activo' ? 'desactivado' : 'activado'} exitosamente.`)
      loadUsers()
    } catch (err) { setError(err.message) }
  }
  const handleDeleteUser = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    clearMessages()
    try { await apiDeleteUser(id); setSuccess('Usuario eliminado.'); loadUsers() }
    catch (err) { setError(err.message) }
  }

  // ========== PRODUCTOS ==========
  const loadProducts = async () => {
    try { const data = await apiGetProducts(); setProducts(data.productos) } catch (err) { setError(err.message) }
  }
  const loadCategories = async () => {
    try { const data = await apiGetCategories(); setCategories(data.categorias) } catch {}
  }
  const handleProductSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const payload = { ...productForm, precio: parseFloat(productForm.precio) || 0, stock: parseInt(productForm.stock) || 0 }
    try {
      if (editProduct) {
        await apiUpdateProduct(editProduct.id, payload)
        setSuccess('Producto actualizado exitosamente.')
      } else {
        await apiCreateProduct(payload)
        setSuccess('Producto creado exitosamente.')
      }
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

  // ========== SERVICIOS ==========
  const loadServices = async () => {
    try { const data = await apiGetServices({ estado: '' }); setServices(data.servicios) } catch (err) { setError(err.message) }
  }
  const handleServiceSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const payload = { ...serviceForm, precio: parseFloat(serviceForm.precio) || 0 }
    try {
      if (editService) {
        await apiUpdateService(editService.id, payload)
        setSuccess('Servicio actualizado exitosamente.')
      } else {
        await apiCreateService(payload)
        setSuccess('Servicio creado exitosamente.')
      }
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

  // ========== VUELOS ==========
  const loadFlights = async () => {
    try {
      const params = flightSearch ? { busqueda: flightSearch } : {}
      const data = await apiGetFlights(params)
      setFlights(data.vuelos)
    } catch (err) { setError(err.message) }
  }
  const handleFlightSubmit = async (e) => {
    e.preventDefault(); clearMessages()
    const payload = { ...flightForm, precio: parseFloat(flightForm.precio) || 0, asientos_disponibles: parseInt(flightForm.asientos_disponibles) || 50 }
    try {
      if (editFlight) {
        await apiUpdateFlight(editFlight.id, payload)
        setSuccess('Vuelo actualizado exitosamente.')
      } else {
        await apiCreateFlight(payload)
        setSuccess('Vuelo creado exitosamente.')
      }
      setFlightModal(false); setEditFlight(null); setFlightForm(INITIAL_FLIGHT); loadFlights()
    } catch (err) { setError(err.message) }
  }
  const handleEditFlight = (f) => {
    setEditFlight(f)
    setFlightForm({
      aerolinea: f.aerolinea, numero_vuelo: f.numero_vuelo, origen: f.origen,
      codigo_origen: f.codigo_origen, destino: f.destino, codigo_destino: f.codigo_destino,
      fecha: f.fecha ? f.fecha.split('T')[0] : '', hora_salida: f.hora_salida,
      hora_llegada: f.hora_llegada, duracion: f.duracion, escalas: f.escalas || 'Directo',
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
    try {
      await apiToggleFlightStatus(id, estado === 'Activo' ? 'Inactivo' : 'Activo')
      setSuccess(`Vuelo ${estado === 'Activo' ? 'desactivado' : 'activado'} exitosamente.`)
      loadFlights()
    } catch (err) { setError(err.message) }
  }

  if (!user || user.rol !== 'Administrador') return null

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'productos', label: 'Productos', icon: '📦' },
    { id: 'servicios', label: 'Servicios', icon: '🛎️' },
    { id: 'vuelos', label: 'Vuelos', icon: '✈️' },
  ]

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            Panel de Administrador
          </p>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Gestión del sistema
          </h1>                <p className="mx-auto mt-3 max-w-xl text-base text-white/85">
            Administra usuarios, productos, servicios y vuelos de la plataforma.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); clearMessages() }}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                tab === t.id ? 'bg-brand-gradient text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Mensajes */}
        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 animate-fade-in dark:bg-rose-500/15 dark:text-rose-400">⚠️ {error}</div>}
        {success && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 animate-fade-in dark:bg-emerald-500/15 dark:text-emerald-400">✅ {success}</div>}

        {/* ========== TAB USUARIOS ========== */}
        {tab === 'usuarios' && (
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input name="userSearch" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuario..." maxLength={50} className="sm:w-72" />
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
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{u.rol_nombre}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>{u.estado}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditUser(u)} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer dark:text-brand-400 dark:hover:bg-brand-500/15">✏️ Editar</button>
                          <button onClick={() => handleToggleUserStatus(u.id, u.estado)} className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 cursor-pointer dark:text-amber-400 dark:hover:bg-amber-500/15">{u.estado === 'Activo' ? '🔒 Desactivar' : '🔓 Activar'}</button>
                          <button onClick={() => handleDeleteUser(u.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-500/15">🗑️ Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay usuarios registrados.</td></tr>
                  )}
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
              <Input name="flightSearch" value={flightSearch} onChange={(e) => setFlightSearch(e.target.value)}
                placeholder="Buscar vuelo..." maxLength={50} className="sm:w-72" />
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
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>{f.estado}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditFlight(f)} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer dark:text-brand-400 dark:hover:bg-brand-500/15">✏️ Editar</button>
                          <button onClick={() => handleToggleFlightStatus(f.id, f.estado)} className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 cursor-pointer dark:text-amber-400 dark:hover:bg-amber-500/15">{f.estado === 'Activo' ? '🔒 Desactivar' : '🔓 Activar'}</button>
                          <button onClick={() => handleDeleteFlight(f.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-500/15">🗑️ Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {flights.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No hay vuelos registrados.</td></tr>
                  )}
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
      </section>

      {/* ========== MODAL USUARIO ========== */}
      <Modal open={userModal} onClose={() => { setUserModal(false); setEditUser(null) }} title={editUser ? 'Editar usuario' : 'Crear usuario'} wide>
        <form onSubmit={handleUserSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input label="Nombre" name="nombre" value={userForm.nombre} onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })} required maxLength={100} />
          <Input label="Apellido" name="apellido" value={userForm.apellido} onChange={(e) => setUserForm({ ...userForm, apellido: e.target.value })} required maxLength={100} />
          <Select label="Tipo de documento" name="tipo_documento" value={userForm.tipo_documento} onChange={(e) => setUserForm({ ...userForm, tipo_documento: e.target.value })} options={[{ value: 'CC', label: 'CC' }, { value: 'TI', label: 'TI' }, { value: 'CE', label: 'CE' }, { value: 'NIT', label: 'NIT' }, { value: 'PA', label: 'Pasaporte' }]} />
          <Input label="Nº Documento" name="numero_documento" value={userForm.numero_documento} onChange={(e) => setUserForm({ ...userForm, numero_documento: e.target.value })} required maxLength={15} />
          <Input label="Dirección" name="direccion" value={userForm.direccion} onChange={(e) => setUserForm({ ...userForm, direccion: e.target.value })} required maxLength={200} className="sm:col-span-2" />
          <Input label="Teléfono" name="telefono" value={userForm.telefono} onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })} required maxLength={15} />
          <Input label="Email" name="email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required maxLength={150} />
          <Input label="Contraseña" name="password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} maxLength={20} placeholder={editUser ? 'Dejar vacío para no cambiar' : 'Mín. 8 caracteres'} />
          <Select label="Rol" name="rol_id" value={userForm.rol_id} onChange={(e) => setUserForm({ ...userForm, rol_id: parseInt(e.target.value) })} options={roles.map((r) => ({ value: r.id, label: r.nombre }))} />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" fullWidth>{editUser ? 'Guardar cambios' : 'Crear usuario'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setUserModal(false); setEditUser(null) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* ========== MODAL PRODUCTO ========== */}
      <Modal open={productModal} onClose={() => { setProductModal(false); setEditProduct(null) }} title={editProduct ? 'Editar producto' : 'Crear producto'} wide>
        <form onSubmit={handleProductSubmit} className="space-y-3">
          <Input label="Nombre" name="nombre" value={productForm.nombre} onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })} required maxLength={200} />
          <Input label="Descripción" name="descripcion" value={productForm.descripcion} onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })} maxLength={1000} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Precio (COP)" name="precio" type="number" value={productForm.precio} onChange={(e) => setProductForm({ ...productForm, precio: e.target.value })} required />
            <Select label="Categoría" name="categoria_id" value={productForm.categoria_id} onChange={(e) => setProductForm({ ...productForm, categoria_id: e.target.value })} options={[{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c.id, label: c.nombre }))]} />
            <Input label="Stock" name="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editProduct ? 'Guardar cambios' : 'Crear producto'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setProductModal(false); setEditProduct(null) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* ========== MODAL SERVICIO ========== */}
      <Modal open={serviceModal} onClose={() => { setServiceModal(false); setEditService(null) }} title={editService ? 'Editar servicio' : 'Crear servicio'}>
        <form onSubmit={handleServiceSubmit} className="space-y-3">
          <Input label="Nombre" name="nombre" value={serviceForm.nombre} onChange={(e) => setServiceForm({ ...serviceForm, nombre: e.target.value })} required maxLength={200} />
          <Input label="Descripción" name="descripcion" value={serviceForm.descripcion} onChange={(e) => setServiceForm({ ...serviceForm, descripcion: e.target.value })} maxLength={1000} />
          <Input label="Precio (COP)" name="precio" type="number" value={serviceForm.precio} onChange={(e) => setServiceForm({ ...serviceForm, precio: e.target.value })} required />
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editService ? 'Guardar cambios' : 'Crear servicio'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setServiceModal(false); setEditService(null) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* ========== MODAL VUELO ========== */}
      <Modal open={flightModal} onClose={() => { setFlightModal(false); setEditFlight(null) }} title={editFlight ? 'Editar vuelo' : 'Crear vuelo'} wide>
        <form onSubmit={handleFlightSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Aerolínea" name="aerolinea" value={flightForm.aerolinea} onChange={(e) => setFlightForm({ ...flightForm, aerolinea: e.target.value })} required maxLength={100} placeholder="Ej. Avianca" />
            <Input label="Nº Vuelo" name="numero_vuelo" value={flightForm.numero_vuelo} onChange={(e) => setFlightForm({ ...flightForm, numero_vuelo: e.target.value })} required maxLength={20} placeholder="Ej. AV 123" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input label="Origen" name="origen" value={flightForm.origen} onChange={(e) => setFlightForm({ ...flightForm, origen: e.target.value })} required maxLength={100} placeholder="Ej. Bogotá" />
            <Input label="Cód. Origen" name="codigo_origen" value={flightForm.codigo_origen} onChange={(e) => setFlightForm({ ...flightForm, codigo_origen: e.target.value })} required maxLength={10} placeholder="Ej. BOG" />
            <Input label="Destino" name="destino" value={flightForm.destino} onChange={(e) => setFlightForm({ ...flightForm, destino: e.target.value })} required maxLength={100} placeholder="Ej. Cartagena" />
            <Input label="Cód. Destino" name="codigo_destino" value={flightForm.codigo_destino} onChange={(e) => setFlightForm({ ...flightForm, codigo_destino: e.target.value })} required maxLength={10} placeholder="Ej. CTG" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input label="Fecha" name="fecha" type="date" value={flightForm.fecha} onChange={(e) => setFlightForm({ ...flightForm, fecha: e.target.value })} required />
            <Input label="Hora Salida" name="hora_salida" value={flightForm.hora_salida} onChange={(e) => setFlightForm({ ...flightForm, hora_salida: e.target.value })} required maxLength={10} placeholder="Ej. 08:15" />
            <Input label="Hora Llegada" name="hora_llegada" value={flightForm.hora_llegada} onChange={(e) => setFlightForm({ ...flightForm, hora_llegada: e.target.value })} required maxLength={10} placeholder="Ej. 09:40" />
            <Input label="Duración" name="duracion" value={flightForm.duracion} onChange={(e) => setFlightForm({ ...flightForm, duracion: e.target.value })} required maxLength={20} placeholder="Ej. 1h 25m" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Select label="Escalas" name="escalas" value={flightForm.escalas} onChange={(e) => setFlightForm({ ...flightForm, escalas: e.target.value })} options={[{ value: 'Directo', label: 'Directo' }, { value: '1 escala', label: '1 escala' }, { value: '2 escalas', label: '2 escalas' }, { value: '3+ escalas', label: '3+ escalas' }]} />
            <Select label="Clase" name="clase" value={flightForm.clase} onChange={(e) => setFlightForm({ ...flightForm, clase: e.target.value })} options={[{ value: 'Económica', label: 'Económica' }, { value: 'Ejecutiva', label: 'Ejecutiva' }, { value: 'Primera Clase', label: 'Primera Clase' }]} />
            <Input label="Precio (COP)" name="precio" type="number" value={flightForm.precio} onChange={(e) => setFlightForm({ ...flightForm, precio: e.target.value })} required />
            <Input label="Asientos" name="asientos_disponibles" type="number" value={flightForm.asientos_disponibles} onChange={(e) => setFlightForm({ ...flightForm, asientos_disponibles: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editFlight ? 'Guardar cambios' : 'Crear vuelo'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setFlightModal(false); setEditFlight(null) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </main>
  )
}

export default AdminPanel
