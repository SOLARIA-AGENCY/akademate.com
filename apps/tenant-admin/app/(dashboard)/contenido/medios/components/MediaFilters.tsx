'use client'

import { Card, CardContent } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Button } from '@payload-config/components/ui/button'
import { Search, X, SlidersHorizontal } from 'lucide-react'

export interface MediaFiltersState {
  search: string
  fileType: string
  sortBy: 'name' | 'date' | 'size'
  sortOrder: 'asc' | 'desc'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
}

interface MediaFiltersProps {
  filters: MediaFiltersState
  onChange: (filters: MediaFiltersState) => void
  onReset?: () => void
  totalItems?: number
  filteredItems?: number
}

export function MediaFilters({
  filters,
  onChange,
  onReset,
  totalItems = 0,
  filteredItems = 0,
}: MediaFiltersProps) {
  const updateFilter = <K extends keyof MediaFiltersState>(
    key: K,
    value: MediaFiltersState[K]
  ) => {
    onChange({ ...filters, [key]: value })
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.fileType !== 'all' ||
    filters.dateRange !== 'all'

  const handleReset = () => {
    onChange({
      search: '',
      fileType: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      dateRange: 'all',
    })
    onReset?.()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Actions Row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o texto alternativo..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
                <X className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* File Type */}
            <div className="flex-1">
              <Select
                value={filters.fileType}
                onValueChange={(value) => updateFilter('fileType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de archivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex-1">
              <Select
                value={filters.dateRange}
                onValueChange={(value) => updateFilter('dateRange', value as MediaFiltersState['dateRange'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fecha de creación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="flex-1">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value as MediaFiltersState['sortBy'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="date">Fecha de creación</SelectItem>
                  <SelectItem value="size">Tamaño</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="flex-1">
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => updateFilter('sortOrder', value as MediaFiltersState['sortOrder'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente</SelectItem>
                  <SelectItem value="desc">Descendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          {filteredItems !== totalItems && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
              <SlidersHorizontal className="h-4 w-4" />
              <span>
                Mostrando {filteredItems} de {totalItems} archivo(s)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
