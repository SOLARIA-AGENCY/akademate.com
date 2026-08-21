'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  AcademicEntityCard,
  AKADEMATE_ACADEMIC_FALLBACK_IMAGE,
  DashboardListingLayout,
  DashboardToolbar,
  ListingColumnBoard,
  WEB_PUBLISH_LIST_COLUMNS,
} from '@payload-config/components/akademate/dashboard'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Switch } from '@payload-config/components/ui/switch'
import { HelpCircle, Plus } from 'lucide-react'

type FaqRow = {
  id: string
  question: string
  categoryLabel: string
  status: string
  featured: boolean
  keywords: string[]
}

export default function FaqsPage() {
  const router = useRouter()
  const [faqs, setFaqs] = React.useState<FaqRow[]>([])
  const [query, setQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [togglingIds, setTogglingIds] = React.useState<Set<string>>(new Set())

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/contenido/faqs', { cache: 'no-store' })
      const payload = (await response.json()) as { success?: boolean; data?: { docs?: FaqRow[] }; error?: string }
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudieron cargar las FAQs')
      }
      setFaqs(payload.data?.docs ?? [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las FAQs')
      setFaqs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const handleTogglePublish = async (faq: FaqRow) => {
    setTogglingIds((prev) => new Set(prev).add(faq.id))
    try {
      const nextStatus = faq.status === 'published' ? 'draft' : 'published'
      const response = await fetch(`/api/contenido/faqs/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!response.ok) throw new Error('No se pudo publicar')
      setFaqs((prev) => prev.map((item) => (item.id === faq.id ? { ...item, status: nextStatus } : item)))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo publicar')
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(faq.id)
        return next
      })
    }
  }

  const filtered = faqs.filter((faq) => {
    if (!query.trim()) return true
    return `${faq.question} ${faq.categoryLabel} ${faq.keywords.join(' ')}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  })

  const openEditor = (faq: FaqRow) => {
    router.push(`/contenido/faqs/${faq.id}`)
  }

  return (
    <DashboardListingLayout
      title="FAQs"
      icon={HelpCircle}
      actions={
        <Button size="sm" onClick={() => router.push('/contenido/faqs/nueva')}>
          <Plus className="h-4 w-4" />
          Crear FAQ
        </Button>
      }
      toolbar={
        <DashboardToolbar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar FAQ…"
        />
      }
    >
      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando FAQs...
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
      {!isLoading && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          No hay FAQs. Crea una o usa MCP `create_faq`.
        </div>
      ) : null}
      {!isLoading && filtered.length > 0 ? (
        <ListingColumnBoard columns={WEB_PUBLISH_LIST_COLUMNS}>
          {filtered.map((faq) => (
            <AcademicEntityCard
              key={faq.id}
              variant="list"
              title={faq.question}
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              badge={
                <Badge
                  variant="static"
                  className={
                    faq.status === 'published'
                      ? 'bg-green-600 text-white hover:bg-green-600'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }
                >
                  {faq.status === 'published' ? 'Publicada' : 'Borrador'}
                </Badge>
              }
              listCells={[
                faq.featured ? `${faq.categoryLabel} · Destacada` : faq.categoryLabel,
                <Switch
                  key="publish"
                  checked={faq.status === 'published'}
                  disabled={togglingIds.has(faq.id)}
                  onCheckedChange={() => void handleTogglePublish(faq)}
                  aria-label={`Publicar ${faq.question}`}
                />,
              ]}
              onClick={() => openEditor(faq)}
              onCtaClick={() => openEditor(faq)}
            />
          ))}
        </ListingColumnBoard>
      ) : null}
    </DashboardListingLayout>
  )
}
