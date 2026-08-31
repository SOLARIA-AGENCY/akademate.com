'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { MapPin, DoorOpen, Users, BookOpen, Phone, Mail, Plus } from 'lucide-react'
import { SedeListItem } from '@payload-config/components/ui/SedeListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { usePlanLimits } from '@payload-config/hooks/usePlanLimits'
import { PlanLimitModal } from '@payload-config/components/ui/PlanLimitModal'
import { UsageBar } from '@payload-config/components/ui/UsageBar'
import { ListingKpiStrip } from '@payload-config/components/ui/listing-kpi'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import { getLimit } from '@payload-config/lib/planLimits'
import { getPublicCampusImage } from '@/app/lib/public-campus-assets'
import {
  ListingSearch,
  PremiumDirectoryShell,
} from '@payload-config/components/directory/PremiumDirectoryShell'

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
  taxId: string | null
  locationChips: string[]
  verificationStatus: 'VERIFIED' | 'INTERNAL_ASSUMPTION' | null
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
  verification_status?: 'VERIFIED' | 'INTERNAL_ASSUMPTION' | string | null
  legal_entity?: { tax_id?: string; legal_form_short?: string } | number | null
  service_locations?: Array<{ name?: string; code?: string } | number>
  primary_location?: { name?: string; address_line_1?: string } | number | null
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
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [limitModal, setLimitModal] = useState<{ open: boolean; current: number; limit: number } | null>(null)

  const { checkLimit, plan } = usePlanLimits()

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        setErrorMessage(null)

        // Fetch campuses and aulas in parallel
        const [campusRes, aulasRes] = await Promise.all([
          fetch('/api/campuses?limit=100&depth=2&sort=name', { cache: 'no-cache' }),
          fetch('/api/aulas', { cache: 'no-cache' }),
        ])

        if (!campusRes.ok) {
          throw new Error('No se pudieron cargar las sedes')
        }

        const campusPayload = (await campusRes.json()) as CampusesApiResponse
        const aulasPayload = aulasRes.ok
          ? ((await aulasRes.json()) as AulasApiResponse)
          : { success: false, data: [] }

        const docs: ApiCampus[] = Array.isArray(campusPayload.docs) ? campusPayload.docs : []
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
          const locationChips = Array.isArray(campus.service_locations)
            ? campus.service_locations
                .map((location) =>
                  typeof location === 'object' && location
                    ? String(location.name ?? location.code ?? '').trim()
                    : '',
                )
                .filter(Boolean)
            : []
          const primaryName =
            campus.primary_location && typeof campus.primary_location === 'object'
              ? campus.primary_location.address_line_1 ?? campus.primary_location.name
              : null
          const addressParts = [
            primaryName,
            campus.address,
            campus.postal_code,
            campus.city,
          ].filter(Boolean)
          const campusStats = aulasByCampus.get(Number(campus.id))
          const taxId =
            campus.legal_entity && typeof campus.legal_entity === 'object'
              ? campus.legal_entity.tax_id ?? null
              : null
          return {
            id: campus.id,
            nombre: campus.name ?? 'Sede',
            direccion: addressParts.join(', ') || 'Dirección pendiente',
            telefono: campus.phone ?? '—',
            email: campus.email ?? '—',
            horario: 'Lunes a Viernes 08:00 - 20:00',
            aulas: campusStats?.count ?? 0,
            capacidad: campusStats?.capacidad ?? 0,
            cursosActivos: 0,
            profesores: Array.isArray(campus.staff_members) ? campus.staff_members.length : 0,
            color: 'bg-primary',
            borderColor: 'border-primary',
            imagen: getPublicCampusImage(
              campus.id,
              campus.image && typeof campus.image === 'object' && campus.image.url
                ? campus.image.url
                : null,
            ),
            taxId,
            locationChips,
            verificationStatus:
              campus.verification_status === 'INTERNAL_ASSUMPTION' ? 'INTERNAL_ASSUMPTION' : 'VERIFIED',
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

  const handleAdd = () => {
    const { allowed, limit } = checkLimit('sedes', sedes.length)
    if (!allowed) {
      setLimitModal({ open: true, current: sedes.length, limit })
      return
    }
    router.push('/dashboard/sedes/nueva')
  }

  const filteredSedes = sedes.filter((sede) => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return true
    return (
      sede.nombre.toLowerCase().includes(query) || sede.direccion.toLowerCase().includes(query)
    )
  })

  const totalAulas = sedes.reduce((sum, sede) => sum + (sede.aulas || 0), 0)
  const totalPlazas = sedes.reduce((sum, sede) => sum + (sede.capacidad || 0), 0)
  const totalProfesores = sedes.reduce((sum, sede) => sum + (sede.profesores || 0), 0)

  return (
    <div className="space-y-6" data-oid="5.ig9gq">
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

      <PageHeader
        title="Sedes"
        icon={MapPin}
        actions={
          <Button onClick={handleAdd} data-oid="hrtnwkn">
            <Plus className="h-4 w-4" />
            Nueva Sede
          </Button>
        }
        data-oid="e1:wo92"
      />

      <ListingKpiStrip
        items={[
          { label: 'Sedes', value: sedes.length },
          { label: 'Aulas', value: totalAulas },
          { label: 'Plazas', value: totalPlazas },
          { label: 'Docentes', value: totalProfesores },
        ]}
      />

      <PremiumDirectoryShell
        search={
          <ListingSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar sede..."
          />
        }
        view={<ViewToggle view={view} onViewChange={setView} />}
      />

      <UsageBar resource="sedes" current={sedes.length} limit={getLimit(plan, 'sedes')} />

      {!isLoading && sedes.length === 0 ? (
        <Card data-oid="kmn6z-k">
          <CardContent className="p-8 text-center" data-oid="z8f:dzt">
            <p className="text-base font-medium" data-oid="0di11bc">
              No hay sedes registradas
            </p>
            <p className="mt-1 text-sm text-muted-foreground" data-oid="pfv-9.9">
              Crea tu primera sede desde el panel de administración de campus.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {view === 'grid' ? (
        <div className="grid gap-6 lg:grid-cols-2" data-oid="sgmd.g2">
          {filteredSedes.map((sede) => (
            <Card
              key={sede.id}
              className="cursor-pointer overflow-hidden"
              onClick={() => handleViewSede(sede.id)}
              data-oid="x43z8n_"
            >
              <CardContent className="space-y-5 p-6" data-oid="rke.tyb">
                <div className="flex items-start gap-4">
                  <EntityThumb src={sede.imagen} alt={sede.nombre} fallback="campus" size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold leading-tight" data-oid="ccek8r3">
                      {sede.nombre}
                    </h3>
                    <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                      <Badge
                        variant="static"
                        className="border-emerald-200 bg-emerald-50 text-emerald-800"
                      >
                        Activo
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground" data-oid="1li66s3">
                      {sede.direccion}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2" data-oid="jks8htn">
                  <div className="flex min-w-0 items-center gap-2" data-oid="qpi.:t:">
                    <Phone className="h-4 w-4 flex-shrink-0" data-oid="4stws:y" />
                    <span className="truncate" data-oid="r3x6t9d">
                      {sede.telefono}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2" data-oid="m0sxcka">
                    <Mail className="h-4 w-4 flex-shrink-0" data-oid="9ucksis" />
                    <span className="truncate" data-oid="05pc1xv">
                      {sede.email}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t pt-4" data-oid="ukx44fj">
                  <div className="rounded-md border bg-muted/20 p-3" data-oid="sede-aulas">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <DoorOpen className="h-3.5 w-3.5" data-oid="calvmou" />
                      Aulas
                    </div>
                    <p className="mt-1 text-xl font-semibold">{sede.aulas || '—'}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3" data-oid="sede-capacidad">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Users className="h-3.5 w-3.5" data-oid="2umu.g." />
                      Plazas
                    </div>
                    <p className="mt-1 text-xl font-semibold">{sede.capacidad || '—'}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3" data-oid="sede-cursos">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" data-oid="08kaha8" />
                      Cursos
                    </div>
                    <p className="mt-1 text-xl font-semibold">{sede.cursosActivos || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-4" data-oid="sede-footer">
                  <div className="min-w-0" data-oid="x6kzf:k">
                    <p className="text-xs font-medium text-muted-foreground">
                      Centro
                    </p>
                    <p className="truncate text-sm font-medium">{sede.nombre}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      handleViewSede(sede.id)
                    }}
                    data-oid="ljzu3kn"
                  >
                    Ver sede
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2" data-oid="fc.70tp">
          {filteredSedes.map((sede) => (
            <SedeListItem
              key={sede.id}
              sede={sede}
              onClick={() => handleViewSede(sede.id)}
              data-oid="57xdg7e"
            />
          ))}
        </div>
      )}

      {limitModal && (
        <PlanLimitModal
          open={limitModal.open}
          onClose={() => setLimitModal(null)}
          resource="sedes"
          current={limitModal.current}
          limit={limitModal.limit}
          plan={plan}
        />
      )}
    </div>
  )
}
