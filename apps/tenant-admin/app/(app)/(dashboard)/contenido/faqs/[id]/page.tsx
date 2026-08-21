'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { FaqEditorForm } from '../_components/FaqEditorForm'
import { editorValuesFromUnknown } from '@/src/domain/faq-content'

export default function EditFaqPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params?.id === 'string' ? params.id : ''
  const [initial, setInitial] = React.useState<ReturnType<typeof editorValuesFromUnknown> | null>(null)
  const [errorMessage, setErrorMessage] = React.useState('')

  React.useEffect(() => {
    if (!id) return
    fetch(`/api/contenido/faqs/${id}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { success?: boolean; data?: Record<string, unknown>; error?: string }) => {
        if (!payload.success || !payload.data) {
          throw new Error(payload.error || 'FAQ no encontrada')
        }
        setInitial(editorValuesFromUnknown(payload.data))
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'FAQ no encontrada')
      })
  }, [id])

  if (errorMessage) {
    return (
      <DashboardPageShell title="FAQ" backHref="/contenido/faqs">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </DashboardPageShell>
    )
  }

  if (!initial) {
    return (
      <DashboardPageShell title="FAQ" backHref="/contenido/faqs">
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando FAQ...
        </div>
      </DashboardPageShell>
    )
  }

  return <FaqEditorForm mode="edit" faqId={id} initial={initial} />
}
