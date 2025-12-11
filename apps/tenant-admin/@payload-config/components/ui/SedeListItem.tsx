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
  // Use bg color instead of border color (e.g., 'bg-[#ff2014]')
  const bgColorClass = sede.borderColor?.replace('border-', 'bg-') || 'bg-[#ff2014]'

  return (
    <div
      className={`flex items-center h-20 pr-4 bg-card border-y border-r rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer ${className || ''}`}
      onClick={onClick}
    >
      {/* Borde de color como div separado - PEGADO a la imagen */}
      <div className={`h-full w-1 flex-shrink-0 ${bgColorClass}`} />

      {/* Thumbnail - Pegada al borde sin gap */}
      <div className="flex-shrink-0 h-full">
        <img
          src={sede.imagen}
          alt={sede.nombre}
          className="h-full w-20 object-cover"
        />
      </div>

      {/* Contenido con padding interno */}
      <div className="flex items-center flex-1 gap-3 pl-4">
        {/* Name + Location */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate leading-tight mb-0.5" title={sede.nombre}>
            {sede.nombre}
          </h3>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{sede.direccion}</span>
          </div>
        </div>

        {/* Contact Info - Compacto */}
        <div className="hidden md:flex flex-col gap-0.5 text-xs min-w-[180px]">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{sede.telefono}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{sede.email}</span>
          </div>
        </div>

        {/* Stats - Compacto */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
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

        {/* Courses Active Badge - Más pequeño */}
        <div className="hidden sm:block w-[120px] flex justify-center">
          <Badge className="bg-[#ff2014] hover:bg-[#ff2014]/90 text-white text-[10px] font-semibold px-2.5 py-1 leading-tight">
            {sede.cursosActivos} cursos
          </Badge>
        </div>

        {/* Action Button - Compacto */}
        <Button
          size="sm"
          className="bg-[#ff2014] hover:bg-[#ff2014]/90 text-white text-xs font-semibold uppercase tracking-wide shrink-0 h-7 px-3"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          VER
        </Button>
      </div>
    </div>
  )
}
