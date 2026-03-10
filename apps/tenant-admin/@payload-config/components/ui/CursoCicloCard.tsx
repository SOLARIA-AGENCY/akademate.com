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
      data-oid="4lcuj5."
    >
      <CardContent className="p-0" data-oid="ighs3hh">
        {/* Image (heredada del ciclo, más pequeña) */}
        <div className="w-full h-24 overflow-hidden bg-gray-100" data-oid="2gq1vmz">
          <img
            src={cicloImagen}
            alt={curso.nombre}
            className="w-full h-full object-cover opacity-70"
            data-oid="17pkw5k"
          />
        </div>

        <div className="p-4 space-y-3" data-oid=".30wkgh">
          {/* Header - Fixed height */}
          <div className="space-y-2 min-h-[5rem]" data-oid="hrqvive">
            <div className="flex items-center gap-2" data-oid="671bvwh">
              <Badge className={`${cicloColor} text-white text-xs`} data-oid="nju.ipu">
                Módulo {curso.orden}
              </Badge>
            </div>
            <h4
              className="font-bold text-sm leading-tight uppercase line-clamp-2 min-h-[2.5rem]"
              data-oid="r7bmnki"
            >
              {curso.nombre}
            </h4>
            <p className="text-xs text-muted-foreground truncate" data-oid="yb-d-q:">
              {curso.codigo}
            </p>
          </div>

          {/* Description - Fixed height for 2 lines */}
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]" data-oid="kg.k28v">
            {curso.descripcion}
          </p>

          {/* Info */}
          <div className="flex items-center gap-4 text-xs border-t pt-2" data-oid="xrek5qi">
            <div className="flex items-center gap-1" data-oid="1h4fqic">
              <Clock className="h-3 w-3 text-muted-foreground" data-oid=":-lk1-s" />
              <span className="font-semibold" data-oid="y2w3:6r">
                {curso.duracion_horas}H
              </span>
            </div>
            <div className="flex items-center gap-1" data-oid="b.pu:sb">
              <BookOpen className="h-3 w-3 text-muted-foreground" data-oid="_eq.a6u" />
              <span className="text-muted-foreground" data-oid="0ckgg9:">
                {curso.contenidos.length} temas
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
