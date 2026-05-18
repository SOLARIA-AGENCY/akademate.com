'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Separator } from '@payload-config/components/ui/separator'
import { cn } from '@payload-config/lib/utils'
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
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border-l-4 border-l-primary shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
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
      <CardContent className="grid min-h-20 grid-cols-[5rem_1fr_auto] items-center gap-4 p-0 pr-3">
        <img src={sede.imagen} alt={sede.nombre} className="h-20 w-20 object-cover" />

        <div className="grid min-w-0 items-center gap-3 py-3 md:grid-cols-[minmax(0,1fr)_180px] lg:grid-cols-[minmax(0,1fr)_180px_170px]">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight" title={sede.nombre}>
              {sede.nombre}
            </h3>
            <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{sede.direccion}</span>
            </div>
          </div>

          <div className="hidden min-w-0 flex-col gap-1 text-xs md:flex">
            <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{sede.telefono}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{sede.email}</span>
            </span>
          </div>

          <div className="hidden items-center gap-3 text-xs lg:flex">
            <span className="flex items-center gap-1">
              <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{sede.aulas}</span>
              <span className="text-muted-foreground">aulas</span>
            </span>
            <Separator orientation="vertical" className="h-5" />
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{sede.capacidad}</span>
              <span className="text-muted-foreground">cap.</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden px-2.5 py-1 text-[10px] font-semibold sm:inline-flex">
            {sede.cursosActivos} cursos
          </Badge>
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
      </CardContent>
    </Card>
  )
}
