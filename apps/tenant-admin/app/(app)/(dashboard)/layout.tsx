'use client'

// Force dynamic rendering for all dashboard pages - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { CommandPalette } from '@payload-config/components/layout/CommandPalette'
import { DashboardFooter } from '@payload-config/components/layout/DashboardFooter'
import {
  DASHBOARD_CANVAS_LOCKED_CLASS,
  DASHBOARD_SHELL_LOCKED_CLASS,
} from '@payload-config/components/layout/dashboard-shell'
import { DASHBOARD_LISTING_MAIN_INNER_CLASS } from '@/app/lib/dashboard-listing-scroll'
import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'
import { ChatbotWidget } from '@payload-config/components/ui/ChatbotWidget'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@payload-config/components/ui/sidebar'
import { Toaster } from '@payload-config/components/ui/sonner'
import { RealtimeProvider } from '@payload-config/components/providers'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { NotificationProvider } from '@/app/providers/notifications'

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
  useTenantBranding()
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

  return (
    <NotificationProvider>
      <RealtimeProvider tenantId={1} data-oid="xrr6i5x">
        <SidebarProvider
          className={DASHBOARD_SHELL_LOCKED_CLASS}
          style={{ ['--dashboard-fab-clearance' as string]: '0rem' }}
        >
          <AppSidebar />
          <SidebarInset className={DASHBOARD_CANVAS_LOCKED_CLASS} data-oid="asfyqnr">
            <header
              className="relative z-30 flex h-14 shrink-0 items-center border-b bg-card px-4 md:px-6"
              data-oid="oy8tn.c"
            >
              <div className="flex items-center gap-2 pr-2 md:pr-4" data-oid="w2r2vqk">
                <SidebarTrigger />
              </div>

              <div className="flex items-center justify-end gap-2 ml-auto" data-oid="4sbbb:o">
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
                    <DropdownMenuItem
                      onClick={async (e: React.MouseEvent<HTMLDivElement>) => {
                        e.preventDefault()
                        try {
                          await fetch('/api/auth/session', {
                            method: 'DELETE',
                            credentials: 'include',
                          })
                          await fetch('/api/auth/logout', {
                            method: 'POST',
                            credentials: 'include',
                          })
                          router.push('/auth/login')
                          router.refresh()
                        } catch (error) {
                          console.error('Logout error:', error)
                        }
                      }}
                      data-oid="et-g84s"
                    >
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main
              data-slot="dashboard-main-inner"
              className={DASHBOARD_LISTING_MAIN_INNER_CLASS}
              data-oid="20tk9nh"
            >
              {children}
            </main>

            <DashboardFooter data-oid="jsy7wdn" />
          </SidebarInset>
          <ChatbotWidget data-oid="2282j28" />
          <CommandPalette />
          <Toaster />
        </SidebarProvider>
      </RealtimeProvider>
    </NotificationProvider>
  )
}
