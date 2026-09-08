import { useCallback, useEffect, useRef, useState } from 'react'
import { slides as defaultSlides } from '../data/slides'

/**
 * Componente reutilizable de carrusel de imágenes.
 * Muestra una diapositiva a la vez con título, descripción,
 * controles, reproducción automática, teclado y gestos táctiles.
 */
function Carousel({ items = defaultSlides, autoPlayMs = 5000 }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)
  const total = items.length

  const goTo = useCallback(
    (index) => {
      if (total <= 1) {
        setCurrent(0)
        return
      }
      setCurrent(((index % total) + total) % total)
    },
    [total],
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Reproducción automática (se pausa al pasar el cursor)
  useEffect(() => {
    if (paused || total <= 1) return undefined
    const timer = setInterval(next, autoPlayMs)
    return () => clearInterval(timer)
  }, [paused, next, autoPlayMs, total])

  // Navegación con las teclas de dirección
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  // Soporte básico de gestos táctiles (swipe)
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 50) {
      if (diff < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  return (
    <section
      className="group relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-300/60 dark:shadow-black/50"
      aria-roledescription="carrusel"
      aria-label="Galería de imágenes destacadas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Ventana deslizante */}
      <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[21/9]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item, i) => (
            <article
              className="relative h-full w-full shrink-0"
              key={item.id}
              aria-hidden={i !== current}
            >
              <img
                className="h-full w-full object-cover"
                src={item.image}
                alt={`${item.title} — ${item.description}`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
              {/* Degradado para legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-transparent" />
              {/* Título y descripción */}
              <div
                className={`absolute inset-x-0 bottom-0 p-6 text-white transition-all duration-500 sm:p-10 ${
                  i === current ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <h2 className="font-display text-2xl font-bold drop-shadow-md sm:text-4xl">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Barra de progreso de la reproducción automática */}
      {!paused && (
        <span
          key={current}
          className="absolute bottom-0 left-0 z-10 h-1 bg-cyan-brand"
          style={{
            width: '100%',
            transformOrigin: 'left',
            animation: `carousel-progress ${autoPlayMs}ms linear forwards`,
          }}
        />
      )}

      {/* Flechas de navegación */}
      <button
        type="button"
        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 sm:left-5 sm:h-12 sm:w-12"
        onClick={prev}
        aria-label="Imagen anterior"
      >
        ‹
      </button>
      <button
        type="button"
        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 sm:right-5 sm:h-12 sm:w-12"
        onClick={next}
        aria-label="Imagen siguiente"
      >
        ›
      </button>

      {/* Contador y puntos indicadores */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 sm:right-6 sm:top-6">
        <span className="rounded-full bg-slate-950/50 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
          {current + 1} / {total}
        </span>
      </div>

      <div
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
        role="tablist"
        aria-label="Seleccionar imagen"
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === current ? 'w-7 bg-cyan-brand' : 'w-2.5 bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => goTo(i)}
            aria-label={`Ir a la imagen ${i + 1}: ${item.title}`}
            aria-current={i === current}
          />
        ))}
      </div>

      <style>{`
        @keyframes carousel-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  )
}

export default Carousel
