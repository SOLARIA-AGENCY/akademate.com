'use client'

import * as React from 'react'
import { Card, CardContent, CardFooter } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Eye, Edit, Trash2, MoreHorizontal, MapPin, Mail, Phone, Briefcase } from 'lucide-react'

interface StaffCardProps {
  id: number
  fullName: string
  position: string
  contractType: string
  employmentStatus: string
  photo: string
  email: string
  phone: string
  bio?: string
  assignedCampuses: Array<{ id: number; name: string; city: string }>
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number, name: string) => void
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Freelance',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  temporary_leave: 'Baja Temporal',
  inactive: 'Inactivo',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  temporary_leave: 'secondary',
  inactive: 'destructive',
}

export function StaffCard({
  id,
  fullName,
  position,
  contractType,
  employmentStatus,
  photo,
  email,
  phone,
  bio,
  assignedCampuses,
  onView,
  onEdit,
  onDelete,
}: StaffCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={() => onView(id)}>
        <CardContent className="p-6">
          {/* Header with Avatar and Menu */}
          <div className="flex items-start justify-between mb-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
              <AvatarImage src={photo} alt={fullName} />
              <AvatarFallback className="text-lg font-semibold">{getInitials(fullName)}</AvatarFallback>
            </Avatar>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onView(id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(id, fullName)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desactivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Name and Position */}
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold text-lg leading-tight">{fullName}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              {position}
            </p>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Badge variant={STATUS_VARIANTS[employmentStatus]} className="text-xs">
              {STATUS_LABELS[employmentStatus]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {CONTRACT_TYPE_LABELS[contractType]}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{phone}</span>
              </div>
            )}
          </div>

          {/* Bio Preview */}
          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{bio}</p>
          )}

          {/* Assigned Campuses */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sedes Asignadas
            </p>
            <div className="flex gap-1 flex-wrap">
              {assignedCampuses.length === 0 ? (
                <Badge variant="outline" className="text-xs">
                  Sin sedes asignadas
                </Badge>
              ) : (
                assignedCampuses.map((campus) => (
                  <Badge key={campus.id} variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {campus.name}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="bg-muted/50 p-4 border-t">
        <Button variant="ghost" size="sm" className="w-full" onClick={() => onView(id)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Ficha Completa
        </Button>
      </CardFooter>
    </Card>
  )
}
