'use client'

import * as React from 'react'
import { Bot, ChevronsLeft, ChevronsRight, Send, Sparkles } from 'lucide-react'
import { cn } from '@payload-config/lib/utils'
import {
  DASHBOARD_AGENT_RAIL_CLASS,
  DASHBOARD_AGENT_RAIL_COLLAPSED_WIDTH,
} from '@/app/lib/dashboard-listing-scroll'

export const AGENT_RAIL_COLLAPSED_PX = 40
export const AGENT_RAIL_DEFAULT_WIDTH = 360
export const AGENT_RAIL_MIN_WIDTH = 280
export const AGENT_RAIL_MAX_WIDTH = 560

export const AGENT_GREETING_PROMPT = `Soy el Agente IA de Akademate.

Estoy aquí para ayudarte con la gestión de tu academia CEP FORMACIÓN.

Próximamente estaré en marcha y funcionando. Mientras tanto, elige una opción:`

export const AGENT_QUICK_REPLIES = [
  {
    id: 'convocatoria',
    label: 'Crear una convocatoria',
    reply:
      'Cuando esté en marcha te guiaré a Programación → Nueva: elige curso, sede y aula. Las plazas ofertadas se ponen a mano y no pueden superar la capacidad del aula.',
  },
  {
    id: 'matricula',
    label: 'Matricular un alumno',
    reply:
      'La matrícula quedará asociada a la convocatoria y el contador interno se actualizará. No se publica en la web. Esta guía estará disponible cuando el agente funcione.',
  },
  {
    id: 'plazas',
    label: 'Revisar plazas y programación',
    reply:
      'Podrás consultar plazas, el planner y las fichas de curso, ciclo y profesor. Pronto podré abrir esas pantallas por ti.',
  },
] as const

type ChatMessage = { id: string; role: 'agent' | 'user'; text: string }

function clampChatWidth(value: number): number {
  return Math.min(AGENT_RAIL_MAX_WIDTH, Math.max(AGENT_RAIL_MIN_WIDTH, Math.round(value)))
}

export function DashboardAgentRail() {
  const [open, setOpen] = React.useState(false)
  const [width, setWidth] = React.useState(AGENT_RAIL_DEFAULT_WIDTH)
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: 'greeting', role: 'agent', text: AGENT_GREETING_PROMPT },
  ])
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

  const chooseReply = (option: (typeof AGENT_QUICK_REPLIES)[number]) => {
    setMessages((current) => [
      ...current,
      { id: `user-${option.id}-${current.length}`, role: 'user', text: option.label },
      { id: `agent-${option.id}-${current.length}`, role: 'agent', text: option.reply },
    ])
  }

  const railWidth = open ? `${width}px` : undefined

  return (
    <aside
      data-slot="dashboard-agent-rail"
      data-state={open ? 'expanded' : 'collapsed'}
      className={cn(DASHBOARD_AGENT_RAIL_CLASS, open ? '' : DASHBOARD_AGENT_RAIL_COLLAPSED_WIDTH)}
      style={open ? { width: railWidth, minWidth: railWidth } : undefined}
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Agente Akademate</p>
              <p className="truncate text-[11px] text-white/70">Próximamente en marcha</p>
            </div>
            <button
              type="button"
              aria-label="Colapsar agente"
              data-slot="dashboard-agent-collapse"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/10"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </header>
          <div
            data-slot="dashboard-agent-transcript"
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 pl-4"
          >
            {messages.map((message) => (
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
            <div className="mt-1 flex flex-col gap-1.5" data-slot="dashboard-agent-quick-replies">
              {AGENT_QUICK_REPLIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseReply(option)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-xs font-medium text-white hover:bg-white/15"
                >
                  {option.label}
                </button>
              ))}
            </div>
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
                placeholder="Próximamente en marcha"
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
        <div className="flex h-full min-h-0 w-full flex-col items-center bg-[#0B1D36] py-2">
          <button
            type="button"
            data-slot="dashboard-agent-expand"
            aria-label="Expandir agente"
            onClick={() => setOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/15"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-slot="dashboard-agent-trigger"
            aria-label="Abrir agente IA"
            onClick={() => setOpen(true)}
            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <Bot className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
    </aside>
  )
}
