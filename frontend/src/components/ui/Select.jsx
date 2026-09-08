/**
 * Select reutilizable con etiqueta y mensaje de error.
 * Recibe las opciones como array de objetos { value, label }.
 */
function Select({ label, name, value, onChange, options, error, required = false, className = '', ...rest }) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full cursor-pointer appearance-none rounded-xl border-2 bg-white px-4 py-3 pr-10 text-sm text-slate-800 transition-all duration-200 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${
            error
              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/60 dark:bg-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:hover:border-slate-600'
          }`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Flecha decorativa */}
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        >
          ▼
        </span>
      </div>

      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-rose-600 animate-fade-in dark:text-rose-400">
          <span aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}

export default Select
