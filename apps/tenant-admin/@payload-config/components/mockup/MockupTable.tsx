'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'

interface MockupTableProps {
  title: string
  description?: string
  columns: string[]
  rows: ReactNode[][]
  onAdd?: () => void
  addButtonText?: string
  onExport?: () => void
}

export function MockupTable({
  title,
  description,
  columns,
  rows,
  onAdd,
  addButtonText = 'Añadir',
  onExport,
}: MockupTableProps) {
  return (
    <div className="space-y-6" data-oid="n2vugs0">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        data-oid="ry7xonc"
      >
        <div data-oid="6z3ck1b">
          <h1 className="text-2xl font-semibold text-foreground" data-oid="yh4yuvs">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1" data-oid="pr8jxbw">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2" data-oid="9lmlhc5">
          {onExport && (
            <Button variant="outline" onClick={onExport} data-oid="5_i7n9b">
              <Download className="h-4 w-4 mr-2" data-oid="ji51ydd" />
              Exportar
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} data-oid="pm7l4tq">
              <Plus className="h-4 w-4 mr-2" data-oid="k778myn" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden" data-oid="5ti5.6m">
        <div className="overflow-x-auto" data-oid="m5lrhkq">
          <table className="w-full" data-oid="47gxe_x">
            <thead className="bg-muted/50" data-oid="ov7vi0y">
              <tr data-oid="raod2f5">
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                    data-oid="_aeqhqe"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border" data-oid="fmrzr3o">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-muted/30 transition-colors"
                  data-oid="y1811uv"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-foreground"
                      data-oid="awztcfe"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
