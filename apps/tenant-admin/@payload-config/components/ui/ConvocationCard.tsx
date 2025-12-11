'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Users, Clock, Euro, MapPin, User, Calendar, DoorOpen } from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import type { InstanciaVistaCompleta } from '@/types'

interface ConvocationCardProps {
  instance: InstanciaVistaCompleta
  onClick?: () => void
  className?: string
}

export function ConvocationCard({ instance, onClick, className }: ConvocationCardProps) {
  const typeConfig = COURSE_TYPE_CONFIG[instance.tipo] || COURSE_TYPE_CONFIG.privados
  const occupancyPercentage = instance.porcentajeOcupacion

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Card
      className={`convocation-card cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 ${typeConfig.borderColor} ${className || ''}`}
      onClick={onClick}
    >
      <div className={`h-2 ${typeConfig.bgColor}`} />

      <CardContent className="p-6 space-y-3 flex flex-col">
        {/* Header with Type Badge */}
        <div className="space-y-2">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-xs font-bold uppercase tracking-wide`}
          >
            {typeConfig.label}
          </Badge>

          {/* Título - ALTURA FIJA, 1 LÍNEA con ellipsis */}
          <div className="h-7 overflow-hidden">
            <h3
              className="font-bold text-lg leading-7 uppercase truncate"
              title={instance.nombreCurso}
            >
              {instance.nombreCurso}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">{instance.codigoCompleto}</p>
        </div>

        {/* Description - 3 líneas máx */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed h-16">
          {instance.descripcionCurso}
        </p>

        {/* NUEVOS CAMPOS: Fechas, Horario, Sede */}
        <div className="space-y-2">
          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-xs">
              {formatDate(instance.fechaInicio)} - {formatDate(instance.fechaFin)}
            </span>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-xs">{instance.horario}</span>
          </div>

          {/* Sede específica */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-xs">{instance.sedeNombre}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-bold">{instance.duracionHoras}H</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Euro className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {instance.precioConDescuento ? (
              <div className="flex items-center gap-1">
                <del className="text-xs text-gray-400">{instance.precio}€</del>
                <span className="font-bold text-red-600">{instance.precioConDescuento}€</span>
              </div>
            ) : instance.precio === 0 ? (
              <span className="font-bold text-green-600 text-xs uppercase">
                100% SUBVENCIONADO
              </span>
            ) : (
              <span className={`font-bold ${typeConfig.textColor}`}>
                {instance.precio}€
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs">
              {instance.plazasOcupadas}/{instance.plazasTotales}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs">{instance.aulaNombre}</span>
          </div>
        </div>

        {/* Profesor */}
        <div className="flex items-center gap-2 py-2 border-t">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <span className="text-xs font-medium truncate">{instance.profesorNombre}</span>
          </div>
        </div>

        {/* Modalidad y Ocupación */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs uppercase">
            {instance.modalidad}
          </Badge>
          <span className="text-xs text-muted-foreground">{occupancyPercentage}% ocupado</span>
        </div>

        {/* Logos de Entidades Financiadoras */}
        {instance.subvencionado !== 'no' && instance.entidadesFinanciadoras.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Financiado por:</p>
            <div className="flex gap-2 flex-wrap items-center">
              {instance.entidadesFinanciadoras.map((entidad) => (
                <div
                  key={entidad.id}
                  className="px-2 py-1 bg-secondary rounded text-xs font-medium"
                  title={entidad.nombre}
                >
                  {entidad.nombre}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button with Type Color */}
        <Button
          className={`w-full ${typeConfig.bgColor} ${typeConfig.hoverColor} text-white font-bold uppercase tracking-wide shadow-md transition-all duration-300 mt-auto`}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          VER CURSO
        </Button>
      </CardContent>
    </Card>
  )
}
