'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Separator } from '@payload-config/components/ui/separator'
import { Switch } from '@payload-config/components/ui/switch'
import { Textarea } from '@payload-config/components/ui/textarea'
import { ArrowLeft, ArrowUp, ArrowDown, Eye, GripVertical, RefreshCcw, Save } from 'lucide-react'
import type { WebsitePage, WebsiteSection } from '@/app/lib/website/types'

type EditorResponse = {
  success: boolean
  data?: {
    page: WebsitePage
  }
  error?: string
}

function asSectionWithTitle(
  section: WebsiteSection
): section is Extract<WebsiteSection, { title: string }> {
  return 'title' in section
}

function asSectionWithSubtitle(
  section: WebsiteSection
): section is Extract<WebsiteSection, { subtitle?: string }> {
  return 'subtitle' in section
}

function asSectionWithLimit(
  section: WebsiteSection
): section is Extract<WebsiteSection, { limit?: number }> {
  return 'limit' in section
}

function SectionGraphicPreview({ section }: { section: WebsiteSection }) {
  if (section.kind === 'heroCarousel') {
    const slide = section.slides?.[0]
    return (
      <div className="mt-2 overflow-hidden rounded-md border bg-black/80">
        {slide ? (
          <div className="relative h-20">
            <img src={slide.image} alt={slide.alt} className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute left-2 top-2 right-2 text-white">
              <p className="line-clamp-1 text-[11px] font-semibold">{section.title}</p>
              <p className="line-clamp-1 text-[10px] text-white/75">{section.subtitle}</p>
            </div>
          </div>
        ) : (
          <div className="h-20 bg-muted" />
        )}
      </div>
    )
  }

  if (section.kind === 'statsStrip') {
    return (
      <div className="mt-2 grid grid-cols-4 gap-1">
        {section.items.slice(0, 4).map((item) => (
          <div key={item.label} className="rounded bg-muted p-1 text-center">
            <p className="text-[10px] font-semibold">{item.value}</p>
            <p className="truncate text-[9px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    )
  }

  if ('title' in section) {
    return (
      <div className="mt-2 rounded-md border bg-muted/40 p-2">
        <p className="line-clamp-1 text-[11px] font-medium">{section.title}</p>
        {'subtitle' in section ? (
          <p className="line-clamp-1 text-[10px] text-muted-foreground">{section.subtitle || 'Sin subtítulo'}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-md border bg-muted/40 p-2">
      <p className="text-[10px] text-muted-foreground">Vista previa disponible al seleccionar bloque.</p>
    </div>
  )
}

export default function EditWebsitePage({
  params,
}: {
  params: { slug: string }
}) {
  const [slug, setSlug] = useState('')
  const [page, setPage] = useState<WebsitePage | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const nextSlug = decodeURIComponent(params.slug)
      setSlug(nextSlug)
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/config/website/pages/${nextSlug}`, {
          cache: 'no-store',
        })
        const payload = (await response.json()) as EditorResponse
        if (!response.ok || !payload.success || !payload.data?.page) {
          throw new Error(payload.error || 'No se pudo cargar la página')
        }
        setPage(payload.data.page)
        const firstSection = payload.data.page.sections[0]
        setSelectedSectionId(firstSection?.id || null)
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar la página para edición.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.slug])

  const selectedSection = useMemo(() => {
    if (!page || !selectedSectionId) return null
    return page.sections.find((section) => section.id === selectedSectionId) || null
  }, [page, selectedSectionId])

  const updatePage = (updater: (prev: WebsitePage) => WebsitePage) => {
    setPage((prev) => (prev ? updater(prev) : prev))
  }

  const updateSection = (
    sectionId: string,
    updater: (section: WebsiteSection) => WebsiteSection
  ) => {
    updatePage((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? updater(section) : section)),
    }))
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    updatePage((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId)
      if (index === -1) return prev
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.sections.length) return prev
      const nextSections = [...prev.sections]
      const [current] = nextSections.splice(index, 1)
      nextSections.splice(target, 0, current)
      return { ...prev, sections: nextSections }
    })
  }

  const savePage = async () => {
    if (!page) return
    setSaving(true)
    setSaveMessage(null)
    setError(null)
    try {
      const response = await fetch(`/api/config/website/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          regenerateThumbnail: true,
        }),
      })
      const payload = (await response.json()) as EditorResponse
      if (!response.ok || !payload.success || !payload.data?.page) {
        throw new Error(payload.error || 'No se pudo guardar la página')
      }
      setPage(payload.data.page)
      setSaveMessage('Cambios guardados correctamente.')
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar la página.')
    } finally {
      setSaving(false)
    }
  }

  const restoreFromServer = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/config/website/pages/${slug}`, { cache: 'no-store' })
      const payload = (await response.json()) as EditorResponse
      if (!response.ok || !payload.success || !payload.data?.page) {
        throw new Error(payload.error || 'No se pudo restaurar la página')
      }
      setPage(payload.data.page)
      setSelectedSectionId(payload.data.page.sections[0]?.id || null)
      setSaveMessage('Cambios restaurados desde servidor.')
    } catch (err) {
      console.error(err)
      setError('No se pudo restaurar la página.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando editor de página...</div>
  }

  if (error && !page) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => void restoreFromServer()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!page) {
    return <div className="p-4 text-sm text-muted-foreground">Página no encontrada.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link href="/contenido/paginas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a páginas
          </Link>
          <h1 className="text-2xl font-semibold">{page.title}</h1>
          <p className="text-sm text-muted-foreground">{page.path}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={page.path} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Vista previa
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void restoreFromServer()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
          <Button onClick={() => void savePage()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {saveMessage ? <p className="text-sm text-emerald-600">{saveMessage}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Secciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {page.sections.map((section, index) => {
              const isSelected = selectedSectionId === section.id
              return (
                <button
                  key={section.id || `${section.kind}-${index}`}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id || null)}
                  className={`w-full rounded-lg border p-3 text-left transition ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{section.label || section.kind}</p>
                      <p className="text-xs text-muted-foreground">{section.kind}</p>
                    </div>
                    <Badge variant={section.enabled === false ? 'outline' : 'secondary'}>
                      {section.enabled === false ? 'Oculta' : 'Activa'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={(event) => {
                          event.stopPropagation()
                          moveSection(section.id || '', 'up')
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={index === page.sections.length - 1}
                        onClick={(event) => {
                          event.stopPropagation()
                          moveSection(section.id || '', 'down')
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <SectionGraphicPreview section={section} />
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editor de bloque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSection ? (
              <p className="text-sm text-muted-foreground">Selecciona una sección para editarla.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nombre interno</Label>
                  <Input
                    value={selectedSection.label || ''}
                    onChange={(event) =>
                      updateSection(selectedSection.id || '', (section) => ({
                        ...section,
                        label: event.target.value,
                      }))
                    }
                    placeholder={selectedSection.kind}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Visible en web pública</p>
                    <p className="text-xs text-muted-foreground">Activa u oculta este bloque sin borrarlo.</p>
                  </div>
                  <Switch
                    checked={selectedSection.enabled !== false}
                    onCheckedChange={(checked) =>
                      updateSection(selectedSection.id || '', (section) => ({
                        ...section,
                        enabled: checked,
                      }))
                    }
                  />
                </div>

                <Separator />

                {asSectionWithTitle(selectedSection) ? (
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={selectedSection.title}
                      onChange={(event) =>
                        updateSection(selectedSection.id || '', (section) => ({
                          ...(section as Extract<WebsiteSection, { title: string }>),
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {'eyebrow' in selectedSection ? (
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input
                      value={selectedSection.eyebrow || ''}
                      onChange={(event) =>
                        updateSection(selectedSection.id || '', (section) => ({
                          ...(section as Extract<WebsiteSection, { kind: 'heroCarousel' }>),
                          eyebrow: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {'slides' in selectedSection ? (
                  <div className="space-y-3">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Slides del Hero</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateSection(selectedSection.id || '', (section) => ({
                            ...(section as Extract<WebsiteSection, { kind: 'heroCarousel' }>),
                            slides: [
                              ...((section as Extract<WebsiteSection, { kind: 'heroCarousel' }>).slides || []),
                              {
                                image: '',
                                alt: `Slide ${(section as Extract<WebsiteSection, { kind: 'heroCarousel' }>).slides.length + 1}`,
                              },
                            ],
                          }))
                        }
                      >
                        Añadir foto
                      </Button>
                    </div>

                    {(selectedSection.slides || []).map((slide, slideIndex) => (
                      <div key={`${slide.image}-${slideIndex}`} className="space-y-2 rounded-md border p-3">
                        <div className="space-y-2">
                          <Label>URL imagen #{slideIndex + 1}</Label>
                          <Input
                            value={slide.image}
                            onChange={(event) =>
                              updateSection(selectedSection.id || '', (section) => {
                                const hero = section as Extract<WebsiteSection, { kind: 'heroCarousel' }>
                                const nextSlides = [...hero.slides]
                                nextSlides[slideIndex] = { ...nextSlides[slideIndex], image: event.target.value }
                                return { ...hero, slides: nextSlides }
                              })
                            }
                            placeholder="/website/cep/hero/slide-1.jpg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Alt #{slideIndex + 1}</Label>
                          <Input
                            value={slide.alt}
                            onChange={(event) =>
                              updateSection(selectedSection.id || '', (section) => {
                                const hero = section as Extract<WebsiteSection, { kind: 'heroCarousel' }>
                                const nextSlides = [...hero.slides]
                                nextSlides[slideIndex] = { ...nextSlides[slideIndex], alt: event.target.value }
                                return { ...hero, slides: nextSlides }
                              })
                            }
                            placeholder="Descripción breve de la imagen"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={(selectedSection.slides || []).length <= 1}
                            onClick={() =>
                              updateSection(selectedSection.id || '', (section) => {
                                const hero = section as Extract<WebsiteSection, { kind: 'heroCarousel' }>
                                return {
                                  ...hero,
                                  slides: hero.slides.filter((_, index) => index !== slideIndex),
                                }
                              })
                            }
                          >
                            Eliminar foto
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {asSectionWithSubtitle(selectedSection) ? (
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Textarea
                      value={selectedSection.subtitle || ''}
                      onChange={(event) =>
                        updateSection(selectedSection.id || '', (section) => ({
                          ...(section as Extract<WebsiteSection, { subtitle?: string }>),
                          subtitle: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {'body' in selectedSection ? (
                  <div className="space-y-2">
                    <Label>Body</Label>
                    <Textarea
                      value={selectedSection.body}
                      onChange={(event) =>
                        updateSection(selectedSection.id || '', (section) => ({
                          ...(section as Extract<WebsiteSection, { kind: 'ctaBanner' }>),
                          body: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {asSectionWithLimit(selectedSection) ? (
                  <div className="space-y-2">
                    <Label>Límite de elementos</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={selectedSection.limit ?? 6}
                      onChange={(event) =>
                        updateSection(selectedSection.id || '', (section) => ({
                          ...(section as Extract<WebsiteSection, { limit?: number }>),
                          limit: Number(event.target.value) || 6,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {'source' in selectedSection ? (
                  <div className="space-y-2">
                    <Label>Fuente de lead</Label>
                    <Input
                      value={selectedSection.source}
                      onChange={(event) =>
                        updateSection(selectedSection.id || '', (section) => ({
                          ...(section as Extract<WebsiteSection, { kind: 'leadForm' }>),
                          source: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {'primaryCta' in selectedSection ? (
                  <>
                    <Separator />
                    <p className="text-sm font-medium">CTA principal</p>
                    <div className="space-y-2">
                      <Label>Texto</Label>
                      <Input
                        value={selectedSection.primaryCta?.label || ''}
                        onChange={(event) =>
                          updateSection(selectedSection.id || '', (section) => ({
                            ...(section as Extract<WebsiteSection, { kind: 'heroCarousel' }>),
                            primaryCta: {
                              label: event.target.value,
                              href: (section as Extract<WebsiteSection, { kind: 'heroCarousel' }>).primaryCta?.href || '#',
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Href</Label>
                      <Input
                        value={selectedSection.primaryCta?.href || ''}
                        onChange={(event) =>
                          updateSection(selectedSection.id || '', (section) => ({
                            ...(section as Extract<WebsiteSection, { kind: 'heroCarousel' }>),
                            primaryCta: {
                              label: (section as Extract<WebsiteSection, { kind: 'heroCarousel' }>).primaryCta?.label || '',
                              href: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
