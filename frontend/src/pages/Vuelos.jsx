import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import RegisterModal from '../components/auth/RegisterModal'
import { apiGetFlights, apiComprarVuelo } from '../utils/api'
import {
  getSession,
  getFavorites,
  toggleFavorite,
  getPurchases,
  addPurchase,
} from '../utils/storage'

const INITIAL_SEARCH = { origin: '', destination: '', date: '', passengers: '2' }

const PASSENGERS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i + 1 === 1 ? 'pasajero' : 'pasajeros'}`,
}))

const formatPrice = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

/**
 * Apartado de vuelos: catálogo de vuelos con búsqueda,
 * compra y favoritos. Comprar y guardar en favoritos solo
 * está disponible para clientes registrados.
 */
function Vuelos() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getSession())
  const [search, setSearch] = useState(INITIAL_SEARCH)
  const [flights, setFlights] = useState([])
  const [visible, setVisible] = useState([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(() =>
    getFavorites(getSession()?.email),
  )
  const [purchases, setPurchases] = useState(() =>
    getPurchases(getSession()?.email),
  )
  const [pendingFlight, setPendingFlight] = useState(null)
  const [purchased, setPurchased] = useState(false)
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState('')
  const [authAction, setAuthAction] = useState(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [tab, setTab] = useState('favoritos')

  // Cargar vuelos desde la API
  useEffect(() => {
    loadFlights()
  }, [])

  const loadFlights = async () => {
    try {
      setLoading(true)
      const data = await apiGetFlights()
      setFlights(data.vuelos)
      setVisible(data.vuelos)
    } catch (err) {
      console.error('Error al cargar vuelos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mantiene la sesión sincronizada con el Header (login/logout)
  useEffect(() => {
    const sync = () => {
      const session = getSession()
      setUser(session)
      setFavorites(getFavorites(session?.email))
      setPurchases(getPurchases(session?.email))
    }
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  const handleSearchChange = (e) => {
    const { name, value } = e.target
    setSearch((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = (v) => v.trim().toLowerCase()
    const filtered = flights.filter((f) => {
      const matchOrigin = !q(search.origin) || f.origen.toLowerCase().includes(q(search.origin))
      const matchDest = !q(search.destination) || f.destino.toLowerCase().includes(q(search.destination))
      const matchDate = !search.date || f.fecha === search.date
      return matchOrigin && matchDest && matchDate
    })
    setVisible(filtered)
  }

  const resetSearch = () => {
    setSearch(INITIAL_SEARCH)
    setVisible(flights)
  }

  const handleRefresh = () => {
    loadFlights()
  }

  const requireAuth = (action) => {
    if (user) return true
    setAuthAction(action)
    return false
  }

  const handleToggleFavorite = (flight) => {
    if (!requireAuth('favorite')) return
    const next = toggleFavorite(user.email, flight.id)
    setFavorites(next)
  }

  const handleBuy = (flight) => {
    if (!requireAuth('buy')) return
    setPurchased(false)
    setBuyError('')
    setPendingFlight(flight)
  }

  const confirmPurchase = async () => {
    if (!pendingFlight || !user || buying) return
    setBuying(true)
    setBuyError('')
    try {
      await apiComprarVuelo({
        vuelo_id: pendingFlight.id,
        cantidad: Number(search.passengers) || 1,
      })
      const next = addPurchase(user.email, pendingFlight)
      setPurchases(next)
      setPurchased(true)
      loadFlights()
    } catch (err) {
      setBuyError(err.message || 'No se pudo registrar la compra. Intenta de nuevo.')
    } finally {
      setBuying(false)
    }
  }

  const closeBuyModal = () => {
    setPendingFlight(null)
    setPurchased(false)
    setBuyError('')
  }

  const isFavorite = (id) => favorites.includes(id)

  const favoriteFlights = flights.filter((f) => favorites.includes(f.id))

  const authMessages = {
    buy: {
      icon: '✈️',
      title: 'Inicia sesión para comprar',
      text: 'La compra de vuelos está disponible solo para clientes registrados.',
    },
    favorite: {
      icon: '💛',
      title: 'Inicia sesión para guardar favoritos',
      text: 'Solo los clientes registrados pueden guardar vuelos en favoritos.',
    },
  }

  const authInfo = authMessages[authAction] || authMessages.buy

  return (
    <main className="flex-1">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-brand/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <p className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            Vuelos
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Vuela a tus <span className="text-yellow-300">destinos favoritos</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
            Encuentra el vuelo perfecto para tu próxima aventura. Compra y guarda
            tus favoritos desde tu cuenta de cliente.
          </p>
        </div>
      </section>

      {/* ---------- Buscador ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <form
          onSubmit={handleSearch}
          noValidate
          className="-mt-14 relative z-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Origen"
              name="origin"
              icon="📍"
              value={search.origin}
              onChange={handleSearchChange}
              maxLength={40}
              placeholder="Ej. Bogotá"
            />
            <Input
              label="Destino"
              name="destination"
              icon="🎯"
              value={search.destination}
              onChange={handleSearchChange}
              maxLength={40}
              placeholder="Ej. Cartagena"
            />
            <Input
              label="Fecha de salida"
              name="date"
              type="date"
              value={search.date}
              onChange={handleSearchChange}
            />
            <Select
              label="Pasajeros"
              name="passengers"
              value={search.passengers}
              onChange={handleSearchChange}
              options={PASSENGERS}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit">Buscar vuelos</Button>
            <Button type="button" variant="ghost" onClick={resetSearch}>
              Limpiar filtros
            </Button>
            <p className="text-xs text-slate-400 sm:ml-auto dark:text-slate-500">
              {visible.length} {visible.length === 1 ? 'vuelo disponible' : 'vuelos disponibles'}
            </p>
          </div>
        </form>
      </section>

      {/* ---------- Catálogo de vuelos ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Catálogo
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
            Vuelos disponibles
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            Compra un vuelo o guárdalo en favoritos para encontrarlo más rápido.
          </p>
          <div className="mt-4">
            <Button variant="ghost" onClick={handleRefresh}>🔄 Actualizar vuelos</Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-4xl" aria-hidden="true">⏳</p>
            <h3 className="mt-4 font-display text-xl font-bold text-slate-800 dark:text-slate-100">
              Cargando vuelos...
            </h3>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-4xl" aria-hidden="true">🛫</p>
            <h3 className="mt-4 font-display text-xl font-bold text-slate-800 dark:text-slate-100">
              No encontramos vuelos
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Prueba con otra ciudad o fecha, o limpia los filtros de búsqueda.
            </p>
            <div className="mt-6">
              <Button variant="secondary" onClick={resetSearch}>
                Ver todos los vuelos
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visible.map((flight) => (
              <article
                key={flight.id}
                className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Encabezado */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
                      {flight.aerolinea}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {flight.numero_vuelo} · {flight.clase}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      flight.escalas === 'Directo'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    }`}
                  >
                    {flight.escalas}
                  </span>
                </div>

                {/* Ruta y horarios */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-2xl font-extrabold tabular-nums text-slate-800 dark:text-slate-100">
                      {flight.hora_salida}
                    </p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {flight.origen}
                      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">{flight.codigo_origen}</span>
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col items-center px-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {flight.duracion}
                    </span>
                    <div className="relative flex w-full items-center">
                      <span className="h-0.5 flex-1 border-t border-dashed border-slate-300 dark:border-slate-700" />
                      <span className="mx-1 text-slate-400 dark:text-slate-500" aria-hidden="true">✈️</span>
                      <span className="h-0.5 flex-1 border-t border-dashed border-slate-300 dark:border-slate-700" />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-extrabold tabular-nums text-slate-800 dark:text-slate-100">
                      {flight.hora_llegada}
                    </p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {flight.destino}
                      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">{flight.codigo_destino}</span>
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-center text-xs capitalize text-slate-400 dark:text-slate-500">
                  {formatDate(flight.fecha)}
                </p>

                {/* Acciones */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Precio por persona
                    </p>
                    <p className="font-display text-xl font-extrabold text-brand-600 dark:text-brand-400">
                      {formatPrice(flight.precio)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(flight)}
                      aria-label={
                        isFavorite(flight.id)
                          ? `Quitar ${flight.aerolinea} de favoritos`
                          : `Guardar ${flight.aerolinea} en favoritos`
                      }
                      aria-pressed={isFavorite(flight.id)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all duration-200 cursor-pointer ${
                        isFavorite(flight.id)
                          ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-400 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-rose-500/15 dark:hover:text-rose-400'
                      }`}
                    >
                      {isFavorite(flight.id) ? '❤️' : '🤍'}
                    </button>
                    <Button size="sm" onClick={() => handleBuy(flight)}>
                      Comprar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Mis vuelos (favoritos y compras) ---------- */}
      <section className="bg-white py-16 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Tu cuenta
            </p>
            <h2 className="font-display text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
              Mis vuelos
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              Consulta tus vuelos favoritos y las compras realizadas.
            </p>
          </div>

          {!user ? (
            /* ---------- Usuario sin sesión ---------- */
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-500/15" aria-hidden="true">
                🔐
              </span>
              <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">
                Solo para clientes registrados
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Para comprar vuelos y guardarlos en favoritos, inicia sesión o
                crea tu cuenta de cliente ExploraTur.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button to="/login">Iniciar sesión</Button>
                <Button variant="ghost" onClick={() => setRegisterOpen(true)}>
                  Crear una cuenta
                </Button>
              </div>
            </div>
          ) : (
            /* ---------- Usuario con sesión ---------- */
            <div>
              <div
                className="mx-auto mb-8 flex w-fit rounded-full bg-slate-100 p-1 dark:bg-slate-800"
                role="tablist"
                aria-label="Secciones de Mis vuelos"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'favoritos'}
                  onClick={() => setTab('favoritos')}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    tab === 'favoritos'
                      ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Favoritos ({favorites.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'compras'}
                  onClick={() => setTab('compras')}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    tab === 'compras'
                      ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Compras ({purchases.length})
                </button>
              </div>

              {tab === 'favoritos' ? (
                favoriteFlights.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                    Aún no tienes vuelos favoritos. Toca el corazón 🤍 en un vuelo para guardarlo aquí.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {favoriteFlights.map((flight) => (
                      <li
                        key={flight.id}
                        className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl dark:bg-brand-500/15" aria-hidden="true">
                            ✈️
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {flight.aerolinea} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({flight.numero_vuelo})</span>
                            </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {flight.codigo_origen} → {flight.codigo_destino} · {formatDate(flight.fecha)} · {formatPrice(flight.precio)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:shrink-0">
                          <Button size="sm" onClick={() => handleBuy(flight)}>
                            Comprar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleToggleFavorite(flight)}>
                            Quitar
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : purchases.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                  Aún no has comprado vuelos. Elige uno del catálogo y pulsa «Comprar».
                </p>
              ) : (
                <ul className="space-y-4">
                  {purchases.map((flight) => (
                    <li
                      key={`${flight.id}-${flight.purchasedAt}`}
                      className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl dark:bg-emerald-500/20" aria-hidden="true">
                          ✅
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {flight.aerolinea} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({flight.numero_vuelo})</span>
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {flight.codigo_origen} → {flight.codigo_destino} · {formatDate(flight.fecha)} · {flight.hora_salida} · {formatPrice(flight.precio)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            Comprado el {new Date(flight.purchasedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:shrink-0 dark:bg-emerald-500/20 dark:text-emerald-300">
                        Comprado
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Modal: inicio de sesión requerido ---------- */}
      <Modal open={Boolean(authAction)} onClose={() => setAuthAction(null)} title="Acceso de clientes">
        <div className="text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl dark:bg-brand-500/15">
            {authInfo.icon}
          </div>
          <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">{authInfo.title}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{authInfo.text}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/login')}>Iniciar sesión</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRegisterOpen(true)
                setAuthAction(null)
              }}
            >
              Crear una cuenta
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------- Modal: confirmación de compra ---------- */}
      <Modal
        open={Boolean(pendingFlight)}
        onClose={closeBuyModal}
        title={purchased ? 'Compra confirmada' : 'Confirmar compra'}
      >
        {pendingFlight &&
          (purchased ? (
            <div className="text-center animate-slide-up">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-500/20">
                🎉
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">
                ¡Vuelo comprado con éxito!
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Tu reserva de{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {pendingFlight.origen} → {pendingFlight.destino}
                </strong>{' '}
                del {formatDate(pendingFlight.fecha)} quedó registrada. Podrás
                verla en la sección «Mis vuelos».
              </p>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <p>✈️ {pendingFlight.aerolinea} · {pendingFlight.numero_vuelo}</p>
                <p className="mt-1">
                  🕘 {pendingFlight.hora_salida} – {pendingFlight.hora_llegada} · {pendingFlight.duracion}
                </p>
                <p className="mt-1">🧑 {search.passengers} pasajeros</p>
                <p className="mt-1 font-semibold text-brand-600 dark:text-brand-400">
                  Total: {formatPrice(pendingFlight.precio * Number(search.passengers))}
                </p>
              </div>
              <div className="mt-6">
                <Button fullWidth onClick={closeBuyModal}>
                  Entendido
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-slide-up">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {pendingFlight.aerolinea} · {pendingFlight.numero_vuelo} · {pendingFlight.clase}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{pendingFlight.hora_salida}</p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {pendingFlight.origen} <span className="text-xs text-slate-400 dark:text-slate-500">({pendingFlight.codigo_origen})</span>
                    </p>
                  </div>
                  <p className="pb-4 text-xs text-slate-400 dark:text-slate-500">
                    {pendingFlight.duracion} · {pendingFlight.escalas}
                  </p>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{pendingFlight.hora_llegada}</p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {pendingFlight.destino} <span className="text-xs text-slate-400 dark:text-slate-500">({pendingFlight.codigo_destino})</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs capitalize text-slate-400 dark:text-slate-500">{formatDate(pendingFlight.fecha)}</p>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-slate-500 dark:text-slate-400">
                  {Number(search.passengers)} × {formatPrice(pendingFlight.precio)}
                </span>
                <strong className="font-display text-lg text-brand-600 dark:text-brand-400">
                  {formatPrice(pendingFlight.precio * Number(search.passengers))}
                </strong>
              </div>

              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                Tu compra quedará registrada en la plataforma y aparecerá en la
                sección «Mis vuelos».
              </p>

              {buyError && (
                <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  ⚠️ {buyError}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={closeBuyModal} disabled={buying}>
                  Cancelar
                </Button>
                <Button onClick={confirmPurchase} disabled={buying}>
                  {buying ? 'Procesando...' : 'Confirmar compra'}
                </Button>
              </div>
            </div>
          ))}
      </Modal>

      {/* ---------- Modal de registro ---------- */}
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </main>
  )
}

export default Vuelos
