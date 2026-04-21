'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@payload-config/components/ui/sheet'
import { Avatar, AvatarFallback } from '@payload-config/components/ui/avatar'
import {
  Users,
  Search,
  Loader2,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  MessageSquare,
  UserSearch,
  ArrowUpRight,
  Filter,
  NotebookPen,
  UserCheck,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lead {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  type?: string | null
  lead_type?: string | null
  status?: string | null
  source?: string | null
  createdAt?: string | null
  created_at?: string | null
  lastInteractor?: { name: string; channel: string; at: string } | null
  interactionCount?: number
  source_form?: string | null
  source_page?: string | null
  campaign_code?: string | null
  utm_campaign?: string | null
  callback_notes?: string | null
  source_details?: Record<string, unknown> | null
  next_action_date?: string | null
  enrollment_id?: number | null
  gdpr_consent?: boolean | null
  is_test?: boolean | null
}

interface DashboardKPIs {
  totalLeads: number
  unattended: number
  conversionRate: number
  avgResponseHours: number
  openEnrollments: number
  followUpBreakdown: Record<string, number>
}

type QueueFilter =
  | 'all'
  | 'overdue_followups'
  | 'reactivate_today'
  | 'moved_to_enrollment'
  | 'recoverable_not_interested'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new: {
    label: 'Nuevo',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  contacted: {
    label: 'Contactado',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
  },
  following_up: {
    label: 'En seguimiento',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
  },
  interested: {
    label: 'Interesado',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  },
  on_hold: {
    label: 'En espera',
    dot: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-700 border border-gray-300',
  },
  enrolling: {
    label: 'En matriculacion',
    dot: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-800 border border-teal-300',
  },
  enrolled: {
    label: 'Matriculado',
    dot: 'bg-green-600',
    badge: 'bg-green-100 text-green-900 border border-green-400',
  },
  not_interested: {
    label: 'No interesado (recuperable)',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 border border-rose-300',
  },
  discarded: {
    label: 'Descartado (definitivo)',
    dot: 'bg-rose-700',
    badge: 'bg-rose-200 text-rose-900 border border-rose-400',
  },
  unreachable: {
    label: 'No contactable',
    dot: 'bg-gray-500',
    badge: 'bg-gray-200 text-gray-700 border border-gray-300',
  },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-blue-100 text-blue-800 border border-blue-300' },
  inscripcion: {
    label: 'Inscripcion',
    color: 'bg-orange-100 text-orange-800 border border-orange-300',
  },
  waiting_list: {
    label: 'Lista espera',
    color: 'bg-gray-100 text-gray-800 border border-gray-300',
  },
}

const ADVANCED_STATUS_OPTIONS = [
  'new',
  'contacted',
  'following_up',
  'interested',
  'on_hold',
  'enrolling',
  'enrolled',
  'not_interested',
  'discarded',
  'unreachable',
] as const

const QUEUE_TABS: Array<{ value: QueueFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue_followups', label: 'Vencidos' },
  { value: 'reactivate_today', label: 'Reactivar hoy' },
  { value: 'moved_to_enrollment', label: 'En matriculacion' },
  { value: 'recoverable_not_interested', label: 'Recuperables' },
]

const DEFAULT_QUEUE_COUNTS: Record<QueueFilter, number> = {
  all: 0,
  overdue_followups: 0,
  reactivate_today: 0,
  moved_to_enrollment: 0,
  recoverable_not_interested: 0,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: string): string {
  const parsed = new Date(date).getTime()
  if (!Number.isFinite(parsed)) return 'sin fecha'
  const diff = Date.now() - parsed
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'hace <1h'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'hace 1 dia' : `hace ${days} dias`
}

function fullName(lead: Lead): string {
  return [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sin nombre'
}

function extractInitials(lead: Lead): string {
  const parts = fullName(lead).split(' ').filter(Boolean)
  if (parts.length === 0) return 'SN'
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[1]?.[0] ?? '' : ''
  return `${first}${second}`.toUpperCase()
}

function normalizePhoneForDial(raw?: string | null): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^\d+]/g, '')
  return cleaned.trim() ? cleaned : null
}

function normalizePhoneForWhatsApp(raw?: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  return digits.startsWith('34') ? digits : `34${digits}`
}

function resolveLeadOrigin(lead: Lead): string {
  const sourceForm = (lead.source_form || '').trim()
  if (sourceForm) return sourceForm
  const sourceDetails =
    lead.source_details && typeof lead.source_details === 'object' ? lead.source_details : null
  const sourceDetailsForm =
    sourceDetails && typeof sourceDetails.source_form === 'string'
      ? sourceDetails.source_form.trim()
      : ''
  if (sourceDetailsForm) return sourceDetailsForm
  const sourcePage = (lead.source_page || '').trim()
  if (sourcePage.includes('/convocatorias')) return 'preinscripcion_convocatoria'
  if (sourcePage.includes('/ciclos')) return 'preinscripcion_ciclo'
  if (sourcePage.includes('/landing/')) return 'landing_contact_form'
  if (sourcePage.includes('/contacto')) return 'contacto'
  return 'origen_no_identificado'
}

function resolveLeadProgramLabel(lead: Lead): string {
  const callback = (lead.callback_notes || '').trim()
  const preinscripcionMatch = callback.match(/preinscripci[oó]n\s*:\s*(.+)$/i)
  if (preinscripcionMatch?.[1]) return preinscripcionMatch[1].trim()

  const interesMatch = callback.match(/^interes\s*:\s*(.+)$/i)
  if (interesMatch?.[1]) return interesMatch[1].trim()

  const sourceDetails =
    lead.source_details && typeof lead.source_details === 'object' ? lead.source_details : null
  const fromSourceDetails =
    sourceDetails && typeof sourceDetails.course_name === 'string'
      ? sourceDetails.course_name.trim()
      : ''
  if (fromSourceDetails) return fromSourceDetails

  const campaign = (lead.campaign_code || lead.utm_campaign || '').trim()
  if (campaign) return campaign

  return 'Programa no identificado'
}

function resolveLastNoteSnippet(lead: Lead): string {
  const callback = (lead.callback_notes || '').trim()
  if (callback) {
    return callback.length > 130 ? `${callback.slice(0, 127)}...` : callback
  }

  if (lead.lastInteractor?.name) {
    return `Ultimo contacto por ${lead.lastInteractor.name} (${lead.lastInteractor.channel})`
  }

  return 'Sin nota registrada'
}

function isLikelyTestLead(lead: Lead): boolean {
  if (lead.is_test === true) return true
  const name = fullName(lead).toLowerCase()
  const email = (lead.email || '').toLowerCase()
  const phone = (lead.phone || '').replace(/\s+/g, '')

  if (/(test|tests|prueba|dummy|qa)/i.test(name)) return true
  if (/(test|tests|prueba|dummy|qa)/i.test(email)) return true
  if (phone === '+34000000000' || phone === '000000000') return true

  return false
}

function parseTs(value?: string | null): number | null {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}

function isLeadOverdueFollowUp(lead: Lead, nowTs: number): boolean {
  if ((lead.status ?? '') !== 'following_up') return false
  const nextActionTs = parseTs(lead.next_action_date)
  if (!nextActionTs) return false
  return nextActionTs < nowTs
}

function isLeadReactivatesToday(lead: Lead, dayStart: number, dayEnd: number): boolean {
  if ((lead.status ?? '') !== 'on_hold') return false
  const nextActionTs = parseTs(lead.next_action_date)
  if (!nextActionTs) return false
  return nextActionTs >= dayStart && nextActionTs < dayEnd
}

function isLeadMovedToEnrollment(lead: Lead): boolean {
  return ['enrolling', 'enrolled'].includes(lead.status ?? '') || Boolean(lead.enrollment_id)
}

function isLeadRecoverable(lead: Lead): boolean {
  return (lead.status ?? '') === 'not_interested' && lead.gdpr_consent !== false
}

function matchesQueue(
  lead: Lead,
  queue: QueueFilter,
  nowTs: number,
  dayStartTs: number,
  dayEndTs: number,
): boolean {
  if (queue === 'all') return true
  if (queue === 'overdue_followups') return isLeadOverdueFollowUp(lead, nowTs)
  if (queue === 'reactivate_today') return isLeadReactivatesToday(lead, dayStartTs, dayEndTs)
  if (queue === 'moved_to_enrollment') return isLeadMovedToEnrollment(lead)
  return isLeadRecoverable(lead)
}

async function fetchWithTimeout(input: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAllLeads(limitPerPage = 200): Promise<Lead[]> {
  const allLeads: Lead[] = []
  let page = 1
  let hasNextPage = true
  let guard = 0

  while (hasNextPage && guard < 50) {
    const res = await fetchWithTimeout(`/api/leads?limit=${limitPerPage}&page=${page}`)
    if (res.status === 401) {
      throw new Error('AUTH_REQUIRED')
    }
    if (!res.ok) {
      throw new Error('No se pudieron cargar los leads del CRM')
    }

    const payload = await res.json()
    const docs = Array.isArray(payload?.docs) ? payload.docs : []
    allLeads.push(...docs)

    hasNextPage = Boolean(payload?.hasNextPage)
    page += 1
    guard += 1
  }

  return allLeads
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    if (typeof payload?.error === 'string' && payload.error.trim().length > 0) {
      return payload.error.trim()
    }
  } catch {
    // ignore json parse issues
  }
  return `Error ${response.status}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [showExtendedKpis, setShowExtendedKpis] = useState(false)

  const [inlineError, setInlineError] = useState<string | null>(null)
  const [noteEditorLeadId, setNoteEditorLeadId] = useState<string | null>(null)
  const [noteDraftByLead, setNoteDraftByLead] = useState<Record<string, string>>({})
  const [savingNotesByLead, setSavingNotesByLead] = useState<Record<string, boolean>>({})
  const [savingStatusByLead, setSavingStatusByLead] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const [leadsResult, kpisResult] = await Promise.allSettled([
          fetchAllLeads(200),
          fetchWithTimeout('/api/leads/dashboard'),
        ])

        if (leadsResult.status === 'fulfilled') {
          setLeads(leadsResult.value)
        } else {
          if (
            leadsResult.reason instanceof Error &&
            leadsResult.reason.message === 'AUTH_REQUIRED'
          ) {
            router.push('/login?redirect=/dashboard/leads')
            return
          }
          throw new Error('No se pudieron cargar los leads del CRM')
        }

        if (kpisResult.status === 'fulfilled' && kpisResult.value.ok) {
          setKpis(await kpisResult.value.json())
        } else {
          setKpis(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar leads')
        setLeads([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const now = useMemo(() => new Date(), [leads])
  const nowTs = now.getTime()
  const dayStartTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayEndTs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()

  const baseFiltered = useMemo(() => {
    let result = leads

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (lead) =>
          fullName(lead).toLowerCase().includes(q) ||
          (lead.email ?? '').toLowerCase().includes(q) ||
          (lead.phone ?? '').includes(q),
      )
    }

    if (typeFilter) {
      result = result.filter((lead) => (lead.lead_type ?? lead.type) === typeFilter)
    }

    if (statusFilter) {
      result = result.filter((lead) => (lead.status ?? 'new') === statusFilter)
    }

    return result
  }, [leads, search, typeFilter, statusFilter])

  const queueCounts = useMemo(() => {
    return baseFiltered.reduce<Record<QueueFilter, number>>((acc, lead) => {
      acc.all += 1
      if (isLeadOverdueFollowUp(lead, nowTs)) acc.overdue_followups += 1
      if (isLeadReactivatesToday(lead, dayStartTs, dayEndTs)) acc.reactivate_today += 1
      if (isLeadMovedToEnrollment(lead)) acc.moved_to_enrollment += 1
      if (isLeadRecoverable(lead)) acc.recoverable_not_interested += 1
      return acc
    }, { ...DEFAULT_QUEUE_COUNTS })
  }, [baseFiltered, nowTs, dayStartTs, dayEndTs])

  const filtered = useMemo(() => {
    return baseFiltered.filter((lead) => matchesQueue(lead, queueFilter, nowTs, dayStartTs, dayEndTs))
  }, [baseFiltered, queueFilter, nowTs, dayStartTs, dayEndTs])

  const followUpTotal = useMemo(() => {
    if (kpis) {
      return Object.values(kpis.followUpBreakdown).reduce((a, b) => a + b, 0)
    }

    return leads.filter((lead) =>
      ['contacted', 'following_up', 'interested', 'on_hold'].includes(lead.status ?? ''),
    ).length
  }, [kpis, leads])

  const overdueTodayTotal = useMemo(() => {
    return leads.filter((lead) => {
      const nextActionTs = parseTs(lead.next_action_date)
      if (!nextActionTs) return false
      return nextActionTs >= dayStartTs && nextActionTs < dayEndTs && nextActionTs < nowTs
    }).length
  }, [leads, dayStartTs, dayEndTs, nowTs])

  const advancedFilterSummary = useMemo(() => {
    const chunks: string[] = []
    if (typeFilter) chunks.push(`Tipo: ${TYPE_CONFIG[typeFilter]?.label ?? typeFilter}`)
    if (statusFilter) chunks.push(`Estado: ${STATUS_CONFIG[statusFilter]?.label ?? statusFilter}`)
    return chunks.join(' · ')
  }, [typeFilter, statusFilter])

  const handleQuickStatusChange = async (lead: Lead, nextStatus: string) => {
    const currentStatus = lead.status ?? 'new'
    if (nextStatus === currentStatus) return

    setInlineError(null)
    setSavingStatusByLead((prev) => ({ ...prev, [lead.id]: true }))

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          status_change_note: 'Cambio rapido desde listado CRM',
        }),
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      setLeads((prev) =>
        prev.map((current) =>
          String(current.id) === String(lead.id) ? { ...current, status: nextStatus } : current,
        ),
      )
    } catch (err) {
      setInlineError(
        err instanceof Error ? err.message : 'No se pudo actualizar el estado del lead',
      )
    } finally {
      setSavingStatusByLead((prev) => ({ ...prev, [lead.id]: false }))
    }
  }

  const handleQuickNoteSave = async (lead: Lead) => {
    const note = (noteDraftByLead[lead.id] ?? '').trim()
    if (!note) return

    setInlineError(null)
    setSavingNotesByLead((prev) => ({ ...prev, [lead.id]: true }))

    try {
      const response = await fetch(`/api/leads/${lead.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'system',
          result: 'note_added',
          note,
        }),
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      setLeads((prev) =>
        prev.map((current) =>
          String(current.id) === String(lead.id)
            ? {
                ...current,
                callback_notes: note,
                lastInteractor: {
                  name: 'Sistema',
                  channel: 'system',
                  at: new Date().toISOString(),
                },
                interactionCount: (current.interactionCount ?? 0) + 1,
              }
            : current,
        ),
      )

      setNoteDraftByLead((prev) => ({ ...prev, [lead.id]: '' }))
      setNoteEditorLeadId(null)
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : 'No se pudo guardar la nota rapida')
    } finally {
      setSavingNotesByLead((prev) => ({ ...prev, [lead.id]: false }))
    }
  }

  const clearAdvancedFilters = () => {
    setTypeFilter(null)
    setStatusFilter(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM de Leads"
        description="Seguimiento operativo diario de captacion"
        icon={Users}
      />

      {/* KPI strip (max 4 visibles) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total leads</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : kpis?.totalLeads ?? leads.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin atender</p>
                <p className={`text-2xl font-bold ${(kpis?.unattended ?? 0) > 0 ? 'text-red-600' : ''}`}>
                  {isLoading ? '-' : kpis?.unattended ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">nuevos &gt;24h</p>
              </div>
              <AlertCircle
                className={`h-8 w-8 ${(kpis?.unattended ?? 0) > 0 ? 'text-red-400' : 'text-red-400/40'}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos hoy</p>
                <p className={`text-2xl font-bold ${overdueTodayTotal > 0 ? 'text-amber-600' : ''}`}>
                  {isLoading ? '-' : overdueTodayTotal}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-amber-400/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">T. respuesta media</p>
                <p className="text-2xl font-bold text-violet-600">
                  {isLoading ? '-' : `${kpis?.avgResponseHours ?? 0}h`}
                </p>
              </div>
              <Clock className="h-8 w-8 text-violet-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Metricas extendidas</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowExtendedKpis((prev) => !prev)}
            >
              {showExtendedKpis ? 'Ocultar' : 'Ver detalle'}
            </Button>
          </div>

          {showExtendedKpis && (
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div className="rounded-md border p-2">
                <p className="font-medium text-foreground">En seguimiento</p>
                <p>{followUpTotal}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="font-medium text-foreground">Fichas abiertas</p>
                <p>{kpis?.openEnrollments ?? 0}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="font-medium text-foreground">Tasa conversion</p>
                <p>{kpis?.conversionRate ?? 0}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barra de trabajo */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar lead..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <Sheet open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full lg:w-auto">
                  <Filter className="h-4 w-4" />
                  Filtros avanzados
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filtros avanzados</SheetTitle>
                  <SheetDescription>
                    Tipo y estado permanecen disponibles en panel secundario para reducir friccion.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 px-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-type-filter">Tipo</Label>
                    <Select
                      value={typeFilter ?? 'all'}
                      onValueChange={(value) => setTypeFilter(value === 'all' ? null : value)}
                    >
                      <SelectTrigger id="lead-type-filter" className="w-full">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead-status-filter">Estado</Label>
                    <Select
                      value={statusFilter ?? 'all'}
                      onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
                    >
                      <SelectTrigger id="lead-status-filter" className="w-full">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {ADVANCED_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_CONFIG[status]?.label ?? status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter>
                  <div className="flex w-full gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearAdvancedFilters}>
                      Limpiar
                    </Button>
                    <Button className="flex-1" onClick={() => setIsAdvancedFiltersOpen(false)}>
                      Aplicar
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <Tabs
            value={queueFilter}
            onValueChange={(value) => setQueueFilter(value as QueueFilter)}
            className="w-full"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              {QUEUE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-none">
                  {tab.label} ({queueCounts[tab.value]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {advancedFilterSummary && (
            <p className="text-xs text-muted-foreground">Filtros activos: {advancedFilterSummary}</p>
          )}
        </CardContent>
      </Card>

      {(error || inlineError) && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
          {error || inlineError}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando leads...
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={UserSearch}
          title="Sin leads en esta bandeja"
          description="No hay leads que requieran accion en este momento."
          action={{
            label: 'Ver todos los leads',
            onClick: () => {
              setQueueFilter('all')
              setSearch('')
              clearAdvancedFilters()
            },
          }}
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {filtered.length} de {kpis?.totalLeads ?? leads.length} leads
          </p>

          <div className="space-y-3">
            {filtered.map((lead) => {
              const created = lead.createdAt ?? lead.created_at
              const status = lead.status ?? 'new'
              const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
              const type = (lead.lead_type ?? lead.type ?? 'lead').toLowerCase()
              const typeConfig = TYPE_CONFIG[type] ?? TYPE_CONFIG.lead
              const dialPhone = normalizePhoneForDial(lead.phone)
              const whatsAppPhone = normalizePhoneForWhatsApp(lead.phone)
              const isTest = isLikelyTestLead(lead)
              const isOverdue = isLeadOverdueFollowUp(lead, nowTs)
              const interactionCount = lead.interactionCount ?? 0
              const noteDraft = noteDraftByLead[lead.id] ?? ''
              const isSavingNote = savingNotesByLead[lead.id] ?? false
              const isSavingStatus = savingStatusByLead[lead.id] ?? false
              const isNoteEditorOpen = noteEditorLeadId === lead.id
              const statusSelectValue = ADVANCED_STATUS_OPTIONS.includes(
                status as (typeof ADVANCED_STATUS_OPTIONS)[number],
              )
                ? status
                : 'new'

              return (
                <Card key={lead.id} className={isOverdue ? 'border-amber-300 bg-amber-50/30' : ''}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {extractInitials(lead)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-foreground">
                              {fullName(lead)}
                            </h3>
                            {isTest && (
                              <Badge variant="outline" className="bg-fuchsia-100 text-fuchsia-800">
                                Test
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                Vencido
                              </Badge>
                            )}
                          </div>

                          <p className="truncate text-sm text-muted-foreground">
                            {resolveLeadProgramLabel(lead)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="grid gap-2 text-sm md:grid-cols-[1fr_1fr_auto] md:items-center">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{lead.email || 'Sin email'}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.phone || 'Sin telefono'}</span>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end">
                          <span className="text-xs text-muted-foreground">Origen:</span>
                          <Badge variant="outline" className="text-xs">
                            {resolveLeadOrigin(lead)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-sm md:flex-row md:items-start md:justify-between">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Ultima nota/accion:</span>{' '}
                          <span className="break-words">"{resolveLastNoteSnippet(lead)}"</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground md:justify-end">
                          {/* TODO: clarificar si interactionCount representa intentos o interacciones efectivas. */}
                          {interactionCount > 0 && <span>Contactos: {interactionCount}</span>}
                          {lead.lastInteractor?.name && (
                            <span className="truncate">Responsable: {lead.lastInteractor.name}</span>
                          )}
                          {created && <span>{timeAgo(created)}</span>}
                        </div>
                      </div>
                    </div>

                    {isNoteEditorOpen && (
                      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                        <Label htmlFor={`quick-note-${lead.id}`}>Nota rapida</Label>
                        <Textarea
                          id={`quick-note-${lead.id}`}
                          placeholder="Anade una nota interna de seguimiento"
                          value={noteDraft}
                          onChange={(event) =>
                            setNoteDraftByLead((prev) => ({
                              ...prev,
                              [lead.id]: event.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNoteEditorLeadId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleQuickNoteSave(lead)}
                            disabled={!noteDraft.trim() || isSavingNote}
                          >
                            {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Guardar nota
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {dialPhone ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={`tel:${dialPhone}`}>
                              <Phone className="h-4 w-4" />
                              Llamar
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <Phone className="h-4 w-4" />
                            Llamar
                          </Button>
                        )}

                        {whatsAppPhone ? (
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={`https://wa.me/${whatsAppPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageSquare className="h-4 w-4" />
                              WA
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <MessageSquare className="h-4 w-4" />
                            WA
                          </Button>
                        )}

                        {lead.email ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="h-4 w-4" />
                              Email
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <Mail className="h-4 w-4" />
                            Email
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant={isNoteEditorOpen ? 'default' : 'outline'}
                          onClick={() => {
                            if (isNoteEditorOpen) {
                              setNoteEditorLeadId(null)
                            } else {
                              setNoteEditorLeadId(lead.id)
                              setNoteDraftByLead((prev) => ({
                                ...prev,
                                [lead.id]: prev[lead.id] ?? '',
                              }))
                            }
                          }}
                        >
                          <NotebookPen className="h-4 w-4" />
                          Nota
                        </Button>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Select
                          value={statusSelectValue}
                          onValueChange={(nextStatus) => void handleQuickStatusChange(lead, nextStatus)}
                          disabled={isSavingStatus}
                        >
                          <SelectTrigger className="w-full sm:w-[230px]" size="sm">
                            <SelectValue placeholder="Cambiar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADVANCED_STATUS_OPTIONS.map((statusOption) => (
                              <SelectItem key={statusOption} value={statusOption}>
                                {STATUS_CONFIG[statusOption]?.label ?? statusOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          onClick={() => router.push(`/leads/${lead.id}`)}
                          className="whitespace-nowrap"
                        >
                          Abrir ficha
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
