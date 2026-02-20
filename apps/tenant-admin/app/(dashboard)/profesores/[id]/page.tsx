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

export default function ProfesorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const professorId = params.id as string

  const [professor, setProfessor] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
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
        const foundProfessor = result.data.find(
          (s: StaffMember) => s.id.toString() === professorId
        )

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando información del profesor...</p>
        </div>
      </div>
    )
  }

  if (error || !professor) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-semibold">Error al cargar profesor</p>
            <p className="text-sm text-muted-foreground">{error || 'Profesor no encontrado'}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()}>Volver</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
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
    freelance: 'Freelance',
  }

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    temporary_leave: 'Baja Temporal',
    inactive: 'Inactivo',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={professor.fullName}
        description={professor.position}
        icon={User}
        actions={(
          <>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button onClick={() => router.push(`/profesores/${professorId}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Profesor
            </Button>
          </>
        )}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Photo and Basic Info */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 space-y-6">
            {/* Photo */}
            <div className="flex flex-col items-center">
              {professor.photo ? (
                <img
                  src={professor.photo}
                  alt={professor.fullName}
                  className="h-48 w-48 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-6xl font-bold">
                    {professor.firstName[0]}
                    {professor.lastName[0]}
                  </span>
                </div>
              )}
              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold">{professor.fullName}</h2>
                <p className="text-sm text-muted-foreground">{professor.position}</p>
              </div>
            </div>

            <Separator />

            {/* Status Badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={professor.employmentStatus === 'active' ? 'default' : 'secondary'}>
                  {statusLabels[professor.employmentStatus] || professor.employmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contrato</span>
                <Badge variant="outline">
                  {contractTypeLabels[professor.contractType] || professor.contractType}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Información de Contacto
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${professor.email}`} className="hover:underline">
                    {professor.email}
                  </a>
                </div>
                {professor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${professor.phone}`} className="hover:underline">
                      {professor.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {professor.hireDate && (
              <>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Fecha de Contratación</p>
                    <p className="font-medium">
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
        <div className="md:col-span-2 space-y-6">
          {/* Bio */}
          {professor.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{professor.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Campuses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Sedes Asignadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {professor.assignedCampuses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {professor.assignedCampuses.map((campus) => (
                    <div
                      key={campus.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{campus.name}</p>
                        <p className="text-sm text-muted-foreground">{campus.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tiene sedes asignadas</p>
              )}
            </CardContent>
          </Card>

          {/* Course Runs (Convocatorias) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Convocatorias Asignadas
                {professor.courseRunsCount ? (
                  <Badge variant="secondary" className="ml-2">
                    {professor.courseRunsCount}
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {professor.courseRuns && professor.courseRuns.length > 0 ? (
                <div className="space-y-4">
                  {professor.courseRuns.map((courseRun) => (
                    <div
                      key={courseRun.id}
                      className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-base">{courseRun.courseName}</h4>
                            <Badge
                              variant={
                                courseRun.status === 'active'
                                  ? 'default'
                                  : courseRun.status === 'scheduled'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {courseRun.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Código: {courseRun.codigo}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {courseRun.campusName} - {courseRun.campusCity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tiene convocatorias asignadas actualmente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Detalles de Empleo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Contrato</p>
                  <p className="font-medium">
                    {contractTypeLabels[professor.contractType] || professor.contractType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado de Empleo</p>
                  <p className="font-medium">
                    {statusLabels[professor.employmentStatus] || professor.employmentStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Personal</p>
                  <p className="font-medium capitalize">{professor.staffType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID del Profesor</p>
                  <p className="font-medium">#{professor.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span className="font-medium">
                    {new Date(professor.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span className="font-medium">
                    {new Date(professor.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
        <Button onClick={() => router.push(`/profesores/${professorId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Profesor
        </Button>
      </div>
    </div>
  )
}
