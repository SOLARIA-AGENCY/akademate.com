'use client'

import * as React from 'react'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { Button } from '@payload-config/components/ui/button'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Search } from 'lucide-react'

function parseLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function WebsiteSeoPage() {
  const [keywords, setKeywords] = React.useState('')
  const [concepts, setConcepts] = React.useState('')
  const [savedAt, setSavedAt] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/config/website/seo', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { success?: boolean; data?: { keywords?: string[]; concepts?: string[] } }) => {
        if (!payload.success) return
        setKeywords((payload.data?.keywords ?? []).join('\n'))
        setConcepts((payload.data?.concepts ?? []).join('\n'))
      })
      .catch(() => {
        setErrorMessage('No se pudo cargar el SEO global')
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/config/website/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: parseLines(keywords),
          concepts: parseLines(concepts),
        }),
      })
      const payload = (await response.json()) as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo guardar el SEO')
      }
      setSavedAt(new Date().toLocaleString('es-ES'))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el SEO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPageShell
      title="SEO"
      icon={Search}
      actions={
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      <p className="text-[11px] text-muted-foreground">
        Estas keywords se inyectan en la metadata de todas las páginas públicas.
      </p>
      {savedAt ? <p className="text-[11px] text-muted-foreground">Publicado: {savedAt}</p> : null}
      {errorMessage ? <p className="text-[11px] text-destructive">{errorMessage}</p> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-muted/70 p-3 shadow-none">
          <label className="text-xs font-semibold text-neutral-950" htmlFor="seo-keywords">
            Keywords
          </label>
          <Textarea
            id="seo-keywords"
            className="mt-2 min-h-40"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="formación profesional&#10;ciclos en Tenerife"
          />
        </div>
        <div className="rounded-xl border border-border/80 bg-muted/70 p-3 shadow-none">
          <label className="text-xs font-semibold text-neutral-950" htmlFor="seo-concepts">
            Conceptos / comandos
          </label>
          <Textarea
            id="seo-concepts"
            className="mt-2 min-h-40"
            value={concepts}
            onChange={(event) => setConcepts(event.target.value)}
            placeholder="empleabilidad&#10;matrícula abierta"
          />
        </div>
      </div>
    </DashboardPageShell>
  )
}
