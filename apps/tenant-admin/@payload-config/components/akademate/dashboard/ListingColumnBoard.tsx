'use client'

import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { Card } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

const LISTING_SURFACE_CLASS = 'rounded-xl border border-border/80 bg-muted/70 shadow-none'

export type ListingColumnDef = {
  id: string
  label: string
  width?: string
}

export const COURSE_LIST_COLUMNS: ListingColumnDef[] = [
  { id: 'formacion', label: 'Formación', width: 'minmax(12rem,2fr)' },
  { id: 'area', label: 'Área', width: 'minmax(8rem,1.2fr)' },
  { id: 'convocatorias', label: 'Convocatorias', width: 'minmax(5.5rem,auto)' },
  { id: 'estado', label: 'Estado', width: 'minmax(6rem,auto)' },
  { id: 'acciones', label: 'Acciones', width: 'auto' },
]

export const CYCLE_LIST_COLUMNS = COURSE_LIST_COLUMNS

export const CONVOCATION_LIST_COLUMNS: ListingColumnDef[] = [
  { id: 'formacion', label: 'Formación', width: 'minmax(12rem,2fr)' },
  { id: 'area', label: 'Área', width: 'minmax(7rem,1fr)' },
  { id: 'sede', label: 'Sede', width: 'minmax(6rem,1fr)' },
  { id: 'inicio', label: 'Inicio', width: 'minmax(6.5rem,auto)' },
  { id: 'plazas', label: 'Plazas', width: 'minmax(4rem,auto)' },
  { id: 'estado', label: 'Estado', width: 'minmax(6rem,auto)' },
  { id: 'acciones', label: 'Acciones', width: 'auto' },
]

export const CAMPUS_LIST_COLUMNS: ListingColumnDef[] = [
  { id: 'sede', label: 'Sede', width: 'minmax(10rem,1.5fr)' },
  { id: 'direccion', label: 'Dirección', width: 'minmax(10rem,2fr)' },
  { id: 'capacidad', label: 'Aulas / plazas', width: 'minmax(7rem,auto)' },
  { id: 'tipo', label: 'Tipo', width: 'auto' },
  { id: 'acciones', label: 'Acciones', width: 'auto' },
]

export const PERSON_LIST_COLUMNS: ListingColumnDef[] = [
  { id: 'nombre', label: 'Nombre', width: 'minmax(12rem,2fr)' },
  { id: 'detalle', label: 'Área / curso', width: 'minmax(8rem,1.2fr)' },
  { id: 'sede', label: 'Sede', width: 'minmax(6rem,1fr)' },
  { id: 'estado', label: 'Estado', width: 'auto' },
  { id: 'acciones', label: 'Acciones', width: 'auto' },
]

export const ENROLLMENT_LIST_COLUMNS: ListingColumnDef[] = [
  { id: 'alumno', label: 'Alumno', width: 'minmax(12rem,1.6fr)' },
  { id: 'curso', label: 'Curso/Ciclo', width: 'minmax(10rem,1.4fr)' },
  { id: 'fecha', label: 'Fecha matrícula', width: 'minmax(7.5rem,1fr)' },
  { id: 'metodo', label: 'Método', width: 'minmax(5rem,auto)' },
  { id: 'importe', label: 'Importe', width: 'minmax(4.5rem,auto)' },
  { id: 'docs', label: 'Docs', width: '3.5rem' },
  { id: 'estado', label: 'Estado', width: 'minmax(5.5rem,auto)' },
  { id: 'acciones', label: 'Acciones', width: 'auto' },
]

export const WAITLIST_LIST_COLUMNS: ListingColumnDef[] = [
  { id: 'posicion', label: '#', width: '3.5rem' },
  { id: 'alumno', label: 'Alumno', width: 'minmax(12rem,1.6fr)' },
  { id: 'origen', label: 'Origen/Curso', width: 'minmax(10rem,1.3fr)' },
  { id: 'convocatoria', label: 'Convocatoria', width: 'minmax(8rem,1fr)' },
  { id: 'prioridad', label: 'Prioridad', width: 'minmax(6rem,auto)' },
  { id: 'interesados', label: 'Interesados', width: 'minmax(6rem,auto)' },
  { id: 'estado', label: 'Estado', width: 'minmax(6.5rem,auto)' },
  { id: 'acciones', label: 'Acciones', width: 'auto' },
]

export const LISTING_COLUMN_HEADER_CLASS = cn(
  'grid min-w-0 items-center gap-3 px-3 py-2.5 text-xs font-semibold text-foreground',
  LISTING_SURFACE_CLASS,
)

const ListingColumnsContext = createContext<ListingColumnDef[] | null>(null)

export function useListingColumns(): ListingColumnDef[] | null {
  return useContext(ListingColumnsContext)
}

export function listingColumnTemplate(columns: ListingColumnDef[]): string {
  return columns.map((column) => column.width ?? 'minmax(0,1fr)').join(' ')
}

export function listingColumnStyle(columns: ListingColumnDef[]): CSSProperties {
  return { gridTemplateColumns: listingColumnTemplate(columns) }
}

export function formatListingDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ListingColumnBoard({
  columns,
  children,
  className,
}: {
  columns: ListingColumnDef[]
  children: ReactNode
  className?: string
}) {
  return (
    <ListingColumnsContext.Provider value={columns}>
      <div data-slot="listing-column-board" className={cn('flex min-w-0 flex-col gap-2', className)}>
        <div
          data-slot="listing-column-header"
          className={LISTING_COLUMN_HEADER_CLASS}
          style={listingColumnStyle(columns)}
        >
          {columns.map((column) => (
            <span key={column.id} className="min-w-0 truncate">
              {column.label}
            </span>
          ))}
        </div>
        {children}
      </div>
    </ListingColumnsContext.Provider>
  )
}

export function ListingColumnCard({
  columns,
  cells,
  onClick,
  className,
}: {
  columns: ListingColumnDef[]
  cells: ReactNode[]
  onClick?: () => void
  className?: string
}) {
  return (
    <Card
      data-slot="listing-column-card"
      className={cn(
        'grid min-w-0 cursor-pointer items-center gap-3 px-3 py-2',
        LISTING_SURFACE_CLASS,
        className,
      )}
      style={listingColumnStyle(columns)}
      onClick={onClick}
    >
      {columns.map((column, index) => (
        <div key={column.id} className="min-w-0">
          {cells[index] ?? null}
        </div>
      ))}
    </Card>
  )
}
