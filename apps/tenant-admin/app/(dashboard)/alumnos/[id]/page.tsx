'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Avatar, AvatarFallback } from '@payload-config/components/ui/avatar'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  User,
} from 'lucide-react'

interface StudentDetailPageProps {
  params: Promise<{ id: string }>
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  active: boolean
  enrolled_courses: number
  completed_courses: number
  sede: string
  curso_actual: string
  ciclo: string
  fecha_inscripcion: string
}

interface StudentApiDoc {
  id: string | number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: string
  createdAt?: string
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  const [student, setStudent] = React.useState<Student | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        // Buscar en la lista de alumnos por ID (Payload no tiene endpoint individual para students aún)
        const response = await fetch(`/api/students?limit=200`, { cache: 'no-cache' })
        const result = await response.json() as { docs?: StudentApiDoc[] }

        const docs: StudentApiDoc[] = Array.isArray(result.docs) ? result.docs : []
        const doc = docs.find((d) => String(d.id) === id)

        if (doc) {
          setStudent({
            id: String(doc.id),
            first_name: doc.first_name ?? '',
            last_name: doc.last_name ?? '',
            email: doc.email ?? '—',
            phone: doc.phone ?? '—',
            active: doc.status ? doc.status === 'active' : true,
            enrolled_courses: 0,
            completed_courses: 0,
            sede: 'Sin sede',
            curso_actual: '—',
            ciclo: '—',
            fecha_inscripcion: doc.createdAt ?? '',
          })
        } else {
          setError('Alumno no encontrado')
        }
      } catch {
        setError('Error de conexión al cargar el alumno')
      } finally {
        setLoading(false)
      }
    }

    void fetchStudent()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando alumno...</p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Alumno no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error ?? `El alumno con ID ${id} no existe`}</p>
            <Button onClick={() => router.push('/alumnos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Alumnos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = `${student.first_name[0] ?? ''}${student.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.first_name} ${student.last_name}`}
        description="Ficha de alumno"
        icon={User}
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/alumnos')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push(`/alumnos/${id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo — Información principal */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {student.active && (
                    <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    {student.first_name} {student.last_name}
                  </h2>
                  <Badge variant={student.active ? 'default' : 'secondary'} className="mt-1">
                    {student.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{student.sede}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{student.ciclo}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho — Estadísticas y cursos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cursando</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{student.enrolled_courses}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">{student.completed_courses}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Curso Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {student.curso_actual !== '—' ? student.curso_actual : 'Sin curso asignado actualmente'}
              </p>
            </CardContent>
          </Card>

          {student.fecha_inscripcion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Información de Inscripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fecha de inscripción:{' '}
                  <span className="font-medium text-foreground">
                    {new Date(student.fecha_inscripcion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
