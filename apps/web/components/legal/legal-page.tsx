import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { PUBLIC_LEGAL } from '@/lib/public-legal'

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <header className="border-b bg-primary/[0.035]">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Información legal
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{intro}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Última revisión: {PUBLIC_LEGAL.lastReviewed}
            </p>
          </div>
        </header>
        <article className="legal-copy mx-auto max-w-4xl px-4 py-12 sm:px-6">{children}</article>
      </main>
      <Footer />
    </div>
  )
}
