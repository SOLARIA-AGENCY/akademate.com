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
      data-oid="b:1-7.8"
    >
      <div className={`h-2 ${typeConfig.bgColor}`} data-oid="1-3rggd" />

      <CardContent className="p-6 space-y-3 flex flex-col" data-oid="zbz8_68">
        {/* Header with Type Badge */}
        <div className="space-y-2" data-oid=".5i2xim">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-xs font-bold uppercase tracking-wide`}
            data-oid="podtj4j"
          >
            {typeConfig.label}
          </Badge>

          {/* Título - ALTURA FIJA, 1 LÍNEA con ellipsis */}
          <div className="h-7 overflow-hidden" data-oid="y93o.jm">
            <h3
              className="font-bold text-lg leading-7 uppercase truncate"
              title={instance.nombreCurso}
              data-oid="y::aibz"
            >
              {instance.nombreCurso}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground" data-oid="nk2iol.">
            {instance.codigoCompleto}
          </p>
        </div>

        {/* Description - 3 líneas máx */}
        <p
          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed h-16"
          data-oid="9x5szt6"
        >
          {instance.descripcionCurso}
        </p>

        {/* NUEVOS CAMPOS: Fechas, Horario, Sede */}
        <div className="space-y-2" data-oid="smbnlm:">
          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm" data-oid="jqqlj4q">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="h.dsd6f" />
            <span className="font-medium text-xs" data-oid="l_4wnzr">
              {formatDate(instance.fechaInicio)} - {formatDate(instance.fechaFin)}
            </span>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-2 text-sm" data-oid=":qj_cy_">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="mpj9_gl" />
            <span className="font-medium text-xs" data-oid="5oqe70y">
              {instance.horario}
            </span>
          </div>

          {/* Sede específica */}
          <div className="flex items-center gap-2 text-sm" data-oid="phfefco">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="b5h8r7_" />
            <span className="font-medium text-xs" data-oid="5i3z-6r">
              {instance.sedeNombre}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y" data-oid="kica-oq">
          <div className="flex items-center gap-2 text-sm" data-oid="5rtppvt">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="7s6ov_k" />
            <span className="font-bold" data-oid="3e52ac3">
              {instance.duracionHoras}H
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm" data-oid="ne9gt6q">
            <Euro className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="xzzabo2" />
            {instance.precioConDescuento ? (
              <div className="flex items-center gap-1" data-oid="0f..9d6">
                <del className="text-xs text-gray-400" data-oid="630hu2d">
                  {instance.precio}€
                </del>
                <span className="font-bold text-red-600" data-oid="cg1diyk">
                  {instance.precioConDescuento}€
                </span>
              </div>
            ) : instance.precio === 0 ? (
              <span className="font-bold text-green-600 text-xs uppercase" data-oid="61ns3v_">
                100% SUBVENCIONADO
              </span>
            ) : (
              <span className={`font-bold ${typeConfig.textColor}`} data-oid="o79g6xu">
                {instance.precio}€
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm" data-oid="8qgiyj:">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="xi3jv9-" />
            <span className="text-xs" data-oid="bd9zk0t">
              {instance.plazasOcupadas}/{instance.plazasTotales}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm" data-oid="uuz048u">
            <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="4irm67u" />
            <span className="text-xs" data-oid="ut3ai-8">
              {instance.aulaNombre}
            </span>
          </div>
        </div>

        {/* Profesor */}
        <div className="flex items-center gap-2 py-2 border-t" data-oid="l_en_yh">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" data-oid="rzrpjui" />
          <div className="flex items-center gap-2 flex-1 overflow-hidden" data-oid="6sy-yib">
            <span className="text-xs font-medium truncate" data-oid="yg-f.e1">
              {instance.profesorNombre}
            </span>
          </div>
        </div>

        {/* Modalidad y Ocupación */}
        <div className="flex items-center justify-between gap-2" data-oid="0e8a0pp">
          <Badge variant="outline" className="text-xs uppercase" data-oid="u9rh874">
            {instance.modalidad}
          </Badge>
          <span className="text-xs text-muted-foreground" data-oid="entcdjd">
            {occupancyPercentage}% ocupado
          </span>
        </div>

        {/* Logos de Entidades Financiadoras */}
        {instance.subvencionado !== 'no' && instance.entidadesFinanciadoras.length > 0 && (
          <div className="pt-2 border-t" data-oid="zehsu4z">
            <p className="text-xs text-muted-foreground mb-2" data-oid="vd39p8v">
              Financiado por:
            </p>
            <div className="flex gap-2 flex-wrap items-center" data-oid="4vot6as">
              {instance.entidadesFinanciadoras.map((entidad) => (
                <div
                  key={entidad.id}
                  className="px-2 py-1 bg-secondary rounded text-xs font-medium"
                  title={entidad.nombre}
                  data-oid="q-12-33"
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
          data-oid="j145d97"
        >
          VER CURSO
        </Button>
      </CardContent>
    </Card>
  )
}
