'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Code,
  DollarSign,
  Key,
  LayoutDashboard,
  Map,
  Receipt,
  Repeat,
  Settings,
  Shield,
  Ticket,
  TrendingUp,
  UserCog,
  Users,
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

// ── Nav sections según diseño aprobado ────────────────────────────────────────

const overviewItems = [
  { name: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
]

const clientsItems = [
  { name: 'Tenants', href: '/dashboard/tenants', icon: Users },
  { name: 'Alta / Registro', href: '/dashboard/tenants/create', icon: UserCog },
  { name: 'Impersonar', href: '/dashboard/impersonar', icon: Shield },
]

const financeItems = [
  { name: 'P&L Overview', href: '/dashboard/finanzas', icon: DollarSign },
  { name: 'Ingresos', href: '/dashboard/finanzas/ingresos', icon: TrendingUp },
  { name: 'Gastos Operativos', href: '/dashboard/finanzas/gastos', icon: Receipt },
  { name: 'Suscripciones', href: '/dashboard/suscripciones', icon: Repeat },
]

const analyticsItems = [
  { name: 'Crecimiento', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Retención & Churn', href: '/dashboard/analytics/retencion', icon: TrendingUp },
]

const supportItems = [
  { name: 'Tickets', href: '/dashboard/soporte', icon: Ticket },
]

const infraItems = [
  { name: 'Estado del Sistema', href: '/dashboard/estado', icon: Activity },
  { name: 'API Console', href: '/dashboard/api', icon: Code },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
]

const opsItems = [
  { name: 'Equipo & Roles', href: '/dashboard/equipo', icon: Users },
  { name: 'Audit Log', href: '/dashboard/auditoria', icon: ClipboardList },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Map },
]

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> }

export function OpsSidebarShell({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
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
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
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
                    <Icon
                      className={cn(
                        'size-4 transition-colors',
                        isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'
                      )}
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="size-3 text-sidebar-primary/60" />}
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
        <div className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <img
            src="/logos/akademate-icon-48.png"
            alt="Akademate"
            className="size-10 flex-shrink-0 rounded-xl"
          />
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-tight text-sidebar-foreground tracking-tight">
              Akademate
            </span>
            <span className="text-[11px] text-sidebar-foreground/60 leading-tight font-medium uppercase tracking-wider">
              Ops Center
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <NavSection label="Overview" items={overviewItems} pathname={pathname} />
        <NavSection label="Clientes" items={clientsItems} pathname={pathname} />
        <NavSection label="Finanzas" items={financeItems} pathname={pathname} />
        <NavSection label="Analytics" items={analyticsItems} pathname={pathname} />
        <NavSection label="Soporte" items={supportItems} pathname={pathname} />
        <NavSection label="Infraestructura" items={infraItems} pathname={pathname} />
        <NavSection label="Operaciones" items={opsItems} pathname={pathname} />
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
            v1.1.0 · OPS CENTER
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
