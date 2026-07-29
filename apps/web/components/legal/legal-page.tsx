import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { RegulatoryNotice } from '@/components/legal/regulatory-notice'

export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string
  summary: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <header className="border-b bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
            <RegulatoryNotice />
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">{summary}</p>
            <p className="mt-4 text-xs text-muted-foreground">Revisión pública: 29 de julio de 2026</p>
          </div>
        </header>
        <article className="mx-auto max-w-4xl space-y-10 px-4 py-14 text-sm leading-7 sm:px-6 lg:px-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_strong]:text-foreground">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  )
}

export function PendingValue({ value }: { value: string }) {
  const pending = value.startsWith('Pendiente de confirmación')
  return (
    <span className={pending ? 'font-medium text-amber-700' : 'text-foreground'}>
      {value}
    </span>
  )
}
