import React from 'react'

export const Dialog = ({ children, open }: { children?: React.ReactNode; open?: boolean }) => (
  open ? <div data-testid="dialog">{children}</div> : null
)

export const DialogContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="dialog-content">{children}</div>
)

export const DialogHeader = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="dialog-header">{children}</div>
)

export const DialogFooter = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className} data-testid="dialog-footer">{children}</div>
)

export const DialogTitle = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <h2 className={className} data-testid="dialog-title">{children}</h2>
)

export const DialogDescription = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <p className={className} data-testid="dialog-description">{children}</p>
)

export const DialogTrigger = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

export const DialogClose = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

export const DialogPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

export const DialogOverlay = ({ className }: { className?: string }) => (
  <div className={className} data-testid="dialog-overlay" />
)
