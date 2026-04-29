'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Separator } from '@payload-config/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  User,
  Loader2,
  Building2,
  GraduationCap,
  Trash2,
} from 'lucide-react'

interface CourseRun {
  id: number
  codigo: string
  status: string
  startDate: string
  endDate: string
  courseName: string
  courseSlug: string
  campusName: string
  campusCity: string
}

interface StaffMember {
  id: number
  staffType: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  position: string
  contractType: string
  employmentStatus: string
  photoId?: number | null
  photo: string
  bio?: string
  assignedCampuses: {
    id: number
    name: string
    city: string
  }[]
  courseRuns?: CourseRun[]
  courseRunsCount?: number
  isActive: boolean
  hireDate?: string
  createdAt: string
  updatedAt: string
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

function TeacherPhotoFallback({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isLarge = size === 'large'
  return (
    <div
      aria-label="Imagen genérica de docente"
      className={[
        'relative flex items-center justify-center rounded-full border bg-primary/10 text-primary shadow-lg',
        isLarge ? 'h-48 w-48' : 'h-16 w-16',
      ].join(' ')}
    >
      <User className={isLarge ? 'h-20 w-20' : 'h-7 w-7'} />
      <div className="absolute right-2 top-2 rounded-full border bg-background p-2 shadow-sm">
        <GraduationCap className={isLarge ? 'h-7 w-7' : 'h-4 w-4'} />
      </div>
    </div>
  )
}

export default function ProfesorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const professorId = params.id as string

  const [professor, setProfessor] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfessor() {
      try {
        setLoading(true)
        const response = await fetch('/api/staff?type=profesor&limit=100')

        if (!response.ok) {
          throw new Error('Failed to load professor data')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error('API returned error')
        }

        // Find the specific professor
        const foundProfessor = result.data.find((s: StaffMember) => s.id.toString() === professorId)

        if (!foundProfessor) {
          throw new Error('Professor not found')
        }

        setProfessor(foundProfessor)
        setError(null)
      } catch (err) {
        console.error('Error loading professor:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (professorId) {
      loadProfessor()
    }
  }, [professorId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="j7:sitz">
        <div className="text-center space-y-4" data-oid="w.7r12z">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" data-oid="b7jynm2" />
          <p className="text-muted-foreground" data-oid="ddh5-jw">
            Cargando información del profesor...
          </p>
        </div>
      </div>
    )
  }

  if (error || !professor) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="7j2iy7-">
        <Card className="max-w-md" data-oid=".d0xgey">
          <CardContent className="pt-6 text-center space-y-4" data-oid="dkd966.">
            <p className="text-destructive font-semibold" data-oid="lkwbblq">
              Error al cargar profesor
            </p>
            <p className="text-sm text-muted-foreground" data-oid="ebr1g00">
              {error || 'Profesor no encontrado'}
            </p>
            <div className="flex gap-2 justify-center" data-oid="4u1j:xq">
              <Button onClick={() => router.back()} data-oid="5.bfae9">
                Volver
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} data-oid="fl2zb4k">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contractTypeLabels: Record<string, string> = {
    full_time: 'Tiempo Completo',
    part_time: 'Medio Tiempo',
    freelance: 'Autónomo',
  }

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    temporary_leave: 'Baja Temporal',
    inactive: 'Inactivo',
  }

  const handleRemovePhoto = async () => {
    if (!professor || removingPhoto) return

    setRemovingPhoto(true)
    setError(null)
    try {
      const response = await fetch(`/api/staff?id=${professorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: null }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || result?.success === false) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'No se pudo eliminar la foto')
      }

      setProfessor((current) =>
        current ? { ...current, photoId: null, photo: '/placeholder-avatar.svg' } : current,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la foto')
    } finally {
      setRemovingPhoto(false)
    }
  }

  const hasCustomPhoto = !isPlaceholderPhoto(professor.photo)

  return (
    <div className="space-y-6" data-oid=".5h6m09">
      <PageHeader
        title={professor.fullName}
        description={professor.position}
        icon={User}
        actions={
          <>
            <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid="q3z:.qx">
              <ArrowLeft className="h-5 w-5" data-oid="1snqjt0" />
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/profesores/${professorId}/editar`)}
              data-oid="lojmz0i"
            >
              <Edit className="mr-2 h-4 w-4" data-oid="m-r0wcw" />
              Editar Profesor
            </Button>
          </>
        }
        data-oid="i_9n5k8"
      />

      <div className="grid gap-6 md:grid-cols-3" data-oid="gcoo2ph">
        {/* Left Column - Photo and Basic Info */}
        <Card className="md:col-span-1" data-oid="d2j-.g8">
          <CardContent className="pt-6 space-y-6" data-oid="bzau5u3">
            {/* Photo */}
            <div className="flex flex-col items-center" data-oid="8ush656">
              {!isPlaceholderPhoto(professor.photo) ? (
                <img
                  src={professor.photo}
                  alt={professor.fullName}
                  className="h-48 w-48 rounded-full object-cover border-4 border-background shadow-lg"
                  onError={() =>
                    setProfessor((current) =>
                      current ? { ...current, photo: '/placeholder-avatar.svg' } : current,
                    )
                  }
                  data-oid="-ttwq2p"
                />
              ) : (
                <TeacherPhotoFallback />
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/profesores/${professorId}/editar`)}
                >
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Cambiar foto
                </Button>
                {hasCustomPhoto ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={removingPhoto}
                    onClick={handleRemovePhoto}
                  >
                    {removingPhoto ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    Eliminar foto
                  </Button>
                ) : null}
              </div>
              <div className="mt-4 text-center" data-oid="xlofrur">
                <h2 className="text-xl font-bold" data-oid="s.pjw6y">
                  {professor.fullName}
                </h2>
                <p className="text-sm text-muted-foreground" data-oid="_t8dsn8">
                  {professor.position}
                </p>
              </div>
            </div>

            <Separator data-oid="6hzyq45" />

            {/* Status Badges */}
            <div className="space-y-3" data-oid="91p6q7m">
              <div className="flex items-center justify-between" data-oid="mwdit8:">
                <span className="text-sm text-muted-foreground" data-oid="yc6qu9x">
                  Estado
                </span>
                <Badge
                  variant={professor.employmentStatus === 'active' ? 'default' : 'secondary'}
                  data-oid=".w9t6n7"
                >
                  {statusLabels[professor.employmentStatus] || professor.employmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between" data-oid="bbzsgm:">
                <span className="text-sm text-muted-foreground" data-oid=":a.leh-">
                  Contrato
                </span>
                <Badge variant="outline" data-oid="en.tqka">
                  {contractTypeLabels[professor.contractType] || professor.contractType}
                </Badge>
              </div>
            </div>

            <Separator data-oid="d0trccx" />

            {/* Contact Info */}
            <div className="space-y-3" data-oid="b1zugzx">
              <h3
                className="text-sm font-semibold uppercase text-muted-foreground"
                data-oid="q9xfntm"
              >
                Información de Contacto
              </h3>
              <div className="space-y-2" data-oid="4hlgxlw">
                <div className="flex items-center gap-3 text-sm" data-oid="qnp5vh6">
                  <Mail className="h-4 w-4 text-muted-foreground" data-oid=":4rbdoa" />
                  <a
                    href={`mailto:${professor.email}`}
                    className="hover:underline"
                    data-oid="cw_3bbv"
                  >
                    {professor.email}
                  </a>
                </div>
                {professor.phone && (
                  <div className="flex items-center gap-3 text-sm" data-oid="vjg-xch">
                    <Phone className="h-4 w-4 text-muted-foreground" data-oid="yv9.7m8" />
                    <a
                      href={`tel:${professor.phone}`}
                      className="hover:underline"
                      data-oid="odnp8hl"
                    >
                      {professor.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {professor.hireDate && (
              <>
                <Separator data-oid="ysquwys" />
                <div className="flex items-center gap-3 text-sm" data-oid="n1.q_ru">
                  <Calendar className="h-4 w-4 text-muted-foreground" data-oid="q1k0rtq" />
                  <div data-oid="6y70g22">
                    <p className="text-muted-foreground" data-oid="scjvvkx">
                      Fecha de Contratación
                    </p>
                    <p className="font-medium" data-oid="nw84wx1">
                      {new Date(professor.hireDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Detailed Info */}
        <div className="md:col-span-2 space-y-6" data-oid="7zawug:">
          {/* Bio */}
          {professor.bio && (
            <Card data-oid="4nkdtyq">
              <CardHeader data-oid="f73cenx">
                <CardTitle className="flex items-center gap-2" data-oid="toje-_1">
                  <User className="h-5 w-5" data-oid="bek14tx" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="n0wbchg">
                <p className="text-muted-foreground leading-relaxed" data-oid="jbotr5z">
                  {professor.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Campuses */}
          <Card data-oid="w5zl1sf">
            <CardHeader data-oid="oft.cuq">
              <CardTitle className="flex items-center gap-2" data-oid=":2uugga">
                <MapPin className="h-5 w-5" data-oid="eut5go2" />
                Sedes Asignadas
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="i.-sa_p">
              {professor.assignedCampuses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2" data-oid="-sry:dm">
                  {professor.assignedCampuses.map((campus) => (
                    <div
                      key={campus.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      data-oid="kdufk12"
                    >
                      <Building2 className="h-5 w-5 text-primary" data-oid="hk3ptvr" />
                      <div data-oid=".cl8mfp">
                        <p className="font-medium" data-oid="ihj9yhg">
                          {campus.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-oid="rcn-hys">
                          {campus.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="67h8..m">
                  No tiene sedes asignadas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Course Runs (Convocatorias) */}
          <Card data-oid="ftaknd_">
            <CardHeader data-oid="o2xkexi">
              <CardTitle className="flex items-center gap-2" data-oid="nvdpxly">
                <Briefcase className="h-5 w-5" data-oid="8n83o8d" />
                Convocatorias Asignadas
                {professor.courseRunsCount ? (
                  <Badge variant="secondary" className="ml-2" data-oid="k67gb6g">
                    {professor.courseRunsCount}
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="7m5v27-">
              {professor.courseRuns && professor.courseRuns.length > 0 ? (
                <div className="space-y-4" data-oid="i-2.5.3">
                  {professor.courseRuns.map((courseRun) => (
                    <div
                      key={courseRun.id}
                      className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      data-oid="m6.q:dp"
                    >
                      <div className="flex items-start justify-between" data-oid="81:0z2k">
                        <div className="flex-1" data-oid="pck94z.">
                          <div className="flex items-center gap-2 mb-1" data-oid="tbajzug">
                            <h4 className="font-semibold text-base" data-oid="jx6vgmb">
                              {courseRun.courseName}
                            </h4>
                            <Badge
                              variant={
                                courseRun.status === 'active'
                                  ? 'default'
                                  : courseRun.status === 'scheduled'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              data-oid="y1vx6lt"
                            >
                              {courseRun.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground" data-oid="w0ryve-">
                            Código: {courseRun.codigo}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm" data-oid=".bq79f1">
                        <div
                          className="flex items-center gap-2 text-muted-foreground"
                          data-oid="cip7-0z"
                        >
                          <Calendar className="h-4 w-4" data-oid="w_rwktq" />
                          <span data-oid="cayz76c">
                            {new Date(courseRun.startDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            -{' '}
                            {new Date(courseRun.endDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-muted-foreground"
                          data-oid="sfxuwe-"
                        >
                          <MapPin className="h-4 w-4" data-oid="500_xym" />
                          <span data-oid="pd8w5:6">
                            {courseRun.campusName} - {courseRun.campusCity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="twab:1j">
                  No tiene convocatorias asignadas actualmente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card data-oid="a1:r32j">
            <CardHeader data-oid="vj:812h">
              <CardTitle className="flex items-center gap-2" data-oid="xtmg2cg">
                <Briefcase className="h-5 w-5" data-oid="6:c:3fx" />
                Detalles de Empleo
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="ac6x9rf">
              <div className="grid gap-4 md:grid-cols-2" data-oid="9elyyd_">
                <div data-oid="gjd_-h.">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="dgj5a5c">
                    Tipo de Contrato
                  </p>
                  <p className="font-medium" data-oid="l7wuhs4">
                    {contractTypeLabels[professor.contractType] || professor.contractType}
                  </p>
                </div>
                <div data-oid="levhp16">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="ywn6qy7">
                    Estado de Empleo
                  </p>
                  <p className="font-medium" data-oid="8g:n_9_">
                    {statusLabels[professor.employmentStatus] || professor.employmentStatus}
                  </p>
                </div>
                <div data-oid="iux8-9o">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="_7epd5j">
                    Tipo de Personal
                  </p>
                  <p className="font-medium capitalize" data-oid="vhjs-2q">
                    {professor.staffType}
                  </p>
                </div>
                <div data-oid="5zfh_hc">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="w6dcmyz">
                    ID del Profesor
                  </p>
                  <p className="font-medium" data-oid="itw8qyy">
                    #{professor.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card data-oid="muug_5s">
            <CardHeader data-oid="blwr0zn">
              <CardTitle className="text-sm" data-oid="lgwcq9p">
                Metadatos
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="3iv8lc9">
              <div className="grid gap-2 text-sm" data-oid="iolrju1">
                <div className="flex justify-between" data-oid="b_fxjbs">
                  <span className="text-muted-foreground" data-oid="5::g66m">
                    Creado:
                  </span>
                  <span className="font-medium" data-oid="7r:olt-">
                    {new Date(professor.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="7k8uoe0">
                  <span className="text-muted-foreground" data-oid="52sd36j">
                    Última actualización:
                  </span>
                  <span className="font-medium" data-oid=":pg0o0q">
                    {new Date(professor.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end" data-oid="h.me6sd">
        <Button variant="outline" onClick={() => router.back()} data-oid="0e8m5ik">
          Volver
        </Button>
        <Button
          onClick={() => router.push(`/dashboard/profesores/${professorId}/editar`)}
          data-oid="awna7rh"
        >
          <Edit className="mr-2 h-4 w-4" data-oid="ljm_bgg" />
          Editar Profesor
        </Button>
      </div>
    </div>
  )
}
