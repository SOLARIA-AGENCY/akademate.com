import React from 'react'

export const AlertDialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => (
  open ? <div data-testid="alert-dialog">{children}</div> : null
)

export const AlertDialogTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button data-testid="alert-dialog-trigger" {...props}>{children}</button>
)

export const AlertDialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="alert-dialog-content">{children}</div>
)

export const AlertDialogHeader = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="alert-dialog-header">{children}</div>
)

export const AlertDialogTitle = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <h2 className={className} data-testid="alert-dialog-title">{children}</h2>
)

export const AlertDialogDescription = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <p className={className} data-testid="alert-dialog-description">{children}</p>
)

export const AlertDialogFooter = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="alert-dialog-footer">{children}</div>
)

export const AlertDialogAction = ({ children, onClick, disabled, className, style }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={className}
    style={style}
    onClick={onClick}
    disabled={disabled}
    data-testid="alert-dialog-action"
  >
    {children}
  </button>
)

export const AlertDialogCancel = ({ children, onClick, disabled, className }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={className}
    onClick={onClick}
    disabled={disabled}
    data-testid="alert-dialog-cancel"
  >
    {children}
  </button>
)
