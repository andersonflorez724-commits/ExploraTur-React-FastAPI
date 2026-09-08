import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { validateEmail, validateRequired, validateForm } from '../../utils/validators'

const INITIAL_FORM = { email: '' }

const rules = {
  email: (v) => validateRequired(v, 'El correo') || validateEmail(v),
}

/**
 * Componente reutilizable e independiente para recuperar la contraseña.
 * Valida el formato del correo y simula el envío del enlace de recuperación.
 */
function RecoverPassword() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)

    // Validación en tiempo real del formato del correo
    const fieldError = rules[name]?.(next[name])
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }))
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validation = validateForm(form, rules)
    setErrors(validation)
    setError('')

    if (Object.keys(validation).length > 0) return

    // Mostrar confirmación siempre (flujo simulado de recuperación)
    setSent(true)
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-brand/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-black/30 dark:ring-slate-800">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl shadow-lg shadow-brand-600/30">
              🔑
            </span>
            <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
              Recuperar contraseña
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {sent ? (
            <div className="text-center animate-fade-in">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-500/20">
                📬
              </div>
              <h2 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">
                ¡Revisa tu correo!
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enviamos las instrucciones de recuperación a{' '}
                <strong className="text-slate-700 dark:text-slate-200">{form.email}</strong>.
              </p>
              <div className="mt-6">
                <Button to="/login" fullWidth>Volver al inicio de sesión</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                icon="✉️"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                required
                maxLength={80}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                hint="Ingresa el correo con el que te registraste."
              />

              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 animate-fade-in dark:bg-rose-500/15 dark:text-rose-400">
                  ⚠️ {error}
                </p>
              )}

              <Button type="submit" fullWidth>
                Recuperar contraseña
              </Button>

              <p className="pt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                ¿Recordaste tu contraseña?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Volver al inicio de sesión
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default RecoverPassword
