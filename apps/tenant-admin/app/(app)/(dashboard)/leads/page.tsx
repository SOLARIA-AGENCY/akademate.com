'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import {
  Users,
  Search,
  Loader2,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  GraduationCap,
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
}

interface DashboardKPIs {
  totalLeads: number
  unattended: number
  conversionRate: number
  avgResponseHours: number
  openEnrollments: number
  followUpBreakdown: Record<string, number>
}

// ---------------------------------------------------------------------------
// Status config with dot colors
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  new:            { label: 'Nuevo',              dot: 'bg-red-500',     badge: 'bg-red-100 text-red-800 border border-red-300' },
  contacted:      { label: 'Contactado',         dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800' },
  following_up:   { label: 'En seguimiento',     dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-800' },
  interested:     { label: 'Interesado',         dot: 'bg-green-500',   badge: 'bg-green-100 text-green-800' },
  enrolling:      { label: 'En matriculacion',   dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-800' },
  enrolled:       { label: 'Matriculado',        dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  on_hold:        { label: 'En espera',          dot: 'bg-amber-500',   badge: 'bg-gray-100 text-gray-600' },
  not_interested: { label: 'No interesado',      dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  unreachable:    { label: 'No contactable',     dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
  discarded:      { label: 'Descartado',         dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-400' },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  inscripcion: { label: 'Inscripcion', color: 'bg-red-100 text-red-800' },
  waiting_list: { label: 'Lista espera', color: 'bg-gray-100 text-gray-800' },
}

const FILTER_STATUSES = ['new', 'contacted', 'interested', 'on_hold', 'enrolling', 'enrolled', 'discarded'] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'hace <1h'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'hace 1 dia' : `hace ${days} dias`
}

function fullName(lead: Lead): string {
  return [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sin nombre'
}

function resolveLeadOrigin(lead: Lead): string {
  const sourceForm = (lead.source_form || '').trim()
  if (sourceForm) return sourceForm
  const sourceDetails = lead.source_details && typeof lead.source_details === 'object' ? lead.source_details : null
  const sourceDetailsForm = sourceDetails && typeof sourceDetails.source_form === 'string' ? sourceDetails.source_form.trim() : ''
  if (sourceDetailsForm) return sourceDetailsForm
  const sourcePage = (lead.source_page || '').trim()
  if (sourcePage.includes('/convocatorias')) return 'preinscripcion_convocatoria'
  if (sourcePage.includes('/ciclos')) return 'preinscripcion_ciclo'
  if (sourcePage.includes('/landing/')) return 'landing_contact_form'
  if (sourcePage.includes('/contacto')) return 'contacto'
  return 'origen_no_identificado'
}

function resolveLeadProgramLabel(lead: Lead): string {
  const fromCallback = (lead.callback_notes || '').replace(/^Interes:\s*/i, '').trim()
  if (fromCallback) return fromCallback
  const sourceDetails = lead.source_details && typeof lead.source_details === 'object' ? lead.source_details : null
  const fromSourceDetails = sourceDetails && typeof sourceDetails.course_name === 'string' ? sourceDetails.course_name.trim() : ''
  if (fromSourceDetails) return fromSourceDetails
  const campaign = (lead.campaign_code || lead.utm_campaign || '').trim()
  if (campaign) return campaign
  return 'Programa no identificado'
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [queueFilter, setQueueFilter] = useState<string | null>(null)

  // Fetch leads and KPIs in parallel with isolated fallbacks.
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
  }, [])

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = leads
    const now = Date.now()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          fullName(l).toLowerCase().includes(q) ||
          (l.email ?? '').toLowerCase().includes(q) ||
          (l.phone ?? '').includes(q),
      )
    }

    if (typeFilter) {
      result = result.filter((l) => (l.lead_type ?? l.type) === typeFilter)
    }

    if (statusFilter) {
      result = result.filter((l) => (l.status ?? 'new') === statusFilter)
    }

    if (queueFilter === 'overdue_followups') {
      result = result.filter((lead) => {
        if ((lead.status ?? '') !== 'following_up') return false
        if (!lead.next_action_date) return false
        const nextActionTs = new Date(lead.next_action_date).getTime()
        return Number.isFinite(nextActionTs) && nextActionTs < now
      })
    }

    if (queueFilter === 'reactivate_today') {
      result = result.filter((lead) => {
        if ((lead.status ?? '') !== 'on_hold') return false
        if (!lead.next_action_date) return false
        const nextActionTs = new Date(lead.next_action_date).getTime()
        return Number.isFinite(nextActionTs) && nextActionTs >= startOfDay.getTime() && nextActionTs < endOfDay.getTime()
      })
    }

    if (queueFilter === 'moved_to_enrollment') {
      result = result.filter((lead) => ['enrolling', 'enrolled'].includes(lead.status ?? '') || Boolean(lead.enrollment_id))
    }

    if (queueFilter === 'recoverable_not_interested') {
      result = result.filter((lead) => (lead.status ?? '') === 'not_interested' && lead.gdpr_consent !== false)
    }

    return result
  }, [leads, search, typeFilter, statusFilter, queueFilter])

  // Follow-up total for KPI
  const followUpTotal = kpis
    ? Object.values(kpis.followUpBreakdown).reduce((a, b) => a + b, 0)
    : leads.filter((l) => ['contacted', 'following_up', 'interested', 'on_hold'].includes(l.status ?? '')).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM de Leads"
        description="Dashboard de captacion y seguimiento de leads"
        icon={Users}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
              <AlertCircle className={`h-8 w-8 ${(kpis?.unattended ?? 0) > 0 ? 'text-red-400' : 'text-red-400/40'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En seguimiento</p>
                <p className="text-2xl font-bold text-amber-600">{isLoading ? '-' : followUpTotal}</p>
                {kpis?.followUpBreakdown && Object.keys(kpis.followUpBreakdown).length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {Object.entries(kpis.followUpBreakdown).map(([s, n]) => `${STATUS_CONFIG[s]?.label ?? s}: ${n}`).join(' · ')}
                  </p>
                )}
              </div>
              <Clock className="h-8 w-8 text-amber-400/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa conversion</p>
                <p className="text-2xl font-bold text-emerald-600">{isLoading ? '-' : `${kpis?.conversionRate ?? 0}%`}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">T. respuesta</p>
                <p className="text-2xl font-bold text-violet-600">
                  {isLoading ? '-' : `${kpis?.avgResponseHours ?? 0}h`}
                </p>
              </div>
              <Clock className="h-8 w-8 text-violet-400/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fichas abiertas</p>
                <p className="text-2xl font-bold text-blue-600">{isLoading ? '-' : kpis?.openEnrollments ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">pendientes pago</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, email o telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-1">Tipo:</span>
          <Button size="sm" variant={typeFilter === null ? 'default' : 'outline'} onClick={() => setTypeFilter(null)}>
            Todos
          </Button>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <Button key={key} size="sm" variant={typeFilter === key ? 'default' : 'outline'} onClick={() => setTypeFilter(typeFilter === key ? null : key)}>
              {cfg.label}
            </Button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-1">Estado:</span>
          <Button size="sm" variant={statusFilter === null ? 'default' : 'outline'} onClick={() => setStatusFilter(null)}>
            Todos
          </Button>
          {FILTER_STATUSES.map((key) => {
            const cfg = STATUS_CONFIG[key]
            return (
              <Button key={key} size="sm" variant={statusFilter === key ? 'default' : 'outline'} onClick={() => setStatusFilter(statusFilter === key ? null : key)}>
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${cfg.dot}`} />
                {cfg.label}
              </Button>
            )
          })}
        </div>

        {/* Workflow queues */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-1">Vistas operativas:</span>
          <Button size="sm" variant={queueFilter === null ? 'default' : 'outline'} onClick={() => setQueueFilter(null)}>
            Todas
          </Button>
          <Button
            size="sm"
            variant={queueFilter === 'overdue_followups' ? 'default' : 'outline'}
            onClick={() => setQueueFilter(queueFilter === 'overdue_followups' ? null : 'overdue_followups')}
          >
            Seguimientos vencidos
          </Button>
          <Button
            size="sm"
            variant={queueFilter === 'reactivate_today' ? 'default' : 'outline'}
            onClick={() => setQueueFilter(queueFilter === 'reactivate_today' ? null : 'reactivate_today')}
          >
            En espera a reactivar hoy
          </Button>
          <Button
            size="sm"
            variant={queueFilter === 'moved_to_enrollment' ? 'default' : 'outline'}
            onClick={() => setQueueFilter(queueFilter === 'moved_to_enrollment' ? null : 'moved_to_enrollment')}
          >
            Pasados a matriculacion
          </Button>
          <Button
            size="sm"
            variant={queueFilter === 'recoverable_not_interested' ? 'default' : 'outline'}
            onClick={() => setQueueFilter(queueFilter === 'recoverable_not_interested' ? null : 'recoverable_not_interested')}
          >
            No interesados recuperables
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando leads...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No se encontraron leads</p>
          <p className="text-sm mt-1">Ajusta los filtros o espera nuevas captaciones</p>
        </div>
      )}

      {/* Lead list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {filtered.length} de {kpis?.totalLeads ?? leads.length} leads
          </p>

          <div className="rounded-lg border bg-card divide-y">
            {filtered.map((lead) => {
              const status = lead.status ?? 'new'
              const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
              const typeCfg = TYPE_CONFIG[(lead.lead_type ?? lead.type) ?? 'lead'] ?? TYPE_CONFIG.lead
              const created = lead.createdAt ?? lead.created_at

              return (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors sm:flex-row sm:items-center"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  {/* Status dot + Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                      <span className="font-medium truncate">{fullName(lead)}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5 pl-[18px]">
                      {lead.email && <span className="truncate max-w-full sm:max-w-[220px]">{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                      <span className="text-xs font-medium text-foreground/80">
                        Origen: {resolveLeadOrigin(lead)}
                      </span>
                      <span className="text-xs truncate max-w-full sm:max-w-[260px]">
                        {resolveLeadProgramLabel(lead)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:ml-auto">
                    {/* Type badge */}
                    <Badge variant="outline" className={`text-xs ${typeCfg.color}`}>
                      {typeCfg.label}
                    </Badge>

                    {/* Status badge */}
                    <Badge variant="outline" className={`text-xs ${statusCfg.badge}`}>
                      {statusCfg.label}
                    </Badge>

                    {/* Last interactor */}
                    {lead.lastInteractor && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`Ultimo contacto: ${lead.lastInteractor.name}`}>
                        {lead.lastInteractor.channel === 'phone' && <Phone className="h-3 w-3" />}
                        {lead.lastInteractor.channel === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                        {lead.lastInteractor.channel === 'email' && <Mail className="h-3 w-3" />}
                        <span className="truncate max-w-[100px]">{lead.lastInteractor.name}</span>
                      </div>
                    )}

                    {/* Interaction count */}
                    {(lead.interactionCount ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground" title="Intentos de contacto">
                        {lead.interactionCount}x
                      </span>
                    )}

                    {/* Time ago */}
                    {created && (
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(created)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
