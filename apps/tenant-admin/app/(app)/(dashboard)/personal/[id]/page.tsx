'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Separator } from '@payload-config/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Award,
  FileText,
  Users,
  User,
  GraduationCap,
} from 'lucide-react'

interface StaffDetailPageProps {
  params: Promise<{ id: string }>
}

interface StaffMember {
  id: number
  fullName: string
  firstName: string
  lastName: string
  staffType: 'profesor' | 'administrativo'
  position: string
  contractType: string
  employmentStatus: string
  hireDate: string
  photo: string
  email: string
  phone: string
  bio: string
  assignedCampuses: { id: number; name: string; city: string }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Autónomo',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  temporary_leave: 'Baja Temporal',
  inactive: 'Inactivo',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  temporary_leave: 'secondary',
  inactive: 'destructive',
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

const isTeachingStaff = (staffType: StaffMember['staffType']) => staffType === 'profesor'

function StaffFallbackIcon({ staffType }: { staffType: StaffMember['staffType'] }) {
  const teaching = isTeachingStaff(staffType)
  return (
    <div
      aria-label={teaching ? 'Imagen genérica de docente' : 'Imagen genérica de administrativo'}
      className="relative flex h-full w-full items-center justify-center bg-primary/10 text-primary"
    >
      <User className="h-14 w-14" aria-hidden="true" />
      {teaching ? (
        <GraduationCap className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background" aria-hidden="true" />
      ) : (
        <Briefcase className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background" aria-hidden="true" />
      )}
    </div>
  )
}

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  const [staff, setStaff] = React.useState<StaffMember | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/staff/${id}`)
        const result = (await response.json()) as {
          success: boolean
          data?: StaffMember
          error?: string
        }

        if (result.success && result.data) {
          setStaff(result.data)
        } else {
          setError(result.error ?? 'Personal no encontrado')
        }
      } catch (err) {
        console.error('Error fetching staff:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="l8__0.z">
        <Card className="w-full max-w-md" data-oid="we_b7gl">
          <CardContent className="py-12 text-center" data-oid="gd9gcm6">
            <p className="text-muted-foreground" data-oid="h_.92u0">
              Cargando...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="9i:m.rb">
        <Card className="w-full max-w-md" data-oid="498yq_0">
          <CardHeader data-oid="3vqx0ri">
            <CardTitle data-oid="79pusny">Personal no encontrado</CardTitle>
            <CardDescription data-oid="e8v9kh7">
              {error || `El personal con ID ${id} no existe`}
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="r0mdyyp">
            <Button onClick={() => router.push('/personal')} data-oid="ursypzs">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="0xa0kgs" />
              Volver a Personal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6" data-oid="h1rsqcs">
      <PageHeader
        title={staff.fullName}
        description={staff.staffType === 'profesor' ? 'Profesor' : 'Personal Administrativo'}
        icon={User}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/personal')}
              data-oid="fqy6js6"
            >
              <ArrowLeft className="h-4 w-4" data-oid="f71ne6v" />
            </Button>
            <Button onClick={() => router.push(`/personal/${id}/editar`)} data-oid="z34c1yo">
              <Edit className="mr-2 h-4 w-4" data-oid="-jw881z" />
              Editar
            </Button>
          </>
        }
        data-oid=".skwt2b"
      />

      {/* Main Content: 2/3 + 1/3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="c6_8.-t">
        {/* LEFT SIDE: 2/3 - Main Information */}
        <div className="lg:col-span-2 space-y-6" data-oid="pplel3m">
          {/* Hero Card with Photo */}
          <Card data-oid="3emv57j">
            <CardContent className="pt-6" data-oid="ubgub38">
              <div className="flex items-start gap-6" data-oid="bs_.k:v">
                <Avatar
                  className="h-32 w-32 border-4 border-background shadow-lg"
                  data-oid="7yjq_n-"
                >
                  {!isPlaceholderPhoto(staff.photo) ? (
                    <AvatarImage src={staff.photo} alt={staff.fullName} data-oid="mhbq-ha" />
                  ) : null}
                  <AvatarFallback className="text-2xl" data-oid="t6actrp">
                    <StaffFallbackIcon staffType={staff.staffType} />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4" data-oid="dhr3bvy">
                  <div data-oid=":j9udep">
                    <h2 className="text-2xl font-bold" data-oid="82w-fl:">
                      {staff.fullName}
                    </h2>
                    <p className="text-lg text-muted-foreground" data-oid="l-r0n65">
                      {staff.position}
                    </p>
                  </div>

                  <div className="flex gap-2" data-oid="t7uiiny">
                    <Badge variant={STATUS_VARIANTS[staff.employmentStatus]} data-oid="j6tr5zy">
                      {STATUS_LABELS[staff.employmentStatus]}
                    </Badge>
                    <Badge variant="outline" data-oid="y9mesrv">
                      {CONTRACT_TYPE_LABELS[staff.contractType] || staff.contractType}
                    </Badge>
                  </div>

                  <Separator data-oid="wqkvjkj" />

                  <div className="grid grid-cols-2 gap-4" data-oid="8vp5rem">
                    <div className="flex items-center gap-2" data-oid="q2r5ky8">
                      <Mail className="h-4 w-4 text-muted-foreground" data-oid="83rets9" />
                      <a
                        href={`mailto:${staff.email}`}
                        className="text-sm hover:underline"
                        data-oid="1tg9uz3"
                      >
                        {staff.email}
                      </a>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2" data-oid="vgzg.vs">
                        <Phone className="h-4 w-4 text-muted-foreground" data-oid="degz3do" />
                        <a
                          href={`tel:${staff.phone}`}
                          className="text-sm hover:underline"
                          data-oid="rql5sul"
                        >
                          {staff.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biography */}
          {staff.bio && (
            <Card data-oid="k3vvyee">
              <CardHeader data-oid="bg579eo">
                <CardTitle className="flex items-center gap-2" data-oid="con4ff-">
                  <FileText className="h-5 w-5" data-oid="rtm4d0f" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="oq3xgw7">
                <p className="text-muted-foreground leading-relaxed" data-oid=".w7y_hz">
                  {staff.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Employment Details */}
          <Card data-oid="o53y0py">
            <CardHeader data-oid="rcp2kis">
              <CardTitle className="flex items-center gap-2" data-oid="akajl5v">
                <Briefcase className="h-5 w-5" data-oid="j:7tnbn" />
                Información Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="-xtpt-g">
              <div className="grid grid-cols-2 gap-4" data-oid="rv0yj47">
                <div data-oid="us7-yqa">
                  <p className="text-sm text-muted-foreground" data-oid="r7h9g-y">
                    Cargo
                  </p>
                  <p className="font-medium" data-oid=".co1gyg">
                    {staff.position}
                  </p>
                </div>
                <div data-oid="rm6u2gu">
                  <p className="text-sm text-muted-foreground" data-oid="ply0ile">
                    Tipo de Contrato
                  </p>
                  <p className="font-medium" data-oid="5dsbgy_">
                    {CONTRACT_TYPE_LABELS[staff.contractType] || staff.contractType}
                  </p>
                </div>
                <div data-oid="deqcc43">
                  <p className="text-sm text-muted-foreground" data-oid="3q.2.k0">
                    Fecha de Ingreso
                  </p>
                  <p className="font-medium flex items-center gap-2" data-oid="s1aww_m">
                    <Calendar className="h-4 w-4 text-muted-foreground" data-oid="qk8w1ua" />
                    {formatDate(staff.hireDate)}
                  </p>
                </div>
                <div data-oid="gv0eau_">
                  <p className="text-sm text-muted-foreground" data-oid="xdh0hnt">
                    Estado
                  </p>
                  <Badge variant={STATUS_VARIANTS[staff.employmentStatus]} data-oid="14m:cbu">
                    {STATUS_LABELS[staff.employmentStatus]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Sidebar */}
        <div className="lg:col-span-1 space-y-6" data-oid="lw:z5t.">
          {/* Assigned Campuses */}
          <Card data-oid=":6zfcpn">
            <CardHeader data-oid="twg-sdb">
              <CardTitle className="text-base flex items-center gap-2" data-oid="hq72jne">
                <MapPin className="h-4 w-4" data-oid="ri:du7f" />
                Sedes Asignadas
              </CardTitle>
              <CardDescription data-oid="a_ndo:f">
                {staff.assignedCampuses.length}{' '}
                {staff.assignedCampuses.length === 1 ? 'sede' : 'sedes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="46zj0s2">
              {staff.assignedCampuses.length === 0 ? (
                <p className="text-sm text-muted-foreground italic" data-oid="17ls0.d">
                  No hay sedes asignadas
                </p>
              ) : (
                staff.assignedCampuses.map((campus) => (
                  <div
                    key={campus.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                    data-oid="wpe1bkz"
                  >
                    <p className="font-medium" data-oid="fnmvdlq">
                      {campus.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-oid="i:n1.2:">
                      {campus.city}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card data-oid="mgk0:yy">
            <CardHeader data-oid="_qvqati">
              <CardTitle className="text-base" data-oid="0r7s0uc">
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="um:h6x5">
              <div data-oid="ml-h19b">
                <p className="text-sm text-muted-foreground" data-oid="2qlf256">
                  Creado
                </p>
                <p className="text-sm" data-oid="s7jk3l3">
                  {formatDate(staff.createdAt)}
                </p>
              </div>
              <div data-oid="r_mjjct">
                <p className="text-sm text-muted-foreground" data-oid="4_:6t8.">
                  Última actualización
                </p>
                <p className="text-sm" data-oid=":h5m.-s">
                  {formatDate(staff.updatedAt)}
                </p>
              </div>
              <div data-oid="m3:pc03">
                <p className="text-sm text-muted-foreground" data-oid="81-qpad">
                  ID
                </p>
                <p className="text-sm font-mono" data-oid=".35a.go">
                  {staff.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professor-specific: Certifications (placeholder) */}
          {staff.staffType === 'profesor' && (
            <Card data-oid="fqg_xi8">
              <CardHeader data-oid="ry8sinp">
                <CardTitle className="text-base flex items-center gap-2" data-oid=":2l8_d:">
                  <Award className="h-4 w-4" data-oid="lr:dyrg" />
                  Certificaciones
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="k0dg:nj">
                <p className="text-sm text-muted-foreground italic" data-oid="2hj7xng">
                  No hay certificaciones registradas
                </p>
                {/* TODO: List certifications when implemented */}
              </CardContent>
            </Card>
          )}

          {/* Professor-specific: Assigned Courses (placeholder) */}
          {staff.staffType === 'profesor' && (
            <Card data-oid="3r_803-">
              <CardHeader data-oid="3fv70va">
                <CardTitle className="text-base flex items-center gap-2" data-oid="3abglbs">
                  <Users className="h-4 w-4" data-oid="00ea:9r" />
                  Convocatorias Asignadas
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="4nkm5s7">
                <p className="text-sm text-muted-foreground italic" data-oid="ea1a:ds">
                  No hay convocatorias asignadas actualmente
                </p>
                {/* TODO: List assigned course runs when implemented */}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
