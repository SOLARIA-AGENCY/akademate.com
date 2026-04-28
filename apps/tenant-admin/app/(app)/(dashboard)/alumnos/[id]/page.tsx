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
        const result = (await response.json()) as { docs?: StudentApiDoc[] }

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
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="9zrogy8">
        <p className="text-muted-foreground" data-oid="ndg4vad">
          Cargando alumno...
        </p>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="26f8d2v">
        <Card className="w-full max-w-md" data-oid="6ztpzar">
          <CardHeader data-oid="b.1tf_:">
            <CardTitle data-oid="9h93du:">Alumno no encontrado</CardTitle>
          </CardHeader>
          <CardContent data-oid="oo9pv:9">
            <p className="text-sm text-muted-foreground mb-4" data-oid="kks0xwy">
              {error ?? `El alumno con ID ${id} no existe`}
            </p>
            <Button onClick={() => router.push('/dashboard/alumnos')} data-oid=":zx8gh6">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="n5bbe9m" />
              Volver a Alumnos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = `${student.first_name[0] ?? ''}${student.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6" data-oid="seiyw9a">
      <PageHeader
        title={`${student.first_name} ${student.last_name}`}
        description="Ficha de alumno"
        icon={User}
        actions={
          <div className="flex items-center gap-2" data-oid="nt3.py.">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/alumnos')}
              data-oid=":icfnk8"
            >
              <ArrowLeft className="h-4 w-4" data-oid="zqj93uq" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/alumnos/${id}/editar`)}
              data-oid="lv9:k4l"
            >
              <Edit className="mr-2 h-4 w-4" data-oid="bv22-7e" />
              Editar
            </Button>
          </div>
        }
        data-oid="f4-g9m8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid=".xgwbx1">
        {/* Panel izquierdo — Información principal */}
        <div className="lg:col-span-1 space-y-6" data-oid="3wn2bmz">
          <Card data-oid="mbqdp6s">
            <CardContent className="pt-6" data-oid="ztkf:1t">
              <div className="flex flex-col items-center text-center space-y-4" data-oid="6d5dxk0">
                <div className="relative" data-oid="uubzj4:">
                  <Avatar className="h-24 w-24" data-oid="ys_yghx">
                    <AvatarFallback
                      className="bg-primary text-primary-foreground text-2xl font-bold"
                      data-oid="2f.ag73"
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {student.active && (
                    <div
                      className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background"
                      data-oid="87-es2u"
                    />
                  )}
                </div>

                <div data-oid="ofoaud.">
                  <h2 className="text-xl font-bold" data-oid="k5yjm7v">
                    {student.first_name} {student.last_name}
                  </h2>
                  <Badge
                    variant={student.active ? 'default' : 'secondary'}
                    className="mt-1"
                    data-oid="g1ct_cm"
                  >
                    {student.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t pt-4" data-oid="jw6ezsz">
                <div className="flex items-center gap-3 text-sm" data-oid="_m27dtt">
                  <Mail
                    className="h-4 w-4 text-muted-foreground flex-shrink-0"
                    data-oid="eo4g92j"
                  />
                  <span className="truncate" data-oid="jtd35:f">
                    {student.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm" data-oid="6uxqopd">
                  <Phone
                    className="h-4 w-4 text-muted-foreground flex-shrink-0"
                    data-oid=":cb55n7"
                  />
                  <span data-oid="4bg-e9a">{student.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm" data-oid="xic9.02">
                  <MapPin
                    className="h-4 w-4 text-muted-foreground flex-shrink-0"
                    data-oid="a3v93_d"
                  />
                  <span data-oid="gycwbxh">{student.sede}</span>
                </div>
                <div className="flex items-center gap-3 text-sm" data-oid="2r44b-3">
                  <GraduationCap
                    className="h-4 w-4 text-muted-foreground flex-shrink-0"
                    data-oid="cy.uz90"
                  />
                  <span data-oid="7w3y23m">{student.ciclo}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho — Estadísticas y cursos */}
        <div className="lg:col-span-2 space-y-6" data-oid="tkbihzv">
          <div className="grid grid-cols-2 gap-4" data-oid="dh3435l">
            <Card data-oid="n-.eu7o">
              <CardHeader className="pb-2" data-oid=".b3w_w3">
                <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="m3ggqpb">
                  Cursando
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="vr.1-nw">
                <div className="flex items-center gap-2" data-oid="5j0_010">
                  <BookOpen className="h-5 w-5 text-primary" data-oid="uzr4a6x" />
                  <span className="text-2xl font-bold" data-oid="l86rcz5">
                    {student.enrolled_courses}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-oid="wlbm:s_">
              <CardHeader className="pb-2" data-oid="huz.3d:">
                <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="irsrf29">
                  Completados
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="s:9hmu4">
                <div className="flex items-center gap-2" data-oid="rwylmiq">
                  <CheckCircle2 className="h-5 w-5 text-green-600" data-oid=":.ul9w5" />
                  <span className="text-2xl font-bold" data-oid="lza99uz">
                    {student.completed_courses}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-oid=".n60fw_">
            <CardHeader data-oid="rb6:lxd">
              <CardTitle data-oid="b9gka58">Curso Actual</CardTitle>
            </CardHeader>
            <CardContent data-oid="lxlgqfe">
              <p className="text-sm text-muted-foreground" data-oid=".mjhoby">
                {student.curso_actual !== '—'
                  ? student.curso_actual
                  : 'Sin curso asignado actualmente'}
              </p>
            </CardContent>
          </Card>

          {student.fecha_inscripcion && (
            <Card data-oid="j0i9-zr">
              <CardHeader data-oid="dlww13y">
                <CardTitle className="text-sm font-medium" data-oid="c021tkm">
                  Información de Inscripción
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="e3x-ey8">
                <p className="text-sm text-muted-foreground" data-oid="r1eq82q">
                  Fecha de inscripción:{' '}
                  <span className="font-medium text-foreground" data-oid="xffe5.m">
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
