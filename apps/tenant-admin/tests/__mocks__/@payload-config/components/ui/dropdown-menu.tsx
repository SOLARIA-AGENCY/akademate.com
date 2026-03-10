import React from 'react'

export const DropdownMenu = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="dropdown-menu" data-oid="4v8xvkj">
    {children}
  </div>
)

export const DropdownMenuTrigger = ({
  children,
  asChild,
}: {
  children?: React.ReactNode
  asChild?: boolean
}) => (
  <div data-testid="dropdown-trigger" data-oid="8-o32kl">
    {children}
  </div>
)

export const DropdownMenuContent = ({
  children,
  className,
  align,
}: {
  children?: React.ReactNode
  className?: string
  align?: string
}) => (
  <div className={className} data-testid="dropdown-content" data-align={align} data-oid="75j4cvm">
    {children}
  </div>
)

export const DropdownMenuItem = ({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}) => (
  <button className={className} data-testid="dropdown-item" onClick={onClick} data-oid="zed3t71">
    {children}
  </button>
)

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <hr className={className} data-testid="dropdown-separator" data-oid="s9mh-ak" />
)

export const DropdownMenuLabel = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <span className={className} data-testid="dropdown-label" data-oid="etx5d5h">
    {children}
  </span>
)
