'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Newspaper } from 'lucide-react'

function lexicalFromText(text: string) {
  const paragraphs = text.split(/\n{2,}/).filter((item) => item.trim())
  return {
    root: {
      type: 'root',
      children: (paragraphs.length > 0 ? paragraphs : [text || ' ']).map((paragraph) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: paragraph, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export default function NuevaNoticiaPage() {
  const router = useRouter()
  const [title, setTitle] = React.useState('')
  const [excerpt, setExcerpt] = React.useState('')
  const [body, setBody] = React.useState('')
  const [keywords, setKeywords] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage('')
    try {
      const tags = keywords
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
      const response = await fetch('/api/blog_posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt: excerpt.length >= 50 ? excerpt : `${excerpt} ${title}`.padEnd(50, '.'),
          content: lexicalFromText(body || excerpt || title),
          tags,
          meta_title: title,
          meta_description: excerpt,
          status: 'draft',
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { errors?: Array<{ message?: string }>; message?: string }
      if (!response.ok) {
        throw new Error(payload.errors?.[0]?.message || payload.message || 'No se pudo crear la noticia')
      }
      router.push('/contenido/blog')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear la noticia')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPageShell
      title="Nueva noticia"
      icon={Newspaper}
      backHref="/contenido/blog"
      actions={
        <Button size="sm" onClick={() => void handleSave()} disabled={saving || title.trim().length < 10}>
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </Button>
      }
    >
      <p className="text-[11px] text-muted-foreground">
        Manual o vía MCP `create_blog_draft`. Las keywords van a metadatos SEO del artículo.
      </p>
      {errorMessage ? <p className="text-[11px] text-destructive">{errorMessage}</p> : null}
      <div className="grid gap-3">
        <div>
          <label className="text-xs font-semibold" htmlFor="news-title">Título</label>
          <Input id="news-title" className="mt-1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor="news-excerpt">Extracto SEO</label>
          <Textarea id="news-excerpt" className="mt-1" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor="news-body">Artículo</label>
          <Textarea id="news-body" className="mt-1 min-h-40" value={body} onChange={(event) => setBody(event.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor="news-keywords">Palabras SEO</label>
          <Input
            id="news-keywords"
            className="mt-1"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="formación, ciclos, Tenerife"
          />
        </div>
        <div>
          <label className="text-xs font-semibold" htmlFor="news-image">Fotografía (URL de medios)</label>
          <Input id="news-image" className="mt-1" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
        </div>
      </div>
    </DashboardPageShell>
  )
}
