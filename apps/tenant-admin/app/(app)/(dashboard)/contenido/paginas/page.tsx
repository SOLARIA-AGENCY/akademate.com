'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { FileEdit, Globe, Route } from 'lucide-react'

export default function PaginasPage() {
  const [pages, setPages] = useState<Array<{ title: string; path: string; pageKind: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/config?section=website', { cache: 'no-store' })
        const payload = (await response.json()) as { data?: { pages?: Array<{ title: string; path: string; pageKind: string }> } }
        setPages(payload.data?.pages ?? [])
      } catch {
        setPages([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

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
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando páginas...</p>
          ) : pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay páginas configuradas todavía.</p>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div key={page.path} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{page.title}</p>
                    <p className="text-sm text-muted-foreground">{page.path}</p>
                  </div>
                  <Badge variant="outline">{page.pageKind}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
