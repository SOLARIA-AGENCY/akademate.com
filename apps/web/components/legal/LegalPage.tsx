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
      <main id="content" className="flex-1 bg-background">
        <header className="product-texture bg-[#06142f] px-4 py-14 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <Link href="/" className="text-sm font-medium text-blue-200 hover:text-white">
              ← Back to Akademate
            </Link>
            <p className="mt-8 text-sm font-semibold text-blue-200">Akademate trust centre</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100/75">{description}</p>
          </div>
        </header>
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="border-b pb-8">
            <p className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              {legalDraftNotice}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {legalLastUpdated}</p>
          </div>

          <div className="space-y-10 py-10">
            {sections.map((section, index) => {
              const id = `seccion-${index + 1}`
              return (
                <section key={section.title} aria-labelledby={id}>
                  <h2 id={id} className="text-xl font-semibold tracking-tight">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-4 text-sm leading-7 text-muted-foreground">
                    {section.content}
                  </div>
                </section>
              )
            })}
          </div>

          <aside className="border-t py-8 text-sm leading-7 text-muted-foreground">
            <h2 className="font-semibold text-foreground">Company information</h2>
            <p className="mt-3">Provider: {legalCompany.name}.</p>
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

          <nav aria-label="Legal documents" className="border-t py-8">
            <h2 className="text-sm font-semibold">Related documents</h2>
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
