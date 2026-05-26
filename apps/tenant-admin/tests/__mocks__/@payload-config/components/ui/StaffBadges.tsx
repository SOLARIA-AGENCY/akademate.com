import type React from 'react'

export function StaffStatusBadge({
  children,
  status,
  ...props
}: {
  children?: React.ReactNode
  status?: string | boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children ?? (typeof status === 'boolean' ? (status ? 'Activo' : 'Inactivo') : status)}</div>
}

export function StaffContractBadge({
  children,
  ...props
}: {
  children?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>
}

export function StaffCampusBadge({
  children,
  ...props
}: {
  children?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>
}

export function StaffCountBadge({
  count,
  label = 'convocatorias',
  ...props
}: {
  count: number
  label?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{count} {label}</div>
}
