'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadFormProps {
  cycleId: string
  cycleName: string
  hasActiveConvocatorias: boolean
  variant?: 'default' | 'card' | 'inline'
  className?: string
  labelClassName?: string
  inputClassName?: string
  buttonClassName?: string
  linkClassName?: string
  submitLabel?: string
  submittingLabel?: string
  sourceForm?: string
  leadType?: string
  notes?: string
  dossierUrl?: string
  dossierName?: string
  leadMetadata?: Record<string, string>
}

export function LeadForm({
  cycleId,
  cycleName,
  hasActiveConvocatorias,
  variant = 'default',
  className,
  labelClassName,
  inputClassName,
  buttonClassName,
  linkClassName,
  submitLabel,
  submittingLabel = 'Enviando...',
  sourceForm = 'preinscripcion_ciclo',
  leadType,
  notes,
  dossierUrl,
  dossierName,
  leadMetadata,
}: LeadFormProps) {
  const requiresQualifiedData = hasActiveConvocatorias
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (requiresQualifiedData && (!firstName.trim() || !lastName.trim() || !phone.trim())) {
      setError('Todos los campos son obligatorios.')
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
          name: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
          phone: phone || undefined,
          source_form: sourceForm,
          source_page: typeof window !== 'undefined' ? window.location.href : '',
          notes: notes || `Interesado en: ${cycleName}`,
          cycle_id: cycleId,
          lead_type: leadType || (hasActiveConvocatorias ? 'lead' : 'waiting_list'),
          dossier_requested: Boolean(dossierUrl),
          dossier_url: dossierUrl || undefined,
          dossier_name: dossierName || undefined,
          ...(leadMetadata ?? {}),
          lead_metadata: leadMetadata,
          gdpr_consent: true,
          consent_timestamp: new Date().toISOString(),
          utm_source:
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('utm_source') || undefined
              : undefined,
          utm_medium:
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('utm_medium') || undefined
              : undefined,
          utm_campaign:
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('utm_campaign') || undefined
              : undefined,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('No se pudo enviar. Inténtalo de nuevo.')
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={cn('text-center py-8 animate-in fade-in zoom-in duration-300', className)}>
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 border-4 border-green-50">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Solicitud recibida!</h3>
        <p className="text-gray-600 max-w-[280px] mx-auto text-sm leading-relaxed">
          Un asesor de CEP Formación se pondrá en contacto contigo en las próximas 24-48h laborales.
        </p>
      </div>
    )
  }

  const labelClasses = cn('text-xs font-semibold text-gray-700 ml-1', labelClassName)
  const inputClasses = cn(
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-400',
    inputClassName
  )
  const buttonClasses = cn(
    'w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 text-white rounded-xl text-base font-bold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-brand-600/20',
    buttonClassName
  )

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className={cn('grid gap-4', variant === 'inline' ? 'md:grid-cols-2' : 'grid-cols-1')}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClasses}>Nombre</label>
            <input
              type="text"
              required={requiresQualifiedData}
              placeholder="Ej. Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Apellidos</label>
            <input
              type="text"
              required={requiresQualifiedData}
              placeholder="Ej. Pérez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClasses}>Email corporativo o personal</label>
          <input
            type="email"
            required
            placeholder="juan.perez@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClasses}>Teléfono de contacto</label>
          <input
            type="tel"
            required={requiresQualifiedData}
            placeholder="+34 600 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
          {error}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={buttonClasses}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {submittingLabel}
            </>
          ) : (
            <>{submitLabel || (hasActiveConvocatorias ? 'Solicitar información gratuita' : 'Avisarme de próximas fechas')}</>
          )}
        </button>
      </div>

      <p className="text-[11px] text-gray-400 text-center leading-tight">
        Al hacer clic, aceptas nuestra{' '}
        <a href="/legal/privacidad" className={cn('underline hover:text-gray-600', linkClassName)}>
          política de privacidad
        </a>{' '}
        y el tratamiento de tus datos para fines informativos.
      </p>
    </form>
  )
}
