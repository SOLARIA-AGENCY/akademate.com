'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { MapPin, DoorOpen, Users, BookOpen, Phone, Mail } from 'lucide-react'
import { SedeListItem } from '@payload-config/components/ui/SedeListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { usePlanLimits } from '@payload-config/hooks/usePlanLimits'
import { PlanLimitModal } from '@payload-config/components/ui/PlanLimitModal'
import { UsageBar } from '@payload-config/components/ui/UsageBar'
import { getLimit } from '@payload-config/lib/planLimits'

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
  imagen: string
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
  const [limitModal, setLimitModal] = useState<{ open: boolean; current: number; limit: number } | null>(null)

  const { checkLimit, plan } = usePlanLimits()

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
          const addressParts = [campus.address, campus.postal_code, campus.city].filter(Boolean)
          const campusStats = aulasByCampus.get(Number(campus.id))
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
            imagen:
              'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop',
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
    router.push(`/sedes/${sedeId}`)
  }

  const handleAdd = () => {
    const { allowed, limit } = checkLimit('sedes', sedes.length)
    if (!allowed) {
      setLimitModal({ open: true, current: sedes.length, limit })
      return
    }
    router.push('/sedes/nueva')
  }

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
        description="Vista simplificada para operación diaria."
        icon={MapPin}
        badge={
          <Badge variant="secondary" data-oid="0fk8_-.">
            {sedes.length} centros
          </Badge>
        }
        actions={
          <Button onClick={handleAdd} data-oid="hrtnwkn">
            Nueva Sede
          </Button>
        }
        filters={
          <div className="flex w-full items-center justify-end gap-3" data-oid="-_wk.s:">
            <ViewToggle view={view} onViewChange={setView} data-oid="3df3n_r" />
          </div>
        }
        data-oid="e1:wo92"
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-oid="sgmd.g2">
          {sedes.map((sede) => (
            <Card
              key={sede.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleViewSede(sede.id)}
              data-oid="x43z8n_"
            >
              <CardContent className="space-y-4 p-5" data-oid="rke.tyb">
                <div className="flex items-center gap-3" data-oid="mjlo9s9">
                  <img
                    src={sede.imagen}
                    alt={sede.nombre}
                    className="h-12 w-12 rounded-md object-cover"
                    data-oid="x6gliby"
                  />

                  <div className="min-w-0" data-oid="x6kzf:k">
                    <h3 className="truncate text-base font-semibold" data-oid="ccek8r3">
                      {sede.nombre}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground" data-oid="1li66s3">
                      {sede.direccion}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground" data-oid="jks8htn">
                  <div className="flex items-center gap-2" data-oid="qpi.:t:">
                    <Phone className="h-4 w-4" data-oid="4stws:y" />
                    <span className="truncate" data-oid="r3x6t9d">
                      {sede.telefono}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" data-oid="m0sxcka">
                    <Mail className="h-4 w-4" data-oid="9ucksis" />
                    <span className="truncate" data-oid="05pc1xv">
                      {sede.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-3" data-oid="ukx44fj">
                  {sede.aulas === 0 ? (
                    <span
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      data-oid="5b::092"
                    >
                      <DoorOpen className="h-3.5 w-3.5" data-oid="calvmou" />
                      Sin configurar
                    </span>
                  ) : (
                    <Badge variant="outline" className="gap-1" data-oid="btqx3p6">
                      <DoorOpen className="h-3.5 w-3.5" data-oid="12kx8xg" />
                      {sede.aulas} aulas
                    </Badge>
                  )}
                  {sede.capacidad === 0 ? (
                    <span
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      data-oid="xymzd2i"
                    >
                      <Users className="h-3.5 w-3.5" data-oid="2umu.g." />
                      Sin configurar
                    </span>
                  ) : (
                    <Badge variant="outline" className="gap-1" data-oid="4els9ku">
                      <Users className="h-3.5 w-3.5" data-oid="v.xcemg" />
                      {sede.capacidad} capacidad
                    </Badge>
                  )}
                  {sede.cursosActivos === 0 ? (
                    <span
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      data-oid="oii.nec"
                    >
                      <BookOpen className="h-3.5 w-3.5" data-oid="08kaha8" />
                      Sin configurar
                    </span>
                  ) : (
                    <Badge variant="outline" className="gap-1" data-oid="i03248n">
                      <BookOpen className="h-3.5 w-3.5" data-oid="u_6bt35" />
                      {sede.cursosActivos} cursos
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    handleViewSede(sede.id)
                  }}
                  data-oid="ljzu3kn"
                >
                  Ver sede
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2" data-oid="fc.70tp">
          {sedes.map((sede) => (
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
