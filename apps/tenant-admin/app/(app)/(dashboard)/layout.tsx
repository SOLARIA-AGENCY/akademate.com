'use client'

// Force dynamic rendering for all dashboard pages - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { NotificationBell } from '@payload-config/components/ui/NotificationBell'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
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
import { DashboardAgentRail } from '@payload-config/components/akademate/dashboard'
import { RealtimeProvider } from '@payload-config/components/providers'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { NotificationProvider } from '@/app/providers/notifications'
import {
  DASHBOARD_CENTER_CLASS,
  DASHBOARD_OVERLAY_HOST_CLASS,
  DASHBOARD_RAIL_CLASS,
  DASHBOARD_RAIL_COLLAPSED_WIDTH,
  DASHBOARD_RAIL_EXPANDED_WIDTH,
  DASHBOARD_SHELL_LOCKED_CLASS,
  DASHBOARD_TOPBAR_CLASS,
} from '@/app/lib/dashboard-listing-scroll'

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

interface ShortcutItem {
  label: string
  href: string
}

const shortcuts: ShortcutItem[] = [
  { label: 'Design Hub (UI Showcase)', href: '/design-hub' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Programación', href: '/programacion' },
  { label: 'Planner Visual', href: '/planner' },
  { label: 'Cursos', href: '/dashboard/cursos' },
  { label: 'Ciclos', href: '/dashboard/ciclos' },
  { label: 'Sedes', href: '/dashboard/sedes' },
  { label: 'Profesores', href: '/dashboard/profesores' },
  { label: 'Administrativos', href: '/dashboard/administrativo' },
  { label: 'Campus Virtual', href: '/campus-virtual' },
  { label: 'Leads', href: '/leads' },
  { label: 'Calendario citas', href: '/calendario-citas' },
  { label: 'Analíticas', href: '/analiticas' },
  { label: 'Administración', href: '/administracion' },
  { label: 'Configuración', href: '/configuracion' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  useTenantBranding()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarHover, setSidebarHover] = useState(false)
  const [sidebarHoverLocked, setSidebarHoverLocked] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    name: 'Administrador',
    email: 'admin@tenant.local',
    avatar: null as string | null,
    initials: 'AD',
  })
  const pathnameRef = useRef(pathname)
  const sessionConfirmedRef = useRef(false)
  pathnameRef.current = pathname

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (response.status >= 500) {
          console.warn('[DashboardLayout] Session probe unavailable; keep current cookies')
          return
        }

        const sendToLogin = () => {
          if (sessionConfirmedRef.current) {
            console.warn('[DashboardLayout] Session probe failed after a confirmed login; keep dashboard')
            return
          }
          const dest = pathnameRef.current || '/dashboard'
          router.replace(`/auth/login?redirect=${encodeURIComponent(dest)}`)
        }

        if (!response.ok) {
          sendToLogin()
          return
        }

        const payload = (await response.json()) as SessionResponse
        const user = payload.user
        if (!payload.authenticated || !user?.email) {
          sendToLogin()
          return
        }

        sessionConfirmedRef.current = true
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
  }, [router])

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

  const railExpanded = isMobile ? sidebarOpen : sidebarOpen || sidebarHover

  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return shortcuts.slice(0, 6)
    return shortcuts.filter(
      (item) => item.label.toLowerCase().includes(query) || item.href.includes(query)
    )
  }, [searchQuery])

  const goToShortcut = (href: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(href)
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (filteredShortcuts.length === 0) return
    goToShortcut(filteredShortcuts[0].href)
  }

  return (
    <NotificationProvider>
      <RealtimeProvider tenantId={1} data-oid="xrr6i5x">
      <div
        className={DASHBOARD_SHELL_LOCKED_CLASS}
        data-oid="dq:3ws5"
      >
        <div className={DASHBOARD_OVERLAY_HOST_CLASS} data-slot="dashboard-overlay-host">
          {isMobile && sidebarOpen ? (
            <Button
              type="button"
              variant="ghost"
              aria-label="Cerrar menú lateral"
              onClick={() => setSidebarOpen(false)}
              className="pointer-events-auto fixed inset-0 z-30 h-auto w-auto rounded-none bg-black/40 p-0 hover:bg-black/40 md:hidden"
            />
          ) : null}
        </div>

        <aside
          className={
            isMobile
              ? `fixed left-0 top-0 z-40 h-screen [grid-area:rail] bg-sidebar border-r border-sidebar-border transition-all duration-300 w-[280px] ${
                  sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                }`
              : `${DASHBOARD_RAIL_CLASS} ${
                  railExpanded ? DASHBOARD_RAIL_EXPANDED_WIDTH : DASHBOARD_RAIL_COLLAPSED_WIDTH
                } bg-sidebar border-r border-sidebar-border`
          }
          onMouseEnter={() => {
            if (!isMobile && !sidebarHoverLocked) setSidebarHover(true)
          }}
          onMouseLeave={() => {
            setSidebarHover(false)
            setSidebarHoverLocked(false)
          }}
          data-oid="044wu:-"
        >
          <AppSidebar
            isCollapsed={!railExpanded}
            onToggle={() => {
              setSidebarOpen((current) => {
                if (current) setSidebarHoverLocked(true)
                return !current
              })
            }}
            data-oid="lb_jqia"
          />
        </aside>

        <div
          className={DASHBOARD_CENTER_CLASS}
          data-slot="dashboard-center"
          data-oid="asfyqnr"
        >
          <header
            className={DASHBOARD_TOPBAR_CLASS}
            data-oid="oy8tn.c"
          >
            <div className="flex items-center gap-2 pr-2 md:pr-4" data-oid="w2r2vqk">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú lateral"
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 min-w-0 max-w-md" data-oid="38sqxrv">
              <div className="relative hidden lg:block" data-oid="37i3m-d">
                <form onSubmit={handleSearchSubmit} data-oid="g45:h35">
                  <Search
                    className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                    data-oid="5gapg5:"
                  />
                  <Input
                    type="search"
                    placeholder="Buscar sección..."
                    value={searchQuery}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setSearchOpen(false), 120)
                    }}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full pl-8 bg-background/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    data-oid="03n16gh"
                  />
                </form>

                {searchOpen && (
                  <div
                    className="absolute left-0 right-0 top-11 z-50 rounded-md border bg-popover p-1 shadow-md"
                    data-oid="8q4-tbc"
                  >
                    {filteredShortcuts.length > 0 ? (
                      filteredShortcuts.slice(0, 6).map((item) => (
                        <Button
                          key={item.href}
                          type="button"
                          variant="ghost"
                          onMouseDown={() => goToShortcut(item.href)}
                          className="h-auto w-full justify-between rounded-sm px-3 py-2 text-left text-sm font-normal"
                          data-oid="lyvogvu"
                        >
                          <span data-oid="tks9og7">{item.label}</span>
                          <span className="text-xs text-muted-foreground" data-oid="oowdwwx">
                            {item.href}
                          </span>
                        </Button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground" data-oid="7e56m0c">
                        Sin resultados
                      </p>
                    )}
                  </div>
                )}
              </div>
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
                        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
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
            className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain px-4 pt-0 pb-6"
            data-oid="20tk9nh"
          >
            <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">{children}</div>
          </main>
          <DashboardFooter data-oid="jsy7wdn" />
        </div>

        <DashboardAgentRail />
      </div>
      </RealtimeProvider>
    </NotificationProvider>
  )
}
