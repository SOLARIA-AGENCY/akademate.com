'use client'

// Force dynamic rendering for all dashboard pages - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NotificationBell } from '@payload-config/components/ui/NotificationBell'
import { Button } from '@payload-config/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@payload-config/components/ui/avatar'
import { AppSidebar } from '@payload-config/components/layout/AppSidebar'
import { DashboardFooter } from '@payload-config/components/layout/DashboardFooter'
import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'
import { ChatbotWidget } from '@payload-config/components/ui/ChatbotWidget'
import { RealtimeProvider } from '@payload-config/components/providers'
import { SiteHeader } from '@payload-config/components/site-header'
import { SidebarProvider } from '@payload-config/components/ui/sidebar'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { NotificationProvider } from '@/app/providers/notifications'
import {
  DASHBOARD_CANVAS_CLASS,
  DASHBOARD_MAIN_CLASS,
  DASHBOARD_RAIL_CLASS,
  DASHBOARD_SHELL_CLASS,
} from './dashboard-shell'

interface SessionUser {
  id: string | number
  email: string
  name?: string
  role?: string
}

interface SessionResponse {
  authenticated?: boolean
  user?: SessionUser
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  useTenantBranding()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    name: 'Administrador',
    email: 'admin@tenant.local',
    avatar: null as string | null,
    initials: 'AD',
  })

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) return

        const payload = (await response.json()) as SessionResponse
        const user = payload.user
        if (!payload.authenticated || !user?.email) return

        const displayName = user.name?.trim() || user.email
        const initials =
          displayName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || 'AU'

        setCurrentUser((prev) => ({
          ...prev,
          name: displayName,
          email: user.email,
          initials,
        }))
      } catch (error) {
        console.warn('[DashboardLayout] Unable to load session user:', error)
      }
    }

    void loadSession()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const syncBreakpoint = () => {
      const mobile = mediaQuery.matches
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }

    syncBreakpoint()
    mediaQuery.addEventListener('change', syncBreakpoint)
    return () => mediaQuery.removeEventListener('change', syncBreakpoint)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile, pathname])

  const handleLogout = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      })
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <NotificationProvider>
      <RealtimeProvider tenantId={1} data-oid="xrr6i5x">
      <div
        className={`${DASHBOARD_SHELL_CLASS} flex flex-col [--header-height:calc(theme(spacing.14))]`}
        data-oid="dq:3ws5"
      >
        <SidebarProvider
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          className="flex flex-col flex-1 min-h-0"
        >
          <SiteHeader>
            <div className="flex items-center justify-end gap-2">
              <ThemeToggle data-oid="87ssh43" />

              <NotificationBell />

              <DropdownMenu data-oid="lv2e625">
                <DropdownMenuTrigger asChild data-oid="i8a8l:y">
                  <Button variant="ghost" className="gap-2" data-oid="_cuht:m">
                    <Avatar className="h-8 w-8" data-oid="axy-fl-">
                      {currentUser.avatar ? (
                        <AvatarImage
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          data-oid=".s8oaov"
                        />
                      ) : null}
                      <AvatarFallback
                        className="bg-primary text-primary-foreground text-sm font-semibold"
                        data-oid="xcvdnw_"
                      >
                        {currentUser.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="hidden md:inline-block font-semibold text-foreground"
                      data-oid="3i0gou8"
                    >
                      {currentUser.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" data-oid="7_b7obl">
                  <DropdownMenuLabel data-oid="zf2aajg">
                    <div className="flex flex-col space-y-1" data-oid="__0-x6n">
                      <p className="text-sm font-medium leading-none" data-oid="jl.n:19">
                        {currentUser.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground" data-oid="r6zges4">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator data-oid="ih2ongq" />
                  <DropdownMenuItem onClick={() => router.push('/perfil')} data-oid="io63_4s">
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/configuracion')}
                    data-oid="eyvl1.a"
                  >
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator data-oid=":nc4rud" />
                  <DropdownMenuItem onClick={handleLogout} data-oid="et-g84s">
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SiteHeader>

          <div className="relative flex flex-1 min-h-0">
            {isMobile && sidebarOpen && (
              <button
                type="button"
                aria-label="Cerrar menú lateral"
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 z-30 bg-black/40 md:hidden"
              />
            )}

            <aside
              className={`${DASHBOARD_RAIL_CLASS} z-40 shrink-0 border-r border-sidebar-border transition-all duration-300 ${
                isMobile
                  ? `absolute inset-y-0 left-0 w-[280px] ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`
                  : sidebarOpen
                    ? 'w-[240px]'
                    : 'w-[80px]'
              }`}
              data-testid="dashboard-rail"
              data-oid="044wu:-"
            >
              <AppSidebar
                isCollapsed={!sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                data-oid="lb_jqia"
              />
            </aside>

            <div
              className={DASHBOARD_CANVAS_CLASS}
              data-testid="dashboard-canvas"
              data-oid="asfyqnr"
            >
              <main
                className={DASHBOARD_MAIN_CLASS}
                data-testid="dashboard-main"
                data-oid="20tk9nh"
              >
                {children}
              </main>

              <div className="shrink-0">
                <DashboardFooter data-oid="jsy7wdn" />
              </div>
            </div>
          </div>
        </SidebarProvider>

        <ChatbotWidget data-oid="2282j28" />
      </div>
      </RealtimeProvider>
    </NotificationProvider>
  )
}
