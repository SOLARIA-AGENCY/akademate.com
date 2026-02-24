'use client'

import { useMemo, useState } from 'react'
import type { ComponentType, FormEvent } from 'react'
import { ArrowUpRight, ExternalLink, GraduationCap, Headset, Palette, Shield, Store, Users } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getPathFromUrl, getRuntimePlatformUrls } from '@/lib/platform-access'

type AccessItem = {
  title: string
  description: string
  cta: string
  destination: string
  icon: ComponentType<{ className?: string }>
  open: () => void
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

export function LoginGateway() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')

  const runtimeUrls = useMemo(() => getRuntimePlatformUrls(), [])

  const accessItems: AccessItem[] = useMemo(
    () => [
      {
        title: 'WEB AKADEMATE PUBLICA',
        description: 'Sitio público corporativo y marketing principal.',
        cta: 'Abrir web',
        destination: runtimeUrls.web,
        icon: Store,
        open: () => openInNewTab(runtimeUrls.web),
      },
      {
        title: 'DASHBOARD AKADEMATE OPS',
        description: 'Panel global de operaciones y supervisión SaaS.',
        cta: 'Abrir Ops',
        destination: runtimeUrls.ops,
        icon: Shield,
        open: () => postAndOpen(`${runtimeUrls.ops}/api/auth/dev-login`, '/dashboard'),
      },
      {
        title: 'DASHBOARD AKADEMATE CLIENTE',
        description: 'Panel de gestión para academias cliente.',
        cta: 'Abrir cliente',
        destination: runtimeUrls.tenant,
        icon: Users,
        open: () => postAndOpen(`${runtimeUrls.tenant}/api/auth/dev-login`, '/dashboard'),
      },
      {
        title: 'CAMPUS AKADEMATE ALUMNO',
        description: 'Campus virtual para seguimiento académico del alumno.',
        cta: 'Abrir campus',
        destination: runtimeUrls.campus,
        icon: GraduationCap,
        open: () => postAndOpen(`${runtimeUrls.campus}/api/auth/dev-login`, '/dashboard'),
      },
      {
        title: 'AKADEMATE DESIGN SYSTEM',
        description: 'Catálogo de foundations, componentes y plantillas de akademate-ui.',
        cta: 'Abrir catálogo',
        destination: runtimeUrls.designSystem,
        icon: Palette,
        open: () => openInNewTab(runtimeUrls.designSystem),
      },
      {
        title: 'AKADEMATE SUPPORT',
        description: 'Centro de soporte y operación sobre dashboard Ops.',
        cta: 'Abrir soporte',
        destination: runtimeUrls.support,
        icon: Headset,
        open: () => {
          if (runtimeUrls.support.startsWith(runtimeUrls.ops)) {
            postAndOpen(`${runtimeUrls.ops}/api/auth/dev-login`, getPathFromUrl(runtimeUrls.support))
            return
          }
          openInNewTab(runtimeUrls.support)
        },
      },
    ],
    [runtimeUrls]
  )

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (username === 'admin' && password === '1234') {
      setIsAuthenticated(true)
      setError('')
      return
    }

    setIsAuthenticated(false)
    setError('Credenciales inválidas. Usa admin / 1234.')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-primary/10 via-background to-background">
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Akademate</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              AKADEMATE SAAS PLATFORM
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Acceso centralizado a toda la plataforma. Credenciales unificadas para este gateway:{' '}
              <span className="font-semibold text-foreground">admin / 1234</span>.
            </p>
          </div>

          <Card className="mx-auto mt-10 max-w-xl">
            <CardHeader>
              <CardTitle>Login principal</CardTitle>
              <CardDescription>
                Valida tus credenciales para habilitar los accesos de la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleLogin}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="username">
                    Usuario
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="1234"
                    required
                  />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full">
                  Activar accesos
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {accessItems.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="flex h-full flex-col">
                  <CardHeader>
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Estado:{' '}
                      <span className={isAuthenticated ? 'font-semibold text-foreground' : 'font-semibold'}>
                        {isAuthenticated ? 'Acceso habilitado' : 'Requiere login principal'}
                      </span>
                    </p>
                    <p className="mt-2 truncate rounded-md border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                      Destino: {item.destination}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={item.open}
                      disabled={!isAuthenticated}
                      aria-disabled={!isAuthenticated}
                    >
                      {item.cta}
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Si prefieres abrir el portal de desarrollo unificado, usa{' '}
            <a
              className="font-medium text-primary hover:underline"
              href={runtimeUrls.portal}
              target="_blank"
              rel="noreferrer"
            >
              AKADEMATE PORTAL
              <ExternalLink className="ml-1 inline h-4 w-4" />
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
