import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import RegisterModal from '../components/auth/RegisterModal'
import { apiLogin, apiLogout } from '../utils/api'
import { saveSession, clearSession } from '../utils/storage'
import { validateEmail, validateRequired, validateForm } from '../utils/validators'

const INITIAL_FORM = { email: '', password: '' }

const rules = {
  email: (v) => validateRequired(v, 'El correo') || validateEmail(v),
  password: (v) => validateRequired(v, 'La contraseña'),
}

/**
 * Página de inicio de sesión para clientes.
 * Se conecta con el Backend para autenticación JWT.
 */
function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [registerOpen, setRegisterOpen] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)

    const fieldError = rules[name]?.(next[name])
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateForm(form, rules)
    setErrors(validation)
    setError('')

    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      const data = await apiLogin(form.email, form.password)
      const user = data.usuario

      // Guardar sesión en localStorage para compatibilidad
      saveSession(user, remember)
      setSession(user)
      window.dispatchEvent(new Event('session-changed'))
    } catch (err) {
      setError(err.message || 'Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    apiLogout()
    clearSession()
    setSession(null)
    setForm(INITIAL_FORM)
    setErrors({})
    window.dispatchEvent(new Event('session-changed'))
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
          {/* Encabezado */}
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl shadow-lg shadow-brand-600/30">
              🔐
            </span>
            <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Accede a tu cuenta de ExploraTur
            </p>
          </div>

          {session ? (
            /* ---------- Sesión iniciada ---------- */
            <div className="text-center animate-fade-in">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-500/20">
                👋
              </div>
              <h2 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">
                ¡Hola, {session.nombre}!
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Has iniciado sesión con <strong className="text-slate-700 dark:text-slate-200">{session.email}</strong>.
              </p>
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {session.rol}
              </span>
              <div className="mt-6 flex flex-col gap-3">
                <Button fullWidth onClick={() => {
                  // Redirigir según el rol
                  if (session.rol === 'Administrador') navigate('/admin')
                  else if (session.rol === 'Empleado') navigate('/empleado')
                  else navigate('/cliente')
                }}>
                  Ir al panel
                </Button>
                <Button variant="ghost" fullWidth onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          ) : (
            /* ---------- Formulario ---------- */
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
                autoComplete="off"
              />

              <div>
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  icon="🔒"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  maxLength={20}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <div className="mt-1.5 text-right">
                  <Link
                    to="/recuperar-password"
                    className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {/* Recordarme */}
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 select-none dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                Recordarme (no cerrar sesión)
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 animate-fade-in dark:bg-rose-500/15 dark:text-rose-400">
                  ⚠️ {error}
                </p>
              )}

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>

              <p className="pt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setRegisterOpen(true)}
                  className="font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline cursor-pointer dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Crear una cuenta
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Página principal → Inicio de sesión → Registro de cliente mediante Modal → Validación de datos → Confirmación del registro
        </p>
      </div>

      {/* Modal de registro de clientes */}
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={(user) => {
          setForm((prev) => ({ ...prev, email: user.email }))
        }}
      />
    </main>
  )
}

export default Login
