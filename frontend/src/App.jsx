import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

/**
 * Limpia datos obsoletos del localStorage del sistema viejo
 * de autenticación local (ya no se usa, ahora es backend API).
 */
function CleanupLegacyStorage() {
  useEffect(() => {
    localStorage.removeItem('exploratur_users')
  }, [])

  return null
}
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppButton from './components/ui/WhatsAppButton'
import Chatbot from './components/Chatbot'
import Index from './pages/Index'
import QuienesSomos from './pages/QuienesSomos'
import Contacto from './pages/Contacto'
import Login from './pages/Login'
import Vuelos from './pages/Vuelos'
import RecoverPassword from './components/auth/RecoverPassword'
import AdminPanel from './pages/AdminPanel'
import EmpleadoPanel from './pages/EmpleadoPanel'
import ClientePanel from './pages/ClientePanel'

/**
 * Lleva la ventana al inicio cada vez que cambia la ruta.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

/**
 * Aplicación principal: define las rutas con React Router DOM.
 * El Header y el Footer se reutilizan en todas las páginas.
 * Incluye el botón flotante de WhatsApp.
 */
function App() {
  const { pathname } = useLocation()
  const panelRoutes = ['/admin', '/empleado', '/cliente']
  const showHeader = !panelRoutes.includes(pathname)

  return (
    <>
      <ScrollToTop />
      <CleanupLegacyStorage />
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/vuelos" element={<Vuelos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecoverPassword />} />
        {/* Paneles por rol */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/empleado" element={<EmpleadoPanel />} />
        <Route path="/cliente" element={<ClientePanel />} />
        {/* Ruta por defecto */}
        <Route path="*" element={<Index />} />
      </Routes>
      <Footer />
      {/* Botón flotante de WhatsApp */}
      <WhatsAppButton />
      {/* Chatbot */}
      <Chatbot />
    </>
  )
}

export default App
