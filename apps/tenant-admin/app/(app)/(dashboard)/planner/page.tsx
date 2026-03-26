'use client'

export const dynamic = 'force-dynamic'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  LayoutGrid,
  Plus,
  MapPin,
  Calendar,
  Users,
  Clock,
  GripVertical,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import { CampaignBadge } from '@payload-config/components/ui/CampaignBadge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KanbanCard {
  id: string
  curso: string
  tipo: string
  sede: string
  sedeId: string
  fechaInicio: string
  fechaFin: string
  horario: string
  plazas: number
  inscritos: number
  estado: string
}

interface KanbanColumn {
  key: string
  label: string
  color: string
  bgColor: string
  cards: KanbanCard[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS_CONFIG: { key: string; label: string; color: string; bgColor: string }[] = [
  { key: 'draft', label: 'Borrador', color: 'border-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900/30' },
  { key: 'enrollment_open', label: 'Inscripcion Abierta', color: 'border-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { key: 'in_progress', label: 'En Curso', color: 'border-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'completed', label: 'Completada', color: 'border-gray-300', bgColor: 'bg-gray-50/50 dark:bg-gray-900/10' },
  { key: 'cancelled', label: 'Cancelada', color: 'border-red-400', bgColor: 'bg-red-50/50 dark:bg-red-900/10' },
]

// ---------------------------------------------------------------------------
// Kanban Card Component
// ---------------------------------------------------------------------------

function KanbanCardItem({ card, onDragStart, onClick }: {
  card: KanbanCard
  onDragStart: (e: React.DragEvent, cardId: string) => void
  onClick: (id: string) => void
}) {
  const ocupacion = card.plazas > 0 ? Math.round((card.inscritos / card.plazas) * 100) : 0

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => onClick(card.id)}
      className="bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      {/* Drag handle */}
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-semibold leading-tight line-clamp-2">{card.curso}</h4>

          {/* Info */}
          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{card.sede}</span>
            </div>
            {card.fechaInicio && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {new Date(card.fechaInicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  {card.fechaFin && ` — ${new Date(card.fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
                </span>
              </div>
            )}
            {card.horario && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate">{card.horario}</span>
              </div>
            )}
          </div>

          {/* Occupation bar */}
          {card.plazas > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />Plazas
                </span>
                <span className="font-medium">{card.inscritos}/{card.plazas}</span>
              </div>
              <div className="h-1 bg-muted rounded-full">
                <div
                  className={`h-1 rounded-full ${ocupacion >= 90 ? 'bg-primary' : ocupacion >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${ocupacion}%` }}
                />
              </div>
            </div>
          )}

          {/* Campaign badge */}
          <div className="mt-2">
            <CampaignBadge status="none" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kanban Column Component
// ---------------------------------------------------------------------------

function KanbanColumnView({ column, onDragStart, onDrop, onDragOver, onClick, onAdd }: {
  column: KanbanColumn
  onDragStart: (e: React.DragEvent, cardId: string) => void
  onDrop: (e: React.DragEvent, columnKey: string) => void
  onDragOver: (e: React.DragEvent) => void
  onClick: (id: string) => void
  onAdd: (columnKey: string) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <div
      className={`flex flex-col rounded-lg border-t-4 ${column.color} ${column.bgColor} min-w-[260px] max-w-[320px] flex-1`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, column.key) }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider">{column.label}</h3>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{column.cards.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onAdd(column.key)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cards */}
      <div className={`flex-1 p-2 pt-0 space-y-2 min-h-[100px] transition-colors rounded-b-lg ${
        isDragOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
      }`}>
        {column.cards.map((card) => (
          <KanbanCardItem key={card.id} card={card} onDragStart={onDragStart} onClick={onClick} />
        ))}
        {column.cards.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground/50 border-2 border-dashed border-muted-foreground/10 rounded-lg">
            Arrastra aqui
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PlannerPage() {
  const router = useRouter()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])
  const [updating, setUpdating] = useState(false)

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        const [convsRes, campusRes] = await Promise.all([
          fetch('/api/convocatorias', { cache: 'no-cache' }),
          fetch('/api/campuses?limit=50', { cache: 'no-cache' }),
        ])

        let cards: KanbanCard[] = []
        if (convsRes.ok) {
          const data = await convsRes.json()
          const items = Array.isArray(data.data) ? data.data : []
          cards = items.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            curso: (c.cursoNombre as string) || 'Curso',
            tipo: (c.cursoTipo as string) || '',
            sede: (c.campusNombre as string) || 'Sin sede',
            sedeId: String(c.campusId || ''),
            fechaInicio: (c.fechaInicio as string) || '',
            fechaFin: (c.fechaFin as string) || '',
            horario: (c.horario as string) || '',
            plazas: (c.plazasTotales as number) || 0,
            inscritos: (c.plazasOcupadas as number) || 0,
            estado: (c.estado as string) || 'draft',
          }))
        }

        if (campusRes.ok) {
          const campusData = await campusRes.json()
          setCampuses((Array.isArray(campusData.docs) ? campusData.docs : []).map((c: Record<string, unknown>) => ({
            id: String(c.id), name: (c.name as string) || 'Sede',
          })))
        }

        // Group into columns
        setColumns(COLUMNS_CONFIG.map((col) => ({
          ...col,
          cards: cards.filter((c) => c.estado === col.key),
        })))
      } catch { /* graceful */ }
      finally { setIsLoading(false) }
    }
    void load()
  }, [])

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cardId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId
    if (!cardId) return

    // Find source column and card
    let sourceCol = ''
    let card: KanbanCard | null = null
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === cardId)
      if (found) { sourceCol = col.key; card = found; break }
    }

    if (!card || sourceCol === targetColumn) { setDraggedCardId(null); return }

    // Optimistic update
    setColumns((prev) => prev.map((col) => {
      if (col.key === sourceCol) return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
      if (col.key === targetColumn) return { ...col, cards: [...col.cards, { ...card!, estado: targetColumn }] }
      return col
    }))

    // API call to update status
    setUpdating(true)
    try {
      const statusMap: Record<string, string> = {
        draft: 'draft',
        enrollment_open: 'enrollment_open',
        in_progress: 'in_progress',
        completed: 'completed',
        cancelled: 'cancelled',
      }
      await fetch(`/api/course-runs/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[targetColumn] || targetColumn }),
      })
    } catch {
      // Revert on error
      setColumns((prev) => prev.map((col) => {
        if (col.key === targetColumn) return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
        if (col.key === sourceCol) return { ...col, cards: [...col.cards, card!] }
        return col
      }))
    } finally {
      setUpdating(false)
      setDraggedCardId(null)
    }
  }, [columns, draggedCardId])

  const handleCardClick = useCallback((id: string) => {
    router.push(`/programacion/${id}`)
  }, [router])

  const handleAdd = useCallback((columnKey: string) => {
    router.push(`/programacion/nueva`)
  }, [router])

  // Filtered columns
  const filteredColumns = sedeFilter === 'todas'
    ? columns
    : columns.map((col) => ({ ...col, cards: col.cards.filter((c) => c.sedeId === sedeFilter) }))

  const totalCards = columns.reduce((s, c) => s + c.cards.length, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Planner Visual"
        description="Arrastra convocatorias entre columnas para cambiar su estado"
        icon={LayoutGrid}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalCards} convocatorias</Badge>
            {updating && <Badge variant="outline" className="animate-pulse">Guardando...</Badge>}
          </div>
        }
        actions={
          <Button onClick={() => router.push('/programacion/nueva')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Convocatoria
          </Button>
        }
      />

      {/* Sede filter */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Filtrar por sede:</span>
          <button
            onClick={() => setSedeFilter('todas')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              sedeFilter === 'todas' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Todas
          </button>
          {campuses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSedeFilter(c.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                sedeFilter === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredColumns.map((column) => (
            <KanbanColumnView
              key={column.key}
              column={column}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={handleCardClick}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground px-1">
        <span className="font-medium">Arrastra las tarjetas entre columnas para cambiar el estado de la convocatoria.</span>
        <span className="flex items-center gap-1">
          <GripVertical className="h-3 w-3" /> = Arrastrar
        </span>
      </div>
    </div>
  )
}
