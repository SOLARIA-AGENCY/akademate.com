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
import { ChatbotWidget } from '@payload-config/components/ui/ChatbotWidget'
import { RealtimeProvider } from '@payload-config/components/providers'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { NotificationProvider } from '@/app/providers/notifications'
import {
  flattenNavigation,
  isNavigationUrlVisible,
  visibleNavigationForRole,
} from '@/lib/navigation/dashboard'

interface SessionUser {
  id: string | number
  email: string
  name?: string
  role?: string
  tenantId?: string | number
}

interface SessionResponse {
  authenticated?: boolean
  user?: SessionUser
}

interface ShortcutItem {
  label: string
  href: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  useTenantBranding()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const [currentUser, setCurrentUser] = useState({
    name: 'Administrador',
    email: 'admin@tenant.local',
    avatar: null as string | null,
    initials: 'AD',
    role: 'lectura' as string | null,
  })

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) {
          router.replace(`/auth/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`)
          return
        }

        const payload = (await response.json()) as SessionResponse
        const user = payload.user
        if (!payload.authenticated || !user?.email) {
          // A stale browser session used to leave the dashboard visible while
          // its protected API calls returned 401 and rendered empty lists.
          // Send the user through login instead of presenting misleading data.
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
          router.replace(`/auth/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`)
          return
        }

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
          role: user.role ?? null,
        }))
      } catch (error) {
        console.warn('[DashboardLayout] Unable to load session user:', error)
      }
    }

    void loadSession()
  }, [pathname, router])

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

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const firstFocusable = sidebarRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSidebarOpen(false)
        mobileMenuButtonRef.current?.focus()
        return
      }

      if (event.key === 'Tab') {
        const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [isMobile, sidebarOpen])

  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const shortcuts: ShortcutItem[] = flattenNavigation(visibleNavigationForRole(currentUser.role))
      .filter((item) => Boolean(item.url))
      .map((item) => ({ label: item.title, href: item.url! }))
    if (!query) return shortcuts.slice(0, 6)
    return shortcuts.filter(
      (item) => item.label.toLowerCase().includes(query) || item.href.includes(query)
    )
  }, [currentUser.role, searchQuery])

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

  const canAccessConfiguration = isNavigationUrlVisible(currentUser.role, '/configuracion')

  return (
    <NotificationProvider>
      <RealtimeProvider data-oid="xrr6i5x">
        <div
          className="dashboard-shell flex h-screen overflow-hidden bg-background text-foreground overscroll-none"
          data-oid="dq:3ws5"
        >
          {isMobile && sidebarOpen && (
            <Button
              type="button"
              variant="ghost"
              aria-label="Cerrar menú lateral"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 h-auto w-auto rounded-none bg-black/40 p-0 hover:bg-black/40 md:hidden"
            />
          )}

          <aside
            id="tenant-dashboard-sidebar"
            ref={sidebarRef}
            aria-label="Navegación principal"
            aria-hidden={isMobile && !sidebarOpen ? true : undefined}
            aria-modal={isMobile ? true : undefined}
            role={isMobile ? 'dialog' : undefined}
            inert={isMobile && !sidebarOpen ? true : undefined}
            className={`fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
              isMobile
                ? `w-[280px] ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`
                : sidebarOpen
                  ? 'w-[240px]'
                  : 'w-[80px]'
            }`}
            data-oid="044wu:-"
          >
            <AppSidebar
              isCollapsed={!sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              role={currentUser.role}
              data-oid="lb_jqia"
            />
          </aside>

          <div
            className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
              isMobile ? 'ml-0' : sidebarOpen ? 'ml-[240px]' : 'ml-[80px]'
            }`}
            data-oid="asfyqnr"
          >
            <header
              className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-card/95 backdrop-blur px-4 md:px-6"
              data-oid="oy8tn.c"
            >
              <div className="flex items-center gap-2 pr-2 md:pr-4" data-oid="w2r2vqk">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menú lateral"
                  aria-controls="tenant-dashboard-sidebar"
                  aria-expanded={sidebarOpen}
                  ref={mobileMenuButtonRef}
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
                        <p
                          className="text-xs leading-none text-muted-foreground"
                          data-oid="r6zges4"
                        >
                          {currentUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator data-oid="ih2ongq" />
                    <DropdownMenuItem onClick={() => router.push('/perfil')} data-oid="io63_4s">
                      Perfil
                    </DropdownMenuItem>
                    {canAccessConfiguration ? (
                      <DropdownMenuItem
                        onClick={() => router.push('/configuracion')}
                        data-oid="eyvl1.a"
                      >
                        Configuración
                      </DropdownMenuItem>
                    ) : null}
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
              className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 md:p-6"
              data-oid="20tk9nh"
            >
              {children}
            </main>

            <DashboardFooter data-oid="jsy7wdn" />
          </div>

          <ChatbotWidget data-oid="2282j28" />
        </div>
      </RealtimeProvider>
    </NotificationProvider>
  )
}
