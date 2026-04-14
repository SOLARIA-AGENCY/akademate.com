'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, X, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { useTenantBranding } from '@/app/providers/tenant-branding'

export function ChatbotWidget() {
  const { branding } = useTenantBranding()
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [location, setLocation] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    if (location.trim().length > 0) return
    setLocation(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  }, [isOpen, location])

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length < 8) {
      setStatus('error')
      setStatusMessage('Describe el problema con más detalle para poder ayudarte.')
      return
    }

    const fallbackLocation =
      location.trim().length > 0
        ? location.trim()
        : typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : '/dashboard'

    setIsSending(true)
    setStatus('idle')
    setStatusMessage('')

    try {
      const response = await fetch('/api/feedback/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          location: fallbackLocation,
          context:
            typeof window !== 'undefined'
              ? {
                  currentUrl: window.location.href,
                  pageTitle: document.title,
                  happenedAt: new Date().toISOString(),
                  viewport: { width: window.innerWidth, height: window.innerHeight },
                }
              : undefined,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as { feedbackId?: string; error?: string }

      if (!response.ok) {
        setStatus('error')
        setStatusMessage(body.error || 'No se pudo enviar el feedback. Inténtalo de nuevo.')
        return
      }

      setStatus('success')
      setStatusMessage(
        body.feedbackId
          ? `Feedback enviado correctamente (${body.feedbackId}).`
          : 'Feedback enviado correctamente.',
      )
      setPrompt('')
    } catch {
      setStatus('error')
      setStatusMessage('No se pudo enviar el feedback. Revisa tu conexión e inténtalo otra vez.')
    } finally {
      setIsSending(false)
    }
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
              <MessageCircle className="h-5 w-5" data-oid="s_7fqf2" />
            </div>
            <div className="flex-1" data-oid="e.9is0h">
              <h3 className="font-semibold" data-oid="zn_.2uo">
                Canal de feedback
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" data-oid="f-gv5hk">
            <div className="rounded-xl border border-border bg-card p-3" data-oid="rtun9vq">
              <p className="text-sm font-medium text-foreground" data-oid="12ffkry">
                Reporta un problema o sugerencia
              </p>
              <p className="mt-1 text-xs text-muted-foreground" data-oid="6hmdyl4">
                Tu mensaje se enviará por correo al equipo de CEP con tu usuario, ruta y contexto
                técnico para poder corregirlo rápido.
              </p>
            </div>

            <div className="space-y-2" data-oid="7rw2s20">
              <label className="text-xs font-medium text-muted-foreground" data-oid="6j65jvr">
                ¿Dónde encontraste el problema?
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="/dashboard/..."
                data-oid="d6s1ko:"
              />
            </div>

            <div className="space-y-2" data-oid="5qq8bls">
              <label className="text-xs font-medium text-muted-foreground" data-oid="7j1q4_4">
                ¿Qué está pasando?
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe el problema, pasos para reproducirlo y resultado esperado."
                className="min-h-36 resize-none"
                data-oid="bd8202-"
              />
              <p className="text-[11px] text-muted-foreground" data-oid="7g8j34w">
                Recomendación: incluye qué intentaste hacer y qué error esperabas evitar.
              </p>
            </div>

            {status !== 'idle' && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  status === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
                data-oid="ifz8w11"
              >
                <p className="flex items-center gap-2" data-oid="l44r4a7">
                  {status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" data-oid="axvfz8z" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" data-oid="2n0j4gj" />
                  )}
                  <span data-oid="3yehpkd">{statusMessage}</span>
                </p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-background" data-oid="s0iew82">
            <div className="flex gap-2" data-oid="yiskxuc">
              <Button
                onClick={handleSend}
                className="w-full"
                disabled={isSending || prompt.trim().length < 8}
                data-oid="cmk-7:-"
              >
                <Send className="h-4 w-4" data-oid="o_98ful" />
                {isSending ? 'Enviando feedback...' : 'Enviar feedback'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center" data-oid="0yacfn0">
              Se envía a agency.solaria@gmail.com con contexto técnico y usuario
            </p>
          </div>
        </div>
      )}
    </>
  )
}
