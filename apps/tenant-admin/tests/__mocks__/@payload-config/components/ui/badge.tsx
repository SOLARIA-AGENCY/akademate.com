import React from 'react'

export const LISTING_PILL_CLASS =
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium'

export const Badge = ({
  children,
  className,
  variant,
  style,
}: {
  children?: React.ReactNode
  className?: string
  variant?: string
  style?: React.CSSProperties
}) => (
  <span
    className={className}
    data-testid="badge"
    data-variant={variant}
    style={style}
    data-oid="0kutkod"
  >
    {children}
  </span>
)

export function StatusDotBadge({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return <span className={className}>{children}</span>
}

