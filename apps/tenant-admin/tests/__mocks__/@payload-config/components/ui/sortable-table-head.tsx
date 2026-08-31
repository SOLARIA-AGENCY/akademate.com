import React from 'react'

export function SortableTableHead({
  label,
  onToggle,
  column,
  className,
}: {
  label: string
  column: string
  sort?: unknown
  onToggle?: (column: string) => void
  className?: string
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <th className={className} data-testid="sortable-table-head">
      <button type="button" aria-label={`Ordenar por ${label}`} onClick={() => onToggle?.(column)}>
        {label}
      </button>
    </th>
  )
}

export function SortableListHeader({
  columns,
  onToggle,
  className,
}: {
  columns: Array<{ id: string; label: string; className?: string }>
  sort?: unknown
  onToggle?: (column: string) => void
  leadingClassName?: string | null
  trailingClassName?: string
  className?: string
}) {
  return (
    <div className={className} data-testid="sortable-list-header">
      {columns.map((column) => (
        <SortableTableHead
          key={column.id}
          label={column.label}
          column={column.id}
          onToggle={onToggle}
          className={column.className}
        />
      ))}
    </div>
  )
}
