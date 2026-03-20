'use client'

import { useState } from 'react'

interface Props {
  convocatoriaId: string
  convocatoriaCodigo: string
  courseName: string
}

export function PreinscripcionForm({ convocatoriaId, convocatoriaCodigo, courseName }: Props) {
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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone: phone || undefined,
          source: 'preinscripcion_convocatoria',
          notes: `Preinscripcion: ${courseName} (${convocatoriaCodigo})${message ? `\nMensaje: ${message}` : ''}`,
          convocatoria_id: convocatoriaId,
          type: 'lead',
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
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
      <input type="email" required placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
      <input type="tel" placeholder="Telefono (recomendado)" value={phone} onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
      <textarea placeholder="Mensaje o consulta (opcional)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-1 rounded border-gray-300" />
        <span className="text-xs text-gray-600">Acepto la <a href="/legal/privacidad" className="text-blue-600 underline" target="_blank">politica de privacidad</a> y el tratamiento de mis datos.</span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button type="submit" disabled={submitting || !email || !name || !privacy}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-base font-bold hover:bg-green-700 disabled:opacity-50 transition-colors uppercase tracking-wide">
        {submitting ? 'Enviando...' : 'Reserva tu plaza'}
      </button>

      <p className="text-xs text-gray-400 text-center">Sin compromiso. Te contactaremos en 24h.</p>
    </form>
  )
}
