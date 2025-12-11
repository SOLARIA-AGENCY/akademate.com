'use client'

import {
  LayoutDashboard,
  Building2,
  Database,
  GraduationCap,
  Cog,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  port: number
  color: 'cyan' | 'teal' | 'sky' | 'emerald' | 'orange'
  status: 'running' | 'stopped' | 'unknown'
}

// Main dashboards (product)
const mainDashboards: DashboardItem[] = [
  {
    title: 'Akademate Admin',
    description: 'Dashboard multitenant SaaS. Gestión completa del negocio: tenants, facturación, suscripciones, soporte y configuración global.',
    icon: LayoutDashboard,
    href: 'http://localhost:3004/dashboard',
    port: 3004,
    color: 'cyan',
    status: 'running',
  },
  {
    title: 'Tenant Admin',
    description: 'Dashboard del cliente (academias). Gestión de cursos, leads, contenido, inscripciones, branding y usuarios del tenant.',
    icon: Building2,
    href: 'http://localhost:3009',
    port: 3009,
    color: 'teal',
    status: 'running',
  },
  {
    title: 'Payload CMS',
    description: 'Backoffice y base de datos. Acceso directo a collections, API REST/GraphQL, usuarios y configuración del CMS.',
    icon: Database,
    href: 'http://localhost:3003/admin',
    port: 3003,
    color: 'sky',
    status: 'running',
  },
  {
    title: 'Campus Virtual',
    description: 'Portal del alumno. Acceso a cursos, materiales, evaluaciones, progreso y certificados por tenant.',
    icon: GraduationCap,
    href: 'http://localhost:3005',
    port: 3005,
    color: 'emerald',
    status: 'running',
  },
]

// Development tools (separate category)
const devTools: DashboardItem = {
  title: 'SOLARIA DFO',
  description: 'Digital Field Operations. Centro de comando para gestión de desarrollo: agentes AI, monitoreo de proyectos, métricas y automatización.',
  icon: Cog,
  href: 'http://localhost:3030',
  port: 3030,
  color: 'orange',
  status: 'unknown',
}

const colorClasses = {
  cyan: {
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    bg: 'bg-cyan-500/15',
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  teal: {
    border: 'border-teal-500/30 hover:border-teal-400/60',
    bg: 'bg-teal-500/15',
    icon: 'text-teal-400',
    badge: 'bg-teal-500/20 text-teal-300',
  },
  sky: {
    border: 'border-sky-500/30 hover:border-sky-400/60',
    bg: 'bg-sky-500/15',
    icon: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    bg: 'bg-emerald-500/15',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  orange: {
    border: 'border-orange-500/30 hover:border-orange-400/60',
    bg: 'bg-orange-500/15',
    icon: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300',
  },
}

function DashboardCard({ dashboard }: { dashboard: DashboardItem }) {
  const colors = colorClasses[dashboard.color]
  const Icon = dashboard.icon

  return (
    <a
      href={dashboard.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
    >
      <Card className={cn(
        "h-full flex flex-col transition-all duration-300",
        colors.border,
        "hover:bg-slate-800/80"
      )}>
        <CardHeader className="relative pb-4">
          {/* Status indicator */}
          <div className="absolute right-6 top-6">
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                dashboard.status === 'running' && 'bg-emerald-400 shadow shadow-emerald-400/60 animate-pulse',
                dashboard.status === 'stopped' && 'bg-red-400 shadow shadow-red-400/60',
                dashboard.status === 'unknown' && 'bg-slate-500'
              )}
            />
          </div>

          {/* Icon */}
          <div className={cn(
            "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            colors.bg
          )}>
            <Icon className={cn("h-7 w-7", colors.icon)} />
          </div>

          <CardTitle className="text-lg">{dashboard.title}</CardTitle>
        </CardHeader>

        <CardContent className="flex-1">
          <CardDescription>{dashboard.description}</CardDescription>
        </CardContent>

        <CardFooter className="border-t border-slate-700/50 pt-4 mt-auto justify-between">
          <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", colors.badge)}>
            localhost:{dashboard.port}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-cyan-300">
            Abrir <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </CardFooter>
      </Card>
    </a>
  )
}

export default function PortalPage() {
  const devToolColors = colorClasses[devTools.color]
  const DevToolIcon = devTools.icon

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-8 sm:p-12 lg:p-16 xl:p-20">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center">
        {/* Header */}
        <header className="mb-16 w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Development Portal</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent uppercase tracking-wider">
              WWW.AKADEMATE.COM
            </span>
          </h1>
        </header>

        {/* Main Dashboards Grid - 2x2 */}
        <section className="w-full">
          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:gap-10">
            {mainDashboards.map((dashboard) => (
              <DashboardCard key={dashboard.title} dashboard={dashboard} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="my-16 w-full">
          <div className="mx-auto h-px w-full max-w-md bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>

        {/* Development Tools Section */}
        <section className="w-full">
          <h3 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.25em] text-orange-400/80">
            Herramientas de Desarrollo
          </h3>
          <div className="mx-auto max-w-xl">
            <a
              href={devTools.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
            >
              <Card className={cn(
                "transition-all duration-300",
                devToolColors.border,
                "hover:bg-slate-800/80"
              )}>
                <CardHeader className="relative">
                  {/* Status indicator */}
                  <div className="absolute right-6 top-6">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-500" />
                  </div>

                  <div className="flex items-start gap-5">
                    <div className={cn(
                      "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                      devToolColors.bg
                    )}>
                      <DevToolIcon className={cn("h-6 w-6", devToolColors.icon)} />
                    </div>
                    <div className="flex-1 pt-1">
                      <CardTitle className="text-base mb-2">{devTools.title}</CardTitle>
                      <CardDescription>{devTools.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardFooter className="border-t border-slate-700/50 pt-4 justify-between">
                  <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", devToolColors.badge)}>
                    localhost:{devTools.port}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-orange-300">
                    Abrir <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </CardFooter>
              </Card>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 w-full text-center">
          <div className="mx-auto mb-6 h-px w-full max-w-lg bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] text-slate-500">
            <span>Next.js 15</span>
            <span className="text-slate-700">•</span>
            <span>Payload 3</span>
            <span className="text-slate-700">•</span>
            <span>Tailwind 4</span>
            <span className="text-slate-700">•</span>
            <span>TypeScript</span>
            <span className="text-slate-700">•</span>
            <span>pnpm workspaces</span>
          </div>
          <p className="mt-4 text-sm font-semibold tracking-[0.2em] text-cyan-400">SOLARIA AGENCY</p>
        </footer>
      </div>
    </div>
  )
}
