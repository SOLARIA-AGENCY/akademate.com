'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Switch } from '@payload-config/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Globe,
  ExternalLink,
  Pencil,
  Calendar,
  Loader2,
  Plus,
  MapPin,
  Users,
} from 'lucide-react'
import { CampaignBadge } from '@payload-config/components/ui/CampaignBadge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConvocatoriaApiItem {
  id: string | number
  cursoNombre?: string
  cursoTipo?: string
  campusNombre?: string
  profesor?:
    | string
    | {
        full_name?: string | null
        first_name?: string | null
        last_name?: string | null
      }
  fechaInicio?: string
  fechaFin?: string
  plazasTotales?: number
  plazasOcupadas?: number
  estado?: string
  modalidad?: string
}

interface ConvocatoriasApiPayload {
  data?: ConvocatoriaApiItem[]
}

interface Convocatoria {
  id: string
  cursoNombre: string
  sedeName: string
  profesorName: string
  fechaInicio: string
  fechaFin: string
  plazasTotales: number
  plazasOcupadas: number
  estado: string
  isPublishable: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ESTADO_MAP: Record<string, { label: string; variant: 'info' | 'success' | 'default' | 'neutral' | 'destructive' | 'outline' | 'warning' }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  published: { label: 'Publicada', variant: 'info' },
  enrollment_open: { label: 'Abierta', variant: 'success' },
  enrollment_closed: { label: 'Cerrada', variant: 'warning' },
  in_progress: { label: 'En Curso', variant: 'default' },
  completed: { label: 'Completada', variant: 'neutral' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

function formatProfesorName(
  profesor: ConvocatoriaApiItem['profesor'],
): string {
  if (typeof profesor === 'string') return profesor
  if (profesor && typeof profesor === 'object') {
    const full = profesor.full_name?.trim()
    if (full) return full
    const combined = `${profesor.first_name?.trim() ?? ''} ${profesor.last_name?.trim() ?? ''}`.trim()
    if (combined) return combined
  }
  return 'Sin asignar'
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function WebConvocatoriasPage() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchConvocatorias = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/convocatorias', { cache: 'no-cache' })
        if (!response.ok) throw new Error('No se pudieron cargar las convocatorias')

        const payload = (await response.json()) as ConvocatoriasApiPayload
        const data: ConvocatoriaApiItem[] = Array.isArray(payload.data) ? payload.data : []

        const mapped: Convocatoria[] = data.map((item) => {
          const estado = item.estado ?? 'draft'
          const publishableStatuses = ['published', 'enrollment_open', 'enrollment_closed', 'in_progress']
          return {
            id: String(item.id),
            cursoNombre: item.cursoNombre ?? 'Curso',
            sedeName: item.campusNombre ?? 'Sin sede',
            profesorName: formatProfesorName(item.profesor),
            fechaInicio: item.fechaInicio ?? '',
            fechaFin: item.fechaFin ?? '',
            plazasTotales: item.plazasTotales ?? 0,
            plazasOcupadas: item.plazasOcupadas ?? 0,
            estado,
            isPublishable: publishableStatuses.includes(estado),
          }
        })

        setConvocatorias(mapped)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar convocatorias')
        setConvocatorias([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchConvocatorias()
  }, [])

  const handleTogglePublish = async (conv: Convocatoria) => {
    setTogglingIds((prev) => new Set(prev).add(conv.id))
    try {
      const newStatus = conv.isPublishable ? 'draft' : 'enrollment_open'
      const response = await fetch(`/api/course-runs/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setConvocatorias((prev) =>
          prev.map((c) =>
            c.id === conv.id
              ? { ...c, estado: newStatus, isPublishable: newStatus !== 'draft' }
              : c,
          ),
        )
      }
    } catch {
      // Silently fail
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(conv.id)
        return next
      })
    }
  }

  const publishedCount = convocatorias.filter((c) => c.isPublishable).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Web — Convocatorias"
        description="Administra que convocatorias se publican como landing pages"
        icon={Globe}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{convocatorias.length} total</Badge>
            <Badge variant="success">{publishedCount} publicadas</Badge>
          </div>
        }
      />

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando convocatorias...
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && convocatorias.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No hay convocatorias</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crea la primera convocatoria desde Programacion.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/programacion/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Convocatoria
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* MOBILE: Card layout (visible on sm and below) */}
      {!isLoading && convocatorias.length > 0 && (
        <div className="space-y-3 lg:hidden">
          {convocatorias.map((conv) => {
            const estadoConfig = ESTADO_MAP[conv.estado] ?? { label: conv.estado, variant: 'outline' as const }
            const isToggling = togglingIds.has(conv.id)
            const ocupacion = conv.plazasTotales > 0
              ? Math.round((conv.plazasOcupadas / conv.plazasTotales) * 100)
              : 0

            return (
              <Card key={conv.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{conv.cursoNombre}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant={estadoConfig.variant} className="text-[10px]">{estadoConfig.label}</Badge>
                      </div>
                    </div>
                    <Switch
                      checked={conv.isPublishable}
                      onCheckedChange={() => void handleTogglePublish(conv)}
                      disabled={isToggling || conv.estado === 'completed' || conv.estado === 'cancelled'}
                      aria-label={`Publicar ${conv.cursoNombre}`}
                    />
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{conv.sedeName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{formatDateShort(conv.fechaInicio)} — {formatDateShort(conv.fechaFin)}</span>
                    </div>
                  </div>

                  {/* Campaign badge */}
                  <CampaignBadge status="none" />

                  {/* Plazas bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />Plazas
                      </span>
                      <span className="font-medium">{conv.plazasOcupadas}/{conv.plazasTotales} ({ocupacion}%)</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${ocupacion >= 90 ? 'bg-primary' : ocupacion >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${ocupacion}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t">
                    {conv.isPublishable && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/web/convocatorias/${conv.id}`} target="_blank">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Ver landing
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/programacion/${conv.id}`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* DESKTOP: Table layout (visible on lg and above) */}
      {!isLoading && convocatorias.length > 0 && (
        <Card className="hidden lg:block overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Ciclo / Curso</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead className="text-center">Plazas</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Campaña</TableHead>
                <TableHead className="text-center">Publicada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {convocatorias.map((conv) => {
                const estadoConfig = ESTADO_MAP[conv.estado] ?? {
                  label: conv.estado,
                  variant: 'outline' as const,
                }
                const isToggling = togglingIds.has(conv.id)

                return (
                  <TableRow key={conv.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">
                      {conv.cursoNombre}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {conv.sedeName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(conv.fechaInicio)} - {formatDate(conv.fechaFin)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{conv.plazasOcupadas}</span>
                      <span className="text-muted-foreground">/{conv.plazasTotales}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={estadoConfig.variant}>{estadoConfig.label}</Badge>
                    </TableCell>
                    {/* Campaign status */}
                    <TableCell className="text-center">
                      <CampaignBadge status="none" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={conv.isPublishable}
                        onCheckedChange={() => void handleTogglePublish(conv)}
                        disabled={isToggling || conv.estado === 'completed' || conv.estado === 'cancelled'}
                        aria-label={`Publicar convocatoria ${conv.cursoNombre}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!conv.isPublishable}
                          title={conv.isPublishable ? 'Ver landing' : 'No publicada'}
                          asChild={conv.isPublishable}
                        >
                          {conv.isPublishable ? (
                            <Link href={`/web/convocatorias/${conv.id}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span>
                              <ExternalLink className="h-4 w-4 opacity-40" />
                            </span>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/programacion/${conv.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
