'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { LogOut, Bell, Search } from 'lucide-react'
import { OpsSidebar, OpsSidebarInset, OpsSidebarShell, OpsSidebarTrigger } from '@/components/sidebar'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from '@/lib/auth-client'


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: sessionData, isPending } = useSession()

  const user = sessionData?.user

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const initials = useMemo(() => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() ?? 'A'
  }, [user])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-600 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">Akademate Ops</p>
            <p className="text-muted-foreground text-sm mt-1">Cargando sesión...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <OpsSidebarShell>
      <aside data-testid="sidebar">
        <div className="md:hidden px-3 py-2 text-xs text-muted-foreground">
          Sidebar
        </div>
        <OpsSidebar />
      </aside>
      <OpsSidebarInset>
        {/* Header - Left/Right structure */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <OpsSidebarTrigger />
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground">Panel de Operaciones</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search button */}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* Divider */}
            <div className="h-8 w-px bg-border mx-1" />

            {/* User dropdown */}
            <div className="flex items-center gap-3 pl-2">
              <Link href="/dashboard/perfil">
                <Avatar className="h-8 w-8 border-2 border-primary/20 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-600 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium leading-tight text-foreground">
                  {user.name ?? user.email.split('@')[0]}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {user.email?.includes('ops@') ? 'Super Admin' : 'Administrador'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

        {/* Footer - 3 column layout */}
        <footer className="border-t border-border bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between text-xs">
            {/* Left: Branding */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-primary to-cyan-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">A</span>
              </div>
              <span className="font-semibold text-foreground">Akademate</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                v1.0.0
              </Badge>
            </div>

            {/* Center: System status */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Todos los sistemas operativos
              </span>
            </div>

            {/* Right: Copyright */}
            <div className="text-muted-foreground">
              © {new Date().getFullYear()} SOLARIA Agency
            </div>
          </div>
        </footer>
      </OpsSidebarInset>
    </OpsSidebarShell>
  )
}
