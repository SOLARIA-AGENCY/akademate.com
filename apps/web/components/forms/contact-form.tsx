'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function ContactForm() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [captchaAccepted, setCaptchaAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const utm = useMemo(() => {
    return {
      source: searchParams.get('utm_source') ?? undefined,
      medium: searchParams.get('utm_medium') ?? undefined,
      campaign: searchParams.get('utm_campaign') ?? undefined,
      term: searchParams.get('utm_term') ?? undefined,
      content: searchParams.get('utm_content') ?? undefined,
    }
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!gdprAccepted) {
      setErrorMessage('Debes aceptar la política de privacidad para continuar.')
      return
    }

    if (!captchaAccepted) {
      setErrorMessage('Completa la verificación anti-spam para continuar.')
      return
    }

    const nameParts = name.trim().split(' ').filter(Boolean)
    const firstName = nameParts.shift() ?? ''
    const lastName = nameParts.join(' ') || 'Sin Apellido'

    if (!firstName) {
      setErrorMessage('El nombre es obligatorio.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          message: `[${subject}] ${message}`.trim(),
          gdpr_consent: gdprAccepted,
          privacy_policy_accepted: gdprAccepted,
          marketing_consent: false,
          utm,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo enviar el mensaje. Inténtalo de nuevo.')
      }

      setSuccessMessage('Mensaje enviado correctamente. Te responderemos pronto.')
      setName('')
      setEmail('')
      setPhone('')
      setSubject('')
      setMessage('')
      setGdprAccepted(false)
      setCaptchaAccepted(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al enviar el mensaje.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nombre y apellidos *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="+34 612 345 678"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium">
          Asunto *
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecciona un asunto</option>
          <option value="demo">Solicitar demo</option>
          <option value="pricing">Información de precios</option>
          <option value="support">Soporte técnico</option>
          <option value="partnership">Colaboraciones</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Mensaje *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="¿En qué podemos ayudarte?"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="gdpr"
          name="gdpr"
          checked={gdprAccepted}
          onChange={(event) => setGdprAccepted(event.target.checked)}
          className="mt-1 rounded border-gray-300"
        />
        <label htmlFor="gdpr" className="text-sm text-muted-foreground">
          Acepto la{' '}
          <a href="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </a>{' '}
          y el tratamiento de mis datos para gestionar mi consulta. *
        </label>
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="captcha"
          name="captcha"
          checked={captchaAccepted}
          onChange={(event) => setCaptchaAccepted(event.target.checked)}
          className="mt-1 rounded border-gray-300"
        />
        <label htmlFor="captcha" className="text-sm text-muted-foreground">
          Verificación anti-spam (marca para continuar)
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
