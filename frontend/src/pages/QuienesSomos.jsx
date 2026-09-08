import Button from '../components/ui/Button'

/**
 * Página interna "¿Quiénes Somos?": historia, misión, visión y valores.
 */
function QuienesSomos() {
  const values = [
    { icon: '🌎', title: 'Sostenibilidad', text: 'Viajamos cuidando el planeta y las comunidades locales.' },
    { icon: '🤝', title: 'Confianza', text: 'La transparencia y la honestidad guían cada una de nuestras decisiones.' },
    { icon: '✨', title: 'Innovación', text: 'Buscamos experiencias nuevas que sorprendan a nuestros viajeros.' },
    { icon: '❤️', title: 'Pasión', text: 'Amamos lo que hacemos y eso se refleja en cada itinerario.' },
  ]

  const stats = [
    { value: '+10', label: 'Años de experiencia' },
    { value: '+2.500', label: 'Viajeros felices' },
    { value: '40', label: 'Destinos disponibles' },
    { value: '100%', label: 'Atención personalizada' },
  ]

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
            ¿Quiénes Somos?
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Un equipo apasionado por los viajes
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
            Nacimos en 2016 con una idea simple: hacer que explorar el mundo sea
            fácil, seguro e inolvidable para todos.
          </p>
        </div>
      </section>

      {/* ---------- Misión y Visión ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-500/15" aria-hidden="true">
              🎯
            </span>
            <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Misión</h2>
            <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">
              Diseñar experiencias turísticas auténticas que conecten a las
              personas con la naturaleza y la cultura, garantizando calidad,
              seguridad y responsabilidad ambiental.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-2xl dark:bg-cyan-500/15" aria-hidden="true">
              🔭
            </span>
            <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Visión</h2>
            <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">
              Ser la agencia líder en turismo de naturaleza en Latinoamérica para
              el 2030, reconocida por su innovación y su compromiso con el
              desarrollo sostenible.
            </p>
          </article>
        </div>
      </section>

      {/* ---------- Valores ---------- */}
      <section className="bg-white py-16 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
            Nuestros valores
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <article
                key={v.title}
                className="rounded-3xl border border-slate-100 p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-100 hover:bg-brand-50/40 hover:shadow-lg dark:border-slate-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
              >
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-xl dark:bg-brand-500/15" aria-hidden="true">
                  {v.icon}
                </span>
                <h3 className="font-display text-base font-bold text-slate-800 dark:text-slate-100">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Estadísticas ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-3xl bg-brand-gradient p-8 text-center text-white sm:p-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <strong className="font-display text-3xl font-extrabold sm:text-4xl">{s.value}</strong>
              <p className="mt-1 text-sm text-white/80">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
            ¿Listo para vivir tu próxima aventura?
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button to="/contacto">Escríbenos</Button>
            <Button to="/login" variant="ghost">Iniciar sesión</Button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default QuienesSomos
