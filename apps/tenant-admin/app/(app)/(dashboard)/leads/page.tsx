'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
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
  Filter,
  NotebookPen,
  UserCheck,
  CalendarPlus,
} from 'lucide-react'
import { CommercialIntakeCard } from '../_components/CommercialIntakeCard'
import {
  resolveFullLeadName,
  resolveLeadProgramLabel as resolveProgramLabel,
} from '@/lib/leads/commercialBuckets'

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
  firstInteractor?: { name: string; channel: string; at: string } | null
  lastInteractor?: { name: string; channel: string; at: string } | null
  assignedTo?: { id?: string | number | null; name?: string | null; email?: string | null } | null
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
  commercial_bucket?: 'leads' | 'inscripciones' | 'unresolved' | null
  commercial_origin_label?: string | null
  commercial_source_label?: string | null
  commercial_campaign_label?: string | null
  commercial_unresolved?: boolean | null
  commercial_ads_active?: boolean | null
  commercial_reason?: string | null
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

function isSystemIdentity(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'sistema' || normalized === 'system' || normalized === 'auto' || normalized === 'bot'
}

function resolveLeadResponsible(lead: Lead): string {
  const firstInteractorName =
    typeof lead.firstInteractor?.name === 'string' ? lead.firstInteractor.name.trim() : ''
  if (firstInteractorName && !isSystemIdentity(firstInteractorName)) {
    return firstInteractorName
  }

  const lastInteractorName =
    typeof lead.lastInteractor?.name === 'string' ? lead.lastInteractor.name.trim() : ''
  if (lastInteractorName && !isSystemIdentity(lastInteractorName)) {
    return lastInteractorName
  }

  if ((lead.interactionCount ?? 0) > 0) {
    const assignedIdentity = [
      typeof lead.assignedTo?.name === 'string' ? lead.assignedTo.name.trim() : '',
      typeof lead.assignedTo?.email === 'string' ? lead.assignedTo.email.trim() : '',
    ].find((value) => value.length > 0)
    if (assignedIdentity && !isSystemIdentity(assignedIdentity)) {
      return assignedIdentity
    }
  }

  return 'Sin asignar'
}

function fullName(lead: Lead): string {
  return resolveFullLeadName(lead as unknown as Record<string, unknown>)
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

function resolveLeadProgramLabel(lead: Lead): string {
  return resolveProgramLabel(lead as unknown as Record<string, unknown>)
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

type LeadsFetchMode = 'bucket_leads' | 'all_leads_fallback'

async function fetchLeadPages(
  params: URLSearchParams,
  limitPerPage = 200,
): Promise<Lead[]> {
  const allLeads: Lead[] = []
  let page = 1
  let hasNextPage = true
  let guard = 0

  while (hasNextPage && guard < 50) {
    const query = new URLSearchParams(params)
    query.set('limit', String(limitPerPage))
    query.set('page', String(page))
    const res = await fetchWithTimeout(
      `/api/leads?${query.toString()}`,
    )
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

async function fetchAllLeads(
  limitPerPage = 200,
): Promise<{ leads: Lead[]; mode: LeadsFetchMode }> {
  const bucketParams = new URLSearchParams()
  bucketParams.set('bucket', 'leads')
  const bucketLeads = await fetchLeadPages(bucketParams, limitPerPage)

  if (bucketLeads.length > 0) {
    return { leads: bucketLeads, mode: 'bucket_leads' }
  }

  const allLeads = await fetchLeadPages(new URLSearchParams(), limitPerPage)
  return { leads: allLeads, mode: 'all_leads_fallback' }
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
  const [fetchMode, setFetchMode] = useState<LeadsFetchMode>('bucket_leads')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)

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
          setLeads(leadsResult.value.leads)
          setFetchMode(leadsResult.value.mode)
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
        setFetchMode('bucket_leads')
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
                lastInteractor: current.lastInteractor,
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
                <p className="text-[10px] text-muted-foreground">nuevos sin contacto</p>
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

      {!isLoading && !error && fetchMode === 'all_leads_fallback' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Modo amplio activo: mostrando todos los leads mientras se termina de confirmar la
          atribución de campañas.
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
              const classification = {
                bucket:
                  lead.commercial_bucket === 'leads' ||
                  lead.commercial_bucket === 'inscripciones' ||
                  lead.commercial_bucket === 'unresolved'
                    ? lead.commercial_bucket
                    : 'inscripciones',
                unresolved: Boolean(lead.commercial_unresolved),
                adsActive: Boolean(lead.commercial_ads_active),
                campaignLabel: lead.commercial_campaign_label ?? null,
                originLabel: lead.commercial_origin_label ?? '',
                sourceLabel: lead.commercial_source_label ?? '',
                reason:
                  lead.commercial_reason === 'active_meta_campaign' ||
                  lead.commercial_reason === 'meta_source_without_active_campaign'
                    ? lead.commercial_reason
                    : 'organic_or_non_meta_campaign',
              } as const
              const normalizedOriginLabel =
                classification.originLabel.trim().toLowerCase() === 'origen no resuelto'
                  ? ''
                  : classification.originLabel
              const sourceBadgeLabel = classification.sourceLabel || normalizedOriginLabel

              const cardBadges: Array<{ label: string; className?: string }> = []
              if (isTest) {
                cardBadges.push({ label: 'Test', className: 'bg-fuchsia-100 text-fuchsia-800' })
              }
              if (isOverdue) {
                cardBadges.push({ label: 'Vencido', className: 'bg-amber-100 text-amber-800' })
              }
              if (classification.bucket === 'leads') {
                cardBadges.push({
                  label: 'Ads activo',
                  className: 'bg-emerald-100 text-emerald-800',
                })
              }
              if (sourceBadgeLabel) {
                cardBadges.push({
                  label: sourceBadgeLabel,
                  className: 'bg-slate-100 text-slate-800',
                })
              }
              if (classification.campaignLabel) {
                cardBadges.push({ label: `Campaña: ${classification.campaignLabel}` })
              }
              cardBadges.push({ label: typeConfig.label, className: typeConfig.color })
              if (interactionCount > 0) {
                cardBadges.push({ label: `Contactos: ${interactionCount}` })
              }
              const advisorName = resolveLeadResponsible(lead)
              if (advisorName !== 'Sin asignar') {
                cardBadges.push({
                  label: `Asesor: ${advisorName}`,
                  className: 'bg-indigo-100 text-indigo-800',
                })
              }

              return (
                <div key={lead.id} className="space-y-2">
                  <CommercialIntakeCard
                    className={isOverdue ? 'border-amber-300 bg-amber-50/30' : ''}
                    fullName={fullName(lead)}
                    statusLabel={statusConfig.label}
                    statusClassName={statusConfig.badge}
                    programLabel={resolveLeadProgramLabel(lead)}
                    email={lead.email}
                    phone={lead.phone}
                    provenanceLabel={
                      classification.sourceLabel ||
                      normalizedOriginLabel ||
                      'Procedencia por confirmar'
                    }
                    timeLabel={created ? timeAgo(created) : undefined}
                    badges={cardBadges}
                    footerLeft={
                      <div className="flex flex-wrap items-center gap-2">
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

                        <Button asChild size="sm" className="bg-red-600 text-white hover:bg-red-700">
                          <Link href={`/calendario-citas?leadId=${lead.id}`}>
                            <CalendarPlus className="h-4 w-4" />
                            Programar cita
                          </Link>
                        </Button>

                        <Select
                          value={statusSelectValue}
                          onValueChange={(nextStatus) => void handleQuickStatusChange(lead, nextStatus)}
                          disabled={isSavingStatus}
                        >
                          <SelectTrigger className="w-[220px]" size="sm">
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
                      </div>
                    }
                    viewHref={`/leads/${lead.id}`}
                  />

                  <p className="px-1 text-xs text-muted-foreground">
                    Última nota/acción: "{resolveLastNoteSnippet(lead)}" · Responsable: {resolveLeadResponsible(lead)}
                  </p>

                  {isNoteEditorOpen && (
                    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                      <Label htmlFor={`quick-note-${lead.id}`}>Nota rápida</Label>
                      <Textarea
                        id={`quick-note-${lead.id}`}
                        placeholder="Añade una nota interna de seguimiento"
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
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
