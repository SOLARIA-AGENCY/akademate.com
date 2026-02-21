'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { MapPin, Phone, Mail, DoorOpen, Users } from 'lucide-react'

interface SedeListItemProps {
  sede: {
    id: string
    nombre: string
    direccion: string
    telefono: string
    email: string
    horario: string
    aulas: number
    capacidad: number
    cursosActivos: number
    profesores: number
    imagen: string
    borderColor?: string
  }
  onClick?: () => void
  className?: string
}

export function SedeListItem({ sede, onClick, className }: SedeListItemProps) {
  return (
    <div
      className={`flex min-h-20 items-center overflow-hidden rounded-lg border bg-card pr-3 transition-shadow duration-150 hover:shadow-sm ${className ?? ''}`}
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
      <div className="h-full w-1 shrink-0 bg-primary" />

      <div className="shrink-0">
        <img src={sede.imagen} alt={sede.nombre} className="h-20 w-20 object-cover" />
      </div>

      <div className="flex flex-1 items-center gap-3 pl-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight" title={sede.nombre}>
            {sede.nombre}
          </h3>
          <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{sede.direccion}</span>
          </div>
        </div>

        <div className="hidden min-w-[180px] flex-col gap-0.5 text-xs md:flex">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{sede.telefono}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{sede.email}</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 text-xs lg:flex">
          <div className="flex items-center gap-1">
            <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{sede.aulas}</span>
            <span className="text-muted-foreground">aulas</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{sede.capacidad}</span>
            <span className="text-muted-foreground">cap.</span>
          </div>
        </div>

        <div className="hidden w-[120px] justify-center sm:flex">
          <Badge variant="secondary" className="px-2.5 py-1 text-[10px] font-semibold leading-tight">
            {sede.cursosActivos} cursos
          </Badge>
        </div>

        <Button
          size="sm"
          className="h-7 shrink-0 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          Ver
        </Button>
      </div>
    </div>
  )
}
