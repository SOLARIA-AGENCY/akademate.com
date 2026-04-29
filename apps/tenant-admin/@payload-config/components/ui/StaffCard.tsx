'use client'

import * as React from 'react'
import { Card, CardContent, CardFooter } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Eye, Edit, Trash2, MoreHorizontal, MapPin, Mail, Phone, Briefcase, GraduationCap, User } from 'lucide-react'

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

  return (
    <div className="relative h-16 w-16 overflow-visible">
      {!isPlaceholderPhoto(photo) ? (
        <img
          src={photo}
          alt={fullName}
          className="h-16 w-16 rounded-full border-2 border-background object-cover shadow-md ring-2 ring-muted ring-offset-2"
        />
      ) : (
        <div
          aria-label={teaching ? 'Imagen genérica de docente' : 'Imagen genérica de administrativo'}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-primary shadow-md ring-2 ring-muted ring-offset-2"
        >
          <User className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
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
}: StaffCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      data-oid="zwb_yf-"
    >
      <div onClick={() => onView(id)} data-oid="i0zslmk">
        <CardContent className="p-6" data-oid="24ngeia">
          {/* Header with Avatar and Menu */}
          <div className="flex items-start justify-between mb-4" data-oid="hdjhmzo">
            <StaffPhoto fullName={fullName} photo={photo} staffType={staffType} />

            <DropdownMenu data-oid="msf0ls9">
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} data-oid="hxa2euo">
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          </div>

          {/* Name and Position */}
          <div className="space-y-2 mb-4" data-oid="1st-aup">
            <h3 className="font-semibold text-lg leading-tight" data-oid="oqae0_.">
              {fullName}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2" data-oid="b.o40c_">
              <Briefcase className="h-3.5 w-3.5" data-oid="yh6fxas" />
              {position}
            </p>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mb-4 flex-wrap" data-oid="34c-.1s">
            <Badge
              variant={STATUS_VARIANTS[employmentStatus]}
              className="text-xs"
              data-oid="8_xl-hu"
            >
              {STATUS_LABELS[employmentStatus]}
            </Badge>
            <Badge variant="outline" className="text-xs" data-oid="0m5w5if">
              {CONTRACT_TYPE_LABELS[contractType]}
            </Badge>
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
                  <Badge key={campus.id} variant="secondary" className="text-xs" data-oid=":pfs_wt">
                    <MapPin className="h-3 w-3 mr-1" data-oid="x6:g9o9" />
                    {campus.name}
                  </Badge>
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
          Ver Ficha Completa
        </Button>
      </CardFooter>
    </Card>
  )
}
