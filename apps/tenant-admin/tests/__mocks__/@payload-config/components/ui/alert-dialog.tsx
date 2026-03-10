import React from 'react'

export const AlertDialog = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) =>
  open ? (
    <div data-testid="alert-dialog" data-oid=".0mhk0q">
      {children}
    </div>
  ) : null

export const AlertDialogTrigger = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button data-testid="alert-dialog-trigger" {...props} data-oid="n_7jcph">
    {children}
  </button>
)

export const AlertDialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="alert-dialog-content" data-oid="6p1f17u">
    {children}
  </div>
)

export const AlertDialogHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="alert-dialog-header" data-oid="dk.ev5h">
    {children}
  </div>
)

export const AlertDialogTitle = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <h2 className={className} data-testid="alert-dialog-title" data-oid="fp5sv.h">
    {children}
  </h2>
)

export const AlertDialogDescription = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <p className={className} data-testid="alert-dialog-description" data-oid="jd0i-tl">
    {children}
  </p>
)

export const AlertDialogFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="alert-dialog-footer" data-oid=".2sokio">
    {children}
  </div>
)

export const AlertDialogAction = ({
  children,
  onClick,
  disabled,
  className,
  style,
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={className}
    style={style}
    onClick={onClick}
    disabled={disabled}
    data-testid="alert-dialog-action"
    data-oid="yfhle9d"
  >
    {children}
  </button>
)

export const AlertDialogCancel = ({
  children,
  onClick,
  disabled,
  className,
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={className}
    onClick={onClick}
    disabled={disabled}
    data-testid="alert-dialog-cancel"
    data-oid="eha1f9o"
  >
    {children}
  </button>
)
