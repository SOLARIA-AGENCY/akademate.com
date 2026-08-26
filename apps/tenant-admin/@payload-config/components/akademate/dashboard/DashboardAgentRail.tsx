'use client'

import * as React from 'react'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'
import {
  DASHBOARD_AGENT_RAIL_CLASS,
  DASHBOARD_AGENT_RAIL_COLLAPSED_WIDTH,
  DASHBOARD_RAIL_SPACER_CLASS,
} from '@/app/lib/dashboard-listing-scroll'

export const AGENT_RAIL_COLLAPSED_PX = 80
export const AGENT_RAIL_DEFAULT_WIDTH = 360
export const AGENT_RAIL_MIN_WIDTH = 280
export const AGENT_RAIL_MAX_WIDTH = 560

export const AGENT_GREETING_PROMPT = `Soy el Agente IA de Akademate.

Estoy aquí para ayudarte con cualquier gestión de tu academia CEP FORMACIÓN.

Puedes pedirme, por ejemplo:
• Crear una convocatoria nueva
• Matricular un alumno
• Revisar plazas, programación o fichas
• Cualquier otra operación de la plataforma

Dime qué necesitas y te guío paso a paso.`

export const AGENT_MOCK_THREADS = [
  {
    id: 't1',
    role: 'agent' as const,
    text: AGENT_GREETING_PROMPT,
  },
  {
    id: 't2',
    role: 'user' as const,
    text: 'Quiero crear una convocatoria para el Curso de Ejemplo.',
  },
  {
    id: 't3',
    role: 'agent' as const,
    text: 'Perfecto. Te guío en Programación → Nueva: elige curso, sede y aula. Las plazas ofertadas se ponen a mano y no pueden superar la capacidad del aula.',
  },
  {
    id: 't4',
    role: 'user' as const,
    text: 'También necesito matricular un alumno en CEP FORMACIÓN.',
  },
  {
    id: 't5',
    role: 'agent' as const,
    text: 'Cuando confirmes la matrícula, el alumno queda asociado a esa convocatoria y el contador interno pasa de 0/20 a 1/20. No se publica en la web.',
  },
] as const

function clampChatWidth(value: number): number {
  return Math.min(AGENT_RAIL_MAX_WIDTH, Math.max(AGENT_RAIL_MIN_WIDTH, Math.round(value)))
}

export function DashboardAgentRail() {
  const [open, setOpen] = React.useState(false)
  const [width, setWidth] = React.useState(AGENT_RAIL_DEFAULT_WIDTH)
  const drag = React.useRef<{ startX: number; startWidth: number } | null>(null)

  React.useEffect(() => {
    if (!open) return undefined

    const onMove = (event: PointerEvent) => {
      if (!drag.current) return
      setWidth(clampChatWidth(drag.current.startWidth + (drag.current.startX - event.clientX)))
    }
    const onUp = () => {
      drag.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      onUp()
    }
  }, [open])

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    drag.current = { startX: event.clientX, startWidth: width }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const railWidth = open ? `${width}px` : undefined

  return (
    <>
      <div
        aria-hidden
        data-slot="dashboard-agent-spacer"
        className={`${DASHBOARD_RAIL_SPACER_CLASS} ${open ? '' : DASHBOARD_AGENT_RAIL_COLLAPSED_WIDTH}`}
        style={open ? { width: railWidth, minWidth: railWidth } : undefined}
      />
      <aside
        data-slot="dashboard-agent-rail"
        data-state={open ? 'expanded' : 'collapsed'}
        className={cn(DASHBOARD_AGENT_RAIL_CLASS, open ? '' : DASHBOARD_AGENT_RAIL_COLLAPSED_WIDTH)}
        style={open ? { width: railWidth } : undefined}
      >
        {open ? (
          <div
            className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0B1D36] text-white"
            data-slot="dashboard-agent-chat"
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar agente"
              data-slot="dashboard-agent-resize"
              onPointerDown={startResize}
              className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize bg-white/10 hover:bg-white/30"
            />
            <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-3 pl-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Agente Akademate</p>
                <p className="truncate text-[11px] text-white/70">Asistente interno · mock</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar agente"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div
              data-slot="dashboard-agent-transcript"
              className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 pl-4"
            >
              {AGENT_MOCK_THREADS.map((message) => (
                <div
                  key={message.id}
                  data-role={message.role}
                  className={cn(
                    'max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    message.role === 'agent'
                      ? 'self-start bg-white/10 text-white'
                      : 'self-end bg-[#0066CC] text-white',
                  )}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <form
              className="shrink-0 border-t border-white/10 p-3 pl-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="sr-only" htmlFor="dashboard-agent-input">
                Mensaje al agente
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <input
                  id="dashboard-agent-input"
                  type="text"
                  disabled
                  placeholder="Escribe al agente (mock)"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                />
                <button
                  type="submit"
                  disabled
                  aria-label="Enviar mensaje"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full flex-col items-center justify-end pb-4">
            <button
              type="button"
              data-slot="dashboard-agent-trigger"
              aria-label="Abrir agente IA"
              onClick={() => setOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white shadow-sm hover:bg-white/25"
            >
              <Bot className="h-6 w-6 text-white" />
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
