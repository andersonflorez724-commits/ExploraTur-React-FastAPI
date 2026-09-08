import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { apiRegister } from '../../utils/api'
import {
  validateEmail,
  validateDigits,
  validateLettersOnly,
  validateMaxLength,
  validateMinLength,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validateRequired,
  validateForm,
} from '../../utils/validators'

/** Opciones del tipo de documento. */
const DOCUMENT_TYPES = [
  { value: '', label: 'Selecciona un tipo...' },
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PA', label: 'Pasaporte' },
]

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  passwordConfirmation: '',
}

/** Reglas de validación por campo (se ejecutan en tiempo real). */
const rules = {
  firstName: (v) =>
    validateRequired(v, 'El nombre') ||
    validateMinLength(v, 2, 'El nombre') ||
    validateMaxLength(v, 50, 'El nombre') ||
    validateLettersOnly(v, 'El nombre'),
  lastName: (v) =>
    validateRequired(v, 'El apellido') ||
    validateMinLength(v, 2, 'El apellido') ||
    validateMaxLength(v, 50, 'El apellido') ||
    validateLettersOnly(v, 'El apellido'),
  documentType: (v) => validateRequired(v, 'El tipo de documento'),
  documentNumber: (v) =>
    validateRequired(v, 'El número de documento') ||
    validateDigits(v, 6, 15, 'El número de documento'),
  address: (v) =>
    validateRequired(v, 'La dirección') ||
    validateMinLength(v, 5, 'La dirección') ||
    validateMaxLength(v, 100, 'La dirección'),
  phone: (v) => validateRequired(v, 'El teléfono') || validatePhone(v),
  email: (v) => validateRequired(v, 'El correo') || validateEmail(v),
  password: (v) => validateRequired(v, 'La contraseña') || validatePassword(v),
  passwordConfirmation: (v, form) =>
    validateRequired(v, 'La confirmación') ||
    validatePasswordMatch(form.password, v),
}

/**
 * Modal de registro de clientes con validaciones en tiempo real.
 * Se conecta con el Backend para almacenar en la base de datos.
 */
function RegisterModal({ open, onClose, onRegistered }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)

    const fieldError = rules[name]?.(next[name], next)
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }))
    if (serverError) setServerError('')

  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateForm(form, rules)
    setErrors(validation)

    if (Object.keys(validation).length > 0) return

    setLoading(true)
    setServerError('')

    try {
      // Mapear campos del formulario a los del Backend
      const backendData = {
        nombre: form.firstName,
        apellido: form.lastName,
        tipo_documento: form.documentType,
        numero_documento: form.documentNumber,
        direccion: form.address,
        telefono: form.phone,
        email: form.email,
        password: form.password,
      }

      const data = await apiRegister(backendData)
      setRegistered({
        firstName: data.usuario.nombre,
        lastName: data.usuario.apellido,
        email: data.usuario.email,
        documentType: data.usuario.tipo_documento,
        documentNumber: data.usuario.numero_documento,
      })
    } catch (err) {
      const msg = err.message || 'Error al registrar. Intenta nuevamente.'
      // Detectar errores de duplicado y mostrar como error de campo específico
      if (msg.toLowerCase().includes('documento')) {
        setErrors((prev) => ({ ...prev, documentNumber: msg }))
      } else if (msg.toLowerCase().includes('correo')) {
        setErrors((prev) => ({ ...prev, email: msg }))
      } else {
        setServerError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setServerError('')
    setRegistered(null)
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Crear cuenta" wide>
      {registered ? (
        /* ---------- Confirmación del registro ---------- */
        <div className="text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>
          <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">
            ¡Registro exitoso!
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Bienvenido(a) <strong className="text-slate-700 dark:text-slate-200">{registered.firstName} {registered.lastName}</strong>.
            Tu cuenta se creó correctamente en la base de datos. Ya puedes iniciar sesión.
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <p>📧 <strong>{registered.email}</strong></p>
            <p className="mt-1">🪪 {registered.documentType} · {registered.documentNumber}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              onClick={() => {
                onRegistered?.(registered)
                handleClose()
              }}
            >
              Iniciar sesión
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        /* ---------- Formulario de registro ---------- */
        <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
            maxLength={50}
            placeholder="Ej. Ana María"
            autoComplete="given-name"
          />
          <Input
            label="Apellido"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
            maxLength={50}
            placeholder="Ej. Rodríguez"
            autoComplete="family-name"
          />

          <Select
            label="Tipo de documento"
            name="documentType"
            value={form.documentType}
            onChange={handleChange}
            options={DOCUMENT_TYPES}
            error={errors.documentType}
            required
          />
          <Input
            label="Número de documento"
            name="documentNumber"
            value={form.documentNumber}
            onChange={handleChange}
            error={errors.documentNumber}
            required
            maxLength={15}
            inputMode="numeric"
            placeholder="Ej. 1020456789"
            autoComplete="off"
          />

          <Input
            label="Dirección"
            name="address"
            value={form.address}
            onChange={handleChange}
            error={errors.address}
            required
            maxLength={100}
            placeholder="Ej. Calle 26 # 5-62"
            autoComplete="street-address"
            className="sm:col-span-2"
          />

          <Input
            label="Teléfono"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            maxLength={15}
            inputMode="tel"
            placeholder="Ej. 3001234567"
            autoComplete="tel"
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

          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
            maxLength={20}
            placeholder="Mín. 8 caracteres"
            autoComplete="new-password"
            hint="Usa mayúscula, minúscula, número y símbolo."
          />
          <Input
            label="Confirmar contraseña"
            name="passwordConfirmation"
            type="password"
            value={form.passwordConfirmation}
            onChange={handleChange}
            error={errors.passwordConfirmation}
            required
            maxLength={20}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />

          {serverError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 sm:col-span-2 animate-fade-in dark:bg-rose-500/15 dark:text-rose-400">
              ⚠️ {serverError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default RegisterModal
