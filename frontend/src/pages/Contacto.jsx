import { useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { apiCreatePQR } from '../utils/api'
import { getSession } from '../utils/storage'

/**
 * Página interna "Contacto": formulario controlado con validación
 * en tiempo real y datos de la empresa. Si el usuario tiene sesión,
 * el mensaje se registra como PQR en el backend.
 */
function Contacto() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const rules = {
    name: (v) =>
      !v.trim()
        ? 'El nombre es obligatorio.'
        : v.trim().length < 3
          ? 'El nombre debe tener al menos 3 caracteres.'
          : null,
    email: (v) =>
      !v.trim()
        ? 'El correo es obligatorio.'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
          ? 'Ingresa un correo electrónico válido.'
          : null,
    message: (v) =>
      !v.trim()
        ? 'El mensaje es obligatorio.'
        : v.trim().length < 10
          ? 'El mensaje debe tener al menos 10 caracteres.'
          : null,
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)

    // Validación en tiempo real
    const fieldError = rules[name]?.(next[name])
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = {}
    Object.entries(rules).forEach(([name, rule]) => {
      const message = rule(form[name])
      if (message) validation[name] = message
    })
    setErrors(validation)

    if (Object.keys(validation).length > 0) {
      setError('Revisa los campos marcados en rojo.')
      return
    }

    setError('')
    const session = getSession()

    if (session) {
      setSending(true)
      try {
        const asunto = form.subject.trim() || `Consulta de ${form.name.trim()}`
        const descripcion = `De: ${form.name.trim()} <${form.email.trim()}>\n\n${form.message.trim()}`
        await apiCreatePQR({ tipo: 'Peticion', asunto, descripcion })
      } catch (err) {
        setError(err.message || 'No se pudo enviar el mensaje. Intenta de nuevo.')
        setSending(false)
        return
      }
      setSending(false)
    }

    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
    setErrors({})
  }

  const info = [
    { icon: '📍', label: 'Dirección', value: 'Calle 26 # 5-62, Bogotá D.C., Colombia' },
    { icon: '📞', label: 'Teléfono', value: '+57 300 123 4567' },
    { icon: '✉️', label: 'Correo', value: 'hola@exploratur.com' },
    { icon: '🕘', label: 'Horario', value: 'Lun a Vie · 8:00 a.m. – 6:00 p.m.' },
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
            Contacto
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Hablemos de tu próximo viaje
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
            Cuéntanos qué estás buscando y uno de nuestros asesores te
            responderá en menos de 24 horas.
          </p>
        </div>
      </section>

      {/* ---------- Contenido ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Formulario */}
          <div>
            {sent && (
              <div role="status" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 animate-slide-up dark:border-emerald-500/30 dark:bg-emerald-500/15">
                <strong className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  ¡Mensaje enviado con éxito! 🎉
                </strong>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                  Gracias por escribirnos. Te contactaremos muy pronto.
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="mb-6 font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
                Envíanos un mensaje
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nombre completo"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  maxLength={60}
                  placeholder="Ej. Ana María Rodríguez"
                  autoComplete="name"
                />
                <Input
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  maxLength={80}
                  placeholder="Ej. ana@correo.com"
                  autoComplete="email"
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Asunto"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  maxLength={80}
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Mensaje <span className="ml-0.5 text-rose-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  placeholder="Cuéntanos sobre tu viaje ideal..."
                  aria-invalid={Boolean(errors.message)}
                  className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                    errors.message
                      ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/60 dark:bg-rose-500/10'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.message ? (
                    <p role="alert" className="text-xs font-medium text-rose-600 animate-fade-in dark:text-rose-400">
                      ⚠️ {errors.message}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">Máximo 500 caracteres</p>
                  )}
                  <span className="ml-auto text-xs tabular-nums text-slate-400 dark:text-slate-500">
                    {form.message.length}/500
                  </span>
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 animate-fade-in dark:bg-rose-500/15 dark:text-rose-400">
                  ⚠️ {error}
                </p>
              )}

              <div className="mt-6">
                <Button type="submit" disabled={sending}>
                  {sending ? 'Enviando...' : 'Enviar mensaje'}
                </Button>
              </div>
            </form>
          </div>

          {/* Datos de contacto */}
          <aside className="h-fit rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-24 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="mb-6 font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
              Información de contacto
            </h2>
            <ul className="space-y-5">
              {info.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg dark:bg-brand-500/15"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div>
                    <strong className="block text-sm text-slate-700 dark:text-slate-200">{item.label}</strong>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default Contacto
