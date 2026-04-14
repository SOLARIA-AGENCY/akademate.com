'use client'

import * as React from 'react'
import Link from 'next/link'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { ExternalLink, FileEdit } from 'lucide-react'
import { WEBSITE_PAGE_CATALOG, type WebsitePageCatalogItem } from './page-catalog'

type LogosPayload = {
  data?: {
    principal?: string
  }
}

function isCepHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname.toLowerCase()
  return /(^|\.)cepformacion(\.|$)/i.test(host) || host.includes('cep-formacion')
}

function getFallbackLogoFromHost(): string {
  return isCepHost()
    ? '/logos/cep-formacion-logo-rectangular.png'
    : '/logos/akademate-logo-official.png'
}

function PageCardSkeleton() {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-4">
        <div className="h-[72px] w-[128px] rounded-md bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          <div className="h-3 w-36 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function resolveThumbnail(_page: WebsitePageCatalogItem, logoUrl: string): string {
  // V1 fallback intentionally uses tenant branding logo while snapshots are unavailable.
  return logoUrl || getFallbackLogoFromHost()
}

export default function PaginasPage() {
  const [logoUrl, setLogoUrl] = React.useState<string>(getFallbackLogoFromHost())
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const loadBranding = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetch('/api/config?section=logos', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('No se pudo cargar el branding')
      }
      const payload = (await response.json()) as LogosPayload
      const nextLogo = payload.data?.principal?.trim()
      setLogoUrl(nextLogo || getFallbackLogoFromHost())
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Error al cargar miniaturas')
      setLogoUrl(getFallbackLogoFromHost())
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadBranding()
  }, [loadBranding])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Páginas"
        description="Gestiona páginas públicas por secciones"
        icon={FileEdit}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Listado de páginas públicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <>
              <PageCardSkeleton />
              <PageCardSkeleton />
              <PageCardSkeleton />
            </>
          )}

          {!isLoading && loadError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="text-destructive font-medium">Error al cargar miniaturas</p>
              <p className="text-muted-foreground mt-1">{loadError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadBranding()}>
                Reintentar
              </Button>
            </div>
          )}

          {!isLoading &&
            WEBSITE_PAGE_CATALOG.map((page) => (
              <div
                key={page.slug}
                className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="h-[72px] w-[128px] overflow-hidden rounded-md border bg-muted/30 sm:h-[90px] sm:w-[160px]">
                  <img
                    src={resolveThumbnail(page, logoUrl)}
                    alt={`Miniatura de ${page.title}`}
                    className="h-full w-full object-contain p-2"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{page.title}</p>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {page.pageKind}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{page.path}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {page.sections.length} secciones configurables
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <Button asChild size="sm">
                    <Link href={`/contenido/paginas/${page.slug}`}>Editar página</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={page.publicPath} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Ver página
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
