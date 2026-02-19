'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { LaunchCard } from '@/components/LaunchCard'
import { ServiceStatusBar } from '@/components/ServiceStatusBar'

const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3006'
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3004'
const tenantUrl = process.env.NEXT_PUBLIC_TENANT_URL ?? 'http://localhost:3009'
const payloadUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL ?? 'http://localhost:3003'
const campusUrl = process.env.NEXT_PUBLIC_CAMPUS_URL ?? 'http://localhost:3005'

function resolveRuntimeServiceUrl(rawUrl: string): string {
  if (typeof window === 'undefined') return rawUrl
  try {
    const parsed = new URL(rawUrl)
    const isLocalHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0'

    if (isLocalHost) {
      parsed.hostname = window.location.hostname
    }

    if (!parsed.protocol.startsWith('http')) {
      parsed.protocol = window.location.protocol
    }

    return parsed.toString().replace(/\/$/, '')
  } catch {
    return rawUrl
  }
}

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function postAndOpen(url: string, redirectPath: string) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  form.target = '_blank'
  form.style.display = 'none'

  const redirectInput = document.createElement('input')
  redirectInput.type = 'hidden'
  redirectInput.name = 'redirect'
  redirectInput.value = redirectPath
  form.appendChild(redirectInput)

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export default function PortalPage() {
  const runtimeUrls = useMemo(() => {
    return {
      web: resolveRuntimeServiceUrl(webUrl),
      admin: resolveRuntimeServiceUrl(adminUrl),
      tenant: resolveRuntimeServiceUrl(tenantUrl),
      payload: resolveRuntimeServiceUrl(payloadUrl),
      campus: resolveRuntimeServiceUrl(campusUrl),
    }
  }, [])

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <header className="border-b border-border/80 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              className="logo h-10 w-10 rounded-lg bg-background p-1 ring-1 ring-border"
              data-testid="logo"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2306b6d4'/%3E%3Cpath d='M16 44V20l16-8 16 8v24l-16 8-16-8z' fill='white'/%3E%3C/svg%3E"
              alt="Akademate"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">AKADEMATE</p>
              <h1 className="text-xl font-semibold text-foreground">Dev Launchpad</h1>
            </div>
          </div>
          <Badge variant="warning">DEV MODE</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Servidor: <span className="font-semibold text-foreground">NEMESIS</span> · Entorno:{' '}
            <span className="font-semibold text-foreground">development</span>
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <LaunchCard
            icon="🌐"
            title="Web"
            subtitle="Web pública"
            port=":3006"
            description="Portal de captación y marketing."
            onOpen={() => openInNewTab(runtimeUrls.web)}
          />

          <LaunchCard
            icon="⚙️"
            title="Ops Admin"
            subtitle="Dashboard SaaS admin"
            port=":3004"
            description="Panel global de operaciones SOLARIA."
            hasAutoLogin
            credentials={[
              { label: 'email', value: 'ops@akademate.com' },
              { label: 'role', value: 'superadmin' },
            ]}
            onOpen={() => postAndOpen(`${runtimeUrls.admin}/api/auth/dev-login`, '/dashboard')}
          />

          <LaunchCard
            icon="🏫"
            title="Tenant Dashboard"
            subtitle="Panel de academia cliente"
            port=":3009"
            description="Dashboard académico con gestión LMS."
            hasAutoLogin
            credentials={[
              { label: 'email', value: 'admin@cep.es' },
              { label: 'role', value: 'admin' },
              { label: 'tenantId', value: '1' },
            ]}
            onOpen={() => postAndOpen(`${runtimeUrls.tenant}/api/auth/dev-login`, '/dashboard')}
          />

          <LaunchCard
            icon="📦"
            title="Payload CMS"
            subtitle="Backend + Admin CMS"
            port=":3003/admin"
            description="Administrador de contenidos y datos."
            hasAutoLogin
            credentials={[
              { label: 'email', value: 'admin@akademate.com' },
              { label: 'password', value: 'Admin1234!' },
            ]}
            onOpen={() =>
              openInNewTab(`${runtimeUrls.payload}/api/dev-seed?redirect=${encodeURIComponent('/admin')}`)
            }
          />
        </section>

        <section>
          <LaunchCard
            icon="🎓"
            title="Campus Virtual"
            subtitle="Experiencia alumno"
            port=":3005"
            description="Campus de cursos, progreso y certificados."
            hasAutoLogin
            credentials={[
              { label: 'email', value: 'alumno@akademate.com' },
              { label: 'role', value: 'student' },
            ]}
            onOpen={() => postAndOpen(`${runtimeUrls.campus}/api/auth/dev-login`, '/dashboard')}
            className="md:col-span-2"
          />
        </section>

        <ServiceStatusBar />
      </main>
    </div>
  )
}
