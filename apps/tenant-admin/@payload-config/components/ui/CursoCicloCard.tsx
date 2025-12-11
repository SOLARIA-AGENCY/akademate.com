'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Clock, BookOpen } from 'lucide-react'
import type { CursoCiclo } from '@/types'

interface CursoCicloCardProps {
  curso: CursoCiclo
  cicloImagen: string // Hereda la imagen del ciclo padre
  cicloColor: string // Hereda el color del ciclo padre
  className?: string
}

export function CursoCicloCard({ curso, cicloImagen, cicloColor, className }: CursoCicloCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-all duration-300 overflow-hidden border ${className}`}
      style={{ maxHeight: '280px' }}
    >
      <CardContent className="p-0">
        {/* Image (heredada del ciclo, más pequeña) */}
        <div className="w-full h-24 overflow-hidden bg-gray-100">
          <img
            src={cicloImagen}
            alt={curso.nombre}
            className="w-full h-full object-cover opacity-70"
          />
        </div>

        <div className="p-4 space-y-3">
          {/* Header - Fixed height */}
          <div className="space-y-2 min-h-[5rem]">
            <div className="flex items-center gap-2">
              <Badge className={`${cicloColor} text-white text-xs`}>
                Módulo {curso.orden}
              </Badge>
            </div>
            <h4 className="font-bold text-sm leading-tight uppercase line-clamp-2 min-h-[2.5rem]">
              {curso.nombre}
            </h4>
            <p className="text-xs text-muted-foreground truncate">{curso.codigo}</p>
          </div>

          {/* Description - Fixed height for 2 lines */}
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
            {curso.descripcion}
          </p>

          {/* Info */}
          <div className="flex items-center gap-4 text-xs border-t pt-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold">{curso.duracion_horas}H</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{curso.contenidos.length} temas</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
