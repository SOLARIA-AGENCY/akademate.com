'use client'

import { useState } from 'react'

interface LeadFormProps {
  cycleId: string
  cycleName: string
  hasActiveConvocatorias: boolean
}

export function LeadForm({ cycleId, cycleName, hasActiveConvocatorias }: LeadFormProps) {
  const requiresQualifiedData = hasActiveConvocatorias
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showFull, setShowFull] = useState(requiresQualifiedData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (requiresQualifiedData && (!name.trim() || !phone.trim())) {
      setError('Nombre y teléfono son obligatorios para solicitar información de ciclos activos.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: name || undefined,
          phone: phone || undefined,
          source_form: 'preinscripcion_ciclo',
          source_page: typeof window !== 'undefined' ? window.location.href : '',
          notes: `Interesado en: ${cycleName}`,
          cycle_id: cycleId,
          lead_type: hasActiveConvocatorias ? 'lead' : 'waiting_list',
          gdpr_consent: true,
          consent_timestamp: new Date().toISOString(),
          utm_source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') || undefined : undefined,
          utm_medium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') || undefined : undefined,
          utm_campaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') || undefined : undefined,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('No se pudo enviar. Intentalo de nuevo.')
      }
    } catch {
      setError('Error de conexion. Intentalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="font-semibold text-gray-900">Recibido</p>
        <p className="text-sm text-gray-600 mt-1">Te contactaremos pronto con mas informacion.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        placeholder="Tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent"
      />

      {!showFull && (
        <button type="button" onClick={() => setShowFull(true)} className="text-xs brand-text hover:underline">
          + Agregar nombre y telefono
        </button>
      )}

      {showFull && (
        <>
          <input
            type="text"
            required={requiresQualifiedData}
            placeholder={requiresQualifiedData ? 'Tu nombre *' : 'Tu nombre (opcional)'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent"
          />
          <input
            type="tel"
            required={requiresQualifiedData}
            placeholder={requiresQualifiedData ? 'Tu telefono *' : 'Tu telefono (opcional)'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 brand-ring focus:border-transparent"
          />
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !email || (requiresQualifiedData && (!name.trim() || !phone.trim()))}
        className="w-full px-4 py-2.5 brand-bg text-white rounded-lg text-sm font-medium hover:brand-bg disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Enviando...' : hasActiveConvocatorias ? 'Solicitar informacion' : 'Avisame de proximas convocatorias'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Al enviar aceptas nuestra <a href="/legal/privacidad" className="underline">politica de privacidad</a>
      </p>
    </form>
  )
}
