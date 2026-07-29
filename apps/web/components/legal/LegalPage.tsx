import Link from 'next/link'
import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import {
  formatLegalField,
  legalCompany,
  legalDraftNotice,
  legalLastUpdated,
  legalLinks,
} from '@/lib/legal-config'

type LegalSection = { title: string; content: ReactNode }

export function LegalPage({
  title,
  description,
  sections,
}: {
  title: string
  description: string
  sections: LegalSection[]
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenido" className="flex-1 bg-background px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Volver a Akademate
          </Link>
          <header className="mt-8 border-b pb-8">
            <p className="text-sm font-medium text-primary">Información legal de Akademate</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 leading-7 text-muted-foreground">{description}</p>
            <p className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              {legalDraftNotice}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Última actualización: {legalLastUpdated}</p>
          </header>

          <div className="space-y-10 py-10">
            {sections.map((section, index) => {
              const id = `seccion-${index + 1}`
              return (
                <section key={section.title} aria-labelledby={id}>
                  <h2 id={id} className="text-xl font-semibold tracking-tight">{section.title}</h2>
                  <div className="mt-3 space-y-4 text-sm leading-7 text-muted-foreground">
                    {section.content}
                  </div>
                </section>
              )
            })}
          </div>

          <aside className="border-t py-8 text-sm leading-7 text-muted-foreground">
            <h2 className="font-semibold text-foreground">Identidad del prestador</h2>
            <p className="mt-3">Prestador: {legalCompany.name}.</p>
            <dl className="mt-3 space-y-3">
              {[
                legalCompany.registryCode,
                legalCompany.vatId,
                legalCompany.registeredOffice,
                legalCompany.operatingAddress,
                legalCompany.privacyContact,
              ].map((field) => (
                <div key={field.label}>
                  <dt className="font-medium text-foreground">{field.label}</dt>
                  <dd>{formatLegalField(field)}</dd>
                </div>
              ))}
            </dl>
          </aside>

          <nav aria-label="Documentos legales" className="border-t py-8">
            <h2 className="text-sm font-semibold">Documentos relacionados</h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-primary hover:underline">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  )
}
