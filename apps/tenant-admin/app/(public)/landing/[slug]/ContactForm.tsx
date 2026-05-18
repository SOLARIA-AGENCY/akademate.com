'use client'

import { useState } from 'react'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'

interface ContactFormProps {
  courseRunId: number
  courseName: string
  slug: string
}

export function ContactForm({ courseRunId, courseName, slug }: ContactFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const eventId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const trackingPayload = {
        path: `/landing/${slug}${typeof window !== 'undefined' ? window.location.search : ''}`,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        utm_source: urlParams?.get('utm_source') || undefined,
        utm_medium: urlParams?.get('utm_medium') || undefined,
        utm_campaign: urlParams?.get('utm_campaign') || undefined,
        meta_campaign_id:
          urlParams?.get('meta_campaign_id') ||
          urlParams?.get('campaign_id') ||
          urlParams?.get('utm_id') ||
          undefined,
      }

      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          event_type: 'form_click',
          event_id: `${eventId}-click`,
          ...trackingPayload,
        }),
      }).catch(() => {})

      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          event_id: `${eventId}-lead`,
          path: `/landing/${slug}`,
          courseRunId,
          courseName,
          utm_source: trackingPayload.utm_source,
          utm_medium: trackingPayload.utm_medium,
          utm_campaign: trackingPayload.utm_campaign,
          meta_campaign_id: trackingPayload.meta_campaign_id,
          ...formData,
        }),
      })

      if (!res.ok) {
        throw new Error('Error al enviar')
      }

      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          event_type: 'form_submit',
          event_id: `${eventId}-submit`,
          ...trackingPayload,
        }),
      }).catch(() => {})

      setStatus('success')
      setFormData({ first_name: '', last_name: '', email: '', phone: '' })
    } catch {
      setStatus('error')
      setErrorMsg('No se pudo enviar la solicitud. Intentalo de nuevo.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Solicitud enviada</h3>
        <p className="text-green-700">
          Hemos recibido tu solicitud de informacion sobre <strong>{courseName}</strong>.
          Te contactaremos en breve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <Input
            type="text"
            id="first_name"
            required
            value={formData.first_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
            className="h-auto rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos *
          </label>
          <Input
            type="text"
            id="last_name"
            required
            value={formData.last_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
            className="h-auto rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Tus apellidos"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          className="h-auto rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefono
        </label>
        <Input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          className="h-auto rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="+34 600 000 000"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="h-auto w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'submitting' ? 'Enviando...' : 'Solicitar Informacion'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Sin compromiso. Al enviar aceptas nuestra{' '}
        <a href="/legal/privacidad" className="underline hover:text-gray-700">politica de privacidad</a>.
      </p>
    </form>
  )
}
