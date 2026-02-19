'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Code,
  CreditCard,
  HelpCircle,
  Image,
  LayoutDashboard,
  Repeat,
  Settings,
  Target,
  UserCog,
  Users,
  ChevronRight,
} from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarRail,
  } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/dashboard/tenants', icon: Users },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Target },
]

const businessNavItems = [
  { name: 'Facturacion', href: '/dashboard/facturacion', icon: CreditCard },
  { name: 'Suscripciones', href: '/dashboard/suscripciones', icon: Repeat },
]

const systemNavItems = [
  { name: 'API', href: '/dashboard/api', icon: Code },
  { name: 'Estado', href: '/dashboard/estado', icon: Activity },
  { name: 'Impersonar', href: '/dashboard/impersonar', icon: UserCog },
  { name: 'Media', href: '/dashboard/media', icon: Image },
]

const supportNavItems = [
  { name: 'Soporte', href: '/dashboard/soporte', icon: HelpCircle },
  { name: 'Configuracion', href: '/dashboard/configuracion', icon: Settings },
]

export function OpsSidebarShell({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>
}

function NavSection({
  label,
  items,
  pathname
}: {
  label: string
  items: typeof mainNavItems
  pathname: string | null
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={cn(
                    'relative transition-all duration-200',
                    isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-sidebar-primary rounded-r-sm" />
                    )}
                    <Icon className={cn(
                      "size-4 transition-colors",
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'
                    )} />
                    <span className="truncate flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="size-3 text-sidebar-primary/60" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function OpsSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="floating" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarRail />
      <SidebarHeader className="pt-5 pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div className="grid">
            <span className="text-sm font-bold leading-tight text-sidebar-foreground tracking-tight">Akademate</span>
            <span className="text-[11px] text-sidebar-foreground/60 leading-tight font-medium uppercase tracking-wider">Ops Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <NavSection label="Principal" items={mainNavItems} pathname={pathname} />
        <NavSection label="Negocio" items={businessNavItems} pathname={pathname} />
        <NavSection label="Sistema" items={systemNavItems} pathname={pathname} />
        <NavSection label="Soporte" items={supportNavItems} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-sidebar-foreground/60 font-medium">Tema</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-3 pt-3 border-t border-sidebar-border/50">
          <p className="text-[10px] text-sidebar-foreground/40 text-center uppercase tracking-wider">
            v1.0.0 · SOLARIA
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function OpsSidebarInset({ children, className }: { children: React.ReactNode; className?: string }) {
  return <SidebarInset className={cn(className, 'bg-canvas')}>{children}</SidebarInset>
}

export function OpsSidebarTrigger({ className }: { className?: string }) {
  return <SidebarTrigger className={cn('scale-110 sm:scale-100', className)} />
}
