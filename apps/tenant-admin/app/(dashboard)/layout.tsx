'use client'

// Force dynamic rendering for all dashboard pages - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Sparkles, LayoutDashboard } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
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
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Programación', href: '/programacion' },
  { label: 'Planner Visual', href: '/planner' },
  { label: 'Cursos', href: '/cursos' },
  { label: 'Ciclos', href: '/ciclos' },
  { label: 'Sedes', href: '/sedes' },
  { label: 'Personal', href: '/personal' },
  { label: 'Campus Virtual', href: '/campus-virtual' },
  { label: 'Leads', href: '/leads' },
  { label: 'Analíticas', href: '/analiticas' },
  { label: 'Administración', href: '/administracion' },
  { label: 'Configuración', href: '/configuracion' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    name: 'Admin User',
    email: 'admin@cepcomunicacion.com',
    avatar: null as string | null,
    initials: 'AU',
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
        const initials = displayName
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

  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return shortcuts.slice(0, 6)
    return shortcuts.filter((item) => item.label.toLowerCase().includes(query) || item.href.includes(query))
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
    <RealtimeProvider tenantId={1}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground overscroll-none">
        <aside
          className={`fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
            sidebarOpen ? 'w-[240px]' : 'w-[80px]'
          }`}
        >
          <AppSidebar
            isCollapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </aside>

        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'ml-[240px]' : 'ml-[80px]'
          }`}
        >
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center border-b bg-card/95 backdrop-blur px-4 md:px-6">
            <div className="flex items-center gap-3 pr-4">
              <Badge variant="outline" className="hidden lg:inline-flex text-[10px] tracking-wide">
                PANEL CLIENTE
              </Badge>
              <div className="hidden xl:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/design-system')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  UI Kit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/diseno/mockup-dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Mockup v2
                </Button>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative hidden lg:block">
                <form onSubmit={handleSearchSubmit}>
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
                  />
                </form>

                {searchOpen && (
                  <div className="absolute left-0 right-0 top-11 z-50 rounded-md border bg-popover p-1 shadow-md">
                    {filteredShortcuts.length > 0 ? (
                      filteredShortcuts.slice(0, 6).map((item) => (
                        <button
                          key={item.href}
                          type="button"
                          onMouseDown={() => goToShortcut(item.href)}
                          className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.href}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 ml-auto">
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex-col items-start">
                    <span className="font-medium">Sistema operativo</span>
                    <span className="text-xs text-muted-foreground">Sin alertas críticas activas</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start">
                    <span className="font-medium">Inscripciones LMS</span>
                    <span className="text-xs text-muted-foreground">Revisa inscripciones recientes en Campus Virtual</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      {currentUser.avatar ? (
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {currentUser.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block font-semibold">
                      {currentUser.name}
                    </span>
                    <Badge variant="secondary" className="hidden xl:inline-flex text-[10px]">Admin</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/perfil')}>
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/configuracion')}>
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async (e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault()
                      try {
                        await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
                        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                        router.push('/auth/login')
                        router.refresh()
                      } catch (error) {
                        console.error('Logout error:', error)
                      }
                    }}
                  >
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">{children}</main>

          <DashboardFooter />
        </div>

        <ChatbotWidget />
      </div>
    </RealtimeProvider>
  )
}
