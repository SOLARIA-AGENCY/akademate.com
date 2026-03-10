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
      data-oid="8x34bh8"
    >
      <CardContent className="p-0" data-oid="jadrt0f">
        {/* Hero Image */}
        <div className="w-full h-64 overflow-hidden bg-gray-100 relative" data-oid="aw.ai8n">
          <img
            src={ciclo.image}
            alt={ciclo.nombre}
            className="w-full h-full object-cover"
            data-oid="d-_k3qy"
          />

          <div className="absolute top-4 right-4" data-oid="i1l:f.x">
            <Badge
              className={`${ciclo.color} text-white text-sm font-bold uppercase`}
              data-oid="ggfbrw1"
            >
              {ciclo.tipo === 'superior' ? 'Grado Superior' : 'Grado Medio'}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4" data-oid="s1qu90j">
          {/* Header - Fixed height */}
          <div className="space-y-2 min-h-[6rem]" data-oid="8tw_yyd">
            <h3
              className="font-bold text-2xl leading-tight uppercase line-clamp-2"
              data-oid="691e3o:"
            >
              {ciclo.nombre}
            </h3>
            <p className="text-sm text-muted-foreground truncate" data-oid="dgqtu8c">
              {ciclo.codigo}
            </p>
            <Badge variant="outline" className="text-xs" data-oid="l5avkvf">
              {ciclo.familia_profesional}
            </Badge>
          </div>

          {/* Description - Fixed height for 3 lines */}
          <p
            className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[4.5rem]"
            data-oid="d74ebcu"
          >
            {ciclo.descripcion}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 py-4 border-y" data-oid="04rvole">
            <div className="flex flex-col items-center text-center" data-oid="augj4dc">
              <BookOpen className="h-5 w-5 text-muted-foreground mb-1" data-oid="dncx65u" />
              <span className="text-xs text-muted-foreground" data-oid="::e6:z8">
                Cursos
              </span>
              <span className="font-bold text-lg" data-oid="8nho9ku">
                {ciclo.cursos.length}
              </span>
            </div>

            <div className="flex flex-col items-center text-center" data-oid="nwqrp1j">
              <Calendar className="h-5 w-5 text-muted-foreground mb-1" data-oid="yb9zcp0" />
              <span className="text-xs text-muted-foreground" data-oid="etybxov">
                Convocatorias
              </span>
              <span className="font-bold text-lg" data-oid="te0nhvv">
                {ciclo.total_instancias}
              </span>
            </div>

            <div className="flex flex-col items-center text-center" data-oid="edbbbe9">
              <Users className="h-5 w-5 text-muted-foreground mb-1" data-oid="7d0z9s_" />
              <span className="text-xs text-muted-foreground" data-oid="cknarjl">
                Alumnos
              </span>
              <span className="font-bold text-lg" data-oid="-q64awt">
                {ciclo.total_alumnos}
              </span>
            </div>

            <div className="flex flex-col items-center text-center" data-oid="mfzzl6z">
              <GraduationCap className="h-5 w-5 text-muted-foreground mb-1" data-oid="wh1dt:o" />
              <span className="text-xs text-muted-foreground" data-oid="hc7id2q">
                Horas
              </span>
              <span className="font-bold text-lg" data-oid="0v7gh6q">
                {ciclo.duracion_total_horas}H
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2" data-oid="9fpfxlo">
            <Button
              className={`flex-1 ${ciclo.color} hover:opacity-90 text-white font-bold uppercase`}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                router.push(`/ciclos/${ciclo.id}`)
              }}
              data-oid="34:sndk"
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
              data-oid="bdtzp.d"
            >
              VER CONVOCATORIAS ({ciclo.instancias_activas})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
