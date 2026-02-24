'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { templateLiveDemos, templateNames, templateProfiles } from '@/lib/design-system-catalog'

export function TemplateGallery() {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const tags = useMemo(() => {
    const unique = new Set<string>()
    templateNames.forEach((name) => {
      const profile = templateProfiles[name]
      if (profile?.category) unique.add(profile.category)
      for (const module of profile?.modules ?? []) {
        unique.add(module)
      }
    })
    return Array.from(unique).sort()
  }, [])

  const filteredTemplates = useMemo(() => {
    return templateNames.filter((name) => {
      const profile = templateProfiles[name]
      const profileTags = [profile?.category, ...(profile?.modules ?? [])].filter(Boolean)
      const tagsMatch = selectedTags.length === 0 || selectedTags.every((tag) => profileTags.includes(tag))
      const q = query.trim().toLowerCase()
      if (!q) return tagsMatch
      const text = `${name} ${profile?.description ?? ''} ${(profile?.modules ?? []).join(' ')}`.toLowerCase()
      return tagsMatch && text.includes(q)
    })
  }, [query, selectedTags])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((current) => current !== tag) : [...prev, tag]))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar template, modulo o descripcion..."
        />
        <div className="flex flex-wrap gap-2">
          {tags.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleTag(item)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedTags.includes(item)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            disabled={selectedTags.length === 0}
          >
            Limpiar
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Mostrando {filteredTemplates.length} de {templateNames.length} templates.
        {selectedTags.length > 0 ? ` Filtros activos: ${selectedTags.join(', ')}.` : ''}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredTemplates.map((template) => {
          const profile = templateProfiles[template]
          return (
            <div key={`template-${template}`} className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{template}</p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {profile?.category ?? 'Template'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{profile?.description ?? 'Template visual del sistema.'}</p>
              <div className="mt-3 overflow-hidden rounded-md border">
                <img
                  src={`/design-system/templates/${template}.png`}
                  alt={`${template} template preview`}
                  className="h-44 w-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`/design-system/templates/${template}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Abrir preview
                </a>
                <Link
                  href={`/design-system/templates/${template}`}
                  className="inline-flex items-center justify-center rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Ver detalle
                </Link>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <Link
                  href={`/design-system/sandbox/${template}`}
                  className="inline-flex items-center justify-center rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Sandbox local
                </Link>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <a
                  href={templateLiveDemos[template]?.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Demo real
                </a>
                <a
                  href={templateLiveDemos[template]?.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Código fuente
                </a>
              </div>
              <details className="mt-3 rounded-md border border-border/70 bg-muted/20 p-2">
                <summary className="cursor-pointer text-xs font-semibold text-foreground">Preview vivo embebido</summary>
                <div className="mt-2 overflow-hidden rounded border bg-background">
                  <iframe
                    src={templateLiveDemos[template]?.liveUrl}
                    title={`${template} demo live`}
                    className="h-72 w-full"
                    loading="lazy"
                  />
                </div>
              </details>
              <div className="mt-3 flex flex-wrap gap-1">
                {(profile?.modules ?? ['Layout', 'Data', 'Actions']).map((module) => (
                  <span key={`${template}-${module}`} className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {module}
                  </span>
                ))}
              </div>
              <details className="mt-3 rounded-md border border-border/70 bg-muted/20 p-2">
                <summary className="cursor-pointer text-xs font-semibold text-foreground">
                  Desplegar módulos ({(profile?.modules ?? []).length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {(profile?.modules ?? []).map((module) => (
                    <li key={`${template}-detail-${module}`} className="rounded border border-border/60 bg-background px-2 py-1">
                      {module}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}
