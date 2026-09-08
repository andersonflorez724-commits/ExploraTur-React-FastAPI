import { useEffect } from 'react'

/**
 * Modal reutilizable: superposición oscura, panel centrado y cierre
 * mediante el botón, el overlay o la tecla Escape.
 */
function Modal({ open, onClose, title, children, wide = false }) {
  // Cierra el modal con la tecla Escape y bloquea el scroll del fondo
  useEffect(() => {
    if (!open) return undefined

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // Cerrar solo si se hace clic sobre el overlay
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`relative my-auto w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-3xl bg-white shadow-2xl animate-pop-in dark:bg-slate-900 dark:shadow-black/40`}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
