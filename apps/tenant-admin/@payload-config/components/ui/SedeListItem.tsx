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
      data-oid="em0zouv"
    >
      <div className="h-full w-1 shrink-0 bg-primary" data-oid="ahierfq" />

      <div className="shrink-0" data-oid="tc8o9s_">
        <img
          src={sede.imagen}
          alt={sede.nombre}
          className="h-20 w-20 object-cover"
          data-oid="ldy01dj"
        />
      </div>

      <div className="flex flex-1 items-center gap-3 pl-4" data-oid="gpb8lda">
        <div className="min-w-0 flex-1" data-oid="ca9xgr4">
          <h3
            className="truncate text-sm font-semibold leading-tight"
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
            <span className="truncate text-muted-foreground" data-oid="quyp9o9">
              {sede.email}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-3 text-xs lg:flex" data-oid="l6mueao">
          <div className="flex items-center gap-1" data-oid="s2b4elg">
            <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" data-oid=":0nki8c" />
            <span className="font-medium" data-oid="_vvkkhz">
              {sede.aulas}
            </span>
            <span className="text-muted-foreground" data-oid="1-kvdq.">
              aulas
            </span>
          </div>
          <div className="flex items-center gap-1" data-oid="zj5n1s7">
            <Users className="h-3.5 w-3.5 text-muted-foreground" data-oid="ztd2ggo" />
            <span className="font-medium" data-oid="n._-q0z">
              {sede.capacidad}
            </span>
            <span className="text-muted-foreground" data-oid="t5.nvcw">
              cap.
            </span>
          </div>
        </div>

        <div className="hidden w-[120px] justify-center sm:flex" data-oid="fsmc2hf">
          <Badge
            variant="secondary"
            className="px-2.5 py-1 text-[10px] font-semibold leading-tight"
            data-oid="bf:l5nj"
          >
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
          data-oid="6u2aznz"
        >
          Ver
        </Button>
      </div>
    </div>
  )
}
