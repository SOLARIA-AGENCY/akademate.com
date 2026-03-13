'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, User, Settings, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty,
} from '@/components/ui/data-table'

interface LogEntry {
  id: number
  method: string
  path: string
  status: number
  latency_ms: number | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

interface LogsResponse {
  docs: LogEntry[]
  total: number
  page: number
  totalPages: number
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  POST: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function statusVariant(code: number): string {
  if (code < 300) return 'bg-success/10 text-success'
  if (code < 400) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (code < 500) return 'bg-warning/10 text-warning'
  return 'bg-destructive/10 text-destructive'
}

// Detect actor type from user-agent / path
function detectActor(entry: LogEntry): { type: 'ai_agent' | 'human' | 'system'; label: string } {
  const ua = entry.user_agent?.toLowerCase() ?? ''
  if (ua.includes('python') || ua.includes('curl') || ua.includes('httpie') || ua.includes('axios') || ua.includes('node-fetch') || ua.includes('go-http')) {
    return { type: 'ai_agent', label: 'Agente IA' }
  }
  if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox') || ua.includes('edge')) {
    return { type: 'human', label: 'Humano' }
  }
  if (entry.path.startsWith('/api/ops/health') || entry.path.startsWith('/api/ops/weekly')) {
    return { type: 'system', label: 'Sistema' }
  }
  return { type: 'system', label: 'Sistema' }
}

const actorStyles = {
  ai_agent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  human: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  system: 'bg-muted text-muted-foreground',
}

const actorIcons = {
  ai_agent: Bot,
  human: User,
  system: Settings,
}

export default function AuditoriaPage() {
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({
    method: '',
    status: '',
    path: '',
    hours: '168', // 7 days default
    actor: '', // ai_agent | human | system | ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50', hours: filter.hours })
    if (filter.method) params.set('method', filter.method)
    if (filter.status) params.set('status', filter.status)
    if (filter.path) params.set('path', filter.path)
    const res = await fetch(`/api/ops/logs?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [page, filter])

  useEffect(() => { load() }, [load])

  function applyQuickFilter(actor: string) {
    setFilter(f => ({ ...f, actor: f.actor === actor ? '' : actor }))
    setPage(1)
  }

  // Filter entries client-side by actor type (UA-based detection)
  const entries = (data?.docs ?? []).filter((entry) => {
    if (!filter.actor) return true
    const { type } = detectActor(entry)
    return type === filter.actor
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Log"
        description="Registro completo de actividad — humanos, agentes IA y sistema"
      />

      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => applyQuickFilter('ai_agent')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${filter.actor === 'ai_agent' ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' : 'border-border hover:bg-muted/50'}`}
        >
          <Bot className="h-4 w-4" />
          Solo IA
        </button>
        <button
          onClick={() => applyQuickFilter('human')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${filter.actor === 'human' ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' : 'border-border hover:bg-muted/50'}`}
        >
          <User className="h-4 w-4" />
          Solo humanos
        </button>
        <button
          onClick={() => {
            setFilter(f => ({ ...f, status: f.status === '5' ? '' : '5' }))
            setPage(1)
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${filter.status === '5' ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border hover:bg-muted/50'}`}
        >
          <Filter className="h-4 w-4" />
          Solo errores 5xx
        </button>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-border hover:bg-muted/50 transition-colors ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        <input
          value={filter.path}
          onChange={e => { setFilter(f => ({ ...f, path: e.target.value })); setPage(1) }}
          placeholder="Filtrar por ruta /api/..."
          className="rounded-md border border-border bg-background px-3 py-2 text-sm w-56"
        />
        <select
          value={filter.method}
          onChange={e => { setFilter(f => ({ ...f, method: e.target.value })); setPage(1) }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los métodos</option>
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={filter.hours}
          onChange={e => { setFilter(f => ({ ...f, hours: e.target.value })); setPage(1) }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="1">Última hora</option>
          <option value="6">Últimas 6h</option>
          <option value="24">Últimas 24h</option>
          <option value="168">Última semana</option>
          <option value="720">Último mes</option>
        </select>
      </div>

      {/* Log table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {loading ? 'Cargando...' : `${data?.total ?? 0} registros`}
            </CardTitle>
            {data && data.totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>{page} / {data.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="p-1 rounded hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Actor</DataTableHead>
                  <DataTableHead>Método</DataTableHead>
                  <DataTableHead>Ruta</DataTableHead>
                  <DataTableHead align="right">Status</DataTableHead>
                  <DataTableHead align="right">Latencia</DataTableHead>
                  <DataTableHead>IP</DataTableHead>
                  <DataTableHead>Fecha</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {entries.length === 0 ? (
                  <DataTableEmpty
                    colSpan={7}
                    title="Sin registros"
                    description="No hay actividad en el período seleccionado"
                  />
                ) : (
                  entries.map((entry) => {
                    const actor = detectActor(entry)
                    const ActorIcon = actorIcons[actor.type]
                    return (
                      <DataTableRow key={entry.id}>
                        <DataTableCell>
                          <Badge className={`${actorStyles[actor.type]} inline-flex items-center gap-1`}>
                            <ActorIcon className="h-3 w-3" />
                            {actor.label}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          <Badge className={METHOD_COLORS[entry.method] ?? 'bg-muted text-muted-foreground'}>
                            {entry.method}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {entry.path.length > 48 ? entry.path.slice(0, 48) + '…' : entry.path}
                          </code>
                        </DataTableCell>
                        <DataTableCell align="right">
                          <Badge className={statusVariant(entry.status)}>
                            {entry.status}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell align="right" numeric>
                          {entry.latency_ms !== null ? `${entry.latency_ms}ms` : '—'}
                        </DataTableCell>
                        <DataTableCell>
                          <code className="text-xs text-muted-foreground font-mono">
                            {entry.ip ?? '—'}
                          </code>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString('es-ES', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </span>
                        </DataTableCell>
                      </DataTableRow>
                    )
                  })
                )}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </Card>
    </div>
  )
}
