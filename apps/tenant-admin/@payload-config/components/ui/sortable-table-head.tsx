'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@payload-config/components/ui/table'
import { cn } from '@payload-config/lib/utils'
import type { CycleSortState } from '@payload-config/lib/cycle-sort'

function SortGlyph({
  active,
  direction,
}: {
  active: boolean
  direction: CycleSortState['direction']
}) {
  const className = cn(
    'h-3.5 w-3.5 shrink-0',
    active ? 'text-primary' : 'text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
  )
  if (!active) return <ArrowUpDown className={className} aria-hidden="true" />
  if (direction === 'desc') return <ArrowDown className={className} aria-hidden="true" />
  return <ArrowUp className={className} aria-hidden="true" />
}

export function SortableColumnButton<K extends string>({
  label,
  column,
  sort,
  onToggle,
  className,
}: {
  label: string
  column: K
  sort: CycleSortState<K>
  onToggle: (column: K) => void
  className?: string
}) {
  const active = sort.column === column

  return (
    <button
      type="button"
      aria-label={`Ordenar por ${label}`}
      className={cn(
        'group inline-flex max-w-full cursor-pointer items-center gap-1 rounded-sm text-left text-xs font-normal transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        active ? 'text-foreground' : 'text-muted-foreground',
        className,
      )}
      onClick={() => onToggle(column)}
    >
      <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
      <SortGlyph active={active} direction={sort.direction} />
    </button>
  )
}

export function SortableTableHead<K extends string>({
  label,
  column,
  sort,
  onToggle,
  className,
  align = 'start',
}: {
  label: string
  column: K
  sort: CycleSortState<K>
  onToggle: (column: K) => void
  className?: string
  align?: 'start' | 'center' | 'end'
}) {
  const ariaSort =
    sort.column === column ? (sort.direction === 'desc' ? 'descending' : 'ascending') : 'none'

  return (
    <TableHead className={className} aria-sort={ariaSort}>
      <SortableColumnButton
        label={label}
        column={column}
        sort={sort}
        onToggle={onToggle}
        className={cn(
          align === 'center' && 'w-full justify-center text-center',
          align === 'end' && 'w-full justify-end text-right',
        )}
      />
    </TableHead>
  )
}

export function SortableListHeader<K extends string>({
  columns,
  sort,
  onToggle,
  leadingClassName = 'h-10 w-10 shrink-0',
  trailingClassName,
  className,
}: {
  columns: Array<{ id: K; label: string; className?: string }>
  sort: CycleSortState<K>
  onToggle: (column: K) => void
  leadingClassName?: string | null
  trailingClassName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'hidden items-center gap-4 px-4 pb-1 sm:flex',
        className,
      )}
      data-slot="sortable-list-header"
    >
      {leadingClassName ? <div className={leadingClassName} aria-hidden="true" /> : null}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {columns.map((column) => (
          <div key={column.id} className={cn('min-w-0', column.className)}>
            <SortableColumnButton
              label={column.label}
              column={column.id}
              sort={sort}
              onToggle={onToggle}
            />
          </div>
        ))}
      </div>
      {trailingClassName ? <div className={trailingClassName} aria-hidden="true" /> : null}
    </div>
  )
}
