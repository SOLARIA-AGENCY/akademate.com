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

interface DashboardCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  port: number
  color: 'cyan' | 'teal' | 'sky' | 'emerald' | 'orange'
  status: 'running' | 'stopped' | 'unknown'
}

const dashboards: DashboardCard[] = [
  {
    title: 'Akademate Admin',
    description: 'Dashboard multitenant SaaS. Gestión completa del negocio: tenants, facturación, suscripciones, soporte y configuración global.',
    icon: LayoutDashboard,
    href: 'http://localhost:3004',
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
  {
    title: 'SOLARIA DFO',
    description: 'Digital Field Operations. Centro de comando con agentes AI, monitoreo de proyectos, métricas y automatización.',
    icon: Cog,
    href: 'http://localhost:3030',
    port: 3030,
    color: 'orange',
    status: 'unknown',
  },
]

const colorClasses = {
  cyan: {
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300',
    glow: 'hover:shadow-cyan-500/10',
  },
  teal: {
    border: 'border-teal-500/30 hover:border-teal-400/60',
    bg: 'bg-teal-500/10',
    icon: 'text-teal-400',
    badge: 'bg-teal-500/20 text-teal-300',
    glow: 'hover:shadow-teal-500/10',
  },
  sky: {
    border: 'border-sky-500/30 hover:border-sky-400/60',
    bg: 'bg-sky-500/10',
    icon: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300',
    glow: 'hover:shadow-sky-500/10',
  },
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
    glow: 'hover:shadow-emerald-500/10',
  },
  orange: {
    border: 'border-orange-500/30 hover:border-orange-400/60',
    bg: 'bg-orange-500/10',
    icon: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300',
    glow: 'hover:shadow-orange-500/10',
  },
}

export default function PortalPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 py-20 sm:px-12 lg:px-16">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-24 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium tracking-wide text-cyan-300">Development Portal</span>
          </div>
          <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              www.akademate.com
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-slate-400">
            Centro de control y acceso directo a todos los dashboards del proyecto.
            <br className="hidden sm:block" />
            Selecciona un módulo para comenzar.
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-3 py-8">
          {dashboards.map((dashboard) => {
            const colors = colorClasses[dashboard.color]
            const Icon = dashboard.icon

            return (
              <a
                key={dashboard.title}
                href={dashboard.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  group relative flex flex-col items-center rounded-2xl border p-10
                  transition-all duration-300 ease-out
                  ${colors.border}
                  bg-slate-900/60 backdrop-blur-sm
                  hover:bg-slate-800/80 hover:shadow-2xl ${colors.glow}
                  hover:-translate-y-2 hover:scale-[1.02]
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                `}
              >
                {/* Status indicator */}
                <div className="absolute right-6 top-6">
                  <span
                    className={`
                      inline-block h-2.5 w-2.5 rounded-full
                      ${dashboard.status === 'running' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse' : ''}
                      ${dashboard.status === 'stopped' ? 'bg-red-400 shadow-lg shadow-red-400/50' : ''}
                      ${dashboard.status === 'unknown' ? 'bg-slate-500' : ''}
                    `}
                  />
                </div>

                {/* Icon */}
                <div className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-8 w-8 ${colors.icon}`} />
                </div>

                {/* Content */}
                <h2 className="mb-6 text-center text-xl font-semibold text-white group-hover:text-cyan-50 transition-colors">
                  {dashboard.title}
                </h2>
                <p className="mb-8 flex-1 text-center text-sm leading-relaxed text-slate-400" style={{ lineHeight: '1.8' }}>
                  {dashboard.description}
                </p>

                {/* Footer */}
                <div className="flex w-full items-center justify-between border-t border-slate-700/50 pt-6">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${colors.badge}`}>
                    localhost:{dashboard.port}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors group-hover:text-cyan-400">
                    <span>Abrir</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {/* Footer Info */}
        <footer className="mt-24 text-center">
          <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <div className="flex flex-col items-center gap-4 text-sm text-slate-500">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <span>Next.js 15</span>
              <span className="text-slate-700">+</span>
              <span>Payload 3</span>
              <span className="text-slate-700">+</span>
              <span>TailwindCSS 4</span>
              <span className="text-slate-700">+</span>
              <span>TypeScript</span>
            </div>
            <p className="text-slate-600">
              Monorepo con pnpm workspaces
            </p>
            <p className="mt-3 font-medium tracking-wider text-cyan-600">
              SOLARIA AGENCY
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
