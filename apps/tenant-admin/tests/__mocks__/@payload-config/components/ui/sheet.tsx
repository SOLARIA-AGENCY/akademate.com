import React from 'react'

export const Sheet = ({
  children,
  open,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (open ? <div data-testid="sheet">{children}</div> : null)

export const SheetContent = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="sheet-content">
    {children}
  </div>
)

export const SheetHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="sheet-header">
    {children}
  </div>
)

export const SheetTitle = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <h2 className={className} data-testid="sheet-title">
    {children}
  </h2>
)

export const SheetDescription = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <p className={className} data-testid="sheet-description">
    {children}
  </p>
)
