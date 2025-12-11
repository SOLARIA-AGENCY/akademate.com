'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
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
  assignedCampuses: Array<{
    id: number
    name: string
    city: string
  }>
  isActive: boolean
  hireDate?: string
  createdAt: string
  updatedAt: string
}

export default function AdministrativoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const adminId = params.id as string

  const [admin, setAdmin] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAdmin() {
      try {
        setLoading(true)
        const response = await fetch('/api/staff?type=administrativo&limit=100')

        if (!response.ok) {
          throw new Error('Failed to load administrative staff data')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error('API returned error')
        }

        // Find the specific admin staff member
        const foundAdmin = result.data.find(
          (s: StaffMember) => s.id.toString() === adminId
        )

        if (!foundAdmin) {
          throw new Error('Administrative staff member not found')
        }

        setAdmin(foundAdmin)
        setError(null)
      } catch (err) {
        console.error('Error loading administrative staff:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (adminId) {
      loadAdmin()
    }
  }, [adminId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando información del personal administrativo...</p>
        </div>
      </div>
    )
  }

  if (error || !admin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-semibold">Error al cargar personal administrativo</p>
            <p className="text-sm text-muted-foreground">{error || 'Personal administrativo no encontrado'}</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{admin.fullName}</h1>
            <p className="text-muted-foreground mt-1">{admin.position}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/administrativo/${adminId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Personal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Photo and Basic Info */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 space-y-6">
            {/* Photo */}
            <div className="flex flex-col items-center">
              {admin.photo ? (
                <img
                  src={admin.photo}
                  alt={admin.fullName}
                  className="h-48 w-48 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-6xl font-bold">
                    {admin.firstName[0]}
                    {admin.lastName[0]}
                  </span>
                </div>
              )}
              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold">{admin.fullName}</h2>
                <p className="text-sm text-muted-foreground">{admin.position}</p>
              </div>
            </div>

            <Separator />

            {/* Status Badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={admin.employmentStatus === 'active' ? 'default' : 'secondary'}>
                  {statusLabels[admin.employmentStatus] || admin.employmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contrato</span>
                <Badge variant="outline">
                  {contractTypeLabels[admin.contractType] || admin.contractType}
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
                  <a href={`mailto:${admin.email}`} className="hover:underline">
                    {admin.email}
                  </a>
                </div>
                {admin.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${admin.phone}`} className="hover:underline">
                      {admin.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {admin.hireDate && (
              <>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Fecha de Contratación</p>
                    <p className="font-medium">
                      {new Date(admin.hireDate).toLocaleDateString('es-ES', {
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
          {admin.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{admin.bio}</p>
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
              {admin.assignedCampuses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {admin.assignedCampuses.map((campus) => (
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
                    {contractTypeLabels[admin.contractType] || admin.contractType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado de Empleo</p>
                  <p className="font-medium">
                    {statusLabels[admin.employmentStatus] || admin.employmentStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Personal</p>
                  <p className="font-medium capitalize">{admin.staffType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p className="font-medium">#{admin.id}</p>
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
                    {new Date(admin.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span className="font-medium">
                    {new Date(admin.updatedAt).toLocaleDateString('es-ES')}
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
        <Button onClick={() => router.push(`/administrativo/${adminId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Personal
        </Button>
      </div>
    </div>
  )
}
