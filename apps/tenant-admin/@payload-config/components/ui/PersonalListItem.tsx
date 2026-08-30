'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Badge, LISTING_PILL_CLASS } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Separator } from '@payload-config/components/ui/separator'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffCountBadge,
  StaffAreaBadge,
  StaffStatusBadge,
} from '@payload-config/components/ui/StaffBadges'
import { cn } from '@payload-config/lib/utils'
import { Mail, Phone, User, GraduationCap, Briefcase } from 'lucide-react'

interface StaffListItemPerson {
  id: number | string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  photo?: string | null
  department?: string | null
  position?: string | null
  staffType?: string | null
  active: boolean | string
  contractLabel?: string | null
  courseRunsCount?: number
  assignedCampuses?: Array<{
    id: number | string
    name: string
    city?: string | null
  }>
  qualifiedAreas?: Array<{
    id: number
    codigo?: string | null
    nombre: string
  }>
  specialties?: string[]
}

interface PersonalListItemProps {
  teacher: StaffListItemPerson
  onClick?: () => void
  className?: string
  actionLabel?: string
  countLabel?: string
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

function StaffListFallback({ staffType }: { staffType?: string | null }) {
  const isTeacher = staffType !== 'administrativo'
  const BadgeIcon = isTeacher ? GraduationCap : Briefcase
  const label = isTeacher ? 'Imagen genérica de docente' : 'Imagen genérica de administrativo'

  return (
    <div
      aria-label={label}
      className="relative flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary"
    >
      <User className="h-7 w-7" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background text-primary shadow-sm">
        <BadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}

export function PersonalListItem({
  teacher,
  onClick,
  className,
  actionLabel,
  countLabel,
}: PersonalListItemProps) {
  const [photoError, setPhotoError] = React.useState(false)
  const missingQualifiedAreas = (teacher.qualifiedAreas ?? []).length === 0
  const isAdministrative = teacher.staffType === 'administrativo'
  const roleLabel =
    teacher.department ?? teacher.position ?? (isAdministrative ? 'Administrativo' : 'Docente')
  const campuses = teacher.assignedCampuses ?? []
  const qualifiedAreas = teacher.qualifiedAreas ?? []
  const resolvedActionLabel = actionLabel ?? 'Ver ficha'
  const email = teacher.email?.trim()
  const phone = teacher.phone?.trim()

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
    >
      <CardContent className="grid min-h-20 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-4 p-4 sm:p-5">
        <Avatar className="h-14 w-14 overflow-visible ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm shrink-0">
          {!isPlaceholderPhoto(teacher.photo) && !photoError ? (
            <AvatarImage
              src={teacher.photo ?? undefined}
              alt={`${teacher.firstName} ${teacher.lastName}`}
              className="rounded-full object-cover"
              onError={() => setPhotoError(true)}
            />
          ) : null}
          <AvatarFallback className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
            <StaffListFallback staffType={teacher.staffType} />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4 lg:grid lg:grid-cols-4 xl:gap-6">
          {/* Nombre y Cargo */}
          <div className="min-w-[180px] flex-1">
            <h3 className="truncate text-sm font-extrabold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {teacher.firstName} {teacher.lastName}
            </h3>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{roleLabel}</p>
            {!isAdministrative && !missingQualifiedAreas ? (
              <div className="mt-1.5 flex max-w-full flex-wrap gap-1">
                {qualifiedAreas.slice(0, 2).map((area) => (
                  <StaffAreaBadge key={area.id} seed={area.codigo ?? area.id}>
                    {area.nombre}
                  </StaffAreaBadge>
                ))}
                {qualifiedAreas.length > 2 ? (
                  <StaffAreaBadge seed={`${teacher.id}-more`} className="max-w-[5rem]">
                    +{qualifiedAreas.length - 2}
                  </StaffAreaBadge>
                ) : null}
              </div>
            ) : null}
            {!isAdministrative && missingQualifiedAreas ? (
              <span className={`mt-1.5 ${LISTING_PILL_CLASS} border-rose-200/80 bg-rose-50 text-rose-700`}>
                Sin área habilitada
              </span>
            ) : null}
          </div>

          {/* Contacto */}
          <div className="hidden min-w-0 flex-col gap-1 text-xs sm:flex">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(event) => event.stopPropagation()}
                >
                  {email}
                </a>
              ) : (
                <span className="truncate italic text-slate-400 dark:text-slate-500">Sin mail</span>
              )}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(event) => event.stopPropagation()}
                >
                  {phone}
                </a>
              ) : (
                <span className="truncate italic text-slate-400 dark:text-slate-500">Sin teléfono</span>
              )}
            </span>
          </div>

          {/* Contrato y Sedes */}
          <div className="hidden min-w-0 flex-col gap-1.5 text-xs lg:flex">
            {teacher.contractLabel ? (
              <StaffContractBadge>{teacher.contractLabel}</StaffContractBadge>
            ) : null}
            {campuses.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {campuses.slice(0, 2).map((campus) => (
                  <StaffCampusBadge key={campus.id}>{campus.name}</StaffCampusBadge>
                ))}
              </div>
            ) : null}
          </div>

          {/* Estado y Convocatorias */}
          <div className="hidden min-w-0 items-center gap-2 xl:flex">
            <StaffStatusBadge status={teacher.active} />
            {typeof teacher.courseRunsCount === 'number' ? (
              <StaffCountBadge
                count={teacher.courseRunsCount}
                label={countLabel ?? 'cursos'}
                className="min-w-0"
              />
            ) : null}
          </div>
        </div>

        {/* Botón CTA */}
        <Button
          size="sm"
          className="h-9 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          {resolvedActionLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
