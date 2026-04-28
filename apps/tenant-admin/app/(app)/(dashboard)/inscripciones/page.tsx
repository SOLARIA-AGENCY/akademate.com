'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@payload-config/components/ui/input'
import {
  UserPlus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { CommercialIntakeCard } from '../_components/CommercialIntakeCard'
import {
  resolveFullLeadName,
  resolveLeadProgramLabel,
} from '@/lib/leads/commercialBuckets'

interface Lead {
  id: number | string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  lead_type?: string | null
  status?: string | null
  priority?: string | null
  createdAt?: string | null
  created_at?: string | null
  firstInteractor?: { name?: string | null; channel?: string | null; at?: string | null } | null
  lastInteractor?: { name?: string | null; channel?: string | null; at?: string | null } | null
  interactionCount?: number | null
  assignedTo?: { id?: number | string | null; name?: string | null; email?: string | null } | null
  source_details?: Record<string, unknown> | null
  callback_notes?: string | null
  message?: string | null
  commercial_bucket?: 'leads' | 'inscripciones' | 'unresolved' | null
  commercial_origin_label?: string | null
  commercial_source_label?: string | null
  commercial_campaign_label?: string | null
  commercial_unresolved?: boolean | null
  commercial_ads_active?: boolean | null
  commercial_reason?: string | null
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Nuevo', className: 'bg-blue-100 text-blue-800 border border-blue-300' },
  contacted: { label: 'Contactado', className: 'bg-amber-100 text-amber-800 border border-amber-300' },
  following_up: { label: 'En seguimiento', className: 'bg-amber-100 text-amber-800 border border-amber-300' },
  interested: { label: 'Interesado', className: 'bg-green-100 text-green-800 border border-green-300' },
  on_hold: { label: 'En espera', className: 'bg-gray-100 text-gray-700 border border-gray-300' },
  enrolling: { label: 'En matriculación', className: 'bg-teal-100 text-teal-800 border border-teal-300' },
  enrolled: { label: 'Matriculado', className: 'bg-emerald-100 text-emerald-900 border border-emerald-300' },
  no_answer: { label: 'No contesta', className: 'bg-orange-100 text-orange-800 border border-orange-300' },
  not_interested: { label: 'No interesado', className: 'bg-rose-100 text-rose-800 border border-rose-300' },
  discarded: { label: 'Descartado', className: 'bg-zinc-200 text-zinc-800 border border-zinc-300' },
}

function timeAgo(date: string): string {
  const parsed = new Date(date).getTime()
  if (!Number.isFinite(parsed)) return 'sin fecha'
  const diff = Date.now() - parsed
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'hace <1h'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'hace 1 día' : `hace ${days} días`
}

function isSystemIdentity(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'sistema' || normalized === 'system' || normalized === 'auto' || normalized === 'bot'
}

function resolveAssignedAdvisor(lead: Lead): string {
  const firstInteractorName =
    typeof lead.firstInteractor?.name === 'string' ? lead.firstInteractor.name.trim() : ''
  if (firstInteractorName && !isSystemIdentity(firstInteractorName)) return firstInteractorName

  const lastInteractorName =
    typeof lead.lastInteractor?.name === 'string' ? lead.lastInteractor.name.trim() : ''
  if (lastInteractorName && !isSystemIdentity(lastInteractorName)) return lastInteractorName

  if ((lead.interactionCount ?? 0) > 0) {
    const assignedName = typeof lead.assignedTo?.name === 'string' ? lead.assignedTo.name.trim() : ''
    if (assignedName && !isSystemIdentity(assignedName)) return assignedName
  }

  return 'Sin asignar'
}

export default function InscripcionesPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/leads?bucket=inscripciones&limit=200&sort=-createdAt&depth=0')
      .then((response) => (response.ok ? response.json() : { docs: [] }))
      .then((payload) => setLeads(Array.isArray(payload?.docs) ? payload.docs : []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter((lead) => {
    if (!search) return true
    const query = search.toLowerCase()
    return (
      resolveFullLeadName(lead as unknown as Record<string, unknown>).toLowerCase().includes(query) ||
      String(lead.email || '').toLowerCase().includes(query) ||
      String(lead.phone || '').includes(query)
    )
  })

  const stats = {
    total: leads.length,
    new: leads.filter((lead) => !lead.status || lead.status === 'new').length,
    contacted: leads.filter((lead) => ['contacted', 'following_up', 'interested'].includes(lead.status || '')).length,
    pending: leads.filter((lead) => ['callback', 'no_answer', 'on_hold'].includes(lead.status || '')).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inscripciones"
        description="Preinscripciones y registros orgánicos sin campaña activa resuelta"
        icon={UserPlus}
        badge={stats.new > 0 ? <Badge variant="destructive">{stats.new} nuevas</Badge> : undefined}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total inscripciones', value: stats.total, icon: UserPlus, color: 'text-primary' },
          { label: 'Sin atender', value: stats.new, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Contactados', value: stats.contacted, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Pendientes callback', value: stats.pending, icon: Clock, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay inscripciones en esta bandeja</p>
            <p className="text-xs mt-1">Cuando no exista trazabilidad a campaña activa, la entrada quedará aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const statusKey = String(lead.status || 'new').toLowerCase()
            const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.new
            const createdAt = lead.createdAt || lead.created_at
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

            const visualBadges: Array<{ label: string; className?: string }> = []
            const normalizedOriginLabel =
              classification.originLabel.trim().toLowerCase() === 'origen no resuelto'
                ? ''
                : classification.originLabel
            const sourceBadgeLabel = classification.sourceLabel || normalizedOriginLabel
            if (classification.bucket === 'leads') {
              visualBadges.push({
                label: 'Ads activo',
                className: 'bg-emerald-100 text-emerald-800',
              })
            }
            if (sourceBadgeLabel) {
              visualBadges.push({
                label: sourceBadgeLabel,
                className: 'bg-slate-100 text-slate-800',
              })
            }

            if (classification.campaignLabel) {
              visualBadges.push({ label: `Campaña: ${classification.campaignLabel}` })
            }

            const advisorName = resolveAssignedAdvisor(lead)
            if (advisorName !== 'Sin asignar') {
              visualBadges.push({
                label: `Asesor: ${advisorName}`,
                className: 'bg-indigo-100 text-indigo-800',
              })
            }

            const isUrgent =
              createdAt && (lead.status || 'new') === 'new'
                ? Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
                : false
            if (isUrgent) {
              visualBadges.push({ label: 'URGENTE', className: 'bg-red-100 text-red-700' })
            }

            return (
              <CommercialIntakeCard
                key={String(lead.id)}
                className={isUrgent ? 'border-l-4 border-l-red-500' : ''}
                fullName={resolveFullLeadName(lead as unknown as Record<string, unknown>)}
                statusLabel={statusConfig.label}
                statusClassName={statusConfig.className}
                programLabel={resolveLeadProgramLabel(lead as unknown as Record<string, unknown>)}
                email={lead.email}
                phone={lead.phone}
                provenanceLabel={
                  classification.sourceLabel ||
                  normalizedOriginLabel ||
                  'Procedencia por confirmar'
                }
                timeLabel={createdAt ? timeAgo(createdAt) : undefined}
                badges={visualBadges}
                viewHref={`/inscripciones/${lead.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
