'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { useTenantBranding } from '@/app/providers/tenant-branding'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatbotWidget() {
  const { branding } = useTenantBranding()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente virtual del centro. Aun no estoy disponible, pero pronto podre resolver tus dudas de gestion academica.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // AI not yet connected — show placeholder response
    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: 'Aun no estoy disponible para responder consultas, pero estoy en proceso de configuracion. Pronto podre ayudarte con todo lo relacionado con la gestion de tu academia. ¡Gracias por tu paciencia!',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 800)
  }

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('usuario') || lowerQuery.includes('crear')) {
      return 'Para crear un nuevo usuario, ve a **Administración → Usuarios** y haz clic en "Crear Usuario". Podrás asignar roles y permisos específicos.'
    }
    if (lowerQuery.includes('curso') || lowerQuery.includes('programación')) {
      return 'Puedes gestionar cursos desde el menú **Cursos** o crear convocatorias en **Programación**. ¿Necesitas ayuda con algo específico?'
    }
    if (lowerQuery.includes('api') || lowerQuery.includes('webhook')) {
      return 'Las configuraciones de API y webhooks están en **Configuración → APIs y Webhooks**. Ahí podrás generar claves y configurar integraciones.'
    }
    if (lowerQuery.includes('color') || lowerQuery.includes('personaliz')) {
      return 'Para personalizar colores y estilos, dirígete a **Configuración → Personalización**. Puedes cambiar colores corporativos, logos y más.'
    }

    return 'Entiendo tu consulta. ¿Podrías ser más específico? Puedo ayudarte con usuarios, cursos, configuraciones, APIs y más.'
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
        data-oid="_2h6sl-"
      >
        {isOpen ? (
          <X className="h-6 w-6" data-oid="6xq73cl" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" data-oid="3_0:04." />
            <span className="absolute -top-1 -right-1 flex h-3 w-3" data-oid="i1l6ko3">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                data-oid="qy50d06"
              ></span>
              <span
                className="relative inline-flex rounded-full h-3 w-3 bg-green-500"
                data-oid="74wf0ic"
              ></span>
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5"
          data-oid="gq0uyhz"
        >
          {/* Header */}
          <div
            className="bg-primary text-primary-foreground p-4 flex items-center gap-3"
            data-oid="crwno0."
          >
            <div
              className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"
              data-oid="2sldmrg"
            >
              <Sparkles className="h-5 w-5" data-oid="s_7fqf2" />
            </div>
            <div className="flex-1" data-oid="e.9is0h">
              <h3 className="font-semibold" data-oid="zn_.2uo">
                Asistente IA
              </h3>
              <p className="text-xs opacity-90" data-oid="x-zx8ck">
                {branding.academyName}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              data-oid="h:67np9"
            >
              <X className="h-4 w-4" data-oid="v__a77w" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" data-oid="f-gv5hk">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-oid="z6v0tbc"
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                  data-oid="7_34osq"
                >
                  <p className="text-sm" data-oid="dr1yvpm">
                    {msg.content}
                  </p>
                  <span className="text-[10px] opacity-70 mt-1 block" data-oid="3:9yxmr">
                    {msg.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start" data-oid="ct9-lyp">
                <div
                  className="bg-card border border-border rounded-2xl px-4 py-2"
                  data-oid="lg1r3hq"
                >
                  <div className="flex gap-1" data-oid="r2--:p9">
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                      data-oid="oy0ra17"
                    ></span>
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                      data-oid="9:3c1lv"
                    ></span>
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                      data-oid="qtslc52"
                    ></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-background" data-oid="s0iew82">
            <div className="flex gap-2" data-oid="yiskxuc">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu pregunta..."
                className="flex-1"
                data-oid="yrrsy1c"
              />

              <Button onClick={handleSend} size="icon" disabled={!input.trim()} data-oid="cmk-7:-">
                <Send className="h-4 w-4" data-oid="o_98ful" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center" data-oid="0yacfn0">
              Powered by AI • Respuestas en tiempo real
            </p>
          </div>
        </div>
      )}
    </>
  )
}
