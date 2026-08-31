'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  Settings,
  Trophy,
} from 'lucide-react'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { CAMPUS_NAV, isCampusNavActive } from '../lib/nav'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@payload-config/components/ui/sidebar'
import { Card, CardContent } from '@payload-config/components/ui/card'

const ICONS = {
  '/campus': LayoutDashboard,
  '/campus/cursos': BookOpen,
  '/campus/horarios': CalendarDays,
  '/campus/entregas': ClipboardList,
  '/campus/comunidad': MessageSquare,
  '/campus/logros': Trophy,
  '/campus/mensajes': MessageCircle,
  '/campus/ajustes': Settings,
} as const

export function CampusSidebar({ messageCount = 0 }: { messageCount?: number }) {
  const pathname = usePathname() ?? '/campus'
  const { branding } = useTenantBranding()
  const logo = branding.logos.principal

  return (
    <Sidebar
      collapsible="icon"
      className="text-foreground [&_[data-slot=sidebar-inner]]:bg-card [&_[data-slot=sidebar-inner]]:text-foreground"
    >
      <SidebarHeader className="border-b border-black/[0.04] px-3 py-4">
        <Link href="/campus" className="flex items-center gap-2 overflow-hidden">
          {logo ? (
            <img src={logo} alt="" className="h-8 w-8 rounded-md object-contain" />
          ) : (
            <GraduationCap className="h-6 w-6 text-primary" />
          )}
          <span className="truncate text-sm font-semibold">
            {branding.academyName} Campus
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {CAMPUS_NAV.map((item) => {
                const Icon = ICONS[item.href]
                const active = isCampusNavActive(pathname, item.href, item.match)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === '/campus/mensajes' && messageCount > 0 ? (
                      <SidebarMenuBadge>{messageCount}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Card className="shadow-none">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-slate-900">Ayuda y tutorías</p>
            <p className="text-xs text-slate-500">Escribe a tu tutor si necesitas apoyo con un módulo.</p>
            <Link href="/campus/mensajes" className="text-sm font-medium text-primary">
              Contactar tutor
            </Link>
          </CardContent>
        </Card>
      </SidebarFooter>
    </Sidebar>
  )
}
