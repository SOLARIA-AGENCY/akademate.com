'use client'

import { useState } from 'react'

interface Props {
  convocatoriaId: string
  convocatoriaCodigo: string
  displayName?: string
  courseName?: string
}

export function PreinscripcionForm({ convocatoriaId, convocatoriaCodigo, displayName, courseName }: Props) {
  const name_ = displayName || courseName || ''
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name || !privacy) return
    setSubmitting(true)
    setError('')

    try {
      const eventId = crypto.randomUUID()

      // Read Meta cookies for better matching
      const getCookie = (name_c: string) => document.cookie.split('; ').find(c => c.startsWith(name_c + '='))?.split('=')[1]
      const fbc = getCookie('_fbc')
      const fbp = getCookie('_fbp')

      // Read UTM params from URL
      const urlParams = new URLSearchParams(window.location.search)
      const utmSource = urlParams.get('utm_source') || ''
      const utmMedium = urlParams.get('utm_medium') || ''
      const utmCampaign = urlParams.get('utm_campaign') || ''
      const utmTerm = urlParams.get('utm_term') || ''
      const utmContent = urlParams.get('utm_content') || ''
      const fbclid = urlParams.get('fbclid') || ''

      // Fire browser Pixel Lead event
      if ((window as any).fbq) {
        ;(window as any).fbq('track', 'Lead', {
          content_name: courseName || '',
          content_category: 'convocatoria',
        }, { eventID: eventId })
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: name,
          phone: phone || undefined,
          message: message || undefined,
          source_form: 'preinscripcion_convocatoria',
          source_page: typeof window !== 'undefined' ? window.location.href : '',
          notes: `Preinscripcion: ${name_} (${convocatoriaCodigo})`,
          convocatoria_id: convocatoriaId,
          lead_type: 'inscripcion',
          priority: 'urgente',
          gdpr_consent: true,
          consent_timestamp: new Date().toISOString(),
          event_id: eventId,
            fbc,
            fbp,
            fbclid: fbclid || undefined,
            utm_source: utmSource || undefined,
            utm_medium: utmMedium || undefined,
            utm_campaign: utmCampaign || undefined,
            utm_term: utmTerm || undefined,
            utm_content: utmContent || undefined,
          }),
        })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('No se pudo enviar. Intentalo de nuevo.')
      }
    } catch {
      setError('Error de conexion.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-lg font-bold text-gray-900">Plaza reservada</p>
        <p className="text-sm text-gray-600 mt-2">Nos pondremos en contacto contigo para confirmar tu inscripcion.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="text" required placeholder="Nombre completo *" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent" />
      <input type="email" required placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent" />
      <input type="tel" placeholder="Telefono (recomendado)" value={phone} onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent" />
      <textarea placeholder="Mensaje o consulta (opcional)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent resize-none" />

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-1 rounded border-gray-300" />
        <span className="text-xs text-gray-600">Acepto la <a href="/legal/privacidad" className="brand-text underline" target="_blank">politica de privacidad</a> y el tratamiento de mis datos.</span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button type="submit" disabled={submitting || !email || !name || !privacy}
        className="w-full px-4 py-3 brand-btn text-white rounded-lg text-base font-bold  disabled:opacity-50 transition-colors uppercase tracking-wide">
        {submitting ? 'Enviando...' : 'Reserva tu plaza'}
      </button>

      <p className="text-xs text-gray-400 text-center">Sin compromiso. Te contactaremos en 24h.</p>
    </form>
  )
}
