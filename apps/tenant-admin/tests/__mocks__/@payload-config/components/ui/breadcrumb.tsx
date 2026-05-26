import type React from 'react'

export function Breadcrumb({ children, ...props }: React.ComponentProps<'nav'>) {
  return <nav {...props}>{children}</nav>
}

export function BreadcrumbList({ children, ...props }: React.ComponentProps<'ol'>) {
  return <ol {...props}>{children}</ol>
}

export function BreadcrumbItem({ children, ...props }: React.ComponentProps<'li'>) {
  return <li {...props}>{children}</li>
}

export function BreadcrumbLink({
  asChild: _asChild,
  children,
  href,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

export function BreadcrumbPage({ children, ...props }: React.ComponentProps<'span'>) {
  return <span {...props}>{children}</span>
}

export function BreadcrumbSeparator({ children, ...props }: React.ComponentProps<'li'>) {
  return (
    <li aria-hidden="true" {...props}>
      {children ?? '/'}
    </li>
  )
}

export function BreadcrumbEllipsis({ children, ...props }: React.ComponentProps<'span'>) {
  return <span {...props}>{children ?? '...'}</span>
}
