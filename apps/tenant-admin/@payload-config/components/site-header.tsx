"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarIcon } from "lucide-react"

import { SearchForm } from "@payload-config/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@payload-config/components/ui/breadcrumb"
import { Button } from "@payload-config/components/ui/button"
import { Separator } from "@payload-config/components/ui/separator"
import { useSidebar } from "@payload-config/components/ui/sidebar"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  programacion: "Programación",
  planner: "Planner Visual",
  cursos: "Cursos",
  ciclos: "Ciclos",
  sedes: "Sedes",
  personal: "Personal",
  "campus-virtual": "Campus Virtual",
  leads: "Leads",
  "calendario-citas": "Calendario citas",
  analiticas: "Analíticas",
  administracion: "Administración",
  configuracion: "Configuración",
  perfil: "Perfil",
  alumnos: "Alumnos",
  profesores: "Profesores",
  matriculas: "Matrículas",
}

function labelForSegment(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  )
}

function crumbsFromPath(pathname: string): { href: string; label: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { href: string; label: string }[] = []
  let href = ""
  for (const segment of segments) {
    href += `/${segment}`
    crumbs.push({ href, label: labelForSegment(segment) })
  }
  if (crumbs.length === 0) {
    crumbs.push({ href: "/dashboard", label: "Dashboard" })
  }
  return crumbs
}

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const { toggleSidebar, setOpen, isMobile } = useSidebar()
  const pathname = usePathname()
  const crumbs = crumbsFromPath(pathname ?? "/dashboard")

  return (
    <header
      className="flex sticky top-0 z-50 w-full items-center border-b bg-background"
      data-testid="site-header"
    >
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isMobile) {
              setOpen((open) => !open)
              return
            }
            toggleSidebar()
          }}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1
              return (
                <React.Fragment key={crumb.href}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        {children}
      </div>
    </header>
  )
}
