import { useState, useRef, useEffect } from 'react'
import { apiChatbot } from '../utils/api'

/**
 * Isotipo del asistente: burbuja de chat con destello de IA sobre el
 * gradiente de marca. Se reutiliza en el lanzador, el encabezado y los
 * mensajes para que el widget tenga una identidad visual consistente.
 */
function BotLogo({ className = 'h-11 w-11', tile = 'bg-brand-gradient text-white shadow-md shadow-brand-600/25' }) {
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-xl ${tile}`}>
      <svg
        className="h-[60%] w-[60%]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.7-.8L3.5 20.5l1.3-4.5A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M12 7.9l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { rol: 'assistant', contenido: '¡Hola! Soy ExploraBot, tu asistente virtual de ExploraTur. ¿En qué puedo ayudarte hoy?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { rol: 'user', contenido: userMsg }])
    setLoading(true)

    try {
      const data = await apiChatbot(userMsg, sessionId)
      setMessages(prev => [...prev, { rol: 'assistant', contenido: data.respuesta }])
      if (data.session_id) setSessionId(data.session_id)
    } catch {
      setMessages(prev => [...prev, { rol: 'assistant', contenido: 'Lo siento, hubo un error. Por favor intenta de nuevo o contacta a soporte.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    '¿Qué servicios ofrecen?',
    '¿Cómo puedo hacer una compra?',
    'Información de contacto',
    'Quiero registrar un PQR',
  ]

  return (
    <>
      {/* Lanzador: barra con la identidad del asistente (nombre y estado),
          en lugar de un botón redondo tipo WhatsApp */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir el asistente virtual de ExploraTur"
          className="fixed bottom-24 right-6 z-50 flex animate-slide-up items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 py-2.5 pl-2.5 pr-5 text-left shadow-xl shadow-slate-900/10 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-2xl hover:shadow-brand-600/20 cursor-pointer dark:border-slate-700 dark:bg-slate-900/95 dark:hover:border-brand-500/40"
        >
          <span className="relative">
            <BotLogo />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
              ExploraBot
            </span>
            <span className="block text-xs font-medium text-brand-600 dark:text-brand-400">
              Asistente virtual · En línea
            </span>
          </span>
        </button>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Asistente virtual ExploraTur"
          className="fixed bottom-24 right-6 z-50 flex w-80 animate-pop-in flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900 sm:w-96"
          style={{ maxHeight: '32rem' }}
        >
          {/* Encabezado */}
          <div className="bg-brand-gradient px-4 py-3">
            <div className="flex items-center gap-3">
              <BotLogo className="h-10 w-10" tile="bg-white/20 text-white ring-1 ring-white/40" />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-sm font-bold text-white">ExploraBot</h3>
                <p className="flex items-center gap-1.5 text-xs text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                  En línea · responde al instante
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar el asistente virtual"
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '20rem' }} aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.rol !== 'user' && <BotLogo className="h-7 w-7 rounded-lg" tile="bg-brand-gradient text-white" />}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.rol === 'user'
                    ? 'bg-brand-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-bl-md'
                }`}>
                  {msg.contenido}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preguntas sugeridas */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1 px-4 pb-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); setTimeout(handleSend, 100) }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-100 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                autoFocus
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                aria-label="Enviar mensaje"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
              Asistente virtual con IA · puede cometer errores
            </p>
          </div>
        </div>
      )}
    </>
  )
}
