import Carousel from '../components/Carousel'
import Button from '../components/ui/Button'

/**
 * Página principal de la aplicación: hero, carrusel
 * de 10 imágenes y características destacadas.
 */
function Index() {
  const features = [
    {
      icon: '🏞️',
      title: 'Destinos únicos',
      text: 'Rutas seleccionadas por expertos para vivir la naturaleza en su máxima expresión.',
    },
    {
      icon: '🛡️',
      title: 'Viajes seguros',
      text: 'Acompañamiento y respaldo en cada etapa de tu aventura, sin preocupaciones.',
    },
    {
      icon: '💬',
      title: 'Atención personalizada',
      text: 'Asesores dispuestos a diseñar el plan perfecto para ti y tu familia.',
    },
  ]

  return (
    <main className="flex-1">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-brand/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            Bienvenido a ExploraTur
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Descubre los{' '}
            <span className="text-yellow-300">destinos más increíbles</span> del mundo
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/85 sm:text-lg">
            Una ventana a paisajes inolvidables: montañas, playas, bosques y
            cielos estrellados. Conoce más sobre nosotros y contáctanos.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button to="/contacto" variant="secondary" size="lg">
              Contáctanos
            </Button>
            <a href="#galeria">
              <Button variant="outline" size="lg">
                Ver galería ↓
              </Button>
            </a>
          </div>
        </div>

        {/* Onda decorativa inferior */}
        <svg
          className="relative block w-full text-bg"
          viewBox="0 0 1440 60"
          fill="currentColor"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,32L48,37.3C96,43,192,53,288,53.3C384,53,480,43,576,37.3C672,32,768,32,864,37.3C960,43,1056,53,1152,56C1248,59,1344,64,1392,66.7L1440,69L1440,60L0,60Z" />
        </svg>
      </section>

      {/* ---------- Carrusel ---------- */}
      <section id="galeria" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Galería
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
            Nuestros destinos destacados
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            Explora nuestra colección de 10 imágenes con sus títulos y descripciones.
          </p>
        </div>
        <Carousel />
      </section>

      {/* ---------- Características ---------- */}
      <section className="bg-white py-16 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              ¿Por qué elegirnos?
            </p>
            <h2 className="font-display text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
              Lo que nos hace diferentes
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-500/10 dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-500/15"
                  aria-hidden="true"
                >
                  {f.icon}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Index
