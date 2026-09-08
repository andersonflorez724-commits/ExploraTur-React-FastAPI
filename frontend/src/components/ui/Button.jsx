import { Link } from 'react-router-dom'

/**
 * Botón reutilizable de la aplicación.
 * Variantes: primary, secondary, outline, ghost, danger.
 * Tamaños: sm, md, lg.
 * Si recibe `to` se renderiza como Link (React Router);
 * si recibe `href` se renderiza como <a>; si no, como <button>.
 */
function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  to,
  href,
  children,
  ...rest
}) {
  const variants = {
    primary:
      'bg-brand-gradient text-white font-semibold shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-brand-100 text-brand-700 font-semibold hover:bg-brand-200 dark:bg-brand-500/25 dark:text-brand-200 dark:hover:bg-brand-500/35 active:scale-[0.98]',
    outline:
      'border-2 border-white/50 text-white font-semibold hover:bg-white/10 active:scale-[0.98]',
    ghost:
      'text-slate-600 font-medium hover:text-brand-600 hover:bg-brand-50 dark:text-slate-300 dark:hover:text-brand-300 dark:hover:bg-brand-500/15 active:scale-[0.98]',
    danger:
      'bg-rose-600 text-white font-semibold hover:bg-rose-700 dark:hover:bg-rose-500 active:scale-[0.98]',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  const base =
    'inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${
    fullWidth ? 'w-full' : ''
  } ${className}`

  // Renderizar como Link interno de React Router
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  // Renderizar como enlace externo
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
