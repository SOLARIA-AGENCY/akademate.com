import React from 'react'

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
