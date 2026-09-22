import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSession, clearSession } from '../utils/storage'
import { apiLogout } from '../utils/api'

/**
 * Layout de dashboard con sidebar oscuro, logo ExploraTour,
 * navegación por secciones y área principal de contenido.
 */
function DashboardLayout({ navItems = [], activeSection, onSectionChange, title, subtitle, accentColor = 'brand', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = getSession()

  const accentMap = {
    brand: { bg: 'bg-brand-600', text: 'text-brand-400', hover: 'hover:bg-brand-600/15', active: 'bg-brand-600 text-white', ring: 'ring-brand-500' },
    cyan: { bg: 'bg-cyan-600', text: 'text-cyan-400', hover: 'hover:bg-cyan-600/15', active: 'bg-cyan-600 text-white', ring: 'ring-cyan-500' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-400', hover: 'hover:bg-emerald-600/15', active: 'bg-emerald-600 text-white', ring: 'ring-emerald-500' },
  }
  const accent = accentMap[accentColor] || accentMap.brand

  const handleLogout = () => {
    apiLogout()
    clearSession()
    window.dispatchEvent(new Event('session-changed'))
    window.location.href = '/'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fef2f2] dark:bg-slate-950">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <svg className="h-9 w-9" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="sidebar-logo-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <rect width="48" height="48" rx="14" fill="url(#sidebar-logo-g)" />
              <path d="M8 34 L18 18 L25 29 L30 22 L40 34 Z" fill="#ffffff" />
              <circle cx="34" cy="15" r="4.5" fill="#fde047" />
            </svg>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Explora<span className="text-brand-400">Tour</span>
            </span>
          </Link>
        </div>

        {/* Usuario */}
        {user && (
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {user.nombre?.[0]?.toUpperCase() || 'U'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.nombre} {user.apellido}</p>
                <p className="truncate text-xs text-slate-400">{user.rol}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => { onSectionChange(item.id); setSidebarOpen(false) }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeSection === item.id
                      ? `${accent.active} shadow-md`
                      : `text-slate-300 ${accent.hover} hover:text-white`
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Cerrar sesión */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
          >
            <span className="text-lg">🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barra superior móvil */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-display text-base font-bold text-slate-800 dark:text-white">
            {navItems.find((n) => n.id === activeSection)?.label || title}
          </span>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto">
          {/* Título */}
          <div className="px-4 pt-6 pb-2 sm:px-6 lg:px-8">
            <h1 className="font-display text-2xl font-extrabold text-slate-800 dark:text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>

          {/* Contenido */}
          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
