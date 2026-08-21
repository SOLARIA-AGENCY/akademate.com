'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import {
  ACADEMIC_ENTITY_META_CLASS,
  ACADEMIC_LISTING_GRID_CLASS,
  AcademicEntityCard,
  CAMPUS_LIST_COLUMNS,
  DashboardListingLayout,
  DashboardToolbar,
  ListingActions,
  ListingColumnBoard,
} from '@payload-config/components/akademate/dashboard'
import { ACADEMIC_FALLBACK_IMAGES } from '@/app/lib/academic-template-mocks'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { downloadCsv, printTable, type ExportColumn } from '@/app/lib/dashboard-export'
import { isVirtualCampus } from '@/src/domain/cep-operational-units'
import { getPublicCampusImage } from '@/app/lib/public-campus-assets'

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
              getPublicCampusImage(
                campus.name,
                campus.image && typeof campus.image === 'object' && campus.image.url
                  ? campus.image.url
                  : null,
              ) ?? ACADEMIC_FALLBACK_IMAGES.campus,
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

  const handleViewSede = (sedeId: string) => {
    router.push(`/dashboard/sedes/${sedeId}`)
  }

  const filteredSedes = searchQuery
    ? sedes.filter((s) => {
        const q = searchQuery.toLowerCase()
        return s.nombre.toLowerCase().includes(q) || s.direccion.toLowerCase().includes(q)
      })
    : sedes

  const exportColumns: ExportColumn<Sede>[] = [
    { header: 'Sede', getValue: (sede) => sede.nombre },
    { header: 'Direccion', getValue: (sede) => sede.direccion },
    { header: 'Telefono', getValue: (sede) => sede.telefono },
    { header: 'Email', getValue: (sede) => sede.email },
    { header: 'Aulas', getValue: (sede) => sede.aulas },
    { header: 'Capacidad', getValue: (sede) => sede.capacidad },
    { header: 'Cursos activos', getValue: (sede) => sede.cursosActivos },
  ]

  const handlePrint = () => printTable('Sedes', exportColumns, sedes)
  const handleCsv = () =>
    downloadCsv(`sedes-${new Date().toISOString().slice(0, 10)}.csv`, exportColumns, sedes)

  return (
    <DashboardListingLayout
      title="Sedes"
      icon={MapPin}
      actions={
        <ListingActions onPrint={handlePrint} onCsv={handleCsv}>
          <Button size="sm" className="shrink-0" onClick={() => router.push('/dashboard/sedes/nueva')}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva sede</span>
          </Button>
        </ListingActions>
      }
      toolbar={
        <DashboardToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar sede…"
          viewToggle={<ViewToggle view={view} onViewChange={setView} data-oid="3df3n_r" />}
        />
      }
    >
      {isLoading && (
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid="d-5l0yh"
        >
          Cargando sedes...
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
          data-oid="u6bao05"
        >
          {errorMessage}
        </div>
      )}

      {!isLoading && sedes.length === 0 ? (
        <Card data-oid="kmn6z-k">
          <CardContent className="p-8 text-center" data-oid="z8f:dzt">
            <p className="text-base font-medium" data-oid="0di11bc">
              No hay sedes registradas
            </p>
            <p className="mt-1 text-sm text-muted-foreground" data-oid="pfv-9.9">
              Crea la primera sede con Nueva sede.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && sedes.length > 0 && filteredSedes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-base font-medium">Sin resultados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ninguna sede coincide con &ldquo;{searchQuery}&rdquo;.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {view === 'grid' ? (
        <div className={ACADEMIC_LISTING_GRID_CLASS} data-oid="sgmd.g2">
          {filteredSedes.map((sede) => (
            <AcademicEntityCard
              key={sede.id}
              title={sede.nombre}
              image={sede.imagen}
              fallbackImage={ACADEMIC_FALLBACK_IMAGES.campus}
              onClick={() => handleViewSede(sede.id)}
              onCtaClick={() => router.push(`/dashboard/sedes/${sede.id}/editar`)}
              badge={
                <Badge variant="static" className="text-[10px] font-medium">
                  {isVirtualCampus({ campus_kind: sede.campusKind }) ? 'Virtual' : 'Física'}
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
      ) : (
        <ListingColumnBoard columns={CAMPUS_LIST_COLUMNS}>
          {filteredSedes.map((sede) => (
            <AcademicEntityCard
              key={sede.id}
              variant="list"
              title={sede.nombre}
              image={sede.imagen}
              fallbackImage={ACADEMIC_FALLBACK_IMAGES.campus}
              onClick={() => handleViewSede(sede.id)}
              onCtaClick={() => router.push(`/dashboard/sedes/${sede.id}/editar`)}
              badge={
                <Badge variant="static" className="text-[10px] font-medium">
                  {isVirtualCampus({ campus_kind: sede.campusKind }) ? 'Virtual' : 'Física'}
                </Badge>
              }
              listCells={[
                <span key="address" className={ACADEMIC_ENTITY_META_CLASS}>
                  {sede.direccion}
                </span>,
                <span key="rooms" className={ACADEMIC_ENTITY_META_CLASS}>
                  {sede.aulas || 0} / {sede.capacidad || 0}
                </span>,
              ]}
            />
          ))}
        </ListingColumnBoard>
      )}
    </DashboardListingLayout>
  )
}
