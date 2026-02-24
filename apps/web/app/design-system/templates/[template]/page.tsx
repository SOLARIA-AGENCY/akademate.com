import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { templateLiveDemos, templateNames, templateProfiles } from '@/lib/design-system-catalog'
import { templateComponentMatrix } from '@/lib/template-component-matrix'
import { TemplateSandbox } from './TemplateSandbox'

type PageProps = {
  params: Promise<{ template: string }>
}

export async function generateStaticParams() {
  return templateNames.map((template) => ({ template }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { template } = await params
  const profile = templateProfiles[template]
  if (!profile) {
    return {
      title: 'Template no encontrado | Akademate',
    }
  }

  return {
    title: `${template} | Akademate Design System`,
    description: profile.description,
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { template } = await params
  const profile = templateProfiles[template]
  const links = templateLiveDemos[template]
  const coverage = templateComponentMatrix[template]
  if (!profile || !coverage) notFound()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/design-system"
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="mt-6 rounded-xl border bg-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Template</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{template}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{profile.description}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{profile.category}</span>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border">
          <img
            src={`/design-system/templates/${template}.png`}
            alt={`${template} preview`}
            className="w-full object-contain"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/design-system/templates/${template}.png`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Abrir preview completo
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={links?.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Abrir demo real
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={links?.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Ver código template
            <ExternalLink className="h-4 w-4" />
          </a>
          <Link
            href={`/design-system/sandbox/${template}`}
            className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Abrir sandbox local
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-background p-4">
        <h2 className="text-lg font-semibold text-foreground">Demo interactiva embebida</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista viva del template para analizar comportamiento real de componentes y flujos.
        </p>
        <div className="mt-3 overflow-hidden rounded-md border">
          <iframe src={links?.liveUrl} title={`${template} embedded live demo`} className="h-[720px] w-full" />
        </div>
      </div>

      <div className="mt-6">
        <TemplateSandbox template={template} modules={profile.modules} components={coverage.components} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile.modules.map((module, index) => (
          <article key={`${template}-${module}`} className="rounded-lg border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Módulo {index + 1}</p>
            <h2 className="mt-2 text-base font-semibold text-foreground">{module}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Área funcional del template para analizar estructura, datos visibles y acciones operativas.
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
