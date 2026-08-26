'use client'

import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardListingLayout } from '../Shell'
import { Button } from '@payload-config/components/ui/button'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Input } from '@payload-config/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { cn } from '@payload-config/lib/utils'
import {
  DIRECTORY_PAGE_SIZES,
  directoryPageNumbers,
  directoryRangeLabel,
  paginateDirectory,
} from './directory-pagination'
import type { DirectoryKpi } from './staff-directory-model'

export type DirectoryViewMode = 'table' | 'grid'

export type DirectorySelectFilter = {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

export type DirectorySegment = {
  id: string
  label: string
}

export type DirectoryColumn<T> = {
  id: string
  header: string
  className?: string
  render: (row: T) => React.ReactNode
}

export function DirectoryKpiStrip({ items }: { items: readonly DirectoryKpi[] }) {
  if (items.length === 0) return null
  return (
    <div
      data-slot="directory-kpi-strip"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="space-y-1 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{item.value}</span>
            {item.helper ? (
              <span className="text-xs font-medium text-slate-500">{item.helper}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DirectoryStatusPill({
  label,
  pillClass,
  dotClass,
}: {
  label: string
  pillClass: string
  dotClass: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        pillClass,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  )
}

export function DirectoryAvatarCell({
  name,
  subtitle,
  src,
  initials,
}: {
  name: string
  subtitle?: string
  src?: string | null
  initials: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900">{name}</div>
        {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
      </div>
    </div>
  )
}

export function DirectoryNeutralBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
      {children}
    </span>
  )
}

export function PremiumDirectoryShell<T extends { id: string }>({
  title,
  description,
  icon,
  entityPlural,
  createLabel,
  onCreate,
  onExportCsv,
  kpis,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  segments,
  selectedSegment,
  onSegmentChange,
  filters = [],
  viewMode,
  onViewModeChange,
  extraToolbar,
  selectedIds,
  onSelectedIdsChange,
  bulkLabel,
  onBulkExport,
  onBulkMail,
  columns,
  rows,
  renderGrid,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  onRetry,
  onRowOpen,
  onRowEdit,
  onRowMail,
  children,
  scroll: _scroll = 'page',
}: {
  title: string
  description: string
  icon?: LucideIcon
  entityPlural: string
  createLabel?: string
  onCreate?: () => void
  onExportCsv: () => void
  kpis: readonly DirectoryKpi[]
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  segments?: readonly DirectorySegment[]
  selectedSegment?: string
  onSegmentChange?: (value: string) => void
  filters?: DirectorySelectFilter[]
  viewMode?: DirectoryViewMode
  onViewModeChange?: (view: DirectoryViewMode) => void
  extraToolbar?: React.ReactNode
  selectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  bulkLabel?: string
  onBulkExport?: () => void
  onBulkMail?: () => void
  columns: DirectoryColumn<T>[]
  rows: T[]
  renderGrid?: (rows: T[]) => React.ReactNode
  loading?: boolean
  error?: string | null
  emptyTitle: string
  emptyDescription?: string
  onRetry?: () => void
  onRowOpen?: (row: T) => void
  onRowEdit?: (row: T) => void
  onRowMail?: (row: T) => void
  children?: React.ReactNode
  scroll?: 'page'
}) {
  const searchRef = React.useRef<HTMLInputElement>(null)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState<(typeof DIRECTORY_PAGE_SIZES)[number]>(10)
  const slice = paginateDirectory(rows, page, pageSize)
  const selected = selectedIds ?? []
  const pageIds = slice.items.map((row) => row.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  React.useEffect(() => {
    setPage(1)
  }, [searchValue, selectedSegment, pageSize, rows.length])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleAll = (checked: boolean) => {
    if (!onSelectedIdsChange) return
    if (checked) {
      onSelectedIdsChange([...new Set([...selected, ...pageIds])])
      return
    }
    onSelectedIdsChange(selected.filter((id) => !pageIds.includes(id)))
  }

  const toggleRow = (id: string) => {
    if (!onSelectedIdsChange) return
    onSelectedIdsChange(
      selected.includes(id) ? selected.filter((rowId) => rowId !== id) : [...selected, id],
    )
  }

  return (
    <DashboardListingLayout
      title={title}
      description={description}
      icon={icon}
      actions={
        <div className="flex flex-nowrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onExportCsv}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => searchRef.current?.focus()}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>
          {onCreate && createLabel ? (
            <Button type="button" size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              {createLabel}
            </Button>
          ) : null}
        </div>
      }
      toolbar={
          <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchRef}
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="bg-slate-50/50 pr-12 pl-9"
                />
                <kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-flex">
                  ⌘K
                </kbd>
              </div>
              {segments && selectedSegment && onSegmentChange ? (
                <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100/80 p-1">
                  {segments.map((segment) => (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => onSegmentChange(segment.id)}
                      className={cn(
                        'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                        selectedSegment === segment.id
                          ? 'bg-white font-semibold text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900',
                      )}
                    >
                      {segment.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((filter) => (
                  <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger size="sm" aria-label={filter.label} className="min-w-[140px]">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
                {extraToolbar}
                {onViewModeChange && viewMode ? (
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      title="Vista tabla"
                      onClick={() => onViewModeChange('table')}
                      className={cn(
                        'rounded-md p-1.5',
                        viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400',
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Vista cuadrícula"
                      onClick={() => onViewModeChange('grid')}
                      className={cn(
                        'rounded-md p-1.5',
                        viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400',
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {selected.length > 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-blue-200/80 bg-blue-50 p-2.5 text-xs">
                <span className="font-medium text-blue-900">
                  {selected.length} {bulkLabel ?? entityPlural} seleccionado(s)
                </span>
                <div className="flex items-center gap-2">
                  {onBulkExport ? (
                    <Button type="button" size="sm" variant="outline" onClick={onBulkExport}>
                      Exportar selección
                    </Button>
                  ) : null}
                  {onBulkMail ? (
                    <Button type="button" size="sm" variant="outline" onClick={onBulkMail}>
                      Enviar correo
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
      }
    >
      <DirectoryKpiStrip items={kpis} />
      {children ? (
        children
      ) : loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Cargando {entityPlural}...</p>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-destructive">Error al cargar {entityPlural}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          {onRetry ? (
            <Button type="button" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">{emptyTitle}</p>
          {emptyDescription ? (
            <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
          ) : null}
          {onCreate ? (
            <Button type="button" className="mt-4" onClick={onCreate}>
              {createLabel ?? 'Crear'}
            </Button>
          ) : null}
        </div>
      ) : viewMode === 'grid' && renderGrid ? (
        renderGrid(slice.items)
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <TableRow>
                {onSelectedIdsChange ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={(value) => toggleAll(value === true)}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                ) : null}
                {columns.map((column) => (
                  <TableHead key={column.id} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                {onRowOpen || onRowEdit || onRowMail ? (
                  <TableHead className="text-right">Acciones</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.items.map((row) => {
                const isSelected = selected.includes(row.id)
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(onRowOpen && 'cursor-pointer', isSelected && 'bg-blue-50/30')}
                    onClick={() => onRowOpen?.(row)}
                  >
                    {onSelectedIdsChange ? (
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(row.id)}
                          aria-label={`Seleccionar ${row.id}`}
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell key={column.id} className={column.className}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                    {onRowOpen || onRowEdit || onRowMail ? (
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1">
                          {onRowMail ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Enviar email"
                              onClick={() => onRowMail(row)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {onRowEdit ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar"
                              onClick={() => onRowEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {onRowOpen ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onRowOpen(row)}>Ver ficha</DropdownMenuItem>
                                {onRowEdit ? (
                                  <DropdownMenuItem onClick={() => onRowEdit(row)}>Editar</DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t border-slate-200/80 p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {directoryRangeLabel(entityPlural, slice.start, slice.end, slice.total)}
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                Filas por página:
                <select
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-700"
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(Number(event.target.value) as (typeof DIRECTORY_PAGE_SIZES)[number])
                  }
                >
                  {DIRECTORY_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={slice.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-md border border-slate-200 p-1.5 disabled:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {directoryPageNumbers(slice.page, slice.pageCount).map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${index}`} className="px-1 text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={cn(
                        'rounded-md px-2.5 py-1 font-medium',
                        item === slice.page
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={slice.page >= slice.pageCount}
                  onClick={() => setPage((current) => Math.min(slice.pageCount, current + 1))}
                  className="rounded-md border border-slate-200 p-1.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardListingLayout>
  )
}
