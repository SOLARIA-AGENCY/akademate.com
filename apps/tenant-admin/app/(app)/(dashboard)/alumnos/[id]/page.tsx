'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Avatar, AvatarFallback } from '@payload-config/components/ui/avatar'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { resolveEnrollmentLifecycle } from '@/app/lib/enrollment-lifecycle'
import { joinStudentWithEnrollments } from '@/src/domain/student-enrollment-join'
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
  const [enrollments, setEnrollments] = React.useState<Array<{
    id: string
    course: string
    campus: string
    label: string
    badgeClass: string
  }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/students/${encodeURIComponent(id)}`, { cache: 'no-cache' })
        const result = (await response.json()) as { doc?: StudentApiDoc; error?: string }
        const doc = result.doc && String(result.doc.id) === id ? result.doc : null

        if (doc) {
          const email = doc.email?.trim()
          const runsRes = email
            ? await fetch(`/api/matriculas?q=${encodeURIComponent(email)}&limit=50`, { cache: 'no-store' })
            : null
          const runsPayload = runsRes
            ? ((await runsRes.json().catch(() => ({}))) as {
                docs?: Array<{
                  id?: string | number
                  status?: string
                  payment_status?: string
                  amount_paid?: number
                  total_amount?: number
                  enrolled_at?: string
                  created_at?: string
                  course?: { name?: string }
                  campus?: { name?: string }
                  cycle?: { name?: string | null }
                  lead?: { email?: string }
                }>
              })
            : { docs: [] }
          const docs = Array.isArray(runsPayload.docs) ? runsPayload.docs : []
          const joined = joinStudentWithEnrollments(
            { email: doc.email },
            docs.map((run) => ({
              email: run.lead?.email ?? doc.email,
              status: run.status,
              campusName: run.campus?.name,
              courseName: run.course?.name,
              cycleName: run.cycle?.name,
            })),
          )
          setStudent({
            id: String(doc.id),
            first_name: doc.first_name ?? '',
            last_name: doc.last_name ?? '',
            email: doc.email ?? '—',
            phone: doc.phone ?? '—',
            active: doc.status ? doc.status === 'active' : true,
            enrolled_courses: joined.enrolled_courses,
            completed_courses: joined.completed_courses,
            sede: joined.sede,
            curso_actual: joined.curso_actual === '-' ? '—' : joined.curso_actual,
            ciclo: joined.ciclo === '-' ? '—' : joined.ciclo,
            fecha_inscripcion: doc.createdAt ?? '',
          })
          setEnrollments(
            docs.map((run) => {
              const life = resolveEnrollmentLifecycle(run)
              return {
                id: String(run.id),
                course: run.course?.name || 'Curso',
                campus: run.campus?.name || 'Sin sede',
                label: life.label,
                badgeClass: life.badgeClass,
              }
            }),
          )
        } else {
          setError(result.error || 'Alumno no encontrado')
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
            <Button onClick={() => router.push('/alumnos')} data-oid=":zx8gh6">
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
    <DashboardPageShell
      title={`${student.first_name} ${student.last_name}`}
      icon={User}
      backHref="/alumnos"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push(`/alumnos/${id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      }
    >

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
              <CardTitle data-oid="b9gka58">Matrículas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2" data-oid="lxlgqfe">
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {student.curso_actual !== '—'
                    ? student.curso_actual
                    : 'Sin matrículas registradas'}
                </p>
              ) : (
                enrollments.map((enrollment) => (
                  <button
                    key={enrollment.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/70 px-3 py-2 text-left"
                    onClick={() => router.push(`/matriculas/${enrollment.id}`)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">{enrollment.course}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{enrollment.campus}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant="static" className={enrollment.badgeClass}>{enrollment.label}</Badge>
                      <span className="text-xs font-medium">Ver</span>
                    </span>
                  </button>
                ))
              )}
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
    </DashboardPageShell>
  )
}
