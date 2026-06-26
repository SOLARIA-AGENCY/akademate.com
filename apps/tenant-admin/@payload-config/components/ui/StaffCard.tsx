'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffCountBadge,
  StaffAreaBadge,
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
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  User,
} from 'lucide-react'

type StaffCardId = number | string

interface StaffCardProps {
  id: StaffCardId
  fullName: string
  staffType?: string
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  email?: string | null
  phone?: string | null
  bio?: string
  assignedCampuses: Array<{ id: number; name: string; city: string }>
  courseRunsCount?: number
  qualifiedAreas?: Array<{ id: number; codigo?: string | null; nombre: string }>
  reviewLabel?: string
  onView: (id: StaffCardId) => void
  onEdit?: (id: StaffCardId) => void
  onDelete?: (id: StaffCardId, name: string) => void
  detailLabel?: string
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  general_regime: 'Régimen General',
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Autónomo',
  contract: 'Contrato',
  employee: 'Empleado',
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
  courseRunsCount,
  qualifiedAreas,
  reviewLabel,
  onView,
  onEdit,
  onDelete,
  detailLabel = 'Ver Ficha Completa',
}: StaffCardProps) {
  const teaching = isTeachingStaff(staffType)
  const hasMenuActions = !!onEdit || !!onDelete
  const normalizedEmail = email?.trim()
  const normalizedPhone = phone?.trim()
  const missingQualifiedAreas = teaching && (qualifiedAreas ?? []).length === 0

  return (
    <Card
      className="group flex min-h-[18rem] cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      data-oid="zwb_yf-"
    >
      <div className="flex flex-1 flex-col" onClick={() => onView(id)} data-oid="i0zslmk">
        <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-3">
          <div className="flex min-w-0 items-start gap-3">
            <StaffPhoto fullName={fullName} photo={photo} staffType={staffType} />
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="line-clamp-2 text-base leading-tight">{fullName}</CardTitle>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{position}</span>
              </p>
            </div>
          </div>

          {hasMenuActions ? (
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
                {onEdit ? (
                  <DropdownMenuItem onClick={() => onEdit(id)} data-oid="zbj8prj">
                    <Edit className="mr-2 h-4 w-4" data-oid="45fhukj" />
                    Editar
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <>
                    <DropdownMenuSeparator data-oid="zc64rui" />
                    <DropdownMenuItem
                      onClick={() => onDelete(id, fullName)}
                      className="text-destructive"
                      data-oid="6ytwys:"
                    >
                      <Trash2 className="mr-2 h-4 w-4" data-oid="hjfpijo" />
                      Desactivar
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col px-4 pb-3 pt-0" data-oid="24ngeia">
          {/* Badges */}
          <div className="mb-3 flex flex-wrap gap-1.5" data-oid="34c-.1s">
            <StaffStatusBadge
              status={employmentStatus}
              className="w-auto min-w-[5.5rem]"
              data-oid="8_xl-hu"
            />
            <StaffContractBadge className="w-auto min-w-[6.5rem]" data-oid="0m5w5if">
              {CONTRACT_TYPE_LABELS[contractType] ?? contractType}
            </StaffContractBadge>
          </div>
          {teaching && !missingQualifiedAreas ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(qualifiedAreas ?? []).slice(0, 2).map((area) => (
                <StaffAreaBadge key={area.id} seed={area.codigo ?? area.id}>
                  {area.nombre}
                </StaffAreaBadge>
              ))}
              {(qualifiedAreas ?? []).length > 2 ? (
                <StaffAreaBadge seed={`${id}-more`} className="max-w-[5rem]">
                  +{(qualifiedAreas ?? []).length - 2}
                </StaffAreaBadge>
              ) : null}
            </div>
          ) : null}
          {missingQualifiedAreas ? (
            <div className="mb-3 inline-flex w-fit rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
              Sin área habilitada
            </div>
          ) : null}
          {reviewLabel ? (
            <div className="mb-3 inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
              {reviewLabel}
            </div>
          ) : null}

          {/* Contact Info */}
          <div className="mb-3 space-y-2" data-oid="lq81nmx">
            <div
              className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
              data-oid="1qrmnly"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0" data-oid="d-nl2o." />
              {normalizedEmail ? (
                <a
                  href={`mailto:${normalizedEmail}`}
                  className="min-w-0 truncate font-medium text-primary hover:underline"
                  onClick={(event) => event.stopPropagation()}
                  data-oid="2axlsrq"
                >
                  {normalizedEmail}
                </a>
              ) : (
                <span className="truncate italic text-muted-foreground/70" data-oid="2axlsrq">
                  Sin mail
                </span>
              )}
            </div>
            <div
              className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
              data-oid="u-4v2i3"
            >
              <Phone className="h-3.5 w-3.5 flex-shrink-0" data-oid="xah4sk6" />
              {normalizedPhone ? (
                <a
                  href={`tel:${normalizedPhone.replace(/\s+/g, '')}`}
                  className="min-w-0 truncate font-medium text-primary hover:underline"
                  onClick={(event) => event.stopPropagation()}
                  data-oid="8dxim-i"
                >
                  {normalizedPhone}
                </a>
              ) : (
                <span className="truncate italic text-muted-foreground/70" data-oid="8dxim-i">
                  Sin teléfono
                </span>
              )}
            </div>
          </div>

          {/* Bio Preview */}
          {bio && (
            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground" data-oid="tgiu333">
              {bio}
            </p>
          )}

          {/* Assigned Campuses */}
          <div className="mt-auto space-y-2" data-oid="f0-qctf">
            <p
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              data-oid="7d5jh7a"
            >
              Sedes Asignadas
            </p>
            <div className="flex gap-1 flex-wrap" data-oid="fpgw5-j">
              {assignedCampuses.length === 0 ? (
                <span className="text-xs text-muted-foreground" data-oid="xgrw:yc">
                  Sin sedes asignadas
                </span>
              ) : (
                assignedCampuses.slice(0, 2).map((campus) => (
                  <StaffCampusBadge
                    key={campus.id}
                    className="w-auto max-w-[10rem]"
                    data-oid=":pfs_wt"
                  >
                    {campus.name}
                  </StaffCampusBadge>
                ))
              )}
            </div>
          </div>
          {typeof courseRunsCount === 'number' ? (
            <div className="mt-3 border-t pt-3">
              <StaffCountBadge count={courseRunsCount} className="w-auto min-w-[7rem]" />
            </div>
          ) : null}
        </CardContent>
      </div>

      <CardFooter className="border-t bg-muted/50 p-3" data-oid="m18tdm8">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs font-semibold uppercase"
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
