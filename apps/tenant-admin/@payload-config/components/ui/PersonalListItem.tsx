'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Mail, Phone, BookOpen, Award } from 'lucide-react'

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
}

export function PersonalListItem({ teacher, onClick, className }: PersonalListItemProps) {
  // Department-based border color
  const departmentColors: Record<string, string> = {
    'Marketing Digital': 'border-l-red-600',
    'Desarrollo Web': 'border-l-blue-600',
    'Diseño Gráfico': 'border-l-purple-600',
    Audiovisual: 'border-l-orange-600',
    Administración: 'border-l-green-600',
  }

  const borderColor = departmentColors[teacher.department] || 'border-l-gray-600'

  return (
    <div
      className={`flex items-center h-20 pr-4 bg-card border-y border-r rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer ${className || ''}`}
      onClick={onClick}
      data-oid="afb5w:u"
    >
      {/* Borde de color como div separado */}
      <div
        className={`h-full w-1 flex-shrink-0 ${borderColor.replace('border-l-', 'bg-')}`}
        data-oid="iw0mc_b"
      />

      {/* Photo (circular) - Con padding para respirar */}
      <div
        className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-full bg-muted ml-4"
        data-oid="jbwoqz1"
      >
        <img
          src={teacher.photo}
          alt={`${teacher.firstName} ${teacher.lastName}`}
          className="w-full h-full object-cover"
          data-oid="28ijt7d"
        />
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
              {teacher.email}
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
            cursos
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
