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
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserPlus,
  ArrowUpRight,
  Filter,
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
  status?: string | null
  source?: string | null
  contact_attempts?: number | null
  contacted_phone?: boolean | null
  contacted_email?: boolean | null
  contacted_whatsapp?: boolean | null
  createdAt?: string | null
}

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-300' },
  contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  interested: { label: 'Interesado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  not_interested: { label: 'No interesado', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
  no_answer: { label: 'No contesta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  wrong_number: { label: 'No contactable', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  callback: { label: 'En espera', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  enrolled: { label: 'Matriculado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300' },
  discarded: { label: 'Descartado', color: 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500' },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  inscripcion: { label: 'Inscripcion', color: 'bg-red-100 text-red-800' },
  waiting_list: { label: 'Lista espera', color: 'bg-gray-100 text-gray-800' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'hace menos de 1h'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hace 1 dia'
  return `hace ${days} dias`
}

function fullName(lead: Lead): string {
  return [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sin nombre'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Fetch
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setError(null)
        const res = await fetch('/api/leads?limit=200&sort=-createdAt&depth=0')
        if (!res.ok) throw new Error('No se pudieron cargar los leads')
        const payload = await res.json()
        setLeads(Array.isArray(payload?.docs) ? payload.docs : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar leads')
        setLeads([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeads()
  }, [])

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = leads

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
      result = result.filter((l) => l.type === typeFilter)
    }

    if (statusFilter) {
      result = result.filter((l) => (l.status ?? 'new') === statusFilter)
    }

    return result
  }, [leads, search, typeFilter, statusFilter])

  // KPI counts
  const totalLeads = leads.length
  const sinAtender = leads.filter((l) => (l.status ?? 'new') === 'new').length
  const enSeguimiento = leads.filter((l) =>
    ['contacted', 'interested', 'callback'].includes(l.status ?? ''),
  ).length
  const convertidos = leads.filter((l) => l.status === 'enrolled').length

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM de Leads"
        description="Dashboard de captacion y seguimiento de leads"
        icon={Users}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total leads</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : totalLeads}</p>
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
                <p className="text-2xl font-bold text-red-600">{isLoading ? '-' : sinAtender}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En seguimiento</p>
                <p className="text-2xl font-bold text-amber-600">{isLoading ? '-' : enSeguimiento}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold text-emerald-600">{isLoading ? '-' : convertidos}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
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
          <Button
            size="sm"
            variant={typeFilter === null ? 'default' : 'outline'}
            onClick={() => setTypeFilter(null)}
          >
            Todos
          </Button>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <Button
              key={key}
              size="sm"
              variant={typeFilter === key ? 'default' : 'outline'}
              onClick={() => setTypeFilter(typeFilter === key ? null : key)}
            >
              {cfg.label}
            </Button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-1">Estado:</span>
          <Button
            size="sm"
            variant={statusFilter === null ? 'default' : 'outline'}
            onClick={() => setStatusFilter(null)}
          >
            Todos
          </Button>
          {['new', 'contacted', 'interested', 'callback', 'discarded'].map((key) => {
            const cfg = STATUS_CONFIG[key]
            return (
              <Button
                key={key}
                size="sm"
                variant={statusFilter === key ? 'default' : 'outline'}
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              >
                {cfg?.label ?? key}
              </Button>
            )
          })}
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
            Mostrando {filtered.length} de {totalLeads} leads
          </p>

          <div className="rounded-lg border bg-card divide-y">
            {filtered.map((lead) => {
              const status = lead.status ?? 'new'
              const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
              const typeCfg = TYPE_CONFIG[lead.type ?? 'lead'] ?? TYPE_CONFIG.lead
              const attempts = lead.contact_attempts ?? 0

              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  {/* Name + contact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{fullName(lead)}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {lead.email && (
                        <span className="truncate max-w-[200px]">{lead.email}</span>
                      )}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                  </div>

                  {/* Type badge */}
                  <Badge variant="outline" className={`shrink-0 text-xs ${typeCfg.color}`}>
                    {typeCfg.label}
                  </Badge>

                  {/* Source badge */}
                  {lead.source && (
                    <Badge variant="outline" className="shrink-0 text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {lead.source}
                    </Badge>
                  )}

                  {/* Status badge */}
                  <Badge variant="outline" className={`shrink-0 text-xs ${statusCfg.color}`}>
                    {statusCfg.label}
                  </Badge>

                  {/* Contact attempts */}
                  {attempts > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0" title="Intentos de contacto">
                      {attempts}x
                    </span>
                  )}

                  {/* Channel icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {lead.contacted_phone && (
                      <Phone className="h-3.5 w-3.5 text-green-600" />
                    )}
                    {lead.contacted_email && (
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    {lead.contacted_whatsapp && (
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" title="WhatsApp" />
                    )}
                  </div>

                  {/* Time ago */}
                  {lead.createdAt && (
                    <span className="text-xs text-muted-foreground shrink-0 w-24 text-right">
                      {timeAgo(lead.createdAt)}
                    </span>
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
