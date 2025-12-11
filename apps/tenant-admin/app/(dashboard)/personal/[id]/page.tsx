'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
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
  assignedCampuses: Array<{ id: number; name: string; city: string }>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Freelance',
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
        const response = await fetch(`/api/staff?limit=100`)
        const result = await response.json()

        if (result.success) {
          const member = result.data.find((s: StaffMember) => s.id === parseInt(id))
          if (member) {
            setStaff(member)
          } else {
            setError('Personal no encontrado')
          }
        } else {
          setError(result.error || 'Error al cargar datos')
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Personal no encontrado</CardTitle>
            <CardDescription>{error || `El personal con ID ${id} no existe`}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/personal')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Personal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/personal')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{staff.fullName}</h1>
            <p className="text-muted-foreground">
              {staff.staffType === 'profesor' ? 'Profesor' : 'Personal Administrativo'}
            </p>
          </div>
        </div>

        <Button onClick={() => router.push(`/personal/${id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Main Content: 2/3 + 1/3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE: 2/3 - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Card with Photo */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={staff.photo} alt={staff.fullName} />
                  <AvatarFallback className="text-2xl">{getInitials(staff.fullName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{staff.fullName}</h2>
                    <p className="text-lg text-muted-foreground">{staff.position}</p>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant={STATUS_VARIANTS[staff.employmentStatus]}>
                      {STATUS_LABELS[staff.employmentStatus]}
                    </Badge>
                    <Badge variant="outline">
                      {CONTRACT_TYPE_LABELS[staff.contractType] || staff.contractType}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${staff.email}`} className="text-sm hover:underline">
                        {staff.email}
                      </a>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${staff.phone}`} className="text-sm hover:underline">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{staff.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Información Laboral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium">{staff.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                  <p className="font-medium">
                    {CONTRACT_TYPE_LABELS[staff.contractType] || staff.contractType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(staff.hireDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={STATUS_VARIANTS[staff.employmentStatus]}>
                    {STATUS_LABELS[staff.employmentStatus]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Assigned Campuses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Sedes Asignadas
              </CardTitle>
              <CardDescription>
                {staff.assignedCampuses.length}{' '}
                {staff.assignedCampuses.length === 1 ? 'sede' : 'sedes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.assignedCampuses.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No hay sedes asignadas</p>
              ) : (
                staff.assignedCampuses.map((campus) => (
                  <div
                    key={campus.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{campus.name}</p>
                    <p className="text-sm text-muted-foreground">{campus.city}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="text-sm">{formatDate(staff.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="text-sm">{formatDate(staff.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="text-sm font-mono">{staff.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Professor-specific: Certifications (placeholder) */}
          {staff.staffType === 'profesor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  No hay certificaciones registradas
                </p>
                {/* TODO: List certifications when implemented */}
              </CardContent>
            </Card>
          )}

          {/* Professor-specific: Assigned Courses (placeholder) */}
          {staff.staffType === 'profesor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Convocatorias Asignadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
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
