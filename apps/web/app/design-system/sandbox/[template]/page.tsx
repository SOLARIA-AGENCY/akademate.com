import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { templateNames, templateProfiles } from '@/lib/design-system-catalog'
import { templateComponentMatrix } from '@/lib/template-component-matrix'
import { TemplateSandbox } from '@/app/design-system/templates/[template]/TemplateSandbox'

type PageProps = {
  params: Promise<{ template: string }>
}

export async function generateStaticParams() {
  return templateNames.map((template) => ({ template }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { template } = await params
  const profile = templateProfiles[template]
  return {
    title: profile ? `Sandbox ${template} | Akademate` : 'Sandbox no encontrado | Akademate',
    description: profile?.description ?? 'Sandbox local de template.',
  }
}

export default async function TemplateSandboxPage({ params }: PageProps) {
  const { template } = await params
  const profile = templateProfiles[template]
  const coverage = templateComponentMatrix[template]
  if (!profile || !coverage) notFound()

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/design-system/templates/${template}`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle
        </Link>
        <Link
          href="/design-system"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Catálogo
        </Link>
      </div>

      <div className="mt-5 rounded-xl border bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Template Sandbox</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{template}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{profile.description}</p>
      </div>

      <div className="mt-6">
        <TemplateSandbox template={template} modules={profile.modules} components={coverage.components} />
      </div>
    </section>
  )
}
