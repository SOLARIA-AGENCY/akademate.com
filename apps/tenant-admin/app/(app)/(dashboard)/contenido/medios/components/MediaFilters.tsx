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
  const updateFilter = <K extends keyof MediaFiltersState>(key: K, value: MediaFiltersState[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const hasActiveFilters =
    filters.search !== '' || filters.fileType !== 'all' || filters.dateRange !== 'all'

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
    <Card data-oid="k9dt1pa">
      <CardContent className="pt-6" data-oid="-6:e8q9">
        <div className="space-y-4" data-oid="6u2jyfu">
          {/* Search and Actions Row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center" data-oid="09g:ryr">
            <div className="relative flex-1" data-oid="g6g.vx6">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                data-oid="jx3o862"
              />
              <Input
                placeholder="Buscar por nombre o texto alternativo..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                data-oid="o3ngtmp"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full md:w-auto"
                data-oid="rx6r1i2"
              >
                <X className="mr-2 h-4 w-4" data-oid=".7dwaq4" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center" data-oid="hj_dl4l">
            {/* File Type */}
            <div className="flex-1" data-oid="hv_uzn:">
              <Select
                value={filters.fileType}
                onValueChange={(value) => updateFilter('fileType', value)}
                data-oid="2tki2:8"
              >
                <SelectTrigger data-oid="g.m23y8">
                  <SelectValue placeholder="Tipo de archivo" data-oid="9m9khh2" />
                </SelectTrigger>
                <SelectContent data-oid="v82w8en">
                  <SelectItem value="all" data-oid=":v5bmq4">
                    Todos los tipos
                  </SelectItem>
                  <SelectItem value="jpg" data-oid="s1-_pz2">
                    JPG
                  </SelectItem>
                  <SelectItem value="png" data-oid="pqz:-.r">
                    PNG
                  </SelectItem>
                  <SelectItem value="gif" data-oid="ai4ba98">
                    GIF
                  </SelectItem>
                  <SelectItem value="svg" data-oid="4sf9izz">
                    SVG
                  </SelectItem>
                  <SelectItem value="webp" data-oid="ymxhvmw">
                    WEBP
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex-1" data-oid="dzbtabx">
              <Select
                value={filters.dateRange}
                onValueChange={(value) =>
                  updateFilter('dateRange', value as MediaFiltersState['dateRange'])
                }
                data-oid="-jj-723"
              >
                <SelectTrigger data-oid="kai8osd">
                  <SelectValue placeholder="Fecha de creación" data-oid=".c1mujs" />
                </SelectTrigger>
                <SelectContent data-oid=":bv4e0g">
                  <SelectItem value="all" data-oid="kfo.a1u">
                    Todas las fechas
                  </SelectItem>
                  <SelectItem value="today" data-oid="oo9mr-d">
                    Hoy
                  </SelectItem>
                  <SelectItem value="week" data-oid="v1j.lh:">
                    Esta semana
                  </SelectItem>
                  <SelectItem value="month" data-oid="ph59shr">
                    Este mes
                  </SelectItem>
                  <SelectItem value="year" data-oid="do7t.8q">
                    Este año
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="flex-1" data-oid="2coyjb2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  updateFilter('sortBy', value as MediaFiltersState['sortBy'])
                }
                data-oid=":tk1mhh"
              >
                <SelectTrigger data-oid="yl91_dr">
                  <SelectValue placeholder="Ordenar por" data-oid="27ah65m" />
                </SelectTrigger>
                <SelectContent data-oid="2_xwaa0">
                  <SelectItem value="name" data-oid="3l0a:7q">
                    Nombre
                  </SelectItem>
                  <SelectItem value="date" data-oid="p96o6d5">
                    Fecha de creación
                  </SelectItem>
                  <SelectItem value="size" data-oid="s05-sdf">
                    Tamaño
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="flex-1" data-oid="dkxf:.v">
              <Select
                value={filters.sortOrder}
                onValueChange={(value) =>
                  updateFilter('sortOrder', value as MediaFiltersState['sortOrder'])
                }
                data-oid=".t91.ah"
              >
                <SelectTrigger data-oid="ne0pvn7">
                  <SelectValue placeholder="Orden" data-oid="y1:kn4g" />
                </SelectTrigger>
                <SelectContent data-oid="fwf_:no">
                  <SelectItem value="asc" data-oid="hywg7ww">
                    Ascendente
                  </SelectItem>
                  <SelectItem value="desc" data-oid="ia9.y97">
                    Descendente
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          {filteredItems !== totalItems && (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t"
              data-oid="r4ewv7j"
            >
              <SlidersHorizontal className="h-4 w-4" data-oid="-wssh4z" />
              <span data-oid="8aoweaz">
                Mostrando {filteredItems} de {totalItems} archivo(s)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
