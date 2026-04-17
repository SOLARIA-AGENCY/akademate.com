'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Textarea } from '@payload-config/components/ui/textarea'
import {
  ArrowLeft, UserPlus, Phone, Mail, MessageSquare,
  Loader2, CheckCircle2, XCircle, Clock, Copy, Check, AlertCircle, PhoneOff,
  GraduationCap, Trash2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo', color: 'bg-red-100 text-red-800 border border-red-300', dot: 'bg-red-500' },
  { value: 'contacted', label: 'Contactado', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  { value: 'following_up', label: 'En seguimiento', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  { value: 'interested', label: 'Interesado', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  { value: 'enrolling', label: 'En matriculacion', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  { value: 'enrolled', label: 'Matriculado', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300', dot: 'bg-emerald-500' },
  { value: 'on_hold', label: 'En espera', color: 'bg-gray-100 text-gray-600', dot: 'bg-amber-500' },
  { value: 'not_interested', label: 'No interesado', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  { value: 'unreachable', label: 'No contactable', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  { value: 'discarded', label: 'Descartado', color: 'bg-gray-50 text-gray-400', dot: 'bg-gray-400' },
]

const CONTACT_RESULTS = [
  { value: 'no_answer', label: 'Sin respuesta', icon: PhoneOff },
  { value: 'positive', label: 'Respondio positivo', icon: CheckCircle2 },
  { value: 'negative', label: 'Respondio negativo', icon: XCircle },
  { value: 'callback', label: 'Pide callback', icon: Clock },
  { value: 'wrong_number', label: 'Numero incorrecto', icon: AlertCircle },
]

const RESULT_LABELS: Record<string, string> = {
  no_answer: 'Sin respuesta',
  positive: 'Respondio positivo',
  negative: 'Respondio negativo',
  callback: 'Pide callback',
  wrong_number: 'Numero incorrecto',
  message_sent: 'Mensaje enviado',
  email_sent: 'Email enviado',
  enrollment_started: 'Matriculacion iniciada',
  status_changed: 'Cambio de estado',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  hibrido: 'Semipresencial',
  online: 'Online',
}

const DECISION_STATE_GUIDE: Record<string, string> = {
  following_up: 'Solicita seguimiento. Agendar fecha y hora concreta.',
  enrolling: 'Inicio de matriculacion. Confirmar documentacion y reserva.',
  on_hold: 'Decision pausada por el lead. Programar reactivacion.',
  not_interested: 'No desea continuar. Cierre cordial y registro de motivo.',
}

const LIVE_DECISION_STATUS_VALUES = ['following_up', 'enrolling', 'on_hold', 'not_interested'] as const

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function formatEuro(value: unknown): string {
  const amount = toFiniteNumber(value)
  if (amount === null) return 'Precio a confirmar'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function normalizeModality(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return MODALITY_LABELS[normalized] || (normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : null)
}

function extractProgramNameFromNotes(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.match(/preinscripcion:\s*([^\n(]+)/i)
  const program = match?.[1]?.trim()
  return program && program.length > 0 ? program : null
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return {}
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return null
}

function isActionableSpanishPhone(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const digits = value.replace(/[^\d]/g, '')
  if (digits === '34000000000' || digits === '000000000') return false
  return /^[+]34\s[6-9]\d{2}\s\d{3}\s\d{3}$/.test(value.trim())
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props { params: Promise<{ id: string }> }

export default function LeadDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [lead, setLead] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [noteText, setNoteText] = React.useState('')

  // Local status for immediate UI feedback
  const [localStatus, setLocalStatus] = React.useState<string | null>(null)

  // Interactions state
  const [interactions, setInteractions] = React.useState<any[]>([])

  // Contact modal state
  const [showContactModal, setShowContactModal] = React.useState<{ channel: 'phone' | 'whatsapp' | 'email' } | null>(null)
  const [contactResult, setContactResult] = React.useState('')
  const [contactNote, setContactNote] = React.useState('')

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const loadLead = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}?depth=1`, { cache: 'no-store' })
      if (res.ok) setLead(await res.json())
    } catch {}
    finally { setLoading(false) }
  }, [id])

  const loadInteractions = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}/interactions`)
      if (res.ok) {
        const data = await res.json()
        setInteractions(data.interactions ?? [])
      }
    } catch {}
  }, [id])

  React.useEffect(() => {
    void loadLead()
    void loadInteractions()
  }, [loadLead, loadInteractions])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const getEnrollmentRoute = (enrollmentId: string | number) => `/matriculas/${enrollmentId}`

  const updateLead = async (updates: Record<string, any>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as Record<string, unknown>))
        throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo actualizar el lead')
      }
      await loadLead()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el lead'
      alert(message)
    }
    finally { setSaving(false) }
  }

  const changeStatus = async (newStatus: string) => {
    const currentStatus = localStatus ?? lead.status
    if (newStatus === currentStatus) return
    setLocalStatus(newStatus) // Immediate UI feedback
    setSaving(true)
    try {
      // 1. Update lead status
      const statusRes = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({} as Record<string, unknown>))
        throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo cambiar el estado')
      }
      // 2. Register status change as system interaction
      const oldLabel = STATUS_OPTIONS.find(s => s.value === currentStatus)?.label ?? currentStatus
      const newLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label ?? newStatus
      const interactionRes = await fetch(`/api/leads/${id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'system',
          result: 'status_changed',
          note: `Estado cambiado: ${oldLabel} → ${newLabel}`,
        }),
      })
      if (!interactionRes.ok) {
        const data = await interactionRes.json().catch(() => ({} as Record<string, unknown>))
        throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo registrar la interacción')
      }
      await loadLead()
      await loadInteractions()
    } catch (error) {
      setLocalStatus(currentStatus)
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el estado'
      alert(message)
    }
    finally { setSaving(false) }
  }

  const registerInteraction = async () => {
    if (!showContactModal || !contactResult) return
    setSaving(true)
    try {
      await fetch(`/api/leads/${id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: showContactModal.channel,
          result: contactResult,
          note: contactNote || undefined,
        }),
      })
      await loadLead()
      await loadInteractions()
      setShowContactModal(null)
      setContactResult('')
      setContactNote('')
    } catch {}
    finally { setSaving(false) }
  }

  const handleEnroll = async () => {
    if (!confirm('Iniciar proceso de matriculacion para este lead?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      const enrollmentId = data?.enrollmentId ?? data?.enrollment_id ?? data?.id ?? data?.enrollment?.id
      if (enrollmentId) {
        router.push(getEnrollmentRoute(enrollmentId))
        return
      }

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo iniciar la matriculacion')
      }
      throw new Error('No se pudo obtener la ficha de matricula')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la matriculacion'
      alert(message)
    }
    finally { setSaving(false) }
  }

  const handleDeleteLead = async () => {
    const confirmed = confirm(
      '¿Eliminar este lead definitivamente?\n\nEsta acción elimina la ficha y no se puede deshacer.',
    )
    if (!confirmed) return

    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })
      const payload = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        const message = typeof payload.error === 'string' ? payload.error : 'No se pudo eliminar el lead'
        throw new Error(message)
      }
      router.push('/inscripciones')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el lead'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!lead) return (
    <div className="space-y-6">
      <PageHeader title="Lead" icon={UserPlus} actions={<Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
      <Card><CardContent className="p-8 text-center text-muted-foreground">Lead no encontrado</CardContent></Card>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const currentStatus = localStatus ?? lead.status ?? 'new'
  const name = lead.first_name || lead.last_name ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : lead.email
  const statusConfig = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0]
  const isInscripcion = lead.lead_type === 'inscripcion'
  const timeSince = lead.createdAt ? Math.round((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)) : 0
  const showEnrollButton = ['interested', 'following_up', 'enrolling'].includes(currentStatus) && !lead.enrollment_id
  const showEnrollLink = !!lead.enrollment_id
  const leadNameForOperator = (name || lead.email || 'LEAD').toUpperCase()
  const leadProgram = lead.lead_program && typeof lead.lead_program === 'object' ? lead.lead_program : null
  const leadOrigin = lead.lead_origin && typeof lead.lead_origin === 'object' ? lead.lead_origin : null
  const sourceDetails = parseJsonRecord(leadOrigin?.source_details ?? lead.source_details)
  const sourceForm = pickFirstString(leadOrigin?.source_form, lead.source_form, sourceDetails.source_form)
  const sourcePage = pickFirstString(leadOrigin?.source_page, lead.source_page, sourceDetails.source_page, sourceDetails.path)
  const originCampaign = pickFirstString(
    leadOrigin?.campaign_code,
    lead.campaign_code,
    sourceDetails.campaign_code,
    sourceDetails.utm_campaign,
    lead.utm_campaign,
  )
  const originLeadType = pickFirstString(leadOrigin?.lead_type, lead.lead_type, sourceDetails.lead_type)
  const originUtmSource = pickFirstString(leadOrigin?.utm_source, sourceDetails.utm_source, lead.utm_source)
  const originUtmMedium = pickFirstString(leadOrigin?.utm_medium, sourceDetails.utm_medium, lead.utm_medium)
  const originUtmCampaign = pickFirstString(leadOrigin?.utm_campaign, sourceDetails.utm_campaign, lead.utm_campaign)
  const originMetaCampaignId = pickFirstString(
    leadOrigin?.meta_campaign_id,
    lead.meta_campaign_id,
    sourceDetails.meta_campaign_id,
  )
  const fallbackProgramName =
    pickFirstString(sourceDetails.course_name, sourceDetails.program_name) ||
    extractProgramNameFromNotes(lead.callback_notes) ||
    extractProgramNameFromNotes(lead.notes)
  const hasResolvedProgram = Boolean(
    (typeof leadProgram?.name === 'string' && leadProgram.name.trim()) ||
    (typeof leadProgram?.course_name === 'string' && leadProgram.course_name.trim()) ||
    fallbackProgramName,
  )
  const programName =
    (typeof leadProgram?.name === 'string' && leadProgram.name.trim()) ||
    (typeof leadProgram?.course_name === 'string' && leadProgram.course_name.trim()) ||
    fallbackProgramName ||
    'programa no identificado'
  const programModality = normalizeModality(leadProgram?.modality) || 'Semipresencial'
  const totalHours = toFiniteNumber(leadProgram?.total_hours)
  const practiceHours = toFiniteNumber(leadProgram?.practice_hours)
  const scheduleText =
    (typeof leadProgram?.schedule === 'string' && leadProgram.schedule.trim()) ||
    '1 dia presencial por semana'
  const programPrice = formatEuro(leadProgram?.price)
  const financingText = leadProgram?.financial_aid_available
    ? 'Disponemos de financiacion flexible para facilitar su matriculacion.'
    : 'Le explico opciones de pago y posibles ayudas al cerrar la matriculacion.'
  const programSummaryParts = [
    `${programModality}`,
    totalHours ? `${totalHours} horas` : null,
    practiceHours ? `${practiceHours} horas de practicas en empresa` : null,
  ].filter(Boolean)
  const programSummary = programSummaryParts.join(', ') || 'Plan formativo a confirmar'
  const hasActionablePhone = isActionableSpanishPhone(lead.phone)
  const hasPhonePlaceholder = Boolean(lead.phone) && !hasActionablePhone

  // Pre-built messages
  const openingLine = `Buenos dias${lead.first_name ? `, ${lead.first_name}` : ''}. Le llamo de CEP Formacion. Hemos recibido su solicitud de informacion${isInscripcion ? ' y preinscripcion' : ''} sobre nuestro ciclo formativo. Es buen momento para hablar?`
  const interestedLine = `Perfecto${lead.first_name ? `, ${lead.first_name}` : ''}. Le detallo su programa: ${programName}. Modalidad: ${programModality}. Horario: ${scheduleText}. Duracion: ${programSummary}. Precio orientativo: ${programPrice}. ${financingText} Si le parece bien, avanzamos ahora mismo con la apertura de matriculacion y le envio confirmacion por WhatsApp o email.`
  const callbackLine = 'Entiendo perfectamente. Que dia y franja horaria le viene mejor para llamarle de nuevo? Lo dejo agendado ahora mismo.'
  const notInterestedLine = 'De acuerdo, sin problema. Si en algun momento necesita informacion, puede contactarnos. Gracias por su tiempo.'
  const phoneScript = `OPERADOR - APERTURA
${openingLine}

OPERADOR - SI INTERESADO
${interestedLine}

OPERADOR - SI NO ES BUEN MOMENTO
${callbackLine}

OPERADOR - SI NO INTERESADO
${notInterestedLine}

ARBOL DE DECISION
1) EN SEGUIMIENTO -> callback agendado
2) EN MATRICULACION -> iniciar matricula
3) EN ESPERA -> decision pausada temporalmente
4) NO INTERESADO -> cierre comercial`

  const whatsappMessage = `Hola${lead.first_name ? ` ${lead.first_name}` : ''}!

Soy del equipo de CEP Formacion. Hemos recibido tu ${isInscripcion ? 'solicitud de preinscripcion' : 'interes'} en nuestro ciclo formativo.

Te escribo para resolver cualquier duda que tengas sobre:
- El programa y los modulos
- Las fechas de inicio y horarios
- Opciones de financiacion y matricula
- Las practicas en empresa

Te viene bien que hablemos o prefieres que te enviemos la informacion por aqui?`

  const emailSubject = `Informacion sobre tu ${isInscripcion ? 'preinscripcion' : 'solicitud'} en CEP Formacion`
  const emailBody = `Hola${lead.first_name ? ` ${lead.first_name}` : ''},

Gracias por tu interes en CEP Formacion. Hemos recibido tu ${isInscripcion ? 'solicitud de preinscripcion' : 'solicitud de informacion'}.

Quedamos a tu disposicion para resolver cualquier duda sobre el programa, los horarios, las opciones de financiacion o el proceso de matricula.

Puedes contactarnos por telefono, WhatsApp o respondiendo a este email.

Un saludo,
Equipo CEP Formacion`

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={`${isInscripcion ? 'Preinscripcion' : 'Lead'} · ${lead.email || ''}`}
        icon={UserPlus}
        badge={<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>}
        actions={
          <div className="flex gap-2">
            {showEnrollButton && (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={handleEnroll}>
                <GraduationCap className="mr-2 h-4 w-4" />Iniciar Matriculacion
              </Button>
            )}
            {showEnrollLink && (
              <Button variant="outline" onClick={() => router.push(getEnrollmentRoute(lead.enrollment_id))}>
                <GraduationCap className="mr-2 h-4 w-4" />Ver ficha matricula
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          </div>
        }
      />

      {/* Urgency alert */}
      {isInscripcion && timeSince < 48 && currentStatus === 'new' && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Preinscripcion sin atender — hace {timeSince}h</p>
            <p className="text-sm text-red-700 dark:text-red-300">Esta persona ha solicitado reservar plaza. Contactar en menos de 24h.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions — call/whatsapp/email */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Acciones de contacto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Phone */}
              {lead.phone && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-medium">Llamar: {lead.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      {hasActionablePhone ? (
                        <a href={`tel:${lead.phone}`} className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">Llamar</a>
                      ) : (
                        <Button size="sm" disabled>Llamar</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setShowContactModal({ channel: 'phone' })}>
                        Registrar resultado
                      </Button>
                    </div>
                  </div>
                  {hasPhonePlaceholder && (
                    <p className="text-xs text-amber-700">
                      Telefono no valido para llamada. Actualiza el numero real del lead.
                    </p>
                  )}
                </div>
              )}

              {/* WhatsApp */}
              {lead.phone && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span className="font-medium">WhatsApp</span>
                    </div>
                    <div className="flex gap-2">
                      {hasActionablePhone ? (
                        <a href={`https://wa.me/${lead.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                          target="_blank" rel="noopener"
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium">
                          Abrir WhatsApp
                        </a>
                      ) : (
                        <Button size="sm" disabled>Abrir WhatsApp</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setShowContactModal({ channel: 'whatsapp' })}>
                        Registrar resultado
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              {lead.email && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{lead.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <a href={`mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium">
                        Enviar email
                      </a>
                      <Button size="sm" variant="outline" onClick={() => setShowContactModal({ channel: 'email' })}>
                        Registrar resultado
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isInscripcion && !hasResolvedProgram && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Contexto de programa incompleto</p>
              <p className="mt-1 text-xs text-amber-800">
                No se pudo resolver automaticamente el programa desde convocatoria, URL o source details.
                Revisa los metadatos de origen del lead antes de continuar.
              </p>
            </div>
          )}

          {/* Interaction History */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Historial de contacto</CardTitle></CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
              ) : (
                <div className="space-y-3">
                  {interactions.map((i: any) => {
                    const actorName =
                      [i.user_first_name, i.user_last_name].filter(Boolean).join(' ').trim() ||
                      i.user_email ||
                      'Sistema'

                    return (
                    <div key={i.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3">
                      <div className="shrink-0 mt-0.5">
                        {i.channel === 'phone' && <Phone className="h-4 w-4 text-primary" />}
                        {i.channel === 'whatsapp' && <MessageSquare className="h-4 w-4 text-green-600" />}
                        {i.channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                        {i.channel === 'system' && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{actorName}</span>
                          <Badge variant="outline" className="text-[10px]">{RESULT_LABELS[i.result] ?? i.result}</Badge>
                        </div>
                        {i.note && <p className="text-muted-foreground mt-0.5">{i.note}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(i.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone script */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />Guion de llamada</CardTitle>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(phoneScript, 'script')}>
                  {copied === 'script' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied === 'script' ? 'Copiado' : 'Copiar guion'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-300 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Lead objetivo</p>
                    <p className="mt-1 text-lg font-black uppercase tracking-wide text-slate-900">{leadNameForOperator}</p>
                    <p className="mt-1 text-xs text-slate-600">Usa este nombre durante toda la llamada para mantener foco comercial.</p>
                  </div>

                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700">OPERADOR - APERTURA</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{openingLine}</p>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">OPERADOR - SI INTERESADO</p>
                  <ul className="mt-2 space-y-1 text-xs font-semibold text-emerald-900">
                    <li><span className="font-black uppercase">Programa:</span> {programName}</li>
                    <li><span className="font-black uppercase">Modalidad:</span> {programModality}</li>
                    <li><span className="font-black uppercase">Horario:</span> {scheduleText}</li>
                    <li><span className="font-black uppercase">Duracion:</span> {programSummary}</li>
                    <li><span className="font-black uppercase">Precio:</span> {programPrice}</li>
                  </ul>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{interestedLine}</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">OPERADOR - SI NO ES BUEN MOMENTO</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{callbackLine}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">OPERADOR - SI NO INTERESADO</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{notInterestedLine}</p>
                </div>

                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">ARBOL DE DECISION - APERTURA DE MATRICULA</p>
                  <div className="mt-2 space-y-2">
                    {LIVE_DECISION_STATUS_VALUES.map((value) => {
                      const opt = STATUS_OPTIONS.find((statusOption) => statusOption.value === value)
                      if (!opt) return null
                      return (
                      <div key={opt.value} className="rounded-lg border border-violet-200/80 bg-white/70 p-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-violet-800">{opt.label}</p>
                          <p className="text-xs text-slate-700">{DECISION_STATE_GUIDE[opt.value] || 'Registrar accion y siguiente paso.'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={currentStatus === opt.value ? 'default' : 'outline'}
                          disabled={saving}
                          onClick={() => void changeStatus(opt.value)}
                        >
                          {currentStatus === opt.value ? 'Estado actual' : 'Marcar'}
                        </Button>
                      </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Notas del asesor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.callback_notes && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-1">Notas anteriores:</p>
                  {lead.callback_notes}
                </div>
              )}
              <Textarea
                placeholder="Escribir nota sobre esta interaccion..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
              />
              <Button size="sm" disabled={saving || !noteText.trim()}
                onClick={() => {
                  void updateLead({ callback_notes: `${lead.callback_notes ? lead.callback_notes + '\n---\n' : ''}[${new Date().toLocaleDateString('es-ES')}] ${noteText}` })
                  setNoteText('')
                }}>
                Guardar nota
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Estado</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${currentStatus === opt.value ? opt.color + ' font-medium ring-1 ring-offset-1 ring-current' : 'hover:bg-muted'}`}
                  disabled={saving}
                  onClick={() => void changeStatus(opt.value)}>
                  <span className={`inline-block w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Lead info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Informacion</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lead.first_name && <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{lead.first_name} {lead.last_name}</span></div>}
              {lead.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium truncate max-w-[60%]">{lead.email}</span></div>}
              {lead.phone && <div className="flex justify-between"><span className="text-muted-foreground">Telefono</span><span className="font-medium">{lead.phone}</span></div>}
              <div className="border-t pt-2 mt-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><Badge variant={isInscripcion ? 'default' : 'secondary'} className="text-[10px]">{isInscripcion ? 'Inscripcion' : lead.lead_type || 'Lead'}</Badge></div>
              {lead.source_form && <div className="flex justify-between"><span className="text-muted-foreground">Formulario</span><span className="text-xs">{lead.source_form}</span></div>}
              {lead.createdAt && <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="text-xs">{new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
              {lead.campaign_code && <div className="flex justify-between"><span className="text-muted-foreground">Campaña</span><span className="font-mono text-xs">{lead.campaign_code}</span></div>}

              <div className="border-t pt-2 mt-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Asesor</span><span className="font-medium text-xs">{lead.assigned_to?.first_name || 'Sin asignar'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Interacciones</span><span className="font-medium">{interactions.length}</span></div>
              {interactions.length > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Ultimo contacto</span><span className="text-xs">{new Date(interactions[0].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
              )}

              {/* Next action */}
              {lead.next_action_date && (
                <>
                  <div className="border-t pt-2 mt-2" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Proxima accion</span><span className="text-xs">{new Date(lead.next_action_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></div>
                  {lead.next_action_note && <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{lead.next_action_note}</div>}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Origen de captacion</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formulario</span>
                <span className="text-xs font-medium">{sourceForm || 'No disponible'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo lead</span>
                <span className="text-xs font-medium">{originLeadType || 'No disponible'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Campaña</span>
                <span className="text-xs font-medium">{originCampaign || 'No disponible'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Meta campaign</span>
                <span className="text-xs font-medium">{originMetaCampaignId || 'No disponible'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UTM</span>
                <span className="text-xs font-medium">{[originUtmSource, originUtmMedium, originUtmCampaign].filter(Boolean).join(' / ') || 'No disponible'}</span>
              </div>
              <div className="border-t pt-2 mt-2" />
              <div>
                <p className="text-muted-foreground text-xs mb-1">URL origen</p>
                <p className="text-xs break-all font-medium">{sourcePage || 'No disponible'}</p>
              </div>
            </CardContent>
          </Card>

          {/* RGPD */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">RGPD</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <p>Consentimiento: {lead.gdpr_consent ? 'Si' : 'No'}</p>
              {lead.consent_timestamp && <p>Fecha: {new Date(lead.consent_timestamp).toLocaleDateString('es-ES')}</p>}
              {lead.gdpr_retention_until && <p>Retencion hasta: {new Date(lead.gdpr_retention_until).toLocaleDateString('es-ES')}</p>}
              {lead.source_page && <p className="break-all">Pagina: {lead.source_page}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Zona sensible</p>
            <p className="text-xs text-red-700/90">Eliminacion permanente de lead. Usar solo para registros invalidados.</p>
          </div>
          <Button
            variant="destructive"
            disabled={saving}
            onClick={() => void handleDeleteLead()}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar lead
          </Button>
        </CardContent>
      </Card>

      {/* Contact Result Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowContactModal(null)}>
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">Registrar resultado — {showContactModal.channel === 'phone' ? 'Llamada' : showContactModal.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {CONTACT_RESULTS.map(({ value, label, icon: Icon }) => (
                  <Button key={value} variant={contactResult === value ? 'default' : 'outline'} size="sm" className="justify-start"
                    onClick={() => setContactResult(value)}>
                    <Icon className="h-3 w-3 mr-1.5" />{label}
                  </Button>
                ))}
                {showContactModal.channel === 'whatsapp' && (
                  <Button variant={contactResult === 'message_sent' ? 'default' : 'outline'} size="sm" className="justify-start"
                    onClick={() => setContactResult('message_sent')}>
                    <MessageSquare className="h-3 w-3 mr-1.5" />Mensaje enviado
                  </Button>
                )}
                {showContactModal.channel === 'email' && (
                  <Button variant={contactResult === 'email_sent' ? 'default' : 'outline'} size="sm" className="justify-start"
                    onClick={() => setContactResult('email_sent')}>
                    <Mail className="h-3 w-3 mr-1.5" />Email enviado
                  </Button>
                )}
              </div>
              <Textarea placeholder="Nota opcional..." value={contactNote}
                onChange={e => setContactNote(e.target.value)} rows={2} />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => { setShowContactModal(null); setContactResult(''); setContactNote('') }}>Cancelar</Button>
                <Button disabled={!contactResult || saving} onClick={() => void registerInteraction()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
