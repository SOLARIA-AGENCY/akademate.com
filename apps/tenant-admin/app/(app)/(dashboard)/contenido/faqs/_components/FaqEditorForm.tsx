'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { Button } from '@payload-config/components/ui/button'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { HelpCircle } from 'lucide-react'
import {
  FAQ_CATEGORIES,
  FAQ_LANGUAGES,
  FAQ_STATUSES,
  draftFaqFromTopic,
  faqCategoryLabel,
  type FaqCategory,
  type FaqEditorValues,
  type FaqLanguage,
  type FaqStatus,
} from '@/src/domain/faq-content'

const EMPTY: FaqEditorValues = {
  question: '',
  answer: '',
  category: 'general',
  language: 'es',
  status: 'draft',
  featured: false,
  order: 0,
  keywords: [],
}

export function FaqEditorForm({
  mode,
  faqId,
  initial,
}: {
  mode: 'create' | 'edit'
  faqId?: string
  initial?: FaqEditorValues
}) {
  const router = useRouter()
  const [values, setValues] = React.useState<FaqEditorValues>(initial ?? EMPTY)
  const [topic, setTopic] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  const patch = (next: Partial<FaqEditorValues>) => {
    setValues((prev) => ({ ...prev, ...next }))
  }

  const handleGenerate = async () => {
    const seoResponse = await fetch('/api/config/website/seo', { cache: 'no-store' })
    const seoPayload = (await seoResponse.json().catch(() => ({}))) as {
      data?: { keywords?: string[]; concepts?: string[] }
    }
    setValues(
      draftFaqFromTopic(topic || values.question, seoPayload.data ?? {}, values.category),
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage('')
    try {
      const path = mode === 'edit' && faqId ? `/api/contenido/faqs/${faqId}` : '/api/contenido/faqs'
      const response = await fetch(path, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          keywords: values.keywords,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo guardar la FAQ')
      }
      router.push('/contenido/faqs')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la FAQ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPageShell
      title={mode === 'edit' ? 'Editar FAQ' : 'Nueva FAQ'}
      icon={HelpCircle}
      backHref="/contenido/faqs"
      actions={
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={saving || values.question.trim().length < 10 || values.answer.trim().length < 20}
        >
          {saving ? 'Guardando…' : values.status === 'published' ? 'Publicar' : 'Guardar borrador'}
        </Button>
      }
    >
      <p className="text-[11px] text-muted-foreground">
        Manual o MCP `create_faq`. Las keywords se mezclan con el SEO global y salen en /faq.
      </p>
      {errorMessage ? <p className="text-[11px] text-destructive">{errorMessage}</p> : null}

      <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 p-3">
        <label className="text-xs font-semibold" htmlFor="faq-topic">
          Generar borrador
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            id="faq-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Tema: matrícula, prácticas, pagos…"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => void handleGenerate()}>
            Generar con SEO
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-question">Pregunta</label>
            <Input
              id="faq-question"
              className="mt-1"
              value={values.question}
              onChange={(event) => patch({ question: event.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-answer">Respuesta</label>
            <Textarea
              id="faq-answer"
              className="mt-1 min-h-40"
              value={values.answer}
              onChange={(event) => patch({ answer: event.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-keywords">Palabras SEO</label>
            <Input
              id="faq-keywords"
              className="mt-1"
              value={values.keywords.join(', ')}
              onChange={(event) =>
                patch({
                  keywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                })
              }
              placeholder="matrícula, ciclo, Tenerife"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border/80 bg-muted/70 p-3 shadow-none">
            <p className="text-[11px] text-muted-foreground">Previsualización</p>
            <p className="mt-1 text-sm font-semibold text-neutral-950">{values.question || 'Pregunta'}</p>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              {values.answer || 'La respuesta se verá en /faq al publicar.'}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-category">Categoría</label>
            <select
              id="faq-category"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.category}
              onChange={(event) => patch({ category: event.target.value as FaqCategory })}
            >
              {FAQ_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {faqCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-language">Idioma</label>
            <select
              id="faq-language"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.language}
              onChange={(event) => patch({ language: event.target.value as FaqLanguage })}
            >
              {FAQ_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-status">Estado</label>
            <select
              id="faq-status"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.status}
              onChange={(event) => patch({ status: event.target.value as FaqStatus })}
            >
              {FAQ_STATUSES.filter((status) => status !== 'archived').map((status) => (
                <option key={status} value={status}>
                  {status === 'published' ? 'Publicada' : 'Borrador'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="faq-order">Orden</label>
            <Input
              id="faq-order"
              type="number"
              min={0}
              className="mt-1"
              value={values.order}
              onChange={(event) => patch({ order: Number(event.target.value) || 0 })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.featured}
              onCheckedChange={(checked) => patch({ featured: checked === true })}
            />
            Destacar
          </label>
        </div>
      </div>
    </DashboardPageShell>
  )
}
