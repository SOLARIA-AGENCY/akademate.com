'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  AcademicEntityCard,
  AKADEMATE_ACADEMIC_FALLBACK_IMAGE,
  DashboardListingLayout,
  DashboardToolbar,
  ListingActions,
  ListingColumnBoard,
  WEB_CONTENT_LIST_COLUMNS,
} from '@payload-config/components/akademate/dashboard'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Switch } from '@payload-config/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { FileInput, Plus } from 'lucide-react'

type FormRow = {
  id: string
  title: string
  subtitle: string
  source: string
  pageSlug: string
  status: string
}

export default function FormulariosPage() {
  const router = useRouter()
  const [rows, setRows] = React.useState<FormRow[]>([])
  const [query, setQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({ title: '', subtitle: '', source: '', pageSlug: '' })

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/contenido/forms', { cache: 'no-store' })
      const payload = (await response.json()) as { success?: boolean; data?: { docs?: FormRow[] }; error?: string }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No se pudieron cargar formularios')
      setRows(payload.data?.docs ?? [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar formularios')
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    setCreating(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/contenido/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = (await response.json()) as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No se pudo crear')
      setCreateOpen(false)
      setForm({ title: '', subtitle: '', source: '', pageSlug: '' })
      await load()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (row: FormRow) => {
    const nextStatus = row.status === 'published' ? 'draft' : 'published'
    const response = await fetch(`/api/contenido/forms/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (!response.ok) {
      setErrorMessage('No se pudo publicar')
      return
    }
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)))
  }

  const filtered = rows.filter((row) =>
    `${row.title} ${row.source} ${row.pageSlug}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <DashboardListingLayout
      title="Formularios"
      icon={FileInput}
      actions={
        <ListingActions>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear formulario
          </Button>
        </ListingActions>
      }
      toolbar={
        <DashboardToolbar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar formulario…"
        />
      }
    >
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando formularios...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No hay formularios. Crea el primero o edita un leadForm en Páginas.
        </p>
      ) : (
        <ListingColumnBoard columns={WEB_CONTENT_LIST_COLUMNS}>
          {filtered.map((row) => (
            <AcademicEntityCard
              key={row.id}
              variant="list"
              title={row.title}
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              badge={
                <Badge
                  variant="static"
                  className={
                    row.status === 'published'
                      ? 'bg-green-600 text-white hover:bg-green-600'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }
                >
                  {row.status === 'published' ? 'Publicado' : 'Borrador'}
                </Badge>
              }
              listCells={[
                row.source,
                <Switch
                  key="publish"
                  checked={row.status === 'published'}
                  onCheckedChange={() => void handleToggle(row)}
                  aria-label={`Publicar ${row.title}`}
                />,
              ]}
              onClick={() => {
                if (row.pageSlug) router.push(`/contenido/paginas/${row.pageSlug}`)
              }}
              onCtaClick={() => {
                if (row.pageSlug) router.push(`/contenido/paginas/${row.pageSlug}`)
              }}
            />
          ))}
        </ListingColumnBoard>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo formulario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Título"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <Input
              placeholder="Origen (source_form)"
              value={form.source}
              onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
            />
            <Input
              placeholder="Slug de página (opcional)"
              value={form.pageSlug}
              onChange={(event) => setForm((prev) => ({ ...prev, pageSlug: event.target.value }))}
            />
            <Textarea
              placeholder="Subtítulo"
              value={form.subtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardListingLayout>
  )
}
