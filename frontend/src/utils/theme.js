/**
 * Utilidades para el modo oscuro de la aplicación.
 * El tema se guarda en localStorage y se aplica mediante
 * la clase `.dark` en el elemento <html>.
 */

const THEME_KEY = 'exploratur_theme'

/** Devuelve el tema guardado ('dark', 'light' o null). */
export const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

/** Devuelve el tema preferido del sistema operativo. */
export const getSystemTheme = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

/** Devuelve el tema inicial: el guardado o el del sistema. */
export const getInitialTheme = () => {
  const stored = getStoredTheme()
  return stored === 'dark' || stored === 'light' ? stored : getSystemTheme()
}

/** Aplica la clase `.dark` según el tema y lo devuelve. */
export const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  return theme
}

/** Guarda el tema y lo aplica en el documento. */
export const saveTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme)
  return applyTheme(theme)
}
