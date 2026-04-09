'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import { Eye, FileEdit, Globe, RefreshCcw, Route } from 'lucide-react'

type WebsitePageInventoryItem = {
  title: string
  path: string
  slug?: string
  pageKind: string
  thumbnailUrl?: string
  sections: Array<{ id?: string; kind: string; enabled?: boolean }>
}

function PlaceholderThumbnail({ title }: { title: string }) {
  return (
    <div className="flex h-[72px] w-[120px] items-center justify-center rounded-md border bg-muted text-center text-[11px] font-medium text-muted-foreground md:h-[90px] md:w-[160px]">
      {title}
    </div>
  )
}

export default function PaginasPage() {
  const [pages, setPages] = useState<WebsitePageInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/config?section=website', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const payload = (await response.json()) as { data?: { pages?: WebsitePageInventoryItem[] } }
      setPages(payload.data?.pages ?? [])
    } catch (err) {
      setPages([])
      setError('No se pudo cargar el inventario de páginas.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPages()
  }, [])

  const orderedPages = useMemo(() => {
    const home = pages.find((page) => page.path === '/')
    const rest = pages
      .filter((page) => page.path !== '/')
      .sort((a, b) => a.path.localeCompare(b.path, 'es'))
    return home ? [home, ...rest] : rest
  }, [pages])

  const resolvePageSlug = (page: WebsitePageInventoryItem): string => {
    if (page.slug && page.slug.trim() !== '') return page.slug
    if (page.path === '/') return 'home'
    return page.path.replace(/^\/+|\/+$/g, '').replace(/\//g, '--')
  }

  const countEnabledSections = (page: WebsitePageInventoryItem): number => {
    if (!Array.isArray(page.sections)) return 0
    return page.sections.filter((section) => section.enabled !== false).length
  }

  const renderLoadingRows = () => {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
            <Skeleton className="h-[72px] w-[120px] md:h-[90px] md:w-[160px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
    )
  }

  const renderRows = () => {
    if (loading) return renderLoadingRows()
    if (error) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={() => void loadPages()} variant="outline" className="mt-3">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )
    }
    if (orderedPages.length === 0) {
      return <p className="text-sm text-muted-foreground">No hay páginas configuradas todavía.</p>
    }

    return (
      <div className="space-y-3">
        {orderedPages.map((page) => {
          const slug = resolvePageSlug(page)
          const sectionCount = countEnabledSections(page)
          return (
            <div key={page.path} className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
              {page.thumbnailUrl ? (
                <img
                  src={page.thumbnailUrl}
                  alt={`Miniatura de ${page.title}`}
                  className="h-[72px] w-[120px] rounded-md border object-cover md:h-[90px] md:w-[160px]"
                />
              ) : (
                <PlaceholderThumbnail title={page.title} />
              )}

              <div className="min-w-[200px] flex-1">
                <p className="font-medium">{page.title}</p>
                <p className="text-sm text-muted-foreground">{page.path}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{page.pageKind}</Badge>
                  <Badge variant="secondary">{sectionCount} secciones</Badge>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={page.path} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver página
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/contenido/paginas/${slug}`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Editar página
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4" data-oid="h-wr_9l">
      <PageHeader
        title="Páginas"
        description="Inventario del website público seccionable del tenant"
        icon={FileEdit}
        data-oid="ox-4:.1"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Website público
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La raíz del tenant ahora queda reservada para la web pública y el dashboard usa <code>/login</code> como entrada.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4" />
              Inventario de páginas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {loading ? 'Cargando configuración...' : `${pages.length} páginas definidas en la configuración website.`}
          </CardContent>
        </Card>
      </div>

      <Card data-oid="wa4-vef">
        <CardContent className="py-6">
          {renderRows()}
        </CardContent>
      </Card>
    </div>
  )
}
