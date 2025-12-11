'use client'

import {
  LayoutDashboard,
  Building2,
  Database,
  GraduationCap,
  Terminal,
  ExternalLink,
  Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PortalCardProps {
  title: string
  description: string
  port: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  status?: 'online' | 'offline' | 'unknown'
  variant?: 'cyan' | 'teal' | 'sky' | 'emerald' | 'orange'
}

const variantStyles = {
  cyan: {
    border: 'hover:border-cyan-500/50',
    iconBg: 'bg-cyan-500/15',
    icon: 'text-cyan-400',
    badge: 'border-cyan-500/30 text-cyan-400',
    hoverText: 'group-hover:text-cyan-400',
  },
  teal: {
    border: 'hover:border-teal-500/50',
    iconBg: 'bg-teal-500/15',
    icon: 'text-teal-400',
    badge: 'border-teal-500/30 text-teal-400',
    hoverText: 'group-hover:text-teal-400',
  },
  sky: {
    border: 'hover:border-sky-500/50',
    iconBg: 'bg-sky-500/15',
    icon: 'text-sky-400',
    badge: 'border-sky-500/30 text-sky-400',
    hoverText: 'group-hover:text-sky-400',
  },
  emerald: {
    border: 'hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/15',
    icon: 'text-emerald-400',
    badge: 'border-emerald-500/30 text-emerald-400',
    hoverText: 'group-hover:text-emerald-400',
  },
  orange: {
    border: 'hover:border-orange-500/50',
    iconBg: 'bg-orange-500/15',
    icon: 'text-orange-400',
    badge: 'border-orange-500/30 text-orange-400',
    hoverText: 'group-hover:text-orange-400',
  },
}

function PortalCard({
  title,
  description,
  port,
  icon: Icon,
  href,
  status = 'online',
  variant = 'cyan',
}: PortalCardProps) {
  const styles = variantStyles[variant]

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm',
        'transition-all duration-200',
        'hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-500/5',
        styles.border
      )}
    >
      {/* Status indicator */}
      <div className="absolute right-4 top-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              status === 'online' && 'animate-pulse bg-emerald-500',
              status === 'offline' && 'bg-red-500',
              status === 'unknown' && 'bg-slate-500'
            )}
          />
          <span className="text-xs text-slate-500">
            {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Icon */}
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
          styles.iconBg
        )}
      >
        <Icon className={cn('h-6 w-6', styles.icon)} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <code
          className={cn(
            'rounded border bg-slate-800/50 px-2 py-1 text-xs',
            styles.badge
          )}
        >
          localhost:{port}
        </code>
        <span
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-all duration-200',
            'group-hover:translate-x-1',
            styles.hoverText
          )}
        >
          Abrir
          <ExternalLink className="h-4 w-4" />
        </span>
      </div>
    </a>
  )
}

// Portal data
const portals = [
  {
    title: 'Akademate Admin',
    description:
      'Dashboard multitenant SaaS. Gestión completa del negocio: tenants, facturación, suscripciones, soporte y configuración global.',
    port: 3004,
    icon: LayoutDashboard,
    href: 'http://localhost:3004/dashboard',
    variant: 'cyan' as const,
    status: 'online' as const,
  },
  {
    title: 'Tenant Admin',
    description:
      'Dashboard del cliente (academias). Gestión de cursos, leads, contenido, inscripciones, branding y usuarios del tenant.',
    port: 3009,
    icon: Building2,
    href: 'http://localhost:3009',
    variant: 'teal' as const,
    status: 'online' as const,
  },
  {
    title: 'Payload CMS',
    description:
      'Backoffice y base de datos. Acceso directo a collections, API REST/GraphQL, usuarios y configuración del CMS.',
    port: 3003,
    icon: Database,
    href: 'http://localhost:3003/admin',
    variant: 'sky' as const,
    status: 'online' as const,
  },
  {
    title: 'Campus Virtual',
    description:
      'Portal del alumno. Acceso a cursos, materiales, evaluaciones, progreso y certificados por tenant.',
    port: 3005,
    icon: GraduationCap,
    href: 'http://localhost:3005',
    variant: 'emerald' as const,
    status: 'online' as const,
  },
]

const devTools = [
  {
    title: 'SOLARIA DFO',
    description:
      'Digital Field Operations. Centro de comando para gestión de desarrollo: agentes AI, monitoreo de proyectos, métricas y automatización.',
    port: 3030,
    icon: Terminal,
    href: 'http://localhost:3030',
    variant: 'orange' as const,
    status: 'unknown' as const,
  },
]

const techStack = [
  'Next.js 15',
  'Payload 3',
  'Tailwind 4',
  'TypeScript',
  'PNPM Workspaces',
]

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Code2 className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-medium uppercase tracking-wider text-cyan-400">
              Development Portal
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Akademate
          </h1>
          <p className="text-lg text-slate-400">
            Centro de control para el ecosistema de desarrollo
          </p>
        </header>

        {/* Portales del Sistema */}
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">Portales del Sistema</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {portals.map((portal) => (
              <PortalCard key={portal.title} {...portal} />
            ))}
          </div>
        </section>

        {/* Herramientas de Desarrollo */}
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">
            Herramientas de Desarrollo
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {devTools.map((tool) => (
              <PortalCard key={tool.title} {...tool} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-8">
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
              Stack Tecnológico
            </h3>
            <div className="flex flex-wrap gap-3">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
            <p className="text-sm text-slate-400">
              Desarrollado por{' '}
              <a
                href="https://solaria.agency"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-cyan-400 transition-colors hover:text-cyan-300 hover:underline"
              >
                Solaria Agency
              </a>
            </p>
            <p className="text-xs text-slate-500">Akademate Development Environment</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
