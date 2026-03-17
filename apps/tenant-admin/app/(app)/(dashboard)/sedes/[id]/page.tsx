'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Edit,
  Clock,
  DoorOpen,
  Users,
  BookOpen,
  Building2,
} from 'lucide-react'

interface ApiCampus {
  id: string
  name?: string
  city?: string
  address?: string
  postal_code?: string
  phone?: string
  email?: string
  metadata?: Record<string, unknown>
  staff_members?: unknown[]
}

interface SedeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export default function SedeDetailPage({ params }: SedeDetailPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  const [sede, setSede] = React.useState<ApiCampus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const fetchSede = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch(`/api/campuses/${id}`, { cache: 'no-store' })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('La sede solicitada no existe.')
          }
          throw new Error('No se pudo cargar la sede.')
        }

        const payload = (await response.json()) as ApiCampus
        if (isMounted) {
          setSede(payload)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Error desconocido al cargar la sede.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchSede()

    return () => {
      isMounted = false
    }
  }, [id])

  const metadata = (sede?.metadata ?? {}) as Record<string, unknown>
  const aulas = toNumber(metadata.aulas)
  const capacidad = toNumber(metadata.capacidad)
  const cursosActivos = toNumber(metadata.cursosActivos)
  const profesores = Array.isArray(sede?.staff_members)
    ? sede.staff_members.length
    : toNumber(metadata.profesores)
  const horario =
    typeof metadata.horario === 'string' ? metadata.horario : 'Lunes a Viernes 08:00 - 20:00'
  const descripcion =
    typeof metadata.descripcion === 'string'
      ? metadata.descripcion
      : 'Sede activa en el ecosistema AKADEMATE. Los datos operativos se sincronizan desde el módulo de campus.'

  const fullAddress =
    [sede?.address, sede?.postal_code, sede?.city].filter(Boolean).join(', ') ||
    'Dirección pendiente'

  if (isLoading) {
    return (
      <div className="space-y-6" data-oid="_h4fpc_">
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid=":2piqpl"
        >
          Cargando sede...
        </div>
      </div>
    )
  }

  if (errorMessage || !sede) {
    return (
      <div className="space-y-6" data-oid="ynb4vry">
        <PageHeader
          title="Sede"
          description="Detalle de sede"
          icon={MapPin}
          actions={
            <Button variant="ghost" onClick={() => router.push('/sedes')} data-oid="2f9.lcr">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="gpvydur" />
              Volver a Sedes
            </Button>
          }
          data-oid="ow1lezo"
        />

        <Card data-oid="3r-.6py">
          <CardContent className="p-8 text-center" data-oid="3884qgz">
            <p className="text-base font-medium" data-oid="k9swd.f">
              No se pudo cargar la sede
            </p>
            <p className="mt-1 text-sm text-muted-foreground" data-oid="fiezwu2">
              {errorMessage ?? 'Sede no encontrada.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-oid="74-lnut">
      <PageHeader
        title={sede.name ?? 'Sede'}
        description="Detalle de sede conectado a datos reales de Campus"
        icon={MapPin}
        badge={
          <Badge variant="secondary" data-oid="zqsbbgw">
            ID {sede.id}
          </Badge>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push('/sedes')} data-oid="sgaz9l8">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="kx_0id0" />
              Volver a Sedes
            </Button>
            <Button onClick={() => router.push(`/sedes/${id}/editar`)} data-oid="mky85cl">
              <Edit className="mr-2 h-4 w-4" data-oid="ni_7ire" />
              Editar Sede
            </Button>
          </>
        }
        data-oid="m6s4hoa"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-oid="r95ln63">
        <Card data-oid="fvh4j3m">
          <CardContent className="p-4" data-oid="njsu0on">
            <div className="flex items-center justify-between" data-oid="ytupdrn">
              <span className="text-sm text-muted-foreground" data-oid="1ms3cp9">
                Aulas
              </span>
              <DoorOpen className="h-4 w-4 text-primary" data-oid="7-n6-.m" />
            </div>
            <p className="mt-2 text-2xl font-semibold" data-oid="xbrd.72">
              {aulas}
            </p>
          </CardContent>
        </Card>
        <Card data-oid="h306h9v">
          <CardContent className="p-4" data-oid="oqo70_9">
            <div className="flex items-center justify-between" data-oid="ezs5:vj">
              <span className="text-sm text-muted-foreground" data-oid="twpr42-">
                Capacidad
              </span>
              <Users className="h-4 w-4 text-primary" data-oid="l-e0n:8" />
            </div>
            <p className="mt-2 text-2xl font-semibold" data-oid="vh1np_v">
              {capacidad}
            </p>
          </CardContent>
        </Card>
        <Card data-oid="-1o588-">
          <CardContent className="p-4" data-oid="g.l4862">
            <div className="flex items-center justify-between" data-oid="mon-3qh">
              <span className="text-sm text-muted-foreground" data-oid="-:1abd8">
                Cursos Activos
              </span>
              <BookOpen className="h-4 w-4 text-primary" data-oid="a8_94:p" />
            </div>
            <p className="mt-2 text-2xl font-semibold" data-oid="kz-dshy">
              {cursosActivos}
            </p>
          </CardContent>
        </Card>
        <Card data-oid="br-k0_5">
          <CardContent className="p-4" data-oid="0sbmmld">
            <div className="flex items-center justify-between" data-oid="szfh9jh">
              <span className="text-sm text-muted-foreground" data-oid="dy1nf-b">
                Profesores
              </span>
              <Building2 className="h-4 w-4 text-primary" data-oid="43:vok-" />
            </div>
            <p className="mt-2 text-2xl font-semibold" data-oid="kx18rq0">
              {profesores}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3" data-oid="gm0:a9d">
        <Card className="md:col-span-2" data-oid="ortpy0u">
          <CardHeader data-oid="::9chsm">
            <CardTitle data-oid="b_hxbnu">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm" data-oid="ij7u-pz">
            <div className="flex items-start gap-2 text-muted-foreground" data-oid="7079t3z">
              <MapPin className="mt-0.5 h-4 w-4" data-oid="o9di_1p" />
              <span data-oid="bm9a72z">{fullAddress}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground" data-oid="brtz603">
              <Phone className="mt-0.5 h-4 w-4" data-oid="_0531_h" />
              <span data-oid="cf0qvul">{sede.phone ?? 'Teléfono pendiente'}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground" data-oid="o3b3e-c">
              <Mail className="mt-0.5 h-4 w-4" data-oid="1tbspd3" />
              <span data-oid="va4pj:4">{sede.email ?? 'Email pendiente'}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground" data-oid="4:ej:l_">
              <Clock className="mt-0.5 h-4 w-4" data-oid="8l-usul" />
              <span data-oid="remf4r9">{horario}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-oid="i1unw_x">
          <CardHeader data-oid="ltfc-ev">
            <CardTitle data-oid="_v3eb0i">Descripción</CardTitle>
          </CardHeader>
          <CardContent data-oid="kjq.c6.">
            <p className="text-sm text-muted-foreground leading-relaxed" data-oid="20s_0ko">
              {descripcion}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
