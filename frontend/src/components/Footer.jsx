import { Link } from 'react-router-dom'

/**
 * Pie de página de la aplicación: información de la empresa,
 * enlaces rápidos, contacto y redes sociales.
 */
function Footer() {
  const year = new Date().getFullYear()

  const socials = [
    { label: 'Facebook', href: 'https://facebook.com', icon: 'f' },
    { label: 'Instagram', href: 'https://instagram.com', icon: '◎' },
    { label: 'X (Twitter)', href: 'https://x.com', icon: '𝕏' },
    { label: 'YouTube', href: 'https://youtube.com', icon: '▶' },
  ]

  return (
    <footer className="mt-auto bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* Marca */}
        <div>
          <span className="font-display text-2xl font-bold text-white">
            Explora<span className="text-cyan-brand">Tur</span>
          </span>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Somos una empresa dedicada a ofrecer experiencias de viaje únicas:
            naturaleza, cultura y aventura en cada destino.
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white">
            Enlaces rápidos
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="transition-colors hover:text-cyan-brand">Inicio</Link>
            </li>
            <li>
              <Link to="/quienes-somos" className="transition-colors hover:text-cyan-brand">¿Quiénes Somos?</Link>
            </li>
            <li>
              <Link to="/vuelos" className="transition-colors hover:text-cyan-brand">Vuelos</Link>
            </li>
            <li>
              <Link to="/contacto" className="transition-colors hover:text-cyan-brand">Contacto</Link>
            </li>
            <li>
              <Link to="/login" className="transition-colors hover:text-cyan-brand">Iniciar sesión</Link>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white">
            Contacto
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li className="flex gap-2">
              <span aria-hidden="true">📍</span> Calle 26 # 5-62, Bogotá D.C.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">📞</span> +57 300 123 4567
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">✉️</span> hola@exploratur.com
            </li>
          </ul>
        </div>

        {/* Redes sociales */}
        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white">
            Síguenos
          </h3>
          <div className="flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm text-slate-300 transition-all duration-200 hover:-translate-y-1 hover:bg-brand-600 hover:text-white"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
          © {year} ExploraTur · Proyecto académico React + Vite · Tailwind CSS ·
          React Router DOM
        </p>
      </div>
    </footer>
  )
}

export default Footer
