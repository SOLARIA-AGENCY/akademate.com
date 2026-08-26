'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@payload-config/components/ui/badge'
import {
  ACADEMIC_LISTING_GRID_CLASS,
  AcademicEntityCard,
  DirectoryAvatarCell,
  DirectoryNeutralBadge,
  PremiumDirectoryShell,
  computeCampusDirectoryKpis,
} from '@payload-config/components/akademate/dashboard'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { downloadCsv, type ExportColumn } from '@/app/lib/dashboard-export'

/** Sede data structure used for display */
interface Sede {
  id: string
  nombre: string
  direccion: string
  telefono: string
  email: string
  horario: string
  aulas: number
  capacidad: number
  cursosActivos: number
  profesores: number
  color: string
  borderColor: string
  imagen: string | null
  campusKind: 'physical' | 'virtual'
  operationalOwner: 'cep' | 'acaten' | 'aproem'
}

/** Campus data from API response */
interface ApiCampus {
  id: string
  name?: string
  address?: string
  postal_code?: string
  city?: string
  phone?: string
  email?: string
  staff_members?: unknown[]
  image?: { url?: string } | number | null
  campus_kind?: 'physical' | 'virtual' | string | null
  operational_owner?: 'cep' | 'acaten' | 'aproem' | string | null
  active?: boolean
}

/** API response shape for campuses endpoint */
interface CampusesApiResponse {
  docs?: ApiCampus[]
}

/** Aula data from /api/aulas */
interface ApiAula {
  id: number
  sedeId: number | null
  capacidad: number
  activa: boolean
}

/** Aulas API response */
interface AulasApiResponse {
  success: boolean
  data: ApiAula[]
}

export default function SedesPage() {
  const router = useRouter()
  const [view, setView] = useViewPreference('sedes')
  const [sedes, setSedes] = useState<Sede[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'todas' | 'physical' | 'virtual'>('todas')

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        setErrorMessage(null)

        // Fetch campuses and aulas in parallel
        const [campusRes, aulasRes] = await Promise.all([
          fetch('/api/campuses?limit=100&sort=createdAt', { cache: 'no-cache' }),
          fetch('/api/aulas', { cache: 'no-cache' }),
        ])

        if (!campusRes.ok) {
          throw new Error('No se pudieron cargar las sedes')
        }

        const campusPayload = (await campusRes.json()) as CampusesApiResponse
        const aulasPayload = aulasRes.ok
          ? ((await aulasRes.json()) as AulasApiResponse)
          : { success: false, data: [] }

        const docs: ApiCampus[] = (Array.isArray(campusPayload.docs) ? campusPayload.docs : []).filter(
          (campus) => campus.active !== false
        )
        const aulas: ApiAula[] = aulasPayload.success ? aulasPayload.data : []

        // Build lookup: campusId → { count, totalCapacity }
        const aulasByCampus = new Map<number, { count: number; capacidad: number }>()
        for (const aula of aulas) {
          if (aula.sedeId !== null && aula.activa) {
            const existing = aulasByCampus.get(aula.sedeId) ?? { count: 0, capacidad: 0 }
            aulasByCampus.set(aula.sedeId, {
              count: existing.count + 1,
              capacidad: existing.capacidad + aula.capacidad,
            })
          }
        }

        const mapped: Sede[] = docs.map((campus: ApiCampus) => {
          const campusKind = campus.campus_kind === 'virtual' ? 'virtual' : 'physical'
          const operationalOwner = campus.operational_owner === 'acaten' || campus.operational_owner === 'aproem'
            ? campus.operational_owner
            : 'cep'
          const addressParts = campusKind === 'virtual' ? [] : [campus.address, campus.postal_code, campus.city].filter(Boolean)
          const campusStats = campusKind === 'virtual' ? undefined : aulasByCampus.get(Number(campus.id))
          return {
            id: campus.id,
            nombre: campus.name ?? 'Sede',
            direccion: addressParts.join(', ') || (campusKind === 'virtual' ? 'Unidad operativa virtual' : 'Dirección pendiente'),
            telefono: campus.phone ?? '—',
            email: campus.email ?? '—',
            horario: 'Lunes a Viernes 08:00 - 20:00',
            aulas: campusStats?.count ?? 0,
            capacidad: campusStats?.capacidad ?? 0,
            cursosActivos: 0,
            profesores: Array.isArray(campus.staff_members) ? campus.staff_members.length : 0,
            color: 'bg-primary',
            borderColor: 'border-primary',
            imagen:
              campus.image && typeof campus.image === 'object' && campus.image.url
                ? campus.image.url
                : null,
            campusKind,
            operationalOwner,
          }
        })

        setSedes(mapped)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar sedes')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCampuses()
  }, [])

  const filteredSedes = sedes.filter((s) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      s.nombre.toLowerCase().includes(q) ||
      s.direccion.toLowerCase().includes(q)
    const matchesKind = kindFilter === 'todas' || s.campusKind === kindFilter
    return matchesSearch && matchesKind
  })

  const exportColumns: ExportColumn<Sede>[] = [
    { header: 'Sede', getValue: (sede) => sede.nombre },
    { header: 'Direccion', getValue: (sede) => sede.direccion },
    { header: 'Telefono', getValue: (sede) => sede.telefono },
    { header: 'Email', getValue: (sede) => sede.email },
    { header: 'Aulas', getValue: (sede) => sede.aulas },
    { header: 'Capacidad', getValue: (sede) => sede.capacidad },
    { header: 'Cursos activos', getValue: (sede) => sede.cursosActivos },
    { header: 'Tipo', getValue: (sede) => (sede.campusKind === 'virtual' ? 'Virtual' : 'Física') },
  ]

  const handleCsv = () =>
    downloadCsv(`sedes-${new Date().toISOString().slice(0, 10)}.csv`, exportColumns, filteredSedes)

  const kpis = computeCampusDirectoryKpis(filteredSedes)

  return (
    <PremiumDirectoryShell
      scroll="page"
      title="Sedes"
      description="Centros físicos y aulas virtuales del tenant, con capacidad real de aulas."
      icon={MapPin}
      entityPlural="sedes"
      extraToolbar={
        <Button size="sm" className="shrink-0" disabled>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva sede</span>
        </Button>
      }
      onExportCsv={handleCsv}
      kpis={kpis}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Buscar sede…"
      segments={[
        { id: 'todas', label: 'Todas' },
        { id: 'physical', label: 'Físicas' },
        { id: 'virtual', label: 'Virtuales' },
      ]}
      selectedSegment={kindFilter}
      onSegmentChange={(value) => setKindFilter(value as typeof kindFilter)}
      viewMode={view === 'grid' ? 'grid' : 'table'}
      onViewModeChange={(mode) => setView(mode === 'grid' ? 'grid' : 'list')}
      columns={[
        {
          id: 'sede',
          header: 'Sede',
          render: (sede) => (
            <DirectoryAvatarCell
              name={sede.nombre}
              subtitle={sede.direccion}
              src={sede.imagen}
              initials={(sede.nombre ?? 'S').slice(0, 2).toUpperCase()}
            />
          ),
        },
        {
          id: 'tipo',
          header: 'Tipo',
          render: (sede) => (
            <DirectoryNeutralBadge>
              {sede.campusKind === 'virtual' ? 'Virtual' : 'Física'}
            </DirectoryNeutralBadge>
          ),
        },
        {
          id: 'aulas',
          header: 'Aulas',
          render: (sede) => String(sede.aulas || 0),
        },
        {
          id: 'capacidad',
          header: 'Capacidad',
          render: (sede) => String(sede.capacidad || 0),
        },
        {
          id: 'contacto',
          header: 'Contacto',
          render: (sede) => sede.telefono || sede.email || '—',
        },
      ]}
      rows={filteredSedes}
      loading={isLoading}
      error={errorMessage}
      emptyTitle={sedes.length === 0 ? 'No hay sedes registradas' : 'Sin resultados'}
      emptyDescription={
        sedes.length === 0
          ? 'Solicita el alta de la primera sede al equipo interno.'
          : searchQuery
            ? `Ninguna sede coincide con “${searchQuery}”.`
            : undefined
      }
      onRowOpen={(sede) => router.push(`/dashboard/sedes/${sede.id}`)}
      onRowEdit={(sede) => router.push(`/dashboard/sedes/${sede.id}/editar`)}
      renderGrid={(pageRows) => (
        <div className={ACADEMIC_LISTING_GRID_CLASS} data-oid="sgmd.g2">
          {pageRows.map((sede) => (
            <AcademicEntityCard
              key={sede.id}
              title={sede.nombre}
              image={sede.imagen}
              href={`/dashboard/sedes/${sede.id}`}
              onCtaClick={() => router.push(`/dashboard/sedes/${sede.id}/editar`)}
              badge={
                <Badge variant="static" className="text-[10px] font-medium">
                  {sede.campusKind === 'virtual' ? 'Virtual' : 'Física'}
                </Badge>
              }
              tiles={[
                <span key="address">{sede.direccion}</span>,
                <span key="rooms">
                  {sede.aulas || 0} aulas · {sede.capacidad || 0} plazas
                </span>,
              ]}
            />
          ))}
        </div>
      )}
    />
  )
}
