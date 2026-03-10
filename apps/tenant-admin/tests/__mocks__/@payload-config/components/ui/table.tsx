import React from 'react'

export const Table = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <table className={className} data-testid="table" data-oid="f9j7lyv">
    {children}
  </table>
)

export const TableHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <thead className={className} data-testid="table-header" data-oid="447w5m.">
    {children}
  </thead>
)

export const TableBody = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <tbody className={className} data-testid="table-body" data-oid="al15wfv">
    {children}
  </tbody>
)

export const TableFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <tfoot className={className} data-testid="table-footer" data-oid="odtwcgn">
    {children}
  </tfoot>
)

export const TableRow = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <tr className={className} data-testid="table-row" data-oid="2-h4m2v">
    {children}
  </tr>
)

export const TableHead = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <th className={className} data-testid="table-head" data-oid="gdps887">
    {children}
  </th>
)

export const TableCell = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <td className={className} data-testid="table-cell" data-oid="rnxxz8x">
    {children}
  </td>
)

export const TableCaption = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <caption className={className} data-testid="table-caption" data-oid="iydkj8l">
    {children}
  </caption>
)
