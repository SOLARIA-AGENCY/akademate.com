'use client'

import * as React from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const INTENTS = [
  { value: 'trabaja-con-nosotros', label: 'Trabaja con nosotros', detailLabel: 'Puesto o área profesional', detailPlaceholder: 'Docencia, coordinación, administración, marketing...' },
  { value: 'practicas-en-cep', label: 'Haz prácticas con nosotros', detailLabel: 'Estudios y periodo de prácticas', detailPlaceholder: 'Ciclo, grado o especialización y fechas aproximadas' },
  { value: 'imparte-formacion', label: 'Imparte formación con nosotros', detailLabel: 'Especialidad y experiencia', detailPlaceholder: 'Área técnica, experiencia profesional o docente' },
  { value: 'proyecto-colaborativo', label: 'Propón un proyecto', detailLabel: 'Entidad o proyecto', detailPlaceholder: 'Organización, iniciativa y ámbito de colaboración' },
  { value: 'empresa-practicas', label: 'Ser empresa colaboradora de prácticas', detailLabel: 'Empresa y perfiles de interés', detailPlaceholder: 'Sector, ubicación y perfiles que podrían incorporarse' },
  { value: 'formacion-empresas', label: 'Formación para empresas', detailLabel: 'Necesidad formativa', detailPlaceholder: 'Equipo, modalidad, objetivos y fechas aproximadas' },
] as const

type Intent = (typeof INTENTS)[number]['value']

function isIntent(value: string | null): value is Intent {
  return INTENTS.some((intent) => intent.value === value)
}

export function ColaboraForm() {
  const searchParams = useSearchParams()
  const [intent, setIntent] = React.useState<Intent>('trabaja-con-nosotros')
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', organization: '', detail: '', message: '', consent: false })
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const queryIntent = searchParams.get('tipo')
    if (isIntent(queryIntent)) setIntent(queryIntent)
  }, [searchParams])

  const selectedIntent = INTENTS.find((item) => item.value === intent) ?? INTENTS[0]

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Indica tu nombre y un email de contacto.')
      return
    }
    if (!form.consent) {
      setError('Debes aceptar la política de privacidad para enviar la solicitud.')
      return
    }

    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message || undefined,
          source_form: 'colabora',
          source_page: '/colabora',
          lead_type: 'contacto',
          lead_intent: intent,
          priority: intent === 'formacion-empresas' || intent === 'empresa-practicas' ? 'high' : 'medium',
          gdpr_consent: true,
          consent_timestamp: new Date().toISOString(),
          lead_metadata: {
            request_label: selectedIntent.label,
            organization: form.organization || undefined,
            detail_label: selectedIntent.detailLabel,
            detail: form.detail || undefined,
          },
        }),
      })

      if (!response.ok) throw new Error('lead_request_failed')
      setStatus('success')
    } catch {
      setStatus('error')
      setError('No hemos podido enviar la solicitud. Inténtalo de nuevo o contacta con nuestro equipo.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Solicitud recibida</h2>
        <p className="mt-3 max-w-md text-base leading-7 text-slate-600">Gracias por contar con CEP Formación. Revisaremos tu solicitud y te responderemos por el canal que nos has indicado.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div>
        <label htmlFor="colabora-intent" className="text-sm font-bold text-slate-900">¿En qué quieres colaborar?</label>
        <select id="colabora-intent" value={intent} onChange={(event) => setIntent(event.target.value as Intent)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10">
          {INTENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-900">Nombre y apellidos
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10" placeholder="Tu nombre completo" autoComplete="name" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-900">Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10" placeholder="nombre@dominio.com" inputMode="email" autoComplete="email" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-900">Teléfono
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10" placeholder="+34 600 000 000" inputMode="tel" autoComplete="tel" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-900">Empresa o entidad <span className="font-medium text-slate-400">(si aplica)</span>
          <input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10" placeholder="Nombre de la organización" autoComplete="organization" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-900">{selectedIntent.detailLabel}
        <input value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10" placeholder={selectedIntent.detailPlaceholder} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-900">Cuéntanos un poco más <span className="font-medium text-slate-400">(opcional)</span>
        <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="min-h-32 resize-y rounded-xl border border-slate-200 p-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#f2014b] focus:ring-4 focus:ring-[#f2014b]/10" placeholder="Información que nos ayude a valorar tu solicitud" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#f2014b] focus:ring-[#f2014b]" />
        <span>Acepto la <a href="/legal/privacidad" className="font-bold text-[#f2014b] hover:underline">política de privacidad</a> y el tratamiento de mis datos para gestionar esta solicitud.</span>
      </label>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button type="submit" disabled={status === 'sending'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f2014b] px-6 text-sm font-black text-white transition hover:bg-[#d0013f] disabled:cursor-wait disabled:opacity-70">
        {status === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando solicitud</> : 'Enviar solicitud'}
      </button>
    </form>
  )
}
