'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Calendar, MapPin, Users, BookOpen, GraduationCap,
  Loader2, Search, Filter, Archive, ChevronRight,
} from 'lucide-react'
import { Input } from '@payload-config/components/ui/input'

interface Convocatoria {
  id: number
  codigo?: string
  status?: string
  start_date?: string
  end_date?: string
  max_students?: number
  current_enrollments?: number
  price_override?: number
  notes?: string
  course?: { id: number; name?: string; title?: string } | number
  campus?: { id: number; name?: string } | number
  instructor?: { id: number; full_name?: string } | number
  createdAt?: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  draft: { label: 'Borrador', variant: 'secondary', color: 'border-gray-300' },
  published: { label: 'Publicada', variant: 'outline', color: 'border-blue-300' },
  enrollment_open: { label: 'Inscripcion abierta', variant: 'default', color: 'border-green-400' },
  in_progress: { label: 'En curso', variant: 'default', color: 'border-blue-400' },
  completed: { label: 'Finalizada', variant: 'secondary', color: 'border-gray-400' },
  cancelled: { label: 'Cancelada', variant: 'destructive', color: 'border-red-400' },
  archived: { label: 'Archivada', variant: 'secondary', color: 'border-gray-300' },
}

export default function HistorialPage() {
  const router = useRouter()
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/course-runs?limit=200&sort=-createdAt&depth=1')
        if (res.ok) {
          const data = await res.json()
          setConvocatorias(data.docs || [])
        }
      } catch (err) {
        console.error('Error loading historial:', err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = convocatorias.filter(c => {
    // Status filter
    if (filter === 'active' && !['enrollment_open', 'published', 'in_progress'].includes(c.status || '')) return false
    if (filter === 'completed' && c.status !== 'completed') return false
    if (filter === 'archived' && !['archived', 'cancelled'].includes(c.status || '')) return false

    // Search
    if (search) {
      const q = search.toLowerCase()
      const courseName = typeof c.course === 'object' ? (c.course?.name || c.course?.title || '') : ''
      const campusName = typeof c.campus === 'object' ? (c.campus?.name || '') : ''
      if (
        !(c.codigo || '').toLowerCase().includes(q) &&
        !courseName.toLowerCase().includes(q) &&
        !campusName.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const stats = {
    total: convocatorias.length,
    active: convocatorias.filter(c => ['enrollment_open', 'published', 'in_progress'].includes(c.status || '')).length,
    completed: convocatorias.filter(c => c.status === 'completed').length,
    archived: convocatorias.filter(c => ['archived', 'cancelled'].includes(c.status || '')).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial"
        description="Registro historico de todas las convocatorias, cursos y ciclos"
        icon={Archive}
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, onClick: () => setFilter('all') },
          { label: 'Activas', value: stats.active, icon: BookOpen, onClick: () => setFilter('active') },
          { label: 'Finalizadas', value: stats.completed, icon: GraduationCap, onClick: () => setFilter('completed') },
          { label: 'Archivadas', value: stats.archived, icon: Archive, onClick: () => setFilter('archived') },
        ].map(({ label, value, icon: Icon, onClick }) => (
          <Card key={label} className={`cursor-pointer hover:border-primary/50 transition-colors ${filter === label.toLowerCase() ? 'border-primary' : ''}`} onClick={onClick}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por codigo, curso o sede..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'completed', 'archived'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : f === 'completed' ? 'Finalizadas' : 'Archivadas'}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay convocatorias {filter !== 'all' ? `${filter === 'active' ? 'activas' : filter === 'completed' ? 'finalizadas' : 'archivadas'}` : ''}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(conv => {
            const courseName = typeof conv.course === 'object' && conv.course !== null
              ? (conv.course.name || conv.course.title || `Curso #${conv.course.id}`)
              : `Curso #${conv.course}`
            const campusName = typeof conv.campus === 'object' && conv.campus !== null
              ? conv.campus.name
              : null
            const instructorName = typeof conv.instructor === 'object' && conv.instructor !== null
              ? conv.instructor.full_name
              : null
            const statusConfig = STATUS_CONFIG[conv.status || 'draft'] || STATUS_CONFIG.draft
            const plazasOcupadas = conv.current_enrollments || 0
            const plazasTotal = conv.max_students || 0
            const porcentaje = plazasTotal > 0 ? Math.round((plazasOcupadas / plazasTotal) * 100) : 0

            return (
              <Card key={conv.id} className={`border-l-4 ${statusConfig.color} hover:shadow-md transition-shadow cursor-pointer`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{conv.codigo}</span>
                        <Badge variant={statusConfig.variant} className="text-[10px]">{statusConfig.label}</Badge>
                      </div>
                      <p className="font-semibold truncate">{courseName}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {campusName && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{campusName}</span>
                        )}
                        {conv.start_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(conv.start_date).toLocaleDateString('es-ES')}</span>
                        )}
                        {instructorName && (
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{instructorName}</span>
                        )}
                        {conv.price_override && (
                          <span className="font-medium">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(conv.price_override)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {plazasTotal > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{plazasOcupadas}/{plazasTotal}</p>
                          <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                          </div>
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
