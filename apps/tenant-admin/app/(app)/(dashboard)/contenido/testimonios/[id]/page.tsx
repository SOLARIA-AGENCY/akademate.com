'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { MessageSquareQuote } from 'lucide-react'

type TestimonialEditor = {
  id: string
  quote: string
  name: string
  role: string
  status: 'draft' | 'published'
}

export default function TestimonioFichaPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = typeof params?.id === 'string' ? params.id : ''
  const [values, setValues] = React.useState<TestimonialEditor | null>(null)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    fetch(`/api/contenido/testimonials/${id}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean
          data?: TestimonialEditor
          error?: string
        }
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Testimonio no encontrado')
        }
        setValues({
          id: payload.data.id,
          quote: payload.data.quote,
          name: payload.data.name,
          role: payload.data.role || '',
          status: payload.data.status === 'published' ? 'published' : 'draft',
        })
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'Testimonio no encontrado')
      })
  }, [id])

  const patch = (next: Partial<TestimonialEditor>) => {
    setValues((prev) => (prev ? { ...prev, ...next } : prev))
  }

  const handleSave = async () => {
    if (!values) return
    setSaving(true)
    setErrorMessage('')
    try {
      const response = await fetch(`/api/contenido/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: values.quote,
          name: values.name,
          role: values.role,
          status: values.status,
        }),
      })
      const payload = (await response.json()) as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo guardar el testimonio')
      }
      router.push('/contenido/testimonios')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el testimonio')
    } finally {
      setSaving(false)
    }
  }

  if (errorMessage && !values) {
    return (
      <DashboardPageShell title="Testimonio" icon={MessageSquareQuote} backHref="/contenido/testimonios">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </DashboardPageShell>
    )
  }

  if (!values) {
    return (
      <DashboardPageShell title="Testimonio" icon={MessageSquareQuote} backHref="/contenido/testimonios">
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando testimonio...
        </div>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      title="Editar testimonio"
      icon={MessageSquareQuote}
      backHref="/contenido/testimonios"
      actions={
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={saving || values.name.trim().length < 2 || values.quote.trim().length < 8}
        >
          {saving ? 'Guardando…' : values.status === 'published' ? 'Publicar' : 'Guardar borrador'}
        </Button>
      }
    >
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold" htmlFor="testimonial-name">
              Nombre
            </label>
            <Input
              id="testimonial-name"
              className="mt-1"
              value={values.name}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="testimonial-role">
              Rol o curso
            </label>
            <Input
              id="testimonial-role"
              className="mt-1"
              value={values.role}
              onChange={(event) => patch({ role: event.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="testimonial-quote">
              Cita
            </label>
            <Textarea
              id="testimonial-quote"
              className="mt-1 min-h-40"
              value={values.quote}
              onChange={(event) => patch({ quote: event.target.value })}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-border/80 bg-muted/70 p-3 shadow-none">
            <p className="text-[11px] text-muted-foreground">Previsualización</p>
            <p className="mt-1 text-sm font-semibold text-neutral-950">{values.name || 'Nombre'}</p>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              {values.quote || 'La cita se verá en la web al publicar.'}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="testimonial-status">
              Estado
            </label>
            <select
              id="testimonial-status"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.status}
              onChange={(event) => patch({ status: event.target.value === 'published' ? 'published' : 'draft' })}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}
