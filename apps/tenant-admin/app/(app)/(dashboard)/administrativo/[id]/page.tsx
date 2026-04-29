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
  isActive: boolean
  hireDate?: string
  createdAt: string
  updatedAt: string
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

function AdminPhotoFallback() {
  return (
    <div
      aria-label="Imagen genérica de administrativo"
      className="relative flex h-48 w-48 items-center justify-center rounded-full border bg-primary/10 text-primary shadow-lg"
    >
      <User className="h-20 w-20" aria-hidden="true" />
      <div className="absolute right-2 top-2 rounded-full border bg-background p-2 shadow-sm">
        <Briefcase className="h-7 w-7" aria-hidden="true" />
      </div>
    </div>
  )
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
        const foundAdmin = result.data.find((s: StaffMember) => s.id.toString() === adminId)

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
      <div className="flex items-center justify-center h-96" data-oid="dgipn03">
        <div className="text-center space-y-4" data-oid="i0gw5wr">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" data-oid="ccy7smx" />
          <p className="text-muted-foreground" data-oid="pubtotn">
            Cargando información del personal administrativo...
          </p>
        </div>
      </div>
    )
  }

  if (error || !admin) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="ep4rfo7">
        <Card className="max-w-md" data-oid="-_97p_.">
          <CardContent className="pt-6 text-center space-y-4" data-oid="ne451nx">
            <p className="text-destructive font-semibold" data-oid="k-9vao_">
              Error al cargar personal administrativo
            </p>
            <p className="text-sm text-muted-foreground" data-oid="skvepuh">
              {error || 'Personal administrativo no encontrado'}
            </p>
            <div className="flex gap-2 justify-center" data-oid="r5cd98g">
              <Button onClick={() => router.back()} data-oid="ig35wls">
                Volver
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} data-oid="n8h_i3u">
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

  return (
    <div className="space-y-6" data-oid="9gk3trs">
      <PageHeader
        title={admin.fullName}
        description={admin.position}
        icon={Briefcase}
        actions={
          <>
            <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid="fntph:p">
              <ArrowLeft className="h-5 w-5" data-oid="p9jc.pi" />
            </Button>
            <Button
              onClick={() => router.push(`/administrativo/${adminId}/editar`)}
              data-oid="odyltnd"
            >
              <Edit className="mr-2 h-4 w-4" data-oid="srqw0p." />
              Editar Personal
            </Button>
          </>
        }
        data-oid="rz_pitb"
      />

      <div className="grid gap-6 md:grid-cols-3" data-oid=".6k2ein">
        {/* Left Column - Photo and Basic Info */}
        <Card className="md:col-span-1" data-oid="q-phr67">
          <CardContent className="pt-6 space-y-6" data-oid="zzitn_q">
            {/* Photo */}
            <div className="flex flex-col items-center" data-oid="xo.xxd9">
              {!isPlaceholderPhoto(admin.photo) ? (
                <img
                  src={admin.photo}
                  alt={admin.fullName}
                  className="h-48 w-48 rounded-full object-cover border-4 border-background shadow-lg"
                  data-oid="1qxhdve"
                />
              ) : (
                <AdminPhotoFallback />
              )}
              <div className="mt-4 text-center" data-oid="0d3p_ko">
                <h2 className="text-xl font-bold" data-oid="knocmsm">
                  {admin.fullName}
                </h2>
                <p className="text-sm text-muted-foreground" data-oid="2b7rg-6">
                  {admin.position}
                </p>
              </div>
            </div>

            <Separator data-oid="zu70_-o" />

            {/* Status Badges */}
            <div className="space-y-3" data-oid="ili5k63">
              <div className="flex items-center justify-between" data-oid="s8_h0ke">
                <span className="text-sm text-muted-foreground" data-oid="jkxg8yu">
                  Estado
                </span>
                <Badge
                  variant={admin.employmentStatus === 'active' ? 'default' : 'secondary'}
                  data-oid="vlhj9mm"
                >
                  {statusLabels[admin.employmentStatus] || admin.employmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between" data-oid="c5fq6z-">
                <span className="text-sm text-muted-foreground" data-oid="exxjx55">
                  Contrato
                </span>
                <Badge variant="outline" data-oid="2ow:84r">
                  {contractTypeLabels[admin.contractType] || admin.contractType}
                </Badge>
              </div>
            </div>

            <Separator data-oid="tcb-m60" />

            {/* Contact Info */}
            <div className="space-y-3" data-oid="98gw:.c">
              <h3
                className="text-sm font-semibold uppercase text-muted-foreground"
                data-oid="x-9l5q4"
              >
                Información de Contacto
              </h3>
              <div className="space-y-2" data-oid="n168emc">
                <div className="flex items-center gap-3 text-sm" data-oid="-gnvz9s">
                  <Mail className="h-4 w-4 text-muted-foreground" data-oid="2lrax3o" />
                  <a href={`mailto:${admin.email}`} className="hover:underline" data-oid="pij7yxt">
                    {admin.email}
                  </a>
                </div>
                {admin.phone && (
                  <div className="flex items-center gap-3 text-sm" data-oid="4zlbrfw">
                    <Phone className="h-4 w-4 text-muted-foreground" data-oid="f03h-k." />
                    <a href={`tel:${admin.phone}`} className="hover:underline" data-oid=".1nn7a7">
                      {admin.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {admin.hireDate && (
              <>
                <Separator data-oid="m9ankxr" />
                <div className="flex items-center gap-3 text-sm" data-oid="hc-pdgh">
                  <Calendar className="h-4 w-4 text-muted-foreground" data-oid="g7df9k9" />
                  <div data-oid="in3dzrr">
                    <p className="text-muted-foreground" data-oid="ndkf:xr">
                      Fecha de Contratación
                    </p>
                    <p className="font-medium" data-oid="d_haq2f">
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
        <div className="md:col-span-2 space-y-6" data-oid="su-oo00">
          {/* Bio */}
          {admin.bio && (
            <Card data-oid="njsfluk">
              <CardHeader data-oid="tp:4ul7">
                <CardTitle className="flex items-center gap-2" data-oid="_mh-d-.">
                  <User className="h-5 w-5" data-oid="wbssq_s" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="ntg1_ep">
                <p className="text-muted-foreground leading-relaxed" data-oid="8pf-ucq">
                  {admin.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Campuses */}
          <Card data-oid="_eapi9l">
            <CardHeader data-oid="457tel:">
              <CardTitle className="flex items-center gap-2" data-oid="ob5thfd">
                <MapPin className="h-5 w-5" data-oid="xd4fvzw" />
                Sedes Asignadas
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="sn_szkc">
              {admin.assignedCampuses.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2" data-oid="k34iyg.">
                  {admin.assignedCampuses.map((campus) => (
                    <div
                      key={campus.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      data-oid=".tt9hl:"
                    >
                      <Building2 className="h-5 w-5 text-primary" data-oid="h21grh8" />
                      <div data-oid="9_b1f11">
                        <p className="font-medium" data-oid="bez86ko">
                          {campus.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-oid=".az.mnf">
                          {campus.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-oid="cflwhmn">
                  No tiene sedes asignadas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card data-oid="zxybru-">
            <CardHeader data-oid="7p2msb6">
              <CardTitle className="flex items-center gap-2" data-oid="suu0:9e">
                <Briefcase className="h-5 w-5" data-oid="dws3ew0" />
                Detalles de Empleo
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="yjp9rz9">
              <div className="grid gap-4 md:grid-cols-2" data-oid="adi2:gn">
                <div data-oid="j6e:pft">
                  <p className="text-sm text-muted-foreground mb-1" data-oid=":nfd1dw">
                    Tipo de Contrato
                  </p>
                  <p className="font-medium" data-oid="b.s-:_-">
                    {contractTypeLabels[admin.contractType] || admin.contractType}
                  </p>
                </div>
                <div data-oid="iaaw475">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="aptw55s">
                    Estado de Empleo
                  </p>
                  <p className="font-medium" data-oid="io250m6">
                    {statusLabels[admin.employmentStatus] || admin.employmentStatus}
                  </p>
                </div>
                <div data-oid="av9.xp:">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="9ieabqq">
                    Tipo de Personal
                  </p>
                  <p className="font-medium capitalize" data-oid="_r_t7mz">
                    {admin.staffType}
                  </p>
                </div>
                <div data-oid="zbw:m4g">
                  <p className="text-sm text-muted-foreground mb-1" data-oid="2nhko53">
                    ID
                  </p>
                  <p className="font-medium" data-oid="js:ru_:">
                    #{admin.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card data-oid="ywa60t0">
            <CardHeader data-oid="cv.21:q">
              <CardTitle className="text-sm" data-oid="bb1wya3">
                Metadatos
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="xu4d:cp">
              <div className="grid gap-2 text-sm" data-oid="bv6lpz.">
                <div className="flex justify-between" data-oid="xuf5bl7">
                  <span className="text-muted-foreground" data-oid="ksat3gy">
                    Creado:
                  </span>
                  <span className="font-medium" data-oid=".idbzgk">
                    {new Date(admin.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="l_prn19">
                  <span className="text-muted-foreground" data-oid="mobczge">
                    Última actualización:
                  </span>
                  <span className="font-medium" data-oid="o6x-18k">
                    {new Date(admin.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end" data-oid="k_thebq">
        <Button variant="outline" onClick={() => router.back()} data-oid="7viqv:0">
          Volver
        </Button>
        <Button onClick={() => router.push(`/administrativo/${adminId}/editar`)} data-oid="l1s868y">
          <Edit className="mr-2 h-4 w-4" data-oid="9ho.u2c" />
          Editar Personal
        </Button>
      </div>
    </div>
  )
}
