'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowDown, ArrowUp, Eye, RotateCcw, Save } from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { getCatalogPageBySlug } from '../page-catalog'

type SectionEditor = {
  id: string
  title: string
  enabled: boolean
  body: string
}

export default function EditWebsitePage() {
  const params = useParams<{ slug: string }>()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const page = React.useMemo(() => getCatalogPageBySlug(slug), [slug])

  const initialSections = React.useMemo<SectionEditor[]>(
    () =>
      (page?.sections ?? []).map((sectionKey) => ({
        id: sectionKey,
        title: sectionKey,
        enabled: true,
        body: `Contenido editable para "${sectionKey}".`,
      })),
    [page],
  )

  const [sections, setSections] = React.useState<SectionEditor[]>(initialSections)
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>(initialSections[0]?.id ?? '')
  const [savedAt, setSavedAt] = React.useState<string>('')

  React.useEffect(() => {
    setSections(initialSections)
    setSelectedSectionId(initialSections[0]?.id ?? '')
  }, [initialSections])

  const selectedSection = sections.find((item) => item.id === selectedSectionId) ?? null

  const swapSections = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return
    const next = [...sections]
    const [item] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    setSections(next)
  }

  const handleSave = () => {
    // v1: local save marker while API editor endpoints are integrated.
    setSavedAt(new Date().toLocaleString('es-ES'))
  }

  const handleRestore = () => {
    setSections(initialSections)
    setSelectedSectionId(initialSections[0]?.id ?? '')
  }

  if (!page) {
    return (
      <div className="space-y-4">
        <PageHeader title="Página no encontrada" description="El slug solicitado no existe en el catálogo web." />
        <Button asChild variant="outline">
          <Link href="/contenido/paginas">Volver a páginas</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Editar: ${page.title}`}
        description={`Ruta pública ${page.path}`}
        icon={Save}
        badge={<Badge variant="outline">{page.pageKind}</Badge>}
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </Button>
        <Button variant="outline" asChild>
          <Link href={page.publicPath} target="_blank" rel="noreferrer">
            <Eye className="mr-2 h-4 w-4" />
            Vista previa
          </Link>
        </Button>
        <Button variant="ghost" onClick={handleRestore}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/contenido/paginas">Volver al listado</Link>
        </Button>
      </div>

      {savedAt && <p className="text-xs text-muted-foreground">Cambios guardados localmente: {savedAt}</p>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Secciones de la página</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section, index) => {
              const isSelected = selectedSectionId === section.id
              return (
                <div
                  key={section.id}
                  className={`rounded-lg border p-3 ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.enabled ? 'Visible' : 'Oculta'}</p>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => swapSections(index, index - 1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => swapSections(index, index + 1)}
                        disabled={index === sections.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editor de sección</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSection && <p className="text-sm text-muted-foreground">Selecciona una sección para editar.</p>}
            {selectedSection && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Título</label>
                  <input
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedSection.title}
                    onChange={(event) =>
                      setSections((prev) =>
                        prev.map((item) =>
                          item.id === selectedSection.id ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Contenido</label>
                  <textarea
                    rows={6}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedSection.body}
                    onChange={(event) =>
                      setSections((prev) =>
                        prev.map((item) =>
                          item.id === selectedSection.id ? { ...item, body: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSection.enabled}
                    onChange={(event) =>
                      setSections((prev) =>
                        prev.map((item) =>
                          item.id === selectedSection.id ? { ...item, enabled: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  Mostrar sección
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
