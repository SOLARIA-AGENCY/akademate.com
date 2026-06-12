'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Separator } from '@payload-config/components/ui/separator'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffCountBadge,
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
  const roleLabel = teacher.department ?? teacher.position ?? (isAdministrative ? 'Administrativo' : 'Docente')
  const campuses = teacher.assignedCampuses ?? []
  const resolvedActionLabel = actionLabel ?? (isAdministrative ? 'Ver ficha administrativo' : 'Ver ficha docente')

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
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
      <CardContent className="grid min-h-24 grid-cols-[5rem_1fr_auto] items-center gap-4 p-4">
        <Avatar className="h-20 w-20 overflow-visible bg-muted">
          {!isPlaceholderPhoto(teacher.photo) && !photoError ? (
            <AvatarImage
              src={teacher.photo ?? undefined}
              alt={`${teacher.firstName} ${teacher.lastName}`}
              className="rounded-full object-cover"
              onError={() => setPhotoError(true)}
            />
          ) : null}
          <AvatarFallback className="bg-transparent">
            <StaffListFallback staffType={teacher.staffType} />
          </AvatarFallback>
        </Avatar>

        <div className="grid min-w-0 items-center gap-3 md:grid-cols-[minmax(0,1fr)_180px] lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight">
              {teacher.firstName} {teacher.lastName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{roleLabel}</p>
            {!isAdministrative && missingQualifiedAreas ? (
              <Badge variant="destructive" className="mt-2 h-6 w-fit px-2 text-[11px]">
                Sin área habilitada
              </Badge>
            ) : null}
          </div>

          <div className="hidden min-w-0 flex-col gap-1 text-xs md:flex">
            <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{teacher.email || 'Sin email'}</span>
            </span>
            {teacher.phone ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{teacher.phone}</span>
              </span>
            ) : null}
          </div>

          <div className="hidden min-w-0 flex-col gap-1 text-xs lg:flex">
            {isAdministrative && teacher.contractLabel ? (
              <StaffContractBadge>{teacher.contractLabel}</StaffContractBadge>
            ) : null}
            {campuses.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {campuses.slice(0, 2).map((campus) => (
                  <StaffCampusBadge key={campus.id}>{campus.name}</StaffCampusBadge>
                ))}
              </div>
            ) : null}
            {!isAdministrative && !campuses.length
              ? (teacher.specialties ?? []).slice(0, 2).map((specialty) => (
                  <span key={specialty} className="truncate leading-tight text-muted-foreground">
                    {specialty}
                  </span>
                ))
              : null}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <StaffStatusBadge status={teacher.active} />
            {typeof teacher.courseRunsCount === 'number' ? (
              <>
                <Separator orientation="vertical" className="h-5" />
                <StaffCountBadge count={teacher.courseRunsCount} label={countLabel ?? 'cursos'} />
              </>
            ) : null}
          </div>
        </div>

        <Button
          size="sm"
          className="h-7 shrink-0 px-3 text-xs font-semibold uppercase tracking-wide"
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
