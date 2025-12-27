import React from 'react'

export const Table = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <table className={className} data-testid="table">{children}</table>
)

export const TableHeader = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <thead className={className} data-testid="table-header">{children}</thead>
)

export const TableBody = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <tbody className={className} data-testid="table-body">{children}</tbody>
)

export const TableFooter = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <tfoot className={className} data-testid="table-footer">{children}</tfoot>
)

export const TableRow = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <tr className={className} data-testid="table-row">{children}</tr>
)

export const TableHead = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={className} data-testid="table-head">{children}</th>
)

export const TableCell = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={className} data-testid="table-cell">{children}</td>
)

export const TableCaption = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <caption className={className} data-testid="table-caption">{children}</caption>
)
