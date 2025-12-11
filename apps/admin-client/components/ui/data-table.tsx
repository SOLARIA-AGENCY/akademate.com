import * as React from 'react'
import { cn } from '@/lib/utils'

interface DataTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
}

function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('data-table', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

interface DataTableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

function DataTableHeader({
  className,
  children,
  ...props
}: DataTableHeaderProps) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

interface DataTableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

function DataTableBody({ className, children, ...props }: DataTableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

interface DataTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
  isHeader?: boolean
}

function DataTableRow({
  className,
  children,
  isHeader = false,
  ...props
}: DataTableRowProps) {
  return (
    <tr className={cn(isHeader && 'bg-muted/50', className)} {...props}>
      {children}
    </tr>
  )
}

interface DataTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
  align?: 'left' | 'center' | 'right'
}

function DataTableHead({
  className,
  children,
  align = 'left',
  ...props
}: DataTableHeadProps) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

interface DataTableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
  align?: 'left' | 'center' | 'right'
  numeric?: boolean
}

function DataTableCell({
  className,
  children,
  align = 'left',
  numeric = false,
  ...props
}: DataTableCellProps) {
  return (
    <td
      className={cn(
        'px-6 py-4',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        numeric && 'tabular-nums font-medium',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

interface DataTableEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  colSpan?: number
}

function DataTableEmpty({
  className,
  icon,
  title,
  description,
  action,
  colSpan = 6,
  ...props
}: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div
          className={cn(
            'flex flex-col items-center justify-center py-12 text-center',
            className
          )}
          {...props}
        >
          {icon && (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  )
}

interface DataTableSkeletonProps {
  columns: number
  rows?: number
}

function DataTableSkeleton({ columns, rows = 3 }: DataTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border/50">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <div className="skeleton-text w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty,
  DataTableSkeleton,
}
