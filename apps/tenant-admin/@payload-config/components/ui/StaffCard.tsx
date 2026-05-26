'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffStatusBadge,
} from '@payload-config/components/ui/StaffBadges'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Eye, Edit, Trash2, MoreHorizontal, Mail, Phone, Briefcase, GraduationCap, User } from 'lucide-react'

interface StaffCardProps {
  id: number
  fullName: string
  staffType?: string
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  email: string
  phone: string
  bio?: string
  assignedCampuses: Array<{ id: number; name: string; city: string }>
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
  detailLabel?: string
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

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

const isTeachingStaff = (staffType?: string) =>
  staffType === 'profesor' || staffType === 'academico'

function StaffPhoto({
  fullName,
  photo,
  staffType,
}: {
  fullName: string
  photo: string
  staffType?: string
}) {
  const teaching = isTeachingStaff(staffType)
  const BadgeIcon = teaching ? GraduationCap : Briefcase
  const [photoError, setPhotoError] = React.useState(false)

  return (
    <div className="relative h-16 w-16 overflow-visible">
      <Avatar className="h-16 w-16 border-2 border-background shadow-md ring-2 ring-muted ring-offset-2">
        {!isPlaceholderPhoto(photo) && !photoError ? (
          <AvatarImage
            src={photo}
            alt={fullName}
            className="object-cover"
            onError={() => setPhotoError(true)}
          />
        ) : null}
        <AvatarFallback
          aria-label={teaching ? 'Imagen genérica de docente' : 'Imagen genérica de administrativo'}
          className="bg-primary/10 text-primary"
        >
          <User className="h-7 w-7" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background text-primary shadow-sm">
        <BadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}

export function StaffCard({
  id,
  fullName,
  staffType,
  position,
  contractType,
  employmentStatus,
  photo,
  email,
  phone,
  bio,
  assignedCampuses,
  onView,
  onEdit,
  onDelete,
  detailLabel = 'Ver Ficha Completa',
}: StaffCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      data-oid="zwb_yf-"
    >
      <div onClick={() => onView(id)} data-oid="i0zslmk">
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex min-w-0 items-start gap-4">
            <StaffPhoto fullName={fullName} photo={photo} staffType={staffType} />
            <div className="min-w-0 space-y-1">
              <CardTitle className="line-clamp-2 text-lg leading-tight">{fullName}</CardTitle>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{position}</span>
              </p>
            </div>
          </div>

          <DropdownMenu data-oid="msf0ls9">
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} data-oid="hxa2euo">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                data-oid="pfv9nwo"
              >
                <span className="sr-only" data-oid="x53fj_-">
                  Abrir menú
                </span>
                <MoreHorizontal className="h-4 w-4" data-oid="p.s5aqy" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-oid="9:6af3z">
              <DropdownMenuLabel data-oid="ifwvtj3">Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator data-oid="seexs1g" />
              <DropdownMenuItem onClick={() => onView(id)} data-oid="mr2ycq-">
                <Eye className="mr-2 h-4 w-4" data-oid="a4m-48a" />
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(id)} data-oid="zbj8prj">
                <Edit className="mr-2 h-4 w-4" data-oid="45fhukj" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator data-oid="zc64rui" />
              <DropdownMenuItem
                onClick={() => onDelete(id, fullName)}
                className="text-destructive"
                data-oid="6ytwys:"
              >
                <Trash2 className="mr-2 h-4 w-4" data-oid="hjfpijo" />
                Desactivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="pt-0" data-oid="24ngeia">
          {/* Badges */}
          <div className="flex gap-2 mb-4 flex-wrap" data-oid="34c-.1s">
            <StaffStatusBadge status={employmentStatus} data-oid="8_xl-hu" />
            <StaffContractBadge data-oid="0m5w5if">
              {CONTRACT_TYPE_LABELS[contractType]}
            </StaffContractBadge>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4" data-oid="lq81nmx">
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-oid="1qrmnly"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0" data-oid="d-nl2o." />
              <span className="truncate" data-oid="2axlsrq">
                {email}
              </span>
            </div>
            {phone && (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                data-oid="u-4v2i3"
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" data-oid="xah4sk6" />
                <span data-oid="8dxim-i">{phone}</span>
              </div>
            )}
          </div>

          {/* Bio Preview */}
          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4" data-oid="tgiu333">
              {bio}
            </p>
          )}

          {/* Assigned Campuses */}
          <div className="space-y-2" data-oid="f0-qctf">
            <p
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              data-oid="7d5jh7a"
            >
              Sedes Asignadas
            </p>
            <div className="flex gap-1 flex-wrap" data-oid="fpgw5-j">
              {assignedCampuses.length === 0 ? (
                <span className="text-sm text-muted-foreground" data-oid="xgrw:yc">
                  Sin sedes asignadas
                </span>
              ) : (
                assignedCampuses.map((campus) => (
                  <StaffCampusBadge key={campus.id} data-oid=":pfs_wt">
                    {campus.name}
                  </StaffCampusBadge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="bg-muted/50 p-4 border-t" data-oid="m18tdm8">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onView(id)}
          data-oid="hs3__v2"
        >
          <Eye className="mr-2 h-4 w-4" data-oid="qq_tri7" />
          {detailLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
