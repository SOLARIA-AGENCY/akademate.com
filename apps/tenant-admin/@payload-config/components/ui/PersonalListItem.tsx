'use client'

import * as React from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Mail, Phone, BookOpen } from 'lucide-react'
import { EntityThumb, type EntityThumbFallback } from '@payload-config/components/ui/entity-thumb'

interface TeacherExpanded {
  id: number
  firstName: string
  lastName: string
  initials: string
  email: string
  phone?: string
  photo: string
  department: string
  specialties: string[]
  bio?: string
  active: boolean
  courseRunsCount: number
  certifications: Array<{
    title: string
    institution: string
    year: number
  }>
}

interface PersonalListItemProps {
  teacher: TeacherExpanded
  onClick?: () => void
  className?: string
  fallback?: EntityThumbFallback
}

const isPlaceholderPhoto = (photo?: string | null) =>
  !photo || photo === '/placeholder-avatar.svg' || photo.includes('placeholder-avatar')

export function PersonalListItem({
  teacher,
  onClick,
  className,
  fallback = 'person',
}: PersonalListItemProps) {
  const photoSrc = isPlaceholderPhoto(teacher.photo) ? null : teacher.photo
  const fullName = `${teacher.firstName} ${teacher.lastName}`

  return (
    <div
      className={`flex min-h-16 items-center rounded-lg border bg-card py-3 pl-5 pr-4 transition-shadow duration-150 hover:shadow-md cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="afb5w:u"
    >
      <div aria-label="Imagen genérica de docente">
        <EntityThumb src={photoSrc} alt={fullName} fallback={fallback} size="md" />
      </div>

      {/* Contenido con padding interno */}
      <div className="flex items-center flex-1 gap-3 pl-4" data-oid="iz.1p66">
        {/* Name + Department */}
        <div className="flex-1 min-w-0" data-oid="5lw2jtv">
          <h3 className="font-semibold text-sm truncate leading-tight mb-0.5" data-oid="xthbz4e">
            {teacher.firstName} {teacher.lastName}
          </h3>
          <p className="text-xs text-muted-foreground truncate" data-oid="s:ke5zh">
            {teacher.department}
          </p>
        </div>

        {/* Contact Info - Compacto */}
        <div className="hidden md:flex flex-col gap-0.5 text-xs min-w-[180px]" data-oid="c23qbt1">
          <div className="flex items-center gap-1" data-oid="nz-6sx_">
            <Mail className="h-3 w-3 text-muted-foreground" data-oid="quf6j77" />
            <span className="text-muted-foreground truncate" data-oid="ua52l:d">
              {teacher.email?.trim() ? teacher.email : '–'}
            </span>
          </div>
          <div className="flex items-center gap-1" data-oid="uwks_u_">
            <Phone className="h-3 w-3 text-muted-foreground" data-oid="wd5:..z" />
            <span className="text-muted-foreground" data-oid="vnrbfqw">
              {teacher.phone}
            </span>
          </div>
        </div>

        {/* Specialties (first 2) - Compacto */}
        <div className="hidden lg:flex flex-col gap-0.5 text-xs min-w-[140px]" data-oid=".ido75a">
          {teacher.specialties.slice(0, 2).map((specialty, idx) => (
            <span
              key={idx}
              className="text-muted-foreground truncate leading-tight"
              data-oid="j.prgx4"
            >
              • {specialty}
            </span>
          ))}
        </div>

        {/* Status Badge - Más pequeño */}
        <div className="hidden lg:block w-[100px] flex justify-center" data-oid="0lag-ll">
          <Badge
            className={`${
              teacher.active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'
            } text-white text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap px-2.5 py-1 leading-tight`}
            data-oid="ere3jjl"
          >
            {teacher.active ? 'ACTIVO' : 'INACTIVO'}
          </Badge>
        </div>

        {/* Courses Count - Compacto */}
        <div className="hidden sm:flex items-center gap-1 text-xs w-28" data-oid="0hx0xsd">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" data-oid="0wrq0xg" />
          <span className="font-medium" data-oid="ef4ll2d">
            {teacher.courseRunsCount}
          </span>
          <span className="text-muted-foreground" data-oid="e366udr">
            {teacher.courseRunsCount === 1 ? 'convocatoria' : 'convocatorias'}
          </span>
        </div>

        {/* Action Button - Compacto */}
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold uppercase tracking-wide shrink-0 h-7 px-3"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          data-oid="1pqhstl"
        >
          VER
        </Button>
      </div>
    </div>
  )
}
