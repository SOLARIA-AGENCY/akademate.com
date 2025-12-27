import React from 'react'

export const DropdownMenu = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="dropdown-menu">{children}</div>
)

export const DropdownMenuTrigger = ({ children, asChild }: { children?: React.ReactNode; asChild?: boolean }) => (
  <div data-testid="dropdown-trigger">{children}</div>
)

export const DropdownMenuContent = ({ children, className, align }: { children?: React.ReactNode; className?: string; align?: string }) => (
  <div className={className} data-testid="dropdown-content" data-align={align}>
    {children}
  </div>
)

export const DropdownMenuItem = ({ children, className, onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) => (
  <button className={className} data-testid="dropdown-item" onClick={onClick}>
    {children}
  </button>
)

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <hr className={className} data-testid="dropdown-separator" />
)

export const DropdownMenuLabel = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={className} data-testid="dropdown-label">{children}</span>
)
