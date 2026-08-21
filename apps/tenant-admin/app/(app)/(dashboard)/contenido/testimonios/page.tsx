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
import { MessageSquareQuote, Plus } from 'lucide-react'

type TestimonialRow = {
  id: string
  quote: string
  name: string
  role: string
  status: string
}

export default function TestimoniosPage() {
  const router = useRouter()
  const [rows, setRows] = React.useState<TestimonialRow[]>([])
  const [query, setQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({ quote: '', name: '', role: '' })

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/contenido/testimonials', { cache: 'no-store' })
      const payload = (await response.json()) as { success?: boolean; data?: { docs?: TestimonialRow[] }; error?: string }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No se pudieron cargar testimonios')
      setRows(payload.data?.docs ?? [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar testimonios')
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
      const response = await fetch('/api/contenido/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = (await response.json()) as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No se pudo crear')
      setCreateOpen(false)
      setForm({ quote: '', name: '', role: '' })
      await load()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (row: TestimonialRow) => {
    const nextStatus = row.status === 'published' ? 'draft' : 'published'
    const response = await fetch(`/api/contenido/testimonials/${row.id}`, {
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
    `${row.name} ${row.role} ${row.quote}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <DashboardListingLayout
      title="Testimonios"
      icon={MessageSquareQuote}
      actions={
        <ListingActions>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear testimonio
          </Button>
        </ListingActions>
      }
      toolbar={
        <DashboardToolbar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar testimonio…"
        />
      }
    >
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Cargando testimonios...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No hay testimonios. Crea el primero.
        </div>
      ) : (
        <ListingColumnBoard columns={WEB_CONTENT_LIST_COLUMNS}>
          {filtered.map((row) => (
            <AcademicEntityCard
              key={row.id}
              variant="list"
              title={row.name}
              fallbackImage={AKADEMATE_ACADEMIC_FALLBACK_IMAGE}
              onClick={() => router.push(`/contenido/testimonios/${row.id}`)}
              onCtaClick={() => router.push(`/contenido/testimonios/${row.id}`)}
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
                row.role || row.quote.slice(0, 80),
                <Switch
                  key="publish"
                  checked={row.status === 'published'}
                  onCheckedChange={() => void handleToggle(row)}
                  aria-label={`Publicar ${row.name}`}
                />,
              ]}
            />
          ))}
        </ListingColumnBoard>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo testimonio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nombre"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="Rol o curso"
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            />
            <Textarea
              placeholder="Cita"
              value={form.quote}
              onChange={(event) => setForm((prev) => ({ ...prev, quote: event.target.value }))}
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
