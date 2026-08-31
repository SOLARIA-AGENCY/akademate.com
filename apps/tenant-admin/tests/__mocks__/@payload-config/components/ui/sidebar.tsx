import React from 'react'

export function SidebarProvider({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div data-testid="sidebar-provider" className={className}>{children}</div>
}

export function Sidebar({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <aside data-testid="sidebar" className={className}>{children}</aside>
}

export function SidebarHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function SidebarContent({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>
}

export function SidebarFooter({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function SidebarGroup({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>
}

export function SidebarGroupContent({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>
}

export function SidebarMenu({ children }: { children?: React.ReactNode }) {
  return <ul>{children}</ul>
}

export function SidebarMenuItem({ children }: { children?: React.ReactNode }) {
  return <li>{children}</li>
}

export function SidebarMenuButton({
  children,
  isActive,
}: {
  children?: React.ReactNode
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
}) {
  return <div data-active={isActive}>{children}</div>
}

export function SidebarMenuBadge({ children }: { children?: React.ReactNode }) {
  return <span data-testid="sidebar-badge">{children}</span>
}

export function SidebarInset({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <main className={className}>{children}</main>
}

export function SidebarTrigger() {
  return <button type="button" aria-label="Colapsar menu" />
}

export function useSidebar() {
  return {
    state: 'expanded' as const,
    open: true,
    setOpen: () => undefined,
    openMobile: false,
    setOpenMobile: () => undefined,
    isMobile: false,
    toggleSidebar: () => undefined,
  }
}
