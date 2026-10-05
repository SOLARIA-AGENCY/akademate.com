import Link from 'next/link'
import React, { type ReactNode } from 'react'
import { legalCompany, legalLastUpdated, legalLinks } from '@/lib/legal-config'

type LegalSection = {
  title: string
  content: ReactNode
}

type LegalPageProps = {
  title: string
  description: string
  sections: LegalSection[]
}

export function LegalPage({ title, description, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← Volver a Akademate
        </Link>

        <header className="mt-8 border-b pb-8">
          <p className="text-sm text-muted-foreground">Información legal de Akademate</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Última actualización: {legalLastUpdated}
          </p>
        </header>

        <div className="space-y-10 py-10">
          {sections.map((section) => (
            <section
              key={section.title}
              aria-labelledby={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
            >
              <h2
                id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                className="text-xl font-semibold tracking-tight"
              >
                {section.title}
              </h2>
              <div className="mt-3 space-y-4 text-sm leading-7 text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <aside className="border-t py-8 text-sm leading-6 text-muted-foreground">
          <h2 className="font-semibold text-foreground">Información de la entidad</h2>
          <p className="mt-3">
            Prestador: {legalCompany.name}. Registro: {legalCompany.registryCode}. IVA:{' '}
            {legalCompany.vatId}.
          </p>
          <p>Domicilio social: {legalCompany.registeredOffice}.</p>
          <p>Dirección operativa: {legalCompany.operatingAddress}.</p>
          <p>Contacto de privacidad: {legalCompany.privacyEmail}.</p>
          <p className="mt-4">
            Estos textos se publican como información general y requieren revisión jurídica antes de
            su adopción definitiva.
          </p>
        </aside>

        <nav aria-label="Documentos legales" className="border-t py-8">
          <h2 className="text-sm font-semibold">Documentos relacionados</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </main>
  )
}
