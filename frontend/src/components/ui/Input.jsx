/**
 * Campo de texto reutilizable con etiqueta, mensaje de error,
 * icono opcional y limitación de caracteres.
 * Admite cualquier atributo nativo de <input> (type, maxLength, placeholder...).
 */
function Input({
  label,
  name,
  value,
  onChange,
  error,
  icon,
  hint,
  required = false,
  maxLength,
  className = '',
  ...rest
}) {
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            icon ? 'pl-11' : ''
          } ${
            error
              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/60 dark:bg-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:hover:border-slate-600'
          }`}
          {...rest}
        />

        {maxLength && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-slate-400 dark:text-slate-500">
            {length}/{maxLength}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1 text-xs font-medium text-rose-600 animate-fade-in dark:text-rose-400"
        >
          <span aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export default Input
