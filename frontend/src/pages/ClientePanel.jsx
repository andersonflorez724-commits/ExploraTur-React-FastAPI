import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { apiGetProducts, apiGetServices } from '../utils/api'
import { getSession, clearSession } from '../utils/storage'

const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

/**
 * Panel de Cliente: muestra información del perfil, productos y servicios disponibles.
 * Acceso solo para clientes autenticados.
 */
function ClientePanel() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getSession())
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [tab, setTab] = useState('perfil')
  const [error, setError] = useState('')

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (user && tab === 'productos') loadProducts()
    if (user && tab === 'servicios') loadServices()
  }, [tab, user])

  const loadProducts = async () => {
    try { const data = await apiGetProducts(); setProducts(data.productos) }
    catch (err) { setError(err.message) }
  }

  const loadServices = async () => {
    try { const data = await apiGetServices(); setServices(data.servicios) }
    catch (err) { setError(err.message) }
  }

  const handleLogout = () => {
    clearSession()
    localStorage.removeItem('exploratur_token')
    window.dispatchEvent(new Event('session-changed'))
    navigate('/')
  }

  if (!user) return null

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            Panel de Cliente
          </p>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            ¡Bienvenido, {user.nombre}!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/85">
            Consulta tu información, productos y servicios disponibles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2" role="tablist">
          {[
            { id: 'perfil', label: 'Mi perfil', icon: '👤' },
            { id: 'productos', label: 'Productos', icon: '📦' },
            { id: 'servicios', label: 'Servicios', icon: '🛎️' },
          ].map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                tab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">⚠️ {error}</div>}

        {/* ========== PERFIL ========== */}
        {tab === 'perfil' && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-500/20">
                  {user.nombre?.[0]?.toUpperCase()}{user.apellido?.[0]?.toUpperCase()}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">{user.nombre} {user.apellido}</h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{user.rol}</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="text-slate-500">Correo electrónico</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{user.email}</span>
                </div>
                {user.numero_documento && (
                  <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="text-slate-500">Documento</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{user.tipo_documento || 'CC'} · {user.numero_documento}</span>
                  </div>
                )}
                {user.telefono && (
                  <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="text-slate-500">Teléfono</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{user.telefono}</span>
                  </div>
                )}
                {user.direccion && (
                  <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="text-slate-500">Dirección</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{user.direccion}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{user.estado || 'Activo'}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button to="/vuelos">Explorar vuelos</Button>
                <Button variant="ghost" onClick={handleLogout}>Cerrar sesión</Button>
              </div>
            </div>
          </div>
        )}

        {/* ========== PRODUCTOS ========== */}
        {tab === 'productos' && (
          <div>
            <p className="mb-4 text-sm text-slate-500">{products.length} productos disponibles</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{p.nombre}</h3>
                  <p className="mt-1 text-xs text-slate-400">{p.categoria_nombre}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{p.descripcion}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-brand-600 dark:text-brand-400">{formatPrice(p.precio)}</p>
                    <span className="text-xs text-slate-400">Stock: {p.stock}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ========== SERVICIOS ========== */}
        {tab === 'servicios' && (
          <div>
            <p className="mb-4 text-sm text-slate-500">{services.length} servicios disponibles</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <article key={s.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{s.nombre}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.descripcion}</p>
                  <p className="mt-3 font-display text-lg font-bold text-brand-600 dark:text-brand-400">{formatPrice(s.precio)}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default ClientePanel
