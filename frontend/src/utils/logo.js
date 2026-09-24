const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="256" height="256">
  <defs>
    <linearGradient id="exploratur-logo-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="14" fill="url(#exploratur-logo-g)"/>
  <path d="M8 34 L18 18 L25 29 L30 22 L40 34 Z" fill="#ffffff"/>
  <circle cx="34" cy="15" r="4.5" fill="#fde047"/>
</svg>`

/**
 * Genera el logo de ExploraTur como dataURL PNG (renderizando el SVG en un canvas).
 * Devuelve null si el navegador no permite generarlo.
 */
export function getLogoDataURL(size = 192) {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, size, size)
          resolve(canvas.toDataURL('image/png'))
        } catch {
          resolve(null)
        } finally {
          URL.revokeObjectURL(url)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    } catch {
      resolve(null)
    }
  })
}
