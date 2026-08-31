'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { MapPin, Phone, Mail, DoorOpen, Users } from 'lucide-react'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'

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
    imagen: string | null
    borderColor?: string
    active?: boolean
  }
  onClick?: () => void
  className?: string
}

export function SedeListItem({ sede, onClick, className }: SedeListItemProps) {
  return (
    <div
      className={`flex min-h-20 items-center gap-4 overflow-hidden rounded-lg border bg-card px-4 py-3 transition-shadow duration-150 hover:shadow-sm ${className ?? ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
      data-oid="em0zouv"
    >
      <EntityThumb src={sede.imagen} alt={sede.nombre} fallback="campus" size="sm" />

      <div className="flex min-w-0 flex-1 items-center gap-3" data-oid="gpb8lda">
        <div className="min-w-0 flex-1" data-oid="ca9xgr4">
          <h3
            className="whitespace-normal text-sm font-semibold leading-tight"
            title={sede.nombre}
            data-oid="_ja87gd"
          >
            {sede.nombre}
          </h3>
          <div
            className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"
            data-oid="tb2avbg"
          >
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" data-oid="wtjbvxm" />
            <span className="line-clamp-1" data-oid="1ekoh:v">
              {sede.direccion}
            </span>
          </div>
        </div>

        <div className="hidden min-w-[180px] flex-col gap-0.5 text-xs md:flex" data-oid="qcpt8d4">
          <div className="flex items-center gap-1" data-oid="gxfhg3e">
            <Phone className="h-3 w-3 text-muted-foreground" data-oid="0_g82ly" />
            <span className="text-muted-foreground" data-oid=".hmriwy">
              {sede.telefono}
            </span>
          </div>
          <div className="flex items-center gap-1" data-oid="c6vs70u">
            <Mail className="h-3 w-3 text-muted-foreground" data-oid="qsmn111" />
            <span className="truncate text-muted-foreground" data-oid="qnp5vh6">
              {sede.email}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-3 text-xs lg:flex" data-oid="l6mueao">
          <div className="flex items-center gap-1" data-oid="s2b4elg">
            <span className="font-medium" data-oid="_vvkkhz">
              {sede.aulas}
            </span>
            <span className="text-muted-foreground" data-oid="1-kvdq.">
              aulas
            </span>
            <DoorOpen className="h-3 w-3 text-muted-foreground" aria-hidden="true" data-oid=":0nki8c" />
          </div>
          <div className="flex items-center gap-1" data-oid="zj5n1s7">
            <span className="font-medium" data-oid="n._-q0z">
              {sede.capacidad}
            </span>
            <span className="text-muted-foreground" data-oid="t5.nvcw">
              cap.
            </span>
            <Users className="h-3 w-3 text-muted-foreground" aria-hidden="true" data-oid="ztd2ggo" />
          </div>
        </div>

        <div className="hidden w-[120px] justify-center sm:flex" data-oid="fsmc2hf">
          <Badge
            variant="static"
            className="border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold leading-tight text-emerald-800"
            data-oid="bf:l5nj"
          >
            Activo
          </Badge>
        </div>

        <Button
          size="sm"
          className="h-7 shrink-0 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          data-oid="6u2aznz"
        >
          Ver
        </Button>
      </div>
    </div>
  )
}
