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
  { value: 'new', label: 'Nuevo', color: 'bg-red-700 text-white border border-red-800', dot: 'bg-red-600' },
  { value: 'contacted', label: 'Contactado', color: 'bg-amber-700 text-white border border-amber-800', dot: 'bg-amber-500' },
  { value: 'following_up', label: 'En seguimiento', color: 'bg-amber-700 text-white border border-amber-800', dot: 'bg-amber-500' },
  { value: 'interested', label: 'Interesado', color: 'bg-emerald-700 text-white border border-emerald-800', dot: 'bg-emerald-500' },
  { value: 'enrolling', label: 'En matriculación', color: 'bg-blue-700 text-white border border-blue-800', dot: 'bg-blue-500' },
  { value: 'enrolled', label: 'Matriculado', color: 'bg-green-800 text-white border border-green-900', dot: 'bg-emerald-500' },
  { value: 'on_hold', label: 'En espera', color: 'bg-slate-700 text-white border border-slate-800', dot: 'bg-slate-500' },
  { value: 'not_interested', label: 'No interesado', color: 'bg-zinc-700 text-white border border-zinc-800', dot: 'bg-zinc-500' },
  { value: 'unreachable', label: 'No contactable', color: 'bg-zinc-700 text-white border border-zinc-800', dot: 'bg-zinc-500' },
  { value: 'discarded', label: 'Descartado', color: 'bg-zinc-800 text-white border border-zinc-900', dot: 'bg-zinc-500' },
]

const CONTACT_RESULTS = [
  { value: 'no_answer', label: 'Sin respuesta', icon: PhoneOff },
  { value: 'positive', label: 'Respondió positivo', icon: CheckCircle2 },
  { value: 'negative', label: 'Respondió negativo', icon: XCircle },
  { value: 'callback', label: 'Pide callback', icon: Clock },
  { value: 'wrong_number', label: 'Número incorrecto', icon: AlertCircle },
]

const RESULT_LABELS: Record<string, string> = {
  no_answer: 'Sin respuesta',
  positive: 'Respondió positivo',
  negative: 'Respondió negativo',
  callback: 'Pide callback',
  wrong_number: 'Número incorrecto',
  message_sent: 'Mensaje enviado',
  email_sent: 'Email enviado',
  enrollment_started: 'Matriculación iniciada',
  status_changed: 'Cambio de estado',
  note_added: 'Nota interna',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  hibrido: 'Semipresencial',
  online: 'Online',
}

const DECISION_STATE_GUIDE: Record<string, string> = {
  following_up: 'Solicita seguimiento. Agendar fecha y hora concreta.',
  enrolling: 'Inicio de matriculación. Confirmar documentación y reserva.',
  on_hold: 'Decisión pausada por el lead. Programar reactivación.',
  not_interested: 'No desea continuar. Cierre cordial y registro de motivo.',
}

const DECISION_ACTIONS = [
  {
    value: 'follow_up',
    label: 'Programar seguimiento',
    targetStatus: 'following_up',
    helper: DECISION_STATE_GUIDE.following_up,
  },
  {
    value: 'enroll',
    label: 'Matricular',
    targetStatus: 'enrolling',
    helper: DECISION_STATE_GUIDE.enrolling,
  },
  {
    value: 'on_hold',
    label: 'Poner en espera',
    targetStatus: 'on_hold',
    helper: DECISION_STATE_GUIDE.on_hold,
  },
  {
    value: 'not_interested',
    label: 'Marcar como no interesado',
    targetStatus: 'not_interested',
    helper: DECISION_STATE_GUIDE.not_interested,
  },
] as const

const FOLLOW_UP_REASONS = [
  'Confirmar interés y resolver dudas',
  'Pendiente de documentación',
  'Pendiente de decisión económica',
  'Pendiente de validación de requisitos',
  'Recontacto solicitado por el lead',
] as const

const PAUSE_REASONS = [
  'Esperando decisión',
  'Esperando financiación/beca',
  'Esperando documentación',
  'Esperando respuesta familiar/laboral',
  'Comparando centros',
  'Otro',
] as const

const DISINTEREST_REASONS = [
  'Precio',
  'Horario',
  'Ubicación',
  'Ya se matriculó en otro centro',
  'No responde más',
  'Solo pidió información',
  'Otro',
] as const

const INTERACTION_RESULT_OPTIONS = [
  { value: 'positive', label: 'Interacción positiva' },
  { value: 'callback', label: 'Solicita callback' },
  { value: 'no_answer', label: 'Sin respuesta' },
  { value: 'negative', label: 'Responde negativo' },
] as const

const CHANNEL_OPTIONS = [
  { value: 'phone', label: 'Llamada' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
] as const

const CONTACT_TIME_OPTIONS = [
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noche' },
  { value: 'anytime', label: 'Cualquier franja' },
] as const

type DecisionAction = (typeof DECISION_ACTIONS)[number]['value']

type DecisionFormState = {
  interactionResult: string
  followUpReason: string
  nextContactAt: string
  timeSlot: string
  channel: string
  note: string
  pauseReason: string
  reactivationAt: string
  pauseNote: string
  disinterestReason: string
  disinterestNote: string
  excludeManualFollowUp: boolean
}

const DECISION_FORM_DEFAULTS: DecisionFormState = {
  interactionResult: 'positive',
  followUpReason: '',
  nextContactAt: '',
  timeSlot: 'anytime',
  channel: 'phone',
  note: '',
  pauseReason: '',
  reactivationAt: '',
  pauseNote: '',
  disinterestReason: '',
  disinterestNote: '',
  excludeManualFollowUp: false,
}

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

function extractConvocatoriaCodeFromPath(pathLike: string): string | null {
  const match = pathLike.match(/\/(?:p\/)?convocatorias\/([^/?#]+)/i)
  return match?.[1] || null
}

function formatElapsedTimeLabel(dateIso: string | null): string {
  if (!dateIso) return 'hace unos minutos'
  const diffMs = Date.now() - new Date(dateIso).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'hace unos minutos'

  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (totalMinutes < 60) return `hace ${totalMinutes}m`

  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) return `hace ${totalHours}h`

  const days = Math.floor(totalHours / 24)
  return `hace ${days}d`
}

function toDateTimeLocalValue(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num: number) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatInteractionTimestamp(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return 'Fecha no disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isInternalAdvisorNote(interaction: any): boolean {
  if (!interaction || typeof interaction !== 'object') return false
  if (interaction.result === 'note_added') return true
  const note = typeof interaction.note === 'string' ? interaction.note.trim() : ''
  if (!note) return false
  return interaction.channel !== 'system'
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
  const [, setLiveClockTick] = React.useState<number>(() => Date.now())
  const [decisionAction, setDecisionAction] = React.useState<DecisionAction | null>(null)
  const [decisionForm, setDecisionForm] = React.useState({ ...DECISION_FORM_DEFAULTS })
  const [decisionError, setDecisionError] = React.useState<string | null>(null)

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

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveClockTick(Date.now())
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const getEnrollmentRoute = (enrollmentId: string | number) => `/matriculas/${enrollmentId}`

  const resetDecision = React.useCallback(() => {
    setDecisionAction(null)
    setDecisionError(null)
    setDecisionForm({ ...DECISION_FORM_DEFAULTS })
  }, [])

  const openDecision = React.useCallback((action: DecisionAction) => {
    setDecisionAction(action)
    setDecisionError(null)
    setDecisionForm((current) => ({
      ...DECISION_FORM_DEFAULTS,
      interactionResult: current.interactionResult || DECISION_FORM_DEFAULTS.interactionResult,
      nextContactAt: toDateTimeLocalValue(lead?.next_action_date),
      channel: current.channel || DECISION_FORM_DEFAULTS.channel,
      timeSlot: current.timeSlot || DECISION_FORM_DEFAULTS.timeSlot,
    }))
  }, [lead?.next_action_date])

  const getStatusLabel = React.useCallback((status: string | null | undefined) => {
    if (!status) return 'sin estado'
    return STATUS_OPTIONS.find((option) => option.value === status)?.label || status
  }, [])

  const changeStatus = async (newStatus: string) => {
    if (newStatus === 'following_up') {
      openDecision('follow_up')
      return
    }
    if (newStatus === 'on_hold') {
      openDecision('on_hold')
      return
    }
    if (newStatus === 'not_interested') {
      openDecision('not_interested')
      return
    }
    if (newStatus === 'enrolling') {
      openDecision('enroll')
      return
    }

    const currentStatus = localStatus ?? lead.status
    if (newStatus === currentStatus) return
    setLocalStatus(newStatus)
    setSaving(true)
    try {
      const statusRes = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          status_change_note: `Estado actualizado: ${currentStatus ?? 'sin estado'} -> ${newStatus}`,
        }),
      })
      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({} as Record<string, unknown>))
        throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo cambiar el estado')
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

  const registerAdvisorNote = async () => {
    const cleanNote = noteText.trim()
    if (!cleanNote) return

    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'system',
          result: 'note_added',
          note: cleanNote,
        }),
      })
      if (!res.ok) {
        throw new Error('No se pudo guardar la nota del asesor')
      }
      setNoteText('')
      await loadLead()
      await loadInteractions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la nota del asesor'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleEnroll = async (options?: { skipConfirm?: boolean }) => {
  if (!options?.skipConfirm && !confirm('¿Iniciar proceso de matriculación para este lead?')) return false
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
        return true
      }

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo iniciar la matriculación')
      }
      throw new Error('No se pudo obtener la ficha de matrícula')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la matriculación'
      alert(message)
      return false
    }
    finally { setSaving(false) }
  }

  const submitDecisionAction = async () => {
    if (!decisionAction) return
    const action = DECISION_ACTIONS.find((entry) => entry.value === decisionAction)
    if (!action) return

    const previousStatus = localStatus ?? lead?.status ?? 'new'
    const nextStatus = action.targetStatus
    const currentSourceDetails = parseJsonRecord(lead?.source_details)
    const sourceDetailsPayload: Record<string, unknown> = {
      ...currentSourceDetails,
      crm_decision: {
        action: decisionAction,
        from_status: previousStatus,
        to_status: nextStatus,
        executed_at: new Date().toISOString(),
      },
    }

    const baseStatusNote = `Árbol CRM: ${action.label}. Estado: ${getStatusLabel(previousStatus)} -> ${getStatusLabel(nextStatus)}.`
    const patchPayload: Record<string, unknown> = {
      status: nextStatus,
      source_details: sourceDetailsPayload,
    }

    if (decisionAction === 'follow_up') {
      if (!decisionForm.interactionResult) {
        setDecisionError('Debes indicar el resultado de la interacción.')
        return
      }
      if (!decisionForm.followUpReason.trim()) {
        setDecisionError('Debes seleccionar el motivo del seguimiento.')
        return
      }
      if (!decisionForm.nextContactAt) {
        setDecisionError('Debes indicar la próxima fecha de contacto.')
        return
      }
      if (!decisionForm.note.trim()) {
        setDecisionError('Debes registrar una nota del asesor para continuar.')
        return
      }

      const nextContactDate = new Date(decisionForm.nextContactAt)
      if (Number.isNaN(nextContactDate.getTime())) {
        setDecisionError('La fecha de próximo contacto no es válida.')
        return
      }

      const nextActionNote = [
        `Seguimiento programado: ${decisionForm.followUpReason}.`,
        `Canal: ${CHANNEL_OPTIONS.find((option) => option.value === decisionForm.channel)?.label || decisionForm.channel}.`,
        `Franja: ${CONTACT_TIME_OPTIONS.find((option) => option.value === decisionForm.timeSlot)?.label || decisionForm.timeSlot}.`,
        `Nota asesor: ${decisionForm.note.trim()}.`,
      ].join(' ')

      patchPayload.next_action_date = nextContactDate.toISOString()
      patchPayload.next_action_note = nextActionNote
      patchPayload.next_callback_date = nextContactDate.toISOString()
      patchPayload.last_contact_result = decisionForm.interactionResult
      patchPayload.preferred_contact_method = decisionForm.channel
      patchPayload.preferred_contact_time = decisionForm.timeSlot
      patchPayload.status_change_note = `${baseStatusNote} Motivo seguimiento: ${decisionForm.followUpReason}. Próximo contacto: ${nextContactDate.toLocaleString('es-ES')} (${decisionForm.timeSlot}).`
      sourceDetailsPayload.follow_up_reason = decisionForm.followUpReason
      sourceDetailsPayload.follow_up_channel = decisionForm.channel
      sourceDetailsPayload.follow_up_time_slot = decisionForm.timeSlot
      sourceDetailsPayload.next_contact_at = nextContactDate.toISOString()
      sourceDetailsPayload.follow_up_note = decisionForm.note.trim()
    }

    if (decisionAction === 'on_hold') {
      if (!decisionForm.pauseReason.trim()) {
        setDecisionError('Debes indicar la causa de espera.')
        return
      }

      let reactivationDateIso: string | null = null
      if (decisionForm.reactivationAt) {
        const reactivationDate = new Date(decisionForm.reactivationAt)
        if (Number.isNaN(reactivationDate.getTime())) {
          setDecisionError('La fecha de reactivación no es válida.')
          return
        }
        reactivationDateIso = reactivationDate.toISOString()
      }

      patchPayload.next_action_date = reactivationDateIso
      patchPayload.next_action_note = `Lead en espera. Motivo: ${decisionForm.pauseReason}.${decisionForm.pauseNote.trim() ? ` Nota: ${decisionForm.pauseNote.trim()}.` : ''}`
      patchPayload.status_change_note = `${baseStatusNote} Causa de espera: ${decisionForm.pauseReason}.${reactivationDateIso ? ` Reactivación prevista: ${new Date(reactivationDateIso).toLocaleString('es-ES')}.` : ''}`
      sourceDetailsPayload.pause_reason = decisionForm.pauseReason
      sourceDetailsPayload.pause_note = decisionForm.pauseNote.trim() || null
      sourceDetailsPayload.reactivation_at = reactivationDateIso
    }

    if (decisionAction === 'not_interested') {
      if (!decisionForm.disinterestReason.trim()) {
        setDecisionError('Debes indicar el motivo de no interés.')
        return
      }

      patchPayload.next_action_date = null
      patchPayload.next_action_note = `Cierre comercial: ${decisionForm.disinterestReason}.${decisionForm.disinterestNote.trim() ? ` Nota: ${decisionForm.disinterestNote.trim()}.` : ''}`
      patchPayload.status_change_note = `${baseStatusNote} Motivo de cierre: ${decisionForm.disinterestReason}. Conservado para segmentación comercial según RGPD.`
      sourceDetailsPayload.disinterest_reason = decisionForm.disinterestReason
      sourceDetailsPayload.disinterest_note = decisionForm.disinterestNote.trim() || null
      sourceDetailsPayload.exclude_manual_follow_up = decisionForm.excludeManualFollowUp
    }

    if (decisionAction === 'enroll') {
      const leadProgramData = lead?.lead_program && typeof lead.lead_program === 'object' ? lead.lead_program : null
      const missingChecklist: string[] = []
      if (!lead?.email) missingChecklist.push('Email del lead')
      if (!isActionableSpanishPhone(lead?.phone)) missingChecklist.push('Teléfono válido (+34 XXX XXX XXX)')
      if (
        !leadProgramData ||
        !(
          (typeof leadProgramData?.name === 'string' && leadProgramData.name.trim().length > 0) ||
          (typeof leadProgramData?.course_name === 'string' && leadProgramData.course_name.trim().length > 0)
        )
      ) {
        missingChecklist.push('Curso/ciclo de origen resuelto')
      }

      if (missingChecklist.length > 0) {
        setDecisionError(`Faltan datos para matricular: ${missingChecklist.join(', ')}.`)
        return
      }

      patchPayload.next_action_date = null
      patchPayload.next_action_note = 'Lead movido a matriculación desde árbol de decisión CRM.'
      patchPayload.status_change_note = `${baseStatusNote} Operación: Matricular con traspaso al flujo de matrícula.`
      sourceDetailsPayload.converted_to_enrollment_at = new Date().toISOString()
    }

    setSaving(true)
    setDecisionError(null)
    try {
      const patchRes = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      })
      if (!patchRes.ok) {
        const payload = await patchRes.json().catch(() => ({} as Record<string, unknown>))
        throw new Error(typeof payload.error === 'string' ? payload.error : 'No se pudo registrar la acción')
      }

      if (decisionAction === 'enroll') {
        const enrollmentStarted = await handleEnroll({ skipConfirm: true })
        if (!enrollmentStarted) {
          throw new Error('No se pudo abrir la matriculación')
        }
      }

      await loadLead()
      await loadInteractions()
      resetDecision()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo ejecutar la acción'
      setDecisionError(message)
    } finally {
      setSaving(false)
    }
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
  const createdAtDate = lead.createdAt ? new Date(lead.createdAt) : null
  const timeSince = createdAtDate ? Math.round((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60)) : 0
  const timeSinceLabel = formatElapsedTimeLabel(lead.createdAt || null)
  const createdAtExact = createdAtDate
    ? createdAtDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null
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
    '1 día presencial por semana'
  const programPrice = formatEuro(leadProgram?.price)
  const financingText = leadProgram?.financial_aid_available
    ? 'Disponemos de financiación flexible para facilitar su matriculación.'
    : 'Le explico opciones de pago y posibles ayudas al cerrar la matriculación.'
  const programSummaryParts = [
    `${programModality}`,
    totalHours ? `${totalHours} horas` : null,
    practiceHours ? `${practiceHours} horas de prácticas en empresa` : null,
  ].filter(Boolean)
  const programSummary = programSummaryParts.join(', ') || 'Plan formativo a confirmar'
  const hasActionablePhone = isActionableSpanishPhone(lead.phone)
  const hasPhonePlaceholder = Boolean(lead.phone) && !hasActionablePhone
  const sourceConvocatoriaCode =
    (typeof leadProgram?.convocatoria_codigo === 'string' && leadProgram.convocatoria_codigo.trim()) ||
    (sourcePage ? extractConvocatoriaCodeFromPath(sourcePage) : null)
  const programContextLabel =
    sourceConvocatoriaCode
      ? `${programName} - Convocatoria ${sourceConvocatoriaCode}`
      : programName
  const sourcePageHref = sourcePage && sourcePage.trim().length > 0 ? sourcePage : null
  const sourcePageIsExternal = sourcePageHref ? /^https?:\/\//i.test(sourcePageHref) : false
  const latestInteraction = interactions.length > 0 ? interactions[0] : null
  const latestInteractionActor =
    latestInteraction
      ? [latestInteraction.user_first_name, latestInteraction.user_last_name].filter(Boolean).join(' ').trim() ||
        latestInteraction.user_email ||
        'Sistema'
      : 'Sin gestión'
  const advisorNotes = interactions.filter((interaction) => isInternalAdvisorNote(interaction))
  const responsibleName =
    [lead.assigned_to?.first_name, lead.assigned_to?.last_name].filter(Boolean).join(' ').trim() || 'Sin asignar'
  const nextActionDate = lead.next_action_date ? new Date(lead.next_action_date) : null
  const nextActionDateLabel = nextActionDate && !Number.isNaN(nextActionDate.getTime())
    ? nextActionDate.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null
  const nextActionChannelLabel = CHANNEL_OPTIONS.find((option) => option.value === lead.preferred_contact_method)?.label || null
  const nextActionTimeSlotLabel = CONTACT_TIME_OPTIONS.find((option) => option.value === lead.preferred_contact_time)?.label || null

  // Pre-built messages
  const openingLine = `Buenos días${lead.first_name ? `, ${lead.first_name}` : ''}. Le llamo de CEP Formación. Hemos recibido su solicitud de información${isInscripcion ? ' y preinscripción' : ''} sobre nuestro ciclo formativo. ¿Es buen momento para hablar?`
  const interestedLine = `Perfecto${lead.first_name ? `, ${lead.first_name}` : ''}. Le detallo su programa: ${programName}. Modalidad: ${programModality}. Horario: ${scheduleText}. Duración: ${programSummary}. Precio orientativo: ${programPrice}. ${financingText} Si le parece bien, avanzamos ahora mismo con la apertura de matriculación y le envío confirmación por WhatsApp o email.`
  const callbackLine = 'Entiendo perfectamente. ¿Qué día y franja horaria le viene mejor para llamarle de nuevo? Lo dejo agendado ahora mismo.'
  const notInterestedLine = 'De acuerdo, sin problema. Si en algún momento necesita información, puede contactarnos. Gracias por su tiempo.'
  const phoneScript = `OPERADOR - APERTURA
${openingLine}

1) SI INTERESADO
${interestedLine}

2) SI NO ES BUEN MOMENTO
${callbackLine}

3) SI NO INTERESADO
${notInterestedLine}

ACCIONES CRM
1) PROGRAMAR SEGUIMIENTO -> callback agendado
2) MATRICULAR -> iniciar matrícula
3) PONER EN ESPERA -> decisión pausada temporalmente
4) MARCAR COMO NO INTERESADO -> cierre comercial`

  const whatsappMessage = `Hola${lead.first_name ? ` ${lead.first_name}` : ''}!

Soy del equipo de CEP Formación. Hemos recibido tu ${isInscripcion ? 'solicitud de preinscripción' : 'interés'} en nuestro ciclo formativo.

Te escribo para resolver cualquier duda que tengas sobre:
- El programa y los modulos
- Las fechas de inicio y horarios
- Opciones de financiación y matrícula
- Las prácticas en empresa

¿Te viene bien que hablemos o prefieres que te enviemos la información por aquí?`

const emailSubject = `Información sobre tu ${isInscripcion ? 'preinscripción' : 'solicitud'} en CEP Formación`
const emailBody = `Hola${lead.first_name ? ` ${lead.first_name}` : ''},

Gracias por tu interés en CEP Formación. Hemos recibido tu ${isInscripcion ? 'solicitud de preinscripción' : 'solicitud de información'}.

Quedamos a tu disposición para resolver cualquier duda sobre el programa, los horarios, las opciones de financiación o el proceso de matrícula.

Puedes contactarnos por teléfono, WhatsApp o respondiendo a este email.

Un saludo,
Equipo CEP Formación`

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={`${isInscripcion ? 'Preinscripción' : 'Lead'} · ${lead.email || ''}`}
        icon={UserPlus}
        badge={<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>}
        actions={
          <div className="flex gap-2">
            {showEnrollButton && (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={() => openDecision('enroll')}>
                <GraduationCap className="mr-2 h-4 w-4" />Matricular
              </Button>
            )}
            {showEnrollLink && (
              <Button variant="outline" onClick={() => router.push(getEnrollmentRoute(lead.enrollment_id))}>
                <GraduationCap className="mr-2 h-4 w-4" />Ver ficha matrícula
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          </div>
        }
      />

      {/* Urgency alert */}
      {isInscripcion && timeSince < 48 && currentStatus === 'new' && (
        <div className="rounded-lg border border-red-900 bg-red-700 p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">
                Preinscripción sin atender — {timeSinceLabel}
                {createdAtExact ? ` — registrado a las ${createdAtExact}` : ''}
              </p>
              <p className="text-sm text-red-50">Esta persona ha solicitado reservar plaza. Contactar en menos de 24h.</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-white hover:bg-red-100 text-red-800"
            disabled={saving}
            onClick={() => void changeStatus('contacted')}
          >
            Marcar como atendido
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program context */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Curso/Ciclo de origen</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{programContextLabel}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {sourceForm && <Badge variant="outline">{sourceForm}</Badge>}
                {sourceConvocatoriaCode && <Badge variant="outline">Código: {sourceConvocatoriaCode}</Badge>}
                {originCampaign && <Badge variant="outline">Campaña: {originCampaign}</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen operativo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Última gestión</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {latestInteraction
                    ? `${latestInteractionActor} · ${formatInteractionTimestamp(latestInteraction.created_at)}`
                    : 'Sin interacciones registradas'}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Próxima acción</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {nextActionDateLabel
                    ? `${nextActionDateLabel}${nextActionChannelLabel ? ` · ${nextActionChannelLabel}` : ''}`
                    : 'Sin acción programada'}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsable</p>
                <p className="mt-1 text-sm font-medium text-foreground">{responsibleName}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Curso / Convocatoria</p>
                <p className="mt-1 text-sm font-medium text-foreground">{programContextLabel}</p>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('historial-contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Ver historial completo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions — call/whatsapp/email */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Acciones de contacto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">Proximo contacto</p>
                <p className="text-muted-foreground mt-1">
                  {nextActionDateLabel
                    ? `${nextActionDateLabel}${nextActionChannelLabel ? ` · ${nextActionChannelLabel}` : ''}${nextActionTimeSlotLabel ? ` · ${nextActionTimeSlotLabel}` : ''}`
                    : 'Sin acción programada. Usa el árbol de decisión para crear la siguiente tarea.'}
                </p>
              </div>

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
                      Teléfono no válido para llamada. Actualiza el número real del lead.
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

          {/* Phone script */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />Playbook comercial (Guion + árbol de decisión)</CardTitle>
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

                <div className="ml-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">1. SI INTERESADO</p>
                  <ul className="mt-2 space-y-1 text-xs font-semibold text-emerald-900">
                    <li><span className="font-black uppercase">Programa:</span> {programName}</li>
                    <li><span className="font-black uppercase">Modalidad:</span> {programModality}</li>
                    <li><span className="font-black uppercase">Horario:</span> {scheduleText}</li>
                    <li><span className="font-black uppercase">Duración:</span> {programSummary}</li>
                    <li><span className="font-black uppercase">Precio:</span> {programPrice}</li>
                  </ul>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{interestedLine}</p>
                </div>

                <div className="ml-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">2. SI NO ES BUEN MOMENTO</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{callbackLine}</p>
                </div>

                <div className="ml-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">3. SI NO INTERESADO</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{notInterestedLine}</p>
                </div>

                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">ÁRBOL DE DECISIÓN - ACCIONES CRM</p>
                  <div className="mt-2 space-y-2">
                    {DECISION_ACTIONS.map((action, index) => (
                      <div key={action.value} className="rounded-lg border border-violet-200/80 bg-white/70 p-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-violet-800">{index + 1}. {action.label}</p>
                          <p className="text-xs text-slate-700">{action.helper}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={currentStatus === action.targetStatus ? 'default' : 'outline'}
                          disabled={saving}
                          onClick={() => openDecision(action.value)}
                        >
                          {currentStatus === action.targetStatus ? 'Estado actual' : 'Ejecutar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notas del asesor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                <span className="font-medium text-muted-foreground">Bitacora comercial</span>
                <Badge variant="outline">{advisorNotes.length} nota{advisorNotes.length === 1 ? '' : 's'}</Badge>
              </div>

              {advisorNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay notas internas registradas.</p>
              ) : (
                <div className="space-y-2">
                  {advisorNotes.map((noteEvent: any) => {
                    const noteAuthor =
                      [noteEvent.user_first_name, noteEvent.user_last_name].filter(Boolean).join(' ').trim() ||
                      noteEvent.user_email ||
                      'Sistema'
                    return (
                      <div key={`note-${noteEvent.id}`} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">{noteAuthor}</span>
                          <span className="text-xs text-muted-foreground">{formatInteractionTimestamp(noteEvent.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">{noteEvent.note}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              <Textarea
                placeholder="Escribe la nota interna de esta gestión comercial..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
              />
              <Button size="sm" disabled={saving || !noteText.trim()}
                onClick={() => { void registerAdvisorNote() }}>
                Guardar nota
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Gestión comercial</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Última gestión</span>
                <span className="text-xs text-right">
                  {latestInteraction
                    ? `${latestInteractionActor} · ${new Date(latestInteraction.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                    : 'Sin interacciones'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Próxima acción</span>
                <span className="text-xs text-right">{lead.next_action_note || 'Sin acción planificada'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Fecha próximo contacto</span>
                <span className="text-xs text-right">{nextActionDateLabel || 'No definida'}</span>
              </div>
              {(nextActionChannelLabel || nextActionTimeSlotLabel) && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Canal recomendado</span>
                  <span className="text-xs text-right">
                    {[nextActionChannelLabel, nextActionTimeSlotLabel].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Responsable</span>
                <span className="text-xs text-right">{responsibleName}</span>
              </div>
            </CardContent>
          </Card>

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
            <CardHeader className="pb-3"><CardTitle className="text-base">Información</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lead.first_name && <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{lead.first_name} {lead.last_name}</span></div>}
              {lead.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium truncate max-w-[60%]">{lead.email}</span></div>}
              {lead.phone && <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span className="font-medium">{lead.phone}</span></div>}
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Curso/Ciclo</span>
                <span className="text-xs font-medium text-right">{programContextLabel}</span>
              </div>
              <div className="border-t pt-2 mt-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><Badge variant={isInscripcion ? 'default' : 'secondary'} className="text-[10px]">{isInscripcion ? 'Inscripción' : lead.lead_type || 'Lead'}</Badge></div>
              {sourceForm && <div className="flex justify-between"><span className="text-muted-foreground">Formulario</span><span className="text-xs">{sourceForm}</span></div>}
              {lead.createdAt && <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="text-xs">{new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
              {originCampaign && <div className="flex justify-between"><span className="text-muted-foreground">Campaña</span><span className="font-mono text-xs">{originCampaign}</span></div>}

              <div className="border-t pt-2 mt-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Asesor</span><span className="font-medium text-xs">{responsibleName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Interacciones</span><span className="font-medium">{interactions.length}</span></div>
              {interactions.length > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Último contacto</span><span className="text-xs">{new Date(interactions[0].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
              )}

              {/* Next action */}
              {lead.next_action_date && (
                <>
                  <div className="border-t pt-2 mt-2" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Próxima acción</span><span className="text-xs">{new Date(lead.next_action_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></div>
                  {lead.next_action_note && <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{lead.next_action_note}</div>}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Origen de captación</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sourceForm && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formulario</span>
                  <span className="text-xs font-medium">{sourceForm}</span>
                </div>
              )}
              {originLeadType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo lead</span>
                  <span className="text-xs font-medium">{originLeadType}</span>
                </div>
              )}
              {originCampaign && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaña</span>
                  <span className="text-xs font-medium">{originCampaign}</span>
                </div>
              )}
              {originMetaCampaignId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta campaign</span>
                  <span className="text-xs font-medium">{originMetaCampaignId}</span>
                </div>
              )}
              {[originUtmSource, originUtmMedium, originUtmCampaign].filter(Boolean).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UTM</span>
                  <span className="text-xs font-medium">{[originUtmSource, originUtmMedium, originUtmCampaign].filter(Boolean).join(' / ')}</span>
                </div>
              )}
              {(sourceConvocatoriaCode || hasResolvedProgram) && (
                <div className="border-t pt-2 mt-2 space-y-1">
                  <p className="text-muted-foreground text-xs">Convocatoria resuelta</p>
                  {sourcePageHref ? (
                    <a
                      href={sourcePageHref}
                      target={sourcePageIsExternal ? '_blank' : undefined}
                      rel={sourcePageIsExternal ? 'noopener noreferrer' : undefined}
                      className="text-xs font-medium text-blue-700 hover:underline break-words"
                    >
                      {programContextLabel}
                    </a>
                  ) : (
                    <p className="text-xs font-medium break-words">{programContextLabel}</p>
                  )}
                </div>
              )}
              <div className="border-t pt-2 mt-2" />
              <div>
                <p className="text-muted-foreground text-xs mb-1">URL origen</p>
                {sourcePageHref ? (
                  <a
                    href={sourcePageHref}
                    target={sourcePageIsExternal ? '_blank' : undefined}
                    rel={sourcePageIsExternal ? 'noopener noreferrer' : undefined}
                    className="text-xs break-all font-medium text-blue-700 hover:underline"
                  >
                    {sourcePageHref}
                  </a>
                ) : (
                  <p className="text-xs break-all font-medium">No disponible</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RGPD */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">RGPD</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <p>Consentimiento: {lead.gdpr_consent ? 'Si' : 'No'}</p>
              {lead.consent_timestamp && <p>Fecha: {new Date(lead.consent_timestamp).toLocaleDateString('es-ES')}</p>}
              {lead.gdpr_retention_until && <p>Retención hasta: {new Date(lead.gdpr_retention_until).toLocaleDateString('es-ES')}</p>}
              {lead.source_page && <p className="break-all">Página: {lead.source_page}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Zona sensible</p>
            <p className="text-xs text-red-700/90">Eliminación permanente de lead. Usar solo para registros invalidados.</p>
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

      <Card id="historial-contacto">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historial de contacto y auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin interacciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction: any) => {
                const actorName =
                  [interaction.user_first_name, interaction.user_last_name].filter(Boolean).join(' ').trim() ||
                  interaction.user_email ||
                  'Sistema'

                const eventLabel = RESULT_LABELS[interaction.result] ?? interaction.result
                const eventTone =
                  interaction.result === 'note_added'
                    ? 'border-l-blue-400'
                    : interaction.channel === 'phone'
                      ? 'border-l-amber-500'
                      : interaction.channel === 'whatsapp'
                        ? 'border-l-green-500'
                        : interaction.channel === 'email'
                          ? 'border-l-sky-500'
                          : 'border-l-slate-400'

                return (
                  <div key={interaction.id} className={`rounded-md border border-l-4 p-3 ${eventTone}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{actorName}</span>
                        <Badge variant="outline" className="text-[10px]">{eventLabel}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatInteractionTimestamp(interaction.created_at)}</span>
                    </div>
                    {interaction.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{interaction.note}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Action Modal */}
      {decisionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={resetDecision}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(event) => event.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">
                {DECISION_ACTIONS.find((action) => action.value === decisionAction)?.label || 'Acción CRM'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {DECISION_ACTIONS.find((action) => action.value === decisionAction)?.helper}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {decisionError && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                  {decisionError}
                </div>
              )}

              {decisionAction === 'follow_up' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Resultado de la interacción *</span>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={decisionForm.interactionResult}
                        onChange={(event) => setDecisionForm((current) => ({ ...current, interactionResult: event.target.value }))}
                      >
                        {INTERACTION_RESULT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Motivo de seguimiento *</span>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={decisionForm.followUpReason}
                        onChange={(event) => setDecisionForm((current) => ({ ...current, followUpReason: event.target.value }))}
                      >
                        <option value="">Selecciona un motivo</option>
                        {FOLLOW_UP_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Próxima fecha de contacto *</span>
                      <input
                        type="datetime-local"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={decisionForm.nextContactAt}
                        onChange={(event) => setDecisionForm((current) => ({ ...current, nextContactAt: event.target.value }))}
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Franja recomendada *</span>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={decisionForm.timeSlot}
                        onChange={(event) => setDecisionForm((current) => ({ ...current, timeSlot: event.target.value }))}
                      >
                        {CONTACT_TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Canal preferido *</span>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={decisionForm.channel}
                        onChange={(event) => setDecisionForm((current) => ({ ...current, channel: event.target.value }))}
                      >
                        {CHANNEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="space-y-1 text-sm block">
                    <span className="font-medium">Nota del asesor *</span>
                    <Textarea
                      placeholder="Contexto de la gestión, objeciones detectadas y siguiente argumento comercial..."
                      value={decisionForm.note}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, note: event.target.value }))}
                      rows={4}
                    />
                  </label>
                </div>
              )}

              {decisionAction === 'on_hold' && (
                <div className="space-y-4">
                  <label className="space-y-1 text-sm block">
                    <span className="font-medium">Causa de espera *</span>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={decisionForm.pauseReason}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, pauseReason: event.target.value }))}
                    >
                      <option value="">Selecciona la causa</option>
                      {PAUSE_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm block">
                    <span className="font-medium">Fecha de reactivacion (opcional)</span>
                    <input
                      type="datetime-local"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={decisionForm.reactivationAt}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, reactivationAt: event.target.value }))}
                    />
                  </label>

                  <label className="space-y-1 text-sm block">
                    <span className="font-medium">Nota de espera</span>
                    <Textarea
                      placeholder="Detalla el contexto para reactivar el lead con mensaje correcto..."
                      value={decisionForm.pauseNote}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, pauseNote: event.target.value }))}
                      rows={3}
                    />
                  </label>
                </div>
              )}

              {decisionAction === 'not_interested' && (
                <div className="space-y-4">
                  <label className="space-y-1 text-sm block">
                    <span className="font-medium">Motivo de no interés *</span>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={decisionForm.disinterestReason}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, disinterestReason: event.target.value }))}
                    >
                      <option value="">Selecciona el motivo</option>
                      {DISINTEREST_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm block">
                    <span className="font-medium">Nota de cierre</span>
                    <Textarea
                      placeholder="Especifica objecion principal y condiciones para recuperarlo en futuras campañas..."
                      value={decisionForm.disinterestNote}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, disinterestNote: event.target.value }))}
                      rows={3}
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={decisionForm.excludeManualFollowUp}
                      onChange={(event) => setDecisionForm((current) => ({ ...current, excludeManualFollowUp: event.target.checked }))}
                    />
                    Excluir de seguimiento comercial manual (mantener para segmentacion automatica)
                  </label>
                </div>
              )}

              {decisionAction === 'enroll' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Se cambiará el estado a <strong>En matriculación</strong> y se abrirá la ficha de matrícula con datos precargados.
                  </p>
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-sm font-medium">Checklist previo</p>
                    <ul className="space-y-1 text-sm">
                      <li className={lead?.email ? 'text-emerald-700' : 'text-red-700'}>
                        {lead?.email ? '✓' : '✗'} Email disponible
                      </li>
                      <li className={hasActionablePhone ? 'text-emerald-700' : 'text-red-700'}>
                        {hasActionablePhone ? '✓' : '✗'} Teléfono válido para contacto
                      </li>
                      <li className={hasResolvedProgram ? 'text-emerald-700' : 'text-red-700'}>
                        {hasResolvedProgram ? '✓' : '✗'} Curso/ciclo de origen resuelto
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={resetDecision} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={() => void submitDecisionAction()} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmar acción
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
