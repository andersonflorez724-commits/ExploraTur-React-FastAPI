import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../utils/storage'
import { apiLogout } from '../utils/api'
import { getInitialTheme, saveTheme } from '../utils/theme'

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`

/**
 * Encabezado de la aplicación: logo, menú de navegación,
 * nombre del usuario autenticado visible en el Navbar,
 * estado de sesión, cambio de tema y menú hamburguesa para móviles.
 */
function Header() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(() => getSession())
  const [theme, setTheme] = useState(() => saveTheme(getInitialTheme()))

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  const closeMenu = () => setOpen(false)

  const handleLogout = () => {
    apiLogout()
    clearSession()
    setUser(null)
    window.dispatchEvent(new Event('session-changed'))
    closeMenu()
    navigate('/')
  }

  const toggleTheme = () => {
    setTheme(saveTheme(theme === 'dark' ? 'light' : 'dark'))
  }

  /** Devuelve la ruta del panel según el rol del usuario. */
  const panelRoute = () => {
    if (!user) return '/login'
    if (user.rol === 'Administrador') return '/admin'
    if (user.rol === 'Empleado') return '/empleado'
    return '/cliente'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Marca */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5" aria-label="ExploraTur, ir al inicio">
          <svg className="h-10 w-10" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#logo-g)" />
            <path d="M8 34 L18 18 L25 29 L30 22 L40 34 Z" fill="#ffffff" />
            <circle cx="34" cy="15" r="4.5" fill="#fde047" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Explora<span className="text-brand-600 dark:text-brand-400">Tour</span>
          </span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir o cerrar menú"
          aria-expanded={open}
          aria-controls="main-nav"
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
        >
          <span className={`h-0.5 w-6 rounded-full bg-slate-700 transition-transform duration-200 dark:bg-slate-200 ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-0.5 w-6 rounded-full bg-slate-700 transition-opacity duration-200 dark:bg-slate-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 rounded-full bg-slate-700 transition-transform duration-200 dark:bg-slate-200 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>

        {/* Cambio de tema */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-colors hover:bg-slate-100 md:ml-auto dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Navegación */}
        <nav
          id="main-nav"
          aria-label="Menú principal"
          className={`${
            open
              ? 'absolute inset-x-0 top-[72px] border-b border-slate-100 bg-white px-4 pb-6 pt-2 shadow-lg md:static md:inset-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:border-slate-800 dark:bg-slate-900'
              : 'hidden md:flex'
          } md:items-center md:gap-1`}
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center">
            <NavLink to="/" end onClick={closeMenu} className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/quienes-somos" onClick={closeMenu} className={navLinkClass}>
              ¿Quiénes Somos?
            </NavLink>
            <NavLink to="/vuelos" onClick={closeMenu} className={navLinkClass}>
              Vuelos
            </NavLink>
            <NavLink to="/contacto" onClick={closeMenu} className={navLinkClass}>
              Contacto
            </NavLink>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 md:ml-3 md:mt-0 md:border-l md:border-t-0 md:pl-3 md:pt-0 dark:border-slate-800">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={panelRoute()} onClick={closeMenu} className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white" aria-hidden="true">
                    {user.nombre?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <div className="hidden leading-tight sm:block">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Bienvenido, {user.nombre || user.firstName} {user.apellido || user.lastName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{user.rol || 'Cliente'}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-500/15"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-600/35"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
