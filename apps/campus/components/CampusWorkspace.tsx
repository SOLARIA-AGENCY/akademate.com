'use client'

import Link from 'next/link'
import { Award, CalendarCheck, LayoutDashboard, LogOut, TrendingUp } from 'lucide-react'
import {
  Button,
  WorkspaceBrand,
  WorkspaceNav,
  WorkspaceNavItem,
  WorkspaceShell,
  WorkspaceSidebar,
} from '@akademate/ui'

import { AuthGuard, useSession } from '../lib/session-context'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/progress', label: 'Progreso', icon: TrendingUp },
  { href: '/asistencia', label: 'Asistencia', icon: CalendarCheck },
  { href: '/certificates', label: 'Certificados', icon: Award },
] as const

export function CampusWorkspaceFrame({
  activePath,
  children,
  footer,
}: {
  activePath: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <WorkspaceShell
      sidebar={
        <WorkspaceSidebar>
          <WorkspaceBrand eyebrow="Campus virtual" name="Akademate" />
          <WorkspaceNav aria-label="Campus">
            {navigation.map(({ href, label, icon: Icon }) => (
              <WorkspaceNavItem key={href} asChild active={activePath === href}>
                <Link href={href} prefetch={false}>
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              </WorkspaceNavItem>
            ))}
          </WorkspaceNav>
          {footer && <div className="ml-auto lg:mt-auto lg:ml-0">{footer}</div>}
        </WorkspaceSidebar>
      }
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </WorkspaceShell>
  )
}

export function CampusWorkspace({
  activePath,
  children,
}: {
  activePath: string
  children: React.ReactNode
}) {
  const { logout } = useSession()

  return (
    <AuthGuard>
      <CampusWorkspaceFrame
        activePath={activePath}
        footer={
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </Button>
        }
      >
        {children}
      </CampusWorkspaceFrame>
    </AuthGuard>
  )
}
