'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { GraduationCap, Users, BookOpen, Calendar } from 'lucide-react'
import type { CicloPlantilla } from '@/types'

interface CicloCardProps {
  ciclo: CicloPlantilla
  className?: string
}

export function CicloCard({ ciclo, className }: CicloCardProps) {
  const router = useRouter()

  return (
    <Card
      className={`cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200 col-span-2 ${className}`}
      onClick={() => router.push(`/ciclos/${ciclo.id}`)}
    >
      <CardContent className="p-0">
        {/* Hero Image */}
        <div className="w-full h-64 overflow-hidden bg-gray-100 relative">
          <img
            src={ciclo.image}
            alt={ciclo.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge className={`${ciclo.color} text-white text-sm font-bold uppercase`}>
              {ciclo.tipo === 'superior' ? 'Grado Superior' : 'Grado Medio'}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Header - Fixed height */}
          <div className="space-y-2 min-h-[6rem]">
            <h3 className="font-bold text-2xl leading-tight uppercase line-clamp-2">
              {ciclo.nombre}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{ciclo.codigo}</p>
            <Badge variant="outline" className="text-xs">
              {ciclo.familia_profesional}
            </Badge>
          </div>

          {/* Description - Fixed height for 3 lines */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[4.5rem]">
            {ciclo.descripcion}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 py-4 border-y">
            <div className="flex flex-col items-center text-center">
              <BookOpen className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Cursos</span>
              <span className="font-bold text-lg">{ciclo.cursos.length}</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Convocatorias</span>
              <span className="font-bold text-lg">{ciclo.total_instancias}</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <Users className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Alumnos</span>
              <span className="font-bold text-lg">{ciclo.total_alumnos}</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <GraduationCap className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Horas</span>
              <span className="font-bold text-lg">{ciclo.duracion_total_horas}H</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className={`flex-1 ${ciclo.color} hover:opacity-90 text-white font-bold uppercase`}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                router.push(`/ciclos/${ciclo.id}`)
              }}
            >
              VER DETALLES
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-bold uppercase"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                router.push(`/ciclos/${ciclo.id}#convocatorias`)
              }}
            >
              VER CONVOCATORIAS ({ciclo.instancias_activas})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
