import type { Metadata } from 'next'
import React from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'Akademate Campus',
  description: 'Campus alumno con acceso a cursos, materiales y certificados por tenant.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased">
        <div className="layout-shell">
          <header className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Campus alumno</span>
              <span className="text-lg font-semibold">Akademate</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">tenant scoped</span>
              <span className="rounded-full bg-secondary/20 px-3 py-1 text-secondary">roles alumno</span>
            </div>
          </header>
          <main className="mt-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
