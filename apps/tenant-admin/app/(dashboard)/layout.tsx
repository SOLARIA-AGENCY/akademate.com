'use client'

// Force dynamic rendering for all dashboard pages - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
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
import { AppSidebar } from '@payload-config/components/layout/AppSidebar' // FORCED RELOAD
import { DashboardFooter } from '@payload-config/components/layout/DashboardFooter'
import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'
import { ChatbotWidget } from '@payload-config/components/ui/ChatbotWidget'
import { RealtimeProvider } from '@payload-config/components/providers'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Mock user data (replace with actual user data from context/session)
  const currentUser = {
    name: 'Admin User',
    email: 'admin@akademate.com',
    avatar: null, // Set to photo URL when available
    initials: 'AU'
  }

  return (
    <html lang="es">
      <body>
        <RealtimeProvider tenantId={1}>
        <div className="flex h-screen overflow-hidden bg-background text-foreground overscroll-none">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <AppSidebar
            isCollapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </aside>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-16'
          }`}
        >
          {/* Fixed Header */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-card px-4 md:px-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative hidden lg:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="w-full pl-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Right Actions - Aligned to the right */}
            <div className="flex items-center justify-end gap-2 ml-auto">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault()
                  console.log('Notificaciones próximamente')
                }}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </Button>

              {/* User Menu */}
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
                        await fetch('/api/auth/logout', { method: 'POST' })
                        localStorage.removeItem('akademate_user')
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

          {/* Scrollable Main Content */}
          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">{children}</main>

          {/* Footer */}
          <DashboardFooter />
        </div>

        {/* Chatbot Widget - Fixed Position */}
        <ChatbotWidget />
        </div>
        </RealtimeProvider>
      </body>
    </html>
  )
}
